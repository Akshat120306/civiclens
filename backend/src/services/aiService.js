import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import similarityEngine from './similarityEngine.js';

let genAI = null;
if (config.geminiApiKey) {
  try {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  } catch (err) {
    console.warn('Failed to initialize Google Generative AI client:', err.message);
  }
}

/**
 * Deterministic Fallback Rules
 */
const CATEGORY_KEYWORDS = {
  'Roads & Infrastructure': ['pothole', 'road', 'asphalt', 'crater', 'pavement', 'sidewalk', 'manhole', 'bridge', 'flyover', 'tarmac', 'ditch', 'speed breaker'],
  'Water Supply & Sanitation': ['water', 'pipe', 'pipeline', 'leakage', 'leak', 'drainage', 'sewage', 'clogged', 'contamination', 'flood', 'flooding', 'gutter'],
  'Electricity & Lighting': ['streetlight', 'pole', 'lamp', 'wire', 'cable', 'transformer', 'blackout', 'power', 'sparks', 'electricity', 'meter', 'dark'],
  'Solid Waste Management': ['garbage', 'trash', 'waste', 'dump', 'dustbin', 'litter', 'smell', 'debris', 'uncollected', 'dead animal'],
  'Traffic & Transport': ['traffic', 'signal', 'jam', 'congestion', 'lights', 'sign', 'bus stop', 'parking', 'zebra crossing'],
};

const SEVERITY_KEYWORDS = {
  Critical: ['accident', 'danger', 'deadly', 'live wire', 'deep crater', 'massive flood', 'hazard', 'severe injury', 'life threatening', 'burst main'],
  High: ['huge', 'large', 'major', 'heavy', 'urgent', 'disrupting', 'unsafe', 'overflowing', 'frequent', 'blockage', 'dangerous'],
  Medium: ['broken', 'damaged', 'pothole', 'leaking', 'uncollected', 'moderate', 'needs repair', 'intermittent'],
  Low: ['minor', 'small', 'flickering', 'aesthetic', 'request', 'slow', 'scratch'],
};

const DEPARTMENT_MAPPINGS = {
  'Roads & Infrastructure': { id: 1, code: 'PWD', name: 'Public Works Department (PWD)', defaultSla: 72 },
  'Water Supply & Sanitation': { id: 2, code: 'WSS', name: 'Water Supply & Sanitation', defaultSla: 48 },
  'Electricity & Lighting': { id: 3, code: 'EB', name: 'Electricity Board', defaultSla: 24 },
  'Solid Waste Management': { id: 4, code: 'SWM', name: 'Solid Waste Management', defaultSla: 36 },
  'Traffic & Transport': { id: 5, code: 'TT', name: 'Traffic & Transport Department', defaultSla: 48 },
};

/**
 * Deterministic AI Classifier
 */
export function analyzeDeterministic(description, locationName = '') {
  const text = `${description} ${locationName}`.toLowerCase();

  // 1. Identify category
  let matchedCategory = 'Roads & Infrastructure';
  let highestCatCount = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let count = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) count++;
    }
    if (count > highestCatCount) {
      highestCatCount = count;
      matchedCategory = category;
    }
  }

  // 2. Identify severity
  let matchedSeverity = 'Medium';
  for (const [sev, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      matchedSeverity = sev;
      break;
    }
  }

  // 3. Generate summary
  const sentences = description.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
  const summary = sentences[0]?.trim() || description.slice(0, 80);

  // 4. Root cause hypothesis
  let rootCause = 'Routine wear and environmental factors.';
  if (matchedCategory === 'Roads & Infrastructure') {
    rootCause = 'Sub-base soil erosion exacerbated by heavy monsoon runoff and vehicular axle load.';
  } else if (matchedCategory === 'Water Supply & Sanitation') {
    rootCause = 'High pressure surge or aging cast-iron distribution pipe joint degradation.';
  } else if (matchedCategory === 'Electricity & Lighting') {
    rootCause = 'Capacitor/photocell wear or underground feeder line insulation failure.';
  } else if (matchedCategory === 'Solid Waste Management') {
    rootCause = 'Collection route schedule discrepancy and inadequate secondary bin capacity.';
  }

  const dept = DEPARTMENT_MAPPINGS[matchedCategory] || DEPARTMENT_MAPPINGS['Roads & Infrastructure'];

  return {
    issue_type: matchedCategory,
    severity: matchedSeverity,
    summary,
    extracted_location: locationName || 'Reported Locality',
    root_cause_suggestion: rootCause,
    recommended_department_id: dept.id,
    recommended_department_code: dept.code,
    recommended_department_name: dept.name,
    recommended_sla_hours: dept.defaultSla,
    ai_engine: 'deterministic-nlp-fallback',
  };
}

/**
 * Full AI Analysis Pipeline with Gemini & Deterministic Fallback
 */
export async function analyzeComplaint(description, locationName = '') {
  if (genAI && config.geminiApiKey && !config.demoMode) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are the CivicLens AI Engine for municipal grievance intelligence.
Analyze the following civic complaint and return a strictly valid JSON object.

Complaint Description: "${description}"
Location: "${locationName}"

Return JSON matching this exact structure:
{
  "issue_type": "Roads & Infrastructure" | "Water Supply & Sanitation" | "Electricity & Lighting" | "Solid Waste Management" | "Traffic & Transport",
  "severity": "Low" | "Medium" | "High" | "Critical",
  "summary": "Concise 1-sentence executive summary",
  "extracted_location": "Clean normalized location name",
  "root_cause_suggestion": "Probable technical root cause",
  "recommended_department_code": "PWD" | "WSS" | "EB" | "SWM" | "TT",
  "recommended_sla_hours": 24 | 48 | 72
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleaned);

      const dept = Object.values(DEPARTMENT_MAPPINGS).find(d => d.code === parsed.recommended_department_code) ||
        DEPARTMENT_MAPPINGS[parsed.issue_type] || DEPARTMENT_MAPPINGS['Roads & Infrastructure'];

      return {
        issue_type: parsed.issue_type || 'Roads & Infrastructure',
        severity: parsed.severity || 'Medium',
        summary: parsed.summary || description.slice(0, 100),
        extracted_location: parsed.extracted_location || locationName,
        root_cause_suggestion: parsed.root_cause_suggestion || 'Material degradation and heavy usage.',
        recommended_department_id: dept.id,
        recommended_department_code: dept.code,
        recommended_department_name: dept.name,
        recommended_sla_hours: parsed.recommended_sla_hours || dept.defaultSla,
        ai_engine: 'gemini-1.5-flash',
      };
    } catch (err) {
      console.warn('Gemini API call encountered error, engaging deterministic fallback:', err.message);
    }
  }

  // Use Deterministic Fallback Engine
  return analyzeDeterministic(description, locationName);
}

export default {
  analyzeComplaint,
  analyzeDeterministic,
  DEPARTMENT_MAPPINGS,
};
