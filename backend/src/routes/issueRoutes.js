import express from 'express';
import { query } from '../db/dbAdapter.js';
import { upload } from '../middleware/upload.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { calculateResolutionQualityScore } from '../services/resolutionScoreService.js';
import { findSimilarIssues } from '../services/similarityEngine.js';

const router = express.Router();

// GET /api/issues
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { department_id, status, severity, is_recurrent, search } = req.query;

    let sql = `
      SELECT i.*, d.name as department_name, d.code as department_code,
             COUNT(DISTINCT c.id) as complaint_count,
             COUNT(DISTINCT e.id) as evidence_count,
             COUNT(DISTINCT r.id) as recurrence_event_count
      FROM issues i
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN complaints c ON c.issue_id = i.id
      LEFT JOIN evidence e ON e.issue_id = i.id
      LEFT JOIN recurrence_events r ON r.issue_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (department_id) {
      params.push(department_id);
      sql += ` AND i.department_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND i.status = $${params.length}`;
    }

    if (severity) {
      params.push(severity);
      sql += ` AND i.severity = $${params.length}`;
    }

    if (is_recurrent === 'true' || is_recurrent === '1') {
      sql += ` AND (i.is_recurrent = 1 OR i.recurrence_count > 0)`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (LOWER(i.title) LIKE $${params.length} OR LOWER(i.location_name) LIKE $${params.length} OR LOWER(i.issue_type) LIKE $${params.length})`;
    }

    sql += ` GROUP BY i.id ORDER BY i.id DESC`;

    const result = await query(sql, params);

    // Compute live SLA health indicator
    const now = new Date();
    const issuesWithSla = result.rows.map(issue => {
      const deadline = issue.sla_deadline ? new Date(issue.sla_deadline) : null;
      let slaStatus = 'ON_TRACK';
      let hoursRemaining = 0;

      if (deadline) {
        const diffMs = deadline - now;
        hoursRemaining = Math.round(diffMs / (1000 * 60 * 60));
        if (['Resolved', 'Closed', 'Verified'].includes(issue.status)) {
          slaStatus = 'COMPLETED';
        } else if (diffMs < 0) {
          slaStatus = 'OVERDUE';
        } else if (hoursRemaining <= 12) {
          slaStatus = 'APPROACHING_DEADLINE';
        }
      }

      return {
        ...issue,
        slaStatus,
        hoursRemaining,
      };
    });

    return res.json({ issues: issuesWithSla });
  } catch (err) {
    console.error('Error fetching issues:', err);
    return res.status(500).json({ error: 'Failed to fetch issues.' });
  }
});

