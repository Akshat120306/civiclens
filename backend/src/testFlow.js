/**
 * Comprehensive Automated End-to-End Test Suite for CivicLens
 * Tests complete workflow:
 * Login -> Complaint Intake -> AI Analysis -> Similarity & Clustering -> Issue Passport ->
 * Department Actions -> Evidence Upload -> Citizen Verification ->
 * Recurrence Detection -> Public Accountability
 */

import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  return { status: response.status, data };
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('🚀 RUNNING CIVICLENS AUTOMATED END-TO-END VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✕ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('\n[1] Testing Health Endpoint');
    const health = await request('/health');
    assert(health.status === 200 && health.data.status === 'online', 'Backend health check online');

    // 2. Authentication
    console.log('\n[2] Testing Authentication & Roles');
    const citizenLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'citizen@civiclens.gov', password: 'password123' },
    });
    assert(citizenLogin.status === 200 && citizenLogin.data.token, 'Citizen login successful & JWT received');
    const citizenToken = citizenLogin.data.token;

    const officerLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'officer.pwd@civiclens.gov', password: 'password123' },
    });
    assert(officerLogin.status === 200 && officerLogin.data.user.role === 'officer', 'PWD Officer login successful');
    const officerToken = officerLogin.data.token;

    // 3. AI Analysis & Pre-Check
    console.log('\n[3] Testing Real-Time AI Analysis & Similarity Engine');
    const aiAnalysis = await request('/ai/analyze', {
      method: 'POST',
      body: {
        description: 'Road has a huge pothole outside ABC College main gate creating traffic risk.',
        location_name: 'ABC College Main Gate, University Road',
      },
    });
    assert(aiAnalysis.status === 200, 'AI Analysis endpoint responded');
    assert(aiAnalysis.data.aiAnalysis.issue_type === 'Roads & Infrastructure', 'Correctly categorized as Roads & Infrastructure');
    assert(aiAnalysis.data.similarityScore >= 0.50, `High semantic similarity matched to existing Issue #${aiAnalysis.data.bestMatch?.id} (${Math.round(aiAnalysis.data.similarityScore * 100)}%)`);

    // 4. Duplicate Complaint Clustering
    console.log('\n[4] Testing Complaint Intake & Clustering');
    const compSubmission = await request('/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: {
        description: 'Massive water leakage from broken pipe flooding Sector 9 Market.',
        location_name: 'Sector 9 Central Market, Gate 2',
      },
    });
    assert(compSubmission.status === 201, 'Complaint submitted successfully');
    assert(compSubmission.data.issue?.id === 1043, 'Correctly clustered into active Common Issue #1043');

    // 5. Issue Passport Data Fetching
    console.log('\n[5] Testing Issue Passport Record (#1042)');
    const passportRes = await request('/issues/1042');
    assert(passportRes.status === 200, 'Issue Passport retrieved');
    assert(passportRes.data.issue.id === 1042, 'Issue ID is 1042');
    assert(passportRes.data.complaints.length >= 10, `Aggregated complaint count: ${passportRes.data.complaints.length}`);
    assert(passportRes.data.qualityScore.score > 0, `Dynamic AI Quality Score calculated: ${passportRes.data.qualityScore.score}/100`);

    // 6. Department Actions Logging
    console.log('\n[6] Testing Department Action Logging');
    const actionRes = await request('/issues/1042/actions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: {
        action_type: 'FIELD_INSPECTION',
        description: 'Automated test: Engineer inspected site and verified hot-mix asphalt compaction.',
      },
    });
    assert(actionRes.status === 201, 'Action recorded successfully in database');

    // 7. Resolution Evidence Submission
    console.log('\n[7] Testing Evidence Submission');
    const evidenceRes = await request('/issues/1042/evidence', {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: {
        file_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
        description: 'Field photo: Completed bitumen road resurfacing.',
        mark_resolved: true,
      },
    });
    assert(evidenceRes.status === 201, 'Evidence uploaded and logged');

    // 8. Citizen Verification Audit
    console.log('\n[8] Testing Citizen Verification Audit');
    const verifyRes = await request('/issues/1042/verification', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: {
        status: 'VERIFIED',
        notes: 'Automated verification test: Smooth asphalt confirmed on site.',
      },
    });
    assert(verifyRes.status === 200 && verifyRes.data.verification_status === 'VERIFIED', 'Verification status updated to VERIFIED in database');

    // 9. RECURRENCE DETECTION TEST (Crucial Requirement #10)
    console.log('\n[9] Testing Active Recurrence Detection Engine');
    const recurrenceComp = await request('/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: {
        description: 'Pothole has appeared again near ABC College after recent heavy rains.',
        location_name: 'ABC College Main Gate, University Road',
      },
    });
    assert(recurrenceComp.status === 201, 'Recurring complaint processed');
    assert(recurrenceComp.data.recurrenceDetected === true, 'RECURRENCE DETECTED flagged by engine');
    assert(recurrenceComp.data.issue.id === 1042, 'Correctly matched against resolved Issue #1042');
    assert(recurrenceComp.data.issue.is_recurrent === 1, 'Issue marked is_recurrent = 1 in database');

    // 10. Public Accountability Feed
    console.log('\n[10] Testing Anonymized Public Accountability Portal');
    const publicIssues = await request('/public/issues');
    assert(publicIssues.status === 200, 'Public issues feed accessible without authentication');
    const public1042 = publicIssues.data.issues.find(i => i.id === 1042);
    assert(public1042 && public1042.is_recurrent === true, 'Public portal displays recurrence badge for Issue #1042');
    assert(public1042.complaint_count > 0, 'Displays aggregated complaint count on public feed');

    const publicStats = await request('/public/stats');
    assert(publicStats.status === 200 && publicStats.data.totalComplaints > 0, 'Public civic metrics generated dynamically');

    console.log('\n===============================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
