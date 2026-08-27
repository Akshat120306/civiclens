import express from 'express';
import { query } from '../db/dbAdapter.js';
import { upload } from '../middleware/upload.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { analyzeComplaint } from '../services/aiService.js';
import { findSimilarIssues } from '../services/similarityEngine.js';
import { calculateResolutionQualityScore } from '../services/resolutionScoreService.js';

const router = express.Router();

// POST /api/complaints (Create new complaint with AI analysis, clustering, and recurrence detection)
router.post('/', optionalAuth, upload.single('image'), async (req, res) => {
  try {
    const { description, location_name, latitude, longitude, issue_type } = req.body;
    if (!description || !location_name) {
      return res.status(400).json({ error: 'Description and location are required.' });
    }

    // Default to citizen user or authenticated user
    const citizenId = req.user ? req.user.id : 1; // Default to demo citizen ID 1
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);

    // 1. Run AI classification & analysis
    const aiAnalysis = await analyzeComplaint(description, location_name);
    const finalType = issue_type || aiAnalysis.issue_type;

    // 2. Fetch existing issues for duplicate & recurrence search
    const issuesRes = await query(`
      SELECT i.*, d.name as department_name, d.code as department_code,
             COUNT(c.id) as complaint_count
      FROM issues i
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN complaints c ON c.issue_id = i.id
      GROUP BY i.id
      ORDER BY i.id DESC
    `);

    const complaintData = {
      description,
      location_name,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      issue_type: finalType,
    };

    const matches = findSimilarIssues(complaintData, issuesRes.rows, 0.45);
    const bestMatch = matches.length > 0 ? matches[0] : null;

    let targetIssueId = null;
    let clusterStatus = 'New_Issue';
    let recurrenceDetected = false;
    let recurrenceEvent = null;
    let responseActionMessage = '';

    // 3. Handle Similarity & Clustering / Recurrence
    if (bestMatch && bestMatch.score >= 0.48) {
      const matchedIssue = bestMatch.issue;
      targetIssueId = matchedIssue.id;

      const isResolved = ['Resolved', 'Closed', 'Verified'].includes(matchedIssue.status);

      if (isResolved) {
        // CASE: RECURRENCE DETECTED
        recurrenceDetected = true;
        clusterStatus = 'Recurrence_Detected';
        const newRecurrenceCount = (matchedIssue.recurrence_count || 0) + 1;

        // Reopen or flag issue as recurring
        await query(`
          UPDATE issues
          SET recurrence_count = $1,
              is_recurrent = 1,
              status = 'Reopened',
              verification_status = 'Disputed',
              verification_notes = 'Auto-flagged: Recurrence detected via new citizen complaint.',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [newRecurrenceCount, targetIssueId]);

        // Insert complaint
        const compInsert = await query(`
          INSERT INTO complaints (citizen_id, issue_id, description, location_name, latitude, longitude, image_url, issue_type, raw_severity, ai_summary, similarity_score, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id
        `, [
          citizenId,
          targetIssueId,
          description,
          location_name,
          latitude ? parseFloat(latitude) : null,
          longitude ? parseFloat(longitude) : null,
          imageUrl,
          finalType,
          aiAnalysis.severity,
          aiAnalysis.summary,
          bestMatch.score,
          'Recurrence_Trigger',
        ]);

        const newComplaintId = compInsert.rows[0]?.id || compInsert.lastInsertRowid;

        // Register recurrence event
        const recNotes = `Recurrence detected: New complaint submitted with ${Math.round(bestMatch.score * 100)}% semantic similarity to previously resolved Issue #${targetIssueId}.`;
        const recRes = await query(`
          INSERT INTO recurrence_events (issue_id, trigger_complaint_id, similarity_score, notes)
          VALUES ($1, $2, $3, $4)
          RETURNING id, created_at
        `, [targetIssueId, newComplaintId, bestMatch.score, recNotes]);

        recurrenceEvent = {
          id: recRes.rows[0]?.id,
          issue_id: targetIssueId,
          trigger_complaint_id: newComplaintId,
          similarity_score: bestMatch.score,
          notes: recNotes,
        };

        // Add action log
        await query(`
          INSERT INTO actions (issue_id, user_id, action_type, description)
          VALUES ($1, $2, $3, $4)
        `, [
          targetIssueId,
          citizenId,
          'RECURRENCE_ALERT',
          `AI System detected issue recurrence from Complaint #${newComplaintId} (${Math.round(bestMatch.score * 100)}% match). Issue status changed to Reopened.`,
        ]);

        responseActionMessage = `Recurrence detected for Issue #${targetIssueId}. The issue has been automatically flagged and reopened for inspection.`;
      } else {
        // CASE: MERGE INTO EXISTING ACTIVE ISSUE CLUSTER
        clusterStatus = 'Clustered';

        await query(`
          UPDATE issues
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [targetIssueId]);

        // Insert complaint
        await query(`
          INSERT INTO complaints (citizen_id, issue_id, description, location_name, latitude, longitude, image_url, issue_type, raw_severity, ai_summary, similarity_score, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          citizenId,
          targetIssueId,
          description,
          location_name,
          latitude ? parseFloat(latitude) : null,
          longitude ? parseFloat(longitude) : null,
          imageUrl,
          finalType,
          aiAnalysis.severity,
          aiAnalysis.summary,
          bestMatch.score,
          'Clustered',
        ]);

        // Add action log
        await query(`
          INSERT INTO actions (issue_id, user_id, action_type, description)
          VALUES ($1, $2, $3, $4)
        `, [
          targetIssueId,
          citizenId,
          'COMPLAINT_MERGED',
          `New citizen complaint merged into Common Issue #${targetIssueId} (${Math.round(bestMatch.score * 100)}% similarity).`,
        ]);

        responseActionMessage = `Complaint clustered into existing Common Issue #${targetIssueId} (${Math.round(bestMatch.score * 100)}% similarity match).`;
      }
    } else {
      // CASE: CREATE BRAND NEW COMMON ISSUE
      const deptId = aiAnalysis.recommended_department_id;
      const slaHours = aiAnalysis.recommended_sla_hours || 72;
      const deadline = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

      const issueTitle = `${finalType} near ${location_name}`;
      const issueRes = await query(`
        INSERT INTO issues (title, description, issue_type, location_name, latitude, longitude, severity, department_id, sla_hours, sla_deadline, status, verification_status, root_cause)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [
        issueTitle,
        description,
        finalType,
        location_name,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        aiAnalysis.severity,
        deptId,
        slaHours,
        deadline,
        'Open',
        'Pending',
        aiAnalysis.root_cause_suggestion,
      ]);

      targetIssueId = issueRes.rows[0]?.id || issueRes.lastInsertRowid;

      // Insert complaint
      await query(`
        INSERT INTO complaints (citizen_id, issue_id, description, location_name, latitude, longitude, image_url, issue_type, raw_severity, ai_summary, similarity_score, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        citizenId,
        targetIssueId,
        description,
        location_name,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        imageUrl,
        finalType,
        aiAnalysis.severity,
        aiAnalysis.summary,
        1.0,
        'Submitted',
      ]);

      // Initial Action Log
      await query(`
        INSERT INTO actions (issue_id, user_id, action_type, description)
        VALUES ($1, $2, $3, $4)
      `, [
        targetIssueId,
        citizenId,
        'ISSUE_CREATED',
        `New Common Issue #${targetIssueId} generated with ${slaHours}h SLA assigned to ${aiAnalysis.recommended_department_name}.`,
      ]);

      responseActionMessage = `New Common Issue #${targetIssueId} created and routed to ${aiAnalysis.recommended_department_name}.`;
    }

    // Fetch full issue details to return
    const issueDetailsRes = await query(`
      SELECT i.*, d.name as department_name, d.code as department_code,
             COUNT(c.id) as complaint_count
      FROM issues i
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN complaints c ON c.issue_id = i.id
      WHERE i.id = $1
      GROUP BY i.id
    `, [targetIssueId]);

    return res.status(201).json({
      message: 'Complaint processed successfully.',
      actionMessage: responseActionMessage,
      clusterStatus,
      recurrenceDetected,
      recurrenceEvent,
      similarityScore: bestMatch ? bestMatch.score : 0,
      matchedIssue: bestMatch ? bestMatch.issue : null,
      issue: issueDetailsRes.rows[0] || null,
      aiAnalysis,
    });
  } catch (err) {
    console.error('Complaint submission error:', err);
    return res.status(500).json({ error: 'Failed to process complaint.' });
  }
});

// GET /api/complaints
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { issue_id, citizen_id } = req.query;
    let sql = `
      SELECT c.*, u.name as citizen_name, u.email as citizen_email,
             i.title as issue_title, i.status as issue_status, i.severity as issue_severity,
             d.name as department_name
      FROM complaints c
      LEFT JOIN users u ON c.citizen_id = u.id
      LEFT JOIN issues i ON c.issue_id = i.id
      LEFT JOIN departments d ON i.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (issue_id) {
      params.push(issue_id);
      sql += ` AND c.issue_id = $${params.length}`;
    }

    if (citizen_id) {
      params.push(citizen_id);
      sql += ` AND c.citizen_id = $${params.length}`;
    }

    sql += ` ORDER BY c.created_at DESC`;

    const result = await query(sql, params);
    return res.json({ complaints: result.rows });
  } catch (err) {
    console.error('Error fetching complaints:', err);
    return res.status(500).json({ error: 'Failed to fetch complaints.' });
  }
});

// GET /api/complaints/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const compRes = await query(`
      SELECT c.*, u.name as citizen_name, u.email as citizen_email,
             i.title as issue_title, i.status as issue_status, i.severity as issue_severity,
             i.sla_hours, i.sla_deadline, d.name as department_name, d.code as department_code
      FROM complaints c
      LEFT JOIN users u ON c.citizen_id = u.id
      LEFT JOIN issues i ON c.issue_id = i.id
      LEFT JOIN departments d ON i.department_id = d.id
      WHERE c.id = $1
    `, [id]);

    if (!compRes.rows.length) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    return res.json({ complaint: compRes.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch complaint details.' });
  }
});

export default router;