// GET /api/issues/:id (Full Issue Passport)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch Master Issue
    const issueRes = await query(`
      SELECT i.*, d.name as department_name, d.code as department_code, d.contact_email as department_email
      FROM issues i
      LEFT JOIN departments d ON i.department_id = d.id
      WHERE i.id = $1
    `, [id]);

    if (!issueRes.rows.length) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    const issue = issueRes.rows[0];

    // 2. Fetch all linked complaints
    const complaintsRes = await query(`
      SELECT c.*, u.name as citizen_name
      FROM complaints c
      LEFT JOIN users u ON c.citizen_id = u.id
      WHERE c.issue_id = $1
      ORDER BY c.created_at DESC
    `, [id]);

    // 3. Fetch actions timeline
    const actionsRes = await query(`
      SELECT a.*, u.name as user_name, u.role as user_role
      FROM actions a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.issue_id = $1
      ORDER BY a.created_at ASC
    `, [id]);

    // 4. Fetch evidence records
    const evidenceRes = await query(`
      SELECT e.*, u.name as uploaded_by_name, u.role as uploaded_by_role
      FROM evidence e
      LEFT JOIN users u ON e.uploaded_by = u.id
      WHERE e.issue_id = $1
      ORDER BY e.created_at DESC
    `, [id]);

    // 5. Fetch verification audit logs
    const verificationsRes = await query(`
      SELECT v.*, u.name as citizen_name
      FROM verifications v
      LEFT JOIN users u ON v.citizen_id = u.id
      WHERE v.issue_id = $1
      ORDER BY v.created_at DESC
    `, [id]);

    // 6. Fetch recurrence events
    const recurrenceRes = await query(`
      SELECT r.*, c.description as trigger_description, c.created_at as trigger_date
      FROM recurrence_events r
      LEFT JOIN complaints c ON r.trigger_complaint_id = c.id
      WHERE r.issue_id = $1
      ORDER BY r.created_at DESC
    `, [id]);

    // 7. Calculate dynamic AI Resolution Quality Score
    const qualityScore = calculateResolutionQualityScore({
      slaDeadline: issue.sla_deadline,
      resolvedAt: issue.updated_at,
      status: issue.status,
      hasEvidence: evidenceRes.rows.length > 0,
      evidenceCount: evidenceRes.rows.length,
      verificationStatus: issue.verification_status,
      recurrenceCount: issue.recurrence_count || recurrenceRes.rows.length,
      actionCount: actionsRes.rows.length,
    });

    // Compute SLA metrics
    const now = new Date();
    const deadline = issue.sla_deadline ? new Date(issue.sla_deadline) : null;
    let slaStatus = 'ON_TRACK';
    let hoursRemaining = 0;

    if (deadline) {
      const diffMs = deadline - now;
      hoursRemaining = Math.round(diffMs / (1000 * 60 * 60));
      if (['Resolved', 'Closed', 'Verified'].includes(issue.status)) {
        slaStatus = 'COMPLETED';
      } else if (diffMs < 0) {
        slaStatus = 'OVERDUE';
      } else if (hoursRemaining <= 12) {
        slaStatus = 'APPROACHING_DEADLINE';
      }
    }

    return res.json({
      issue: {
        ...issue,
        slaStatus,
        hoursRemaining,
        complaint_count: complaintsRes.rows.length,
      },
      complaints: complaintsRes.rows,
      actions: actionsRes.rows,
      evidence: evidenceRes.rows,
      verifications: verificationsRes.rows,
      recurrenceEvents: recurrenceRes.rows,
      qualityScore,
    });
  } catch (err) {
    console.error('Error fetching issue passport:', err);
    return res.status(500).json({ error: 'Failed to fetch issue passport.' });
  }
});

// PATCH /api/issues/:id (Update status, department, SLA)
router.patch('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, department_id, severity, sla_hours, resolution_summary, notes } = req.body;
    const userId = req.user ? req.user.id : 2; // Default to officer if unauthenticated in demo

    // Fetch existing issue
    const prevRes = await query('SELECT * FROM issues WHERE id = $1', [id]);
    if (!prevRes.rows.length) {
      return res.status(404).json({ error: 'Issue not found.' });
    }
    const prevIssue = prevRes.rows[0];

    const updates = [];
    const params = [id];

    if (status) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (department_id) {
      params.push(department_id);
      updates.push(`department_id = $${params.length}`);
    }

    if (severity) {
      params.push(severity);
      updates.push(`severity = $${params.length}`);
    }

    if (sla_hours) {
      params.push(sla_hours);
      updates.push(`sla_hours = $${params.length}`);
      const newDeadline = new Date(Date.now() + sla_hours * 3600 * 1000).toISOString();
      params.push(newDeadline);
      updates.push(`sla_deadline = $${params.length}`);
    }

    if (resolution_summary) {
      params.push(resolution_summary);
      updates.push(`resolution_summary = $${params.length}`);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    await query(`UPDATE issues SET ${updates.join(', ')} WHERE id = $1`, params);

    // Record Action entry
    let actionDesc = `Issue updated.`;
    if (status && status !== prevIssue.status) {
      actionDesc = `Status changed from ${prevIssue.status} to ${status}. ${notes || ''}`.trim();
    } else if (department_id && department_id !== prevIssue.department_id) {
      actionDesc = `Department re-assigned to Department #${department_id}.`;
    }

    await query(`
      INSERT INTO actions (issue_id, user_id, action_type, description)
      VALUES ($1, $2, $3, $4)
    `, [id, userId, 'STATUS_UPDATE', actionDesc]);

    return res.json({ message: 'Issue updated successfully.' });
  } catch (err) {
    console.error('Error updating issue:', err);
    return res.status(500).json({ error: 'Failed to update issue.' });
  }
});

