import bcrypt from 'bcryptjs';
import { initDb, query } from './dbAdapter.js';

async function seed() {
  console.log('Starting CivicLens database seed...');
  process.env.CIVICLENS_SEEDING = '1';
  await initDb();

  // Clear everything so the platform starts on a clean slate.
  // Only departments and login accounts are seeded; all issues and complaints
  // are created live by users lodging real complaints.
  await query('DELETE FROM justifications');
  await query('DELETE FROM recurrence_events');
  await query('DELETE FROM verifications');
  await query('DELETE FROM evidence');
  await query('DELETE FROM actions');
  await query('DELETE FROM complaints');
  await query('DELETE FROM issues');
  await query('DELETE FROM users');
  await query('DELETE FROM departments');

  console.log('Cleared existing tables.');

  // 1. Seed Departments (needed for AI routing + SLA assignment)
  const depts = [
    { id: 1, name: 'Public Works Department (PWD)', code: 'PWD', contact: 'pwd.support@civiclens.gov', sla: 72 },
    { id: 2, name: 'Water Supply & Sanitation (WSS)', code: 'WSS', contact: 'water.support@civiclens.gov', sla: 48 },
    { id: 3, name: 'Electricity Board (EB)', code: 'EB', contact: 'eb.support@civiclens.gov', sla: 24 },
    { id: 4, name: 'Solid Waste Management (SWM)', code: 'SWM', contact: 'waste.support@civiclens.gov', sla: 36 },
    { id: 5, name: 'Traffic & Transport (TT)', code: 'TT', contact: 'traffic.support@civiclens.gov', sla: 48 },
  ];

  for (const d of depts) {
    await query(`
      INSERT INTO departments (id, name, code, contact_email, default_sla_hours)
      VALUES ($1, $2, $3, $4, $5)
    `, [d.id, d.name, d.code, d.contact, d.sla]);
  }
  console.log(`Seeded ${depts.length} departments.`);

  // 2. Seed login accounts (citizen + one officer per department + admin)
  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [
    { id: 1, name: 'Rahul Sharma (Citizen)', email: 'citizen@civiclens.gov', role: 'citizen', dept: null, phone: '+91 98765 43210' },
    { id: 2, name: 'Vikram Singh (PWD Officer)', email: 'officer.pwd@civiclens.gov', role: 'officer', dept: 1, phone: '+91 98111 22334' },
    { id: 3, name: 'Priya Nair (Water Officer)', email: 'officer.water@civiclens.gov', role: 'officer', dept: 2, phone: '+91 98222 33445' },
    { id: 4, name: 'Rajesh Patel (EB Officer)', email: 'officer.eb@civiclens.gov', role: 'officer', dept: 3, phone: '+91 98333 44556' },
    { id: 5, name: 'Sunita Rao (Municipal Admin)', email: 'admin@civiclens.gov', role: 'admin', dept: null, phone: '+91 98444 55667' },
  ];

  for (const u of users) {
    await query(`
      INSERT INTO users (id, name, email, password_hash, role, department_id, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [u.id, u.name, u.email, passwordHash, u.role, u.dept, u.phone]);
  }
  console.log(`Seeded ${users.length} users.`);

  console.log('CivicLens database seed completed successfully! (clean slate — no demo issues)');
}

export async function runSeed() {
  await seed();
}

// If run directly from terminal: node seed.js
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seed().catch(err => {
    console.error('Seed script failed:', err);
    process.exit(1);
  });
}

export default seed;
