import express from 'express';
import { query } from '../db/dbAdapter.js';
import { analyzeComplaint } from '../services/aiService.js';
import { findSimilarIssues, computeSimilarity } from '../services/similarityEngine.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/ai/analyze
router.post('/analyze', optionalAuth, async (req, res) => {
  try {
    const { description, location_name, latitude, longitude } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Complaint description is required for AI analysis.' });
    }

    // 1. Run AI classification pipeline (Gemini or Deterministic fallback)
    const aiAnalysis = await analyzeComplaint(description, location_name);

    // 2. Fetch existing issues from database for similarity matching
    const issuesRes = await query(`
      SELECT i.*, d.name as department_name, d.code as department_code,
             COUNT(c.id) as complaint_count
      FROM issues i
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN complaints c ON c.issue_id = i.id
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `);

    // 3. Search for similar issues
    const newComplaintData = {
      description,
      location_name: location_name || aiAnalysis.extracted_location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      issue_type: aiAnalysis.issue_type,
    };

    const similarMatches = findSimilarIssues(newComplaintData, issuesRes.rows, 0.40);

    // 4. Fetch stored complaints for granular text comparison
    const complaintsRes = await query(`
      SELECT c.*, i.title as issue_title, i.status as issue_status, i.id as issue_id
      FROM complaints c
      LEFT JOIN issues i ON c.issue_id = i.id
      ORDER BY c.created_at DESC
      LIMIT 50
    `);

    const similarComplaints = [];
    for (const c of complaintsRes.rows) {
      const sim = computeSimilarity(newComplaintData, c);
      if (sim.score >= 0.45) {
        similarComplaints.push({
          complaint: c,
          ...sim,
        });
      }
    }
    similarComplaints.sort((a, b) => b.score - a.score);

    // 5. Determine cluster / recurrence action
    let bestMatch = similarMatches[0] || null;
    let isRecurrence = false;
    let matchingIssue = null;

    if (bestMatch && bestMatch.score >= 0.50) {
      matchingIssue = bestMatch.issue;
      if (['Resolved', 'Closed', 'Verified'].includes(matchingIssue.status)) {
        isRecurrence = true;
      }
    }

    return res.json({
      aiAnalysis,
      similarityScore: bestMatch ? bestMatch.score : 0,
      bestMatch: matchingIssue,
      isRecurrence,
      similarIssues: similarMatches.slice(0, 5),
      similarComplaints: similarComplaints.slice(0, 5),
    });
  } catch (err) {
    console.error('AI Analysis error:', err);
    return res.status(500).json({ error: 'Failed to analyze complaint.' });
  }
});

export default router;
