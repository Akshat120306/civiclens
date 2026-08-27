import express from 'express';
import { query } from '../db/dbAdapter.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { department_id } = req.query;

    let issueFilter = '';
    const params = [];
    if (department_id) {
      params.push(department_id);
      issueFilter = ` WHERE i.department_id = $${params.length}`;
    }

    // 1. Fetch all issues for aggregate stats
    const issuesRes = await query(`
      SELECT i.*, d.name as department_name, d.code as department_code,
             COUNT(DISTINCT c.id) as complaint_count
      FROM issues i
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN complaints c ON c.issue_id = i.id
      ${issueFilter}
      GROUP BY i.id
      ORDER BY i.id DESC
    `, params);

    const now = new Date();
    let totalIssues = issuesRes.rows.length;
    let openIssues = 0;
    let inProgressIssues = 0;
    let resolvedIssues = 0;
    let overdueIssues = 0;
    let approachingSla = 0;
    let recurrentIssues = 0;
    let pendingVerification = 0;
    let totalComplaintsClustered = 0;

    const urgentQueue = [];

    issuesRes.rows.forEach(issue => {
      totalComplaintsClustered += Number(issue.complaint_count || 1);
      const isDone = ['Resolved', 'Closed', 'Verified'].includes(issue.status);

      if (issue.status === 'Open') openIssues++;
      else if (issue.status === 'In Progress') inProgressIssues++;
      else if (isDone) resolvedIssues++;

      if (issue.is_recurrent === 1 || issue.recurrence_count > 0) {
        recurrentIssues++;
      }

      if (issue.verification_status === 'Pending' && isDone) {
        pendingVerification++;
      }

      const deadline = issue.sla_deadline ? new Date(issue.sla_deadline) : null;
      let isOverdue = false;
      let isApproaching = false;

      if (deadline && !isDone) {
        const diffMs = deadline - now;
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffMs < 0) {
          overdueIssues++;
          isOverdue = true;
        } else if (diffHours <= 12) {
          approachingSla++;
          isApproaching = true;
        }
      }

      if (isOverdue || isApproaching || issue.severity === 'Critical' || issue.is_recurrent === 1) {
        urgentQueue.push({
          ...issue,
          isOverdue,
          isApproaching,
        });
      }
    });

    // 2. Department Breakdown
    const deptStatsRes = await query(`
      SELECT d.id, d.name, d.code,
             COUNT(i.id) as issue_count,
             SUM(CASE WHEN i.status IN ('Resolved', 'Verified', 'Closed') THEN 1 ELSE 0 END) as resolved_count,
             SUM(CASE WHEN i.is_recurrent = 1 OR i.recurrence_count > 0 THEN 1 ELSE 0 END) as recurrent_count
      FROM departments d
      LEFT JOIN issues i ON i.department_id = d.id
      GROUP BY d.id
      ORDER BY d.id ASC
    `);

    // 3. Recent Action Stream
    const recentActionsRes = await query(`
      SELECT a.*, i.title as issue_title, i.location_name, u.name as user_name, u.role as user_role
      FROM actions a
      LEFT JOIN issues i ON a.issue_id = i.id
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    // 4. Overall SLA Compliance Rate
    const resolvedCount = resolvedIssues;
    const slaComplianceRate = totalIssues > 0 ? Math.round(((totalIssues - overdueIssues) / totalIssues) * 100) : 100;
    const resolutionRate = totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0;

    return res.json({
      metrics: {
        totalIssues,
        openIssues,
        inProgressIssues,
        resolvedIssues,
        overdueIssues,
        approachingSla,
        recurrentIssues,
        pendingVerification,
        totalComplaintsClustered,
        slaComplianceRate,
        resolutionRate,
      },
      departments: deptStatsRes.rows,
      urgentQueue: urgentQueue.slice(0, 8),
      recentActivity: recentActionsRes.rows,
      allIssues: issuesRes.rows,
    });
  } catch (err) {
    console.error('Dashboard metrics error:', err);
    return res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
  }
});

export default router;
