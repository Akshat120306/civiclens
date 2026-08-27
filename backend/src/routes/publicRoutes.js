import express from 'express';
import { query } from '../db/dbAdapter.js';
import { calculateResolutionQualityScore } from '../services/resolutionScoreService.js';

const router = express.Router();

// GET /api/public/issues (Anonymized public issues feed)
router.get('/issues', async (req, res) => {
  try {
    const { department_code, status, search } = req.query;

    let sql = `
      SELECT i.id, i.title, i.issue_type, i.location_name, i.severity, i.status,
             i.verification_status, i.sla_hours, i.sla_deadline, i.is_recurrent, i.recurrence_count,
             i.resolution_score, i.resolution_summary, i.created_at, i.updated_at,
             d.name as department_name, d.code as department_code,
             COUNT(DISTINCT c.id) as complaint_count,
             COUNT(DISTINCT e.id) as evidence_count
      FROM issues i
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN complaints c ON c.issue_id = i.id
      LEFT JOIN evidence e ON e.issue_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (department_code) {
      params.push(department_code);
      sql += ` AND d.code = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND i.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (LOWER(i.title) LIKE $${params.length} OR LOWER(i.location_name) LIKE $${params.length} OR LOWER(i.issue_type) LIKE $${params.length})`;
    }

    sql += ` GROUP BY i.id ORDER BY i.id DESC`;

    const result = await query(sql, params);

    const now = new Date();
    const anonymizedIssues = result.rows.map(issue => {
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

      // Calculate transparent score
      const qualityScore = calculateResolutionQualityScore({
        slaDeadline: issue.sla_deadline,
        resolvedAt: issue.updated_at,
        status: issue.status,
        hasEvidence: issue.evidence_count > 0,
        evidenceCount: issue.evidence_count,
        verificationStatus: issue.verification_status,
        recurrenceCount: issue.recurrence_count,
        actionCount: 2,
      });

      return {
        id: issue.id,
        title: issue.title,
        issue_type: issue.issue_type,
        location_name: issue.location_name,
        severity: issue.severity,
        status: issue.status,
        verification_status: issue.verification_status,
        department_name: issue.department_name,
        department_code: issue.department_code,
        sla_hours: issue.sla_hours,
        sla_deadline: issue.sla_deadline,
        slaStatus,
        hoursRemaining,
        is_recurrent: issue.is_recurrent === 1 || issue.recurrence_count > 0,
        recurrence_count: issue.recurrence_count || 0,
        complaint_count: Number(issue.complaint_count || 1),
        evidence_count: Number(issue.evidence_count || 0),
        qualityScore: qualityScore.score,
        qualityGrade: qualityScore.grade,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
      };
    });

    return res.json({ issues: anonymizedIssues });
  } catch (err) {
    console.error('Public issues fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch public issues feed.' });
  }
});

// GET /api/public/stats
router.get('/stats', async (req, res) => {
  try {
    const issuesRes = await query(`
      SELECT status, verification_status, sla_deadline, is_recurrent, recurrence_count
      FROM issues
    `);

    const complaintsCountRes = await query(`SELECT COUNT(*) as count FROM complaints`);

    const now = new Date();
    let totalIssues = issuesRes.rows.length;
    let resolvedCount = 0;
    let verifiedCount = 0;
    let overdueCount = 0;
    let recurringCount = 0;

    issuesRes.rows.forEach(i => {
      const isDone = ['Resolved', 'Closed', 'Verified'].includes(i.status);
      if (isDone) resolvedCount++;
      if (i.verification_status === 'VERIFIED') verifiedCount++;
      if (i.is_recurrent === 1 || i.recurrence_count > 0) recurringCount++;

      const deadline = i.sla_deadline ? new Date(i.sla_deadline) : null;
      if (deadline && !isDone && deadline < now) {
        overdueCount++;
      }
    });

    const slaCompliance = totalIssues > 0 ? Math.round(((totalIssues - overdueCount) / totalIssues) * 100) : 100;
    const resolutionRate = totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0;

    return res.json({
      totalIssues,
      totalComplaints: Number(complaintsCountRes.rows[0]?.count || totalIssues),
      resolvedCount,
      verifiedCount,
      overdueCount,
      recurringCount,
      slaCompliance,
      resolutionRate,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch public stats.' });
  }
});

export default router;
