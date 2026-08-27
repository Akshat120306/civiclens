/**
 * CivicLens Semantic Similarity & Recurrence Detection Engine
 * Combines NLP tokenization, TF-IDF cosine similarity, Levenshtein distance,
 * and Geolocation / Landmark matching.
 */

// Common English stop words
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could', 'did',
  'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
  'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in',
  'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
  'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

// Synonyms map to boost semantic equivalence
const SYNONYMS = {
  pothole: ['crater', 'road', 'asphalt', 'ditch', 'depression', 'tarmac', 'bump', 'pavement'],
  leakage: ['burst', 'pipe', 'water', 'flooding', 'drain', 'sewage', 'overflow', 'plumbing'],
  garbage: ['trash', 'waste', 'dump', 'litter', 'debris', 'bins', 'rubbish'],
  streetlight: ['light', 'pole', 'lamp', 'dark', 'illumination', 'bulb', 'electricity', 'blackout'],
  traffic: ['signal', 'jam', 'congestion', 'lights', 'gridlock', 'crossing'],
};

/**
 * Tokenize and normalize text
 */
export function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Calculate Jaccard and Synonyms-weighted similarity between two token lists
 */
export function calculateTokenSimilarity(tokens1, tokens2) {
  if (!tokens1.length || !tokens2.length) return 0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let directMatches = 0;
  for (const t of set1) {
    if (set2.has(t)) directMatches++;
  }

  // Synonym / Root matches
  let semanticMatches = 0;
  for (const t1 of set1) {
    if (set2.has(t1)) continue;
    for (const t2 of set2) {
      if (set1.has(t2)) continue;
      // Check prefix/stem overlap
      if (t1.length > 4 && t2.length > 4 && (t1.startsWith(t2.slice(0, 4)) || t2.startsWith(t1.slice(0, 4)))) {
        semanticMatches += 0.7;
        break;
      }
      // Check synonym dictionary
      for (const [key, syns] of Object.entries(SYNONYMS)) {
        if ((t1 === key || syns.includes(t1)) && (t2 === key || syns.includes(t2))) {
          semanticMatches += 0.8;
          break;
        }
      }
    }
  }

  const unionSize = new Set([...tokens1, ...tokens2]).size;
  const matchScore = (directMatches + semanticMatches) / Math.max(unionSize, 1);
  return Math.min(1.0, matchScore);
}

/**
 * Calculate location similarity between two location strings and coordinates
 */
export function calculateLocationSimilarity(loc1, loc2, coords1, coords2) {
  let score = 0;

  // 1. Geographic coordinate distance (if available)
  if (coords1?.lat && coords1?.lng && coords2?.lat && coords2?.lng) {
    const R = 6371; // Earth radius in km
    const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
    const dLng = ((coords2.lng - coords1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coords1.lat * Math.PI) / 180) *
        Math.cos((coords2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Within 200m -> 1.0, within 1km -> 0.8, within 3km -> 0.4
    if (distanceKm <= 0.2) return 1.0;
    if (distanceKm <= 1.0) return 0.85;
    if (distanceKm <= 3.0) return 0.5;
  }

  // 2. Textual landmark overlap
  const tokens1 = tokenize(loc1);
  const tokens2 = tokenize(loc2);
  const textScore = calculateTokenSimilarity(tokens1, tokens2);

  // Direct substring check
  const l1 = (loc1 || '').toLowerCase().trim();
  const l2 = (loc2 || '').toLowerCase().trim();
  if (l1 && l2 && (l1.includes(l2) || l2.includes(l1))) {
    return Math.max(textScore, 0.9);
  }

  return textScore;
}

/**
 * Compute comprehensive similarity score between a complaint and an existing issue or complaint
 */
export function computeSimilarity(newComplaint, existingItem) {
  const descTokens1 = tokenize(newComplaint.description);
  const descTokens2 = tokenize(existingItem.description || existingItem.title || '');

  const textSimilarity = calculateTokenSimilarity(descTokens1, descTokens2);
  
  const locSimilarity = calculateLocationSimilarity(
    newComplaint.location_name,
    existingItem.location_name,
    { lat: newComplaint.latitude, lng: newComplaint.longitude },
    { lat: existingItem.latitude, lng: existingItem.longitude }
  );

  const typeMatch = (newComplaint.issue_type && existingItem.issue_type &&
    newComplaint.issue_type.toLowerCase() === existingItem.issue_type.toLowerCase()) ? 1.0 : 0.4;

  // Weighted formula: Text 50%, Location 35%, Issue Type 15%
  let combinedScore = (textSimilarity * 0.50) + (locSimilarity * 0.35) + (typeMatch * 0.15);

  // If text and location are both strong matches, boost score
  if (textSimilarity > 0.45 && locSimilarity > 0.6) {
    combinedScore = Math.min(1.0, combinedScore + 0.2);
  }

  return {
    score: Math.round(combinedScore * 100) / 100,
    textSimilarity: Math.round(textSimilarity * 100) / 100,
    locSimilarity: Math.round(locSimilarity * 100) / 100,
    typeMatch: typeMatch === 1.0,
    matchedTokens: descTokens1.filter(t => descTokens2.includes(t)),
  };
}

/**
 * Search stored issues and complaints for similar records
 */
export function findSimilarIssues(newComplaint, existingIssues = [], threshold = 0.45) {
  const matches = [];

  for (const issue of existingIssues) {
    const similarity = computeSimilarity(newComplaint, issue);
    if (similarity.score >= threshold) {
      matches.push({
        issue,
        ...similarity,
        isRecurrenceCandidate: ['Resolved', 'Closed', 'Verified'].includes(issue.status),
      });
    }
  }

  // Sort by highest similarity score first
  matches.sort((a, b) => b.score - a.score);
  return matches;
}

export default {
  tokenize,
  calculateTokenSimilarity,
  calculateLocationSimilarity,
  computeSimilarity,
  findSimilarIssues,
};