// POST /api/issues/:id/actions (Add operational action note)
router.post('/:id/actions', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action_type, description } = req.body;
    const userId = req.user ? req.user.id : 2;

    if (!description) {
      return res.status(400).json({ error: 'Action description is required.' });
    }

    const actionRes = await query(`
      INSERT INTO actions (issue_id, user_id, action_type, description)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
    `, [id, userId, action_type || 'FIELD_ACTION', description]);

    return res.status(201).json({
      message: 'Action recorded successfully.',
      actionId: actionRes.rows[0]?.id,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record action.' });
  }
});

// POST /api/issues/:id/evidence (Upload resolution photo evidence)
router.post('/:id/evidence', optionalAuth, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { description, mark_resolved } = req.body;
    const userId = req.user ? req.user.id : 2;

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.file_url || null);
    if (!fileUrl) {
      return res.status(400).json({ error: 'Evidence image file or URL is required.' });
    }

    // 1. Log action for evidence upload
    const actRes = await query(`
      INSERT INTO actions (issue_id, user_id, action_type, description)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [id, userId, 'EVIDENCE_UPLOAD', `Resolution evidence submitted: ${description || 'Visual repair documentation'}`]);

    const actionId = actRes.rows[0]?.id;

    // 2. Insert into evidence table
    const evRes = await query(`
      INSERT INTO evidence (issue_id, action_id, file_url, description, uploaded_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [id, actionId, fileUrl, description || 'Field resolution photographic proof', userId]);

    // 3. Mark issue as Resolved if selected
    if (mark_resolved === 'true' || mark_resolved === true) {
      await query(`
        UPDATE issues
        SET status = 'Resolved',
            verification_status = 'Pending',
            resolution_summary = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [description || 'Resolution evidence submitted by municipal team.', id]);

      await query(`
        INSERT INTO actions (issue_id, user_id, action_type, description)
        VALUES ($1, $2, $3, $4)
      `, [id, userId, 'STATUS_UPDATE', 'Issue marked as RESOLVED pending citizen verification audit.']);
    }

    return res.status(201).json({
      message: 'Resolution evidence uploaded successfully.',
      evidenceId: evRes.rows[0]?.id,
      fileUrl,
    });
  } catch (err) {
    console.error('Evidence upload error:', err);
    return res.status(500).json({ error: 'Failed to upload evidence.' });
  }
});

// POST /api/issues/:id/verification (Citizen verification audit)
router.post('/:id/verification', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const citizenId = req.user ? req.user.id : 1;

    if (!['VERIFIED', 'DISPUTED', 'NEEDS_REVIEW'].includes(status)) {
      return res.status(400).json({ error: 'Status must be VERIFIED, DISPUTED, or NEEDS_REVIEW' });
    }

    // 1. Insert verification audit
    await query(`
      INSERT INTO verifications (issue_id, citizen_id, status, notes)
      VALUES ($1, $2, $3, $4)
    `, [id, citizenId, status, notes || `Citizen audit response: ${status}`]);

    // 2. Update issue record
    let newIssueStatus = 'Resolved';
    if (status === 'VERIFIED') {
      newIssueStatus = 'Verified';
    } else if (status === 'DISPUTED') {
      newIssueStatus = 'In Progress'; // Reopen for review
    }

    await query(`
      UPDATE issues
      SET verification_status = $1,
          verification_notes = $2,
          status = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [status, notes || '', newIssueStatus, id]);

    // 3. Log action
    let actionText = `Citizen audit completed: Marked as ${status}.`;
    if (status === 'DISPUTED') {
      actionText = `Resolution disputed by citizen: "${notes || 'Repair unsatisfactory'}". Issue reverted to In Progress for municipal review.`;
    }

    await query(`
      INSERT INTO actions (issue_id, user_id, action_type, description)
      VALUES ($1, $2, $3, $4)
    `, [id, citizenId, 'CITIZEN_VERIFICATION', actionText]);

    return res.json({
      message: `Verification recorded as ${status}.`,
      verification_status: status,
      issue_status: newIssueStatus,
    });
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({ error: 'Failed to submit verification.' });
  }
});

export default router;
