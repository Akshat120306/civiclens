/**
 * AI-Assisted Resolution Quality Score Calculator
 * Dynamically computes a transparent 0-100 rating based on:
 * - SLA Adherence
 * - Resolution Evidence Availability
 * - Citizen Verification Feedback
 * - Recurrence Event History
 * - Operational Action Log Completeness
 */

export function calculateResolutionQualityScore({
  slaDeadline,
  resolvedAt,
  status,
  hasEvidence,
  evidenceCount = 0,
  verificationStatus,
  recurrenceCount = 0,
  actionCount = 0,
}) {
  let score = 25; // Base baseline
  const factors = [];

  // 1. SLA Performance Assessment
  const now = new Date();
  const deadline = slaDeadline ? new Date(slaDeadline) : null;
  const isResolved = ['Resolved', 'Closed', 'Verified'].includes(status);

  if (deadline) {
    if (isResolved) {
      const resolveTime = resolvedAt ? new Date(resolvedAt) : now;
      if (resolveTime <= deadline) {
        score += 25;
        factors.push({ name: 'SLA Adherence', points: '+25', note: 'Resolved within committed SLA deadline.' });
      } else {
        score -= 15;
        factors.push({ name: 'SLA Delay', points: '-15', note: 'Resolved after the SLA deadline expired.' });
      }
    } else if (now > deadline) {
      score -= 25;
      factors.push({ name: 'SLA Breach', points: '-25', note: 'Currently overdue beyond agreed SLA window.' });
    } else {
      score += 15;
      factors.push({ name: 'SLA On-Track', points: '+15', note: 'Currently progressing within SLA timeframe.' });
    }
  }

  // 2. Photographic Proof & Evidence
  if (hasEvidence || evidenceCount > 0) {
    const evidenceBonus = Math.min(25, 15 + evidenceCount * 5);
    score += evidenceBonus;
    factors.push({ name: 'Photographic Proof', points: `+${evidenceBonus}`, note: `${evidenceCount} field resolution photo(s) submitted.` });
  } else if (isResolved) {
    score -= 15;
    factors.push({ name: 'Missing Evidence', points: '-15', note: 'Marked resolved without accompanying photographic proof.' });
  }

  // 3. Citizen Verification Audit
  if (verificationStatus === 'VERIFIED') {
    score += 25;
    factors.push({ name: 'Citizen Audit', points: '+25', note: 'Directly verified and approved by reporting citizens.' });
  } else if (verificationStatus === 'DISPUTED') {
    score -= 35;
    factors.push({ name: 'Citizen Dispute', points: '-35', note: 'Citizen audit flagged incomplete or unsatisfactory repair.' });
  } else if (verificationStatus === 'NEEDS_REVIEW') {
    score -= 10;
    factors.push({ name: 'Review Pending', points: '-10', note: 'Citizen requested additional secondary inspection.' });
  }

  // 4. Recurrence Penalties
  if (recurrenceCount === 0) {
    score += 10;
    factors.push({ name: 'Zero Recurrence', points: '+10', note: 'No recurring complaints recorded for this location.' });
  } else {
    const penalty = Math.min(40, recurrenceCount * 20);
    score -= penalty;
    factors.push({ name: 'Recurrence Penalty', points: `-${penalty}`, note: `Issue has recurred ${recurrenceCount} time(s) post-resolution.` });
  }

  // 5. Action Log Completeness
  if (actionCount >= 2) {
    score += 15;
    factors.push({ name: 'Detailed Action Logs', points: '+15', note: `${actionCount} documented operational progress milestones.` });
  } else if (actionCount === 1) {
    score += 8;
    factors.push({ name: 'Basic Action Log', points: '+8', note: '1 operational milestone recorded.' });
  }

  // Bound score strictly between 5 and 100
  const finalScore = Math.max(5, Math.min(100, Math.round(score)));

  let grade = 'Acceptable';
  let gradeColor = 'blue';
  if (finalScore >= 85) {
    grade = 'Excellent';
    gradeColor = 'emerald';
  } else if (finalScore >= 70) {
    grade = 'Good';
    gradeColor = 'blue';
  } else if (finalScore >= 50) {
    grade = 'Moderate';
    gradeColor = 'amber';
  } else {
    grade = 'Critical Attention Required';
    gradeColor = 'rose';
  }

  return {
    score: finalScore,
    grade,
    gradeColor,
    factors,
    assessedAt: new Date().toISOString(),
  };
}

export default {
  calculateResolutionQualityScore,
};
