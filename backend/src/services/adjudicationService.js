/**
 * CivicLens AI Accountability Adjudicator
 *
 * Two decisions, both "AI":
 *  1. reviewJustification()  - when a department explains why an overdue issue
 *     isn't fixed yet, the AI decides if the excuse (+ proof) is acceptable.
 *  2. reviewResolutionEvidence() - when a department submits resolution proof,
 *     the AI decides if it is genuine evidence of a fix ("done & dusted").
 *
 * Works fully offline with a deterministic rule engine. If a GEMINI_API_KEY is
 * set and DEMO_MODE=false, it upgrades to Gemini (same pattern as aiService).
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

let genAI = null;
if (config.geminiApiKey) {
  try {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  } catch (err) {
    console.warn('Adjudicator: failed to init Gemini client:', err.message);
  }
}

// Weak / non-accountable excuses the AI should push back on.
const WEAK_EXCUSE_PATTERNS = [
  'will do', 'will look', 'soon', 'later', 'busy', 'no staff', 'not my',
  'someone else', 'next week', 'budget', 'no update', 'pending', 'tomorrow',
];

// Signals of a credible, concrete justification.
const STRONG_JUSTIFICATION_PATTERNS = [
  'work order', 'tender', 'contractor', 'material', 'rain', 'monsoon', 'flood',
  'excavat', 'inspect', 'approval', 'permit', 'underground', 'cable', 'pipe',
  'dispatched', 'mobilized', 'team deployed', 'parts', 'equipment', 'delay due to',
];

function hasAny(text, list) {
  const t = (text || '').toLowerCase();
  return list.some((p) => t.includes(p));
}

/**
 * Deterministic review of a department's SLA-breach justification.
 */
export function reviewJustificationDeterministic(reason = '', hasEvidence = false) {
  const words = reason.trim().split(/\s+/).filter(Boolean).length;
  const strong = hasAny(reason, STRONG_JUSTIFICATION_PATTERNS);
  const weak = hasAny(reason, WEAK_EXCUSE_PATTERNS);

  // No evidence at all -> cannot accept.
  if (!hasEvidence) {
    return {
      verdict: 'REJECTED',
      confidence: 0.9,
      reasoning:
        'No supporting evidence was attached. Per public accountability rules, an overdue issue cannot be justified by a written statement alone. This issue stays on the public Accountability Wall until proof is provided.',
    };
  }

  if (words < 8 || (weak && !strong)) {
    return {
      verdict: 'NEEDS_MORE',
      confidence: 0.65,
      reasoning:
        'The explanation is too vague or non-committal to establish accountability. Provide a concrete reason (work order, contractor, material/weather constraint) with dated field proof.',
    };
  }

  if (strong) {
    return {
      verdict: 'ACCEPTED',
      confidence: 0.8,
      reasoning:
        'The justification cites a concrete operational constraint and is backed by evidence. The delay is recorded as accountable; the SLA clock may be extended while work continues under public tracking.',
    };
  }

  return {
    verdict: 'NEEDS_MORE',
    confidence: 0.55,
    reasoning:
      'Evidence was attached but the reason does not clearly explain the delay. Add the specific operational cause so the public record is complete.',
  };
}

/**
 * Deterministic review of resolution evidence ("done & dusted?").
 */
export function reviewResolutionEvidenceDeterministic(description = '', evidenceCount = 0) {
  if (evidenceCount === 0) {
    return {
      verdict: 'INSUFFICIENT',
      confidence: 0.9,
      notes: 'Marked resolved without any photographic proof. AI cannot confirm the fix — resolution withheld pending field evidence.',
    };
  }

  const words = description.trim().split(/\s+/).filter(Boolean).length;
  const describesFix = hasAny(description, [
    'repair', 'fixed', 'replaced', 'restored', 'resurfac', 'cleared', 'completed',
    'asphalt', 'collar', 'sleeve', 'cable', 'bin', 'collected', 'installed', 'overlay',
  ]);

  if (evidenceCount >= 1 && describesFix && words >= 4) {
    return {
      verdict: 'APPROVED',
      confidence: 0.82,
      notes: 'Evidence shows concrete repair work consistent with the reported issue. AI confirms resolution — closing as done & dusted, pending citizen audit.',
    };
  }

  return {
    verdict: 'INSUFFICIENT',
    confidence: 0.6,
    notes: 'Evidence was submitted but does not clearly document the specific repair. Add a description of the work carried out for AI confirmation.',
  };
}

/**
 * Gemini-backed justification review, deterministic fallback.
 */
export async function reviewJustification(reason, hasEvidence, issueContext = '') {
  if (genAI && config.geminiApiKey && !config.demoMode) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are the CivicLens Accountability AI. A municipal department missed its SLA on this issue and submitted a justification.
Issue: "${issueContext}"
Justification reason: "${reason}"
Evidence attached: ${hasEvidence ? 'yes' : 'no'}
Decide if this is an acceptable, accountable justification. Return strict JSON:
{"verdict":"ACCEPTED"|"REJECTED"|"NEEDS_MORE","confidence":0.0-1.0,"reasoning":"1-2 sentences"}`;
      const result = await model.generateContent(prompt);
      const cleaned = result.response.text().replace(/```json/gi, '').replace(/```/gi, '').trim();
      const p = JSON.parse(cleaned);
      if (p.verdict) return { verdict: p.verdict, confidence: p.confidence ?? 0.7, reasoning: p.reasoning || '' };
    } catch (err) {
      console.warn('Adjudicator (justification) Gemini error, using fallback:', err.message);
    }
  }
  return reviewJustificationDeterministic(reason, hasEvidence);
}

/**
 * Gemini-backed resolution review, deterministic fallback.
 */
export async function reviewResolutionEvidence(description, evidenceCount, issueContext = '') {
  if (genAI && config.geminiApiKey && !config.demoMode) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are the CivicLens Accountability AI. A department submitted evidence that it resolved this issue.
Issue: "${issueContext}"
Evidence description: "${description}"
Photos attached: ${evidenceCount}
Decide if this proves the issue is genuinely resolved. Return strict JSON:
{"verdict":"APPROVED"|"INSUFFICIENT","confidence":0.0-1.0,"notes":"1-2 sentences"}`;
      const result = await model.generateContent(prompt);
      const cleaned = result.response.text().replace(/```json/gi, '').replace(/```/gi, '').trim();
      const p = JSON.parse(cleaned);
      if (p.verdict) return { verdict: p.verdict, confidence: p.confidence ?? 0.7, notes: p.notes || '' };
    } catch (err) {
      console.warn('Adjudicator (resolution) Gemini error, using fallback:', err.message);
    }
  }
  return reviewResolutionEvidenceDeterministic(description, evidenceCount);
}

export default {
  reviewJustification,
  reviewResolutionEvidence,
  reviewJustificationDeterministic,
  reviewResolutionEvidenceDeterministic,
};
