import bcrypt from 'bcryptjs';
import { initDb, query } from './dbAdapter.js';

async function seed() {
  console.log('Starting CivicLens database seed...');
  await initDb();

  // Clear existing records to ensure clean state
  await query('DELETE FROM recurrence_events');
  await query('DELETE FROM verifications');
  await query('DELETE FROM evidence');
  await query('DELETE FROM actions');
  await query('DELETE FROM complaints');
  await query('DELETE FROM issues');
  await query('DELETE FROM users');
  await query('DELETE FROM departments');

  console.log('Cleared existing tables.');

  // 1. Seed Departments
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

  // 2. Seed Users
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

  // 3. Seed Key Demo Issue #1042 (Resolved Road Damage near ABC College)
  const resolvedDeadline = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  await query(`
    INSERT INTO issues (id, title, description, issue_type, location_name, latitude, longitude, severity, department_id, sla_hours, sla_deadline, status, verification_status, verification_notes, resolution_score, resolution_summary, recurrence_count, is_recurrent, root_cause)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
  `, [
    1042,
    'Road Damage near ABC College',
    'Severe road surface failure and deep potholes creating hazardous traffic congestion and two-wheeler accidents outside ABC College entrance.',
    'Roads & Infrastructure',
    'ABC College Main Gate, University Road',
    12.9716,
    77.5946,
    'High',
    1, // PWD
    72,
    resolvedDeadline,
    'Resolved',
    'VERIFIED',
    'Citizen Audit: Verified smooth hot-mix asphalt road repair.',
    88,
    'Excavated damaged sub-base, filled with cold gravel aggregate, and applied 50mm hot-mix bitumen asphalt overlay.',
    0,
    0,
    'Sub-base soil erosion exacerbated by heavy monsoon runoff and vehicular axle load.',
  ]);

  // Seed 12 complaints linked to #1042
  const complaints1042 = [
    'Large pothole near ABC College causing two-wheeler skid.',
    'Road has a huge pothole outside ABC College main gate.',
    'Deep crater in front of ABC College campus.',
    'Dangerous broken road near ABC College bus stop.',
    'Heavy asphalt damage and big pothole near ABC College entrance.',
    'Multiple potholes on University Road right outside ABC College.',
    'Vehicles getting stuck in deep pothole near ABC College gate.',
    'Road crater outside ABC College needs urgent resurfacing.',
    'Severely damaged road stretch near ABC College.',
    'Deep potholes causing traffic gridlock at ABC College junction.',
    'Pothole hazard outside ABC College campus road.',
    'Broken tarmac and loose gravel near ABC College gate.',
  ];

  for (let i = 0; i < complaints1042.length; i++) {
    await query(`
      INSERT INTO complaints (id, citizen_id, issue_id, description, location_name, latitude, longitude, issue_type, raw_severity, ai_summary, similarity_score, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      100 + i,
      1,
      1042,
      complaints1042[i],
      'ABC College Main Gate, University Road',
      12.9716 + (Math.random() - 0.5) * 0.002,
      77.5946 + (Math.random() - 0.5) * 0.002,
      'Roads & Infrastructure',
      'High',
      complaints1042[i],
      0.88,
      'Resolved',
    ]);
  }

  // Actions for #1042
  await query(`
    INSERT INTO actions (id, issue_id, user_id, action_type, description)
    VALUES 
    (1, 1042, 1, 'ISSUE_CREATED', 'Initial grievance filed with 72h PWD SLA window.'),
    (2, 1042, 2, 'FIELD_INSPECTION', 'Site inspection completed by PWD Junior Engineer. Asphalt patch work order #PWD-884 issued.'),
    (3, 1042, 2, 'REPAIR_EXECUTION', 'Road resurfacing team completed gravel compaction and bitumen asphalt laying.')
  `);

  // Evidence for #1042
  await query(`
    INSERT INTO evidence (id, issue_id, action_id, file_url, description, uploaded_by)
    VALUES 
    (1, 1042, 3, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=60', 'Before and After field photo: Hot-mix asphalt resurfacing completed on 120m stretch at ABC College.', 2)
  `);

  // Verification for #1042
  await query(`
    INSERT INTO verifications (id, issue_id, citizen_id, status, notes)
    VALUES 
    (1, 1042, 1, 'VERIFIED', 'Inspected on site. Potholes have been filled and smooth asphalt applied. Verified!')
  `);

  // 4. Seed Active Issue #1043 (Water Supply Leakage)
  const activeDeadline = new Date(Date.now() + 32 * 3600 * 1000).toISOString();
  await query(`
    INSERT INTO issues (id, title, description, issue_type, location_name, latitude, longitude, severity, department_id, sla_hours, sla_deadline, status, verification_status, resolution_score, root_cause)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `, [
    1043,
    'Water Pipeline Leakage at Sector 9 Central Market',
    'Main 300mm drinking water distribution line ruptured, causing potable water loss and street flooding near Market Gate 2.',
    'Water Supply & Sanitation',
    'Sector 9 Central Market, Gate 2',
    12.9810,
    77.6020,
    'High',
    2, // WSS
    48,
    activeDeadline,
    'In Progress',
    'Pending',
    72,
    'High pressure surge causing rupture in aging cast-iron distribution pipe joint.',
  ]);

  const complaints1043 = [
    'Huge water pipe burst flooding road at Sector 9 Market.',
    'Clean drinking water gushing from pipeline near Sector 9 Gate 2.',
    'Water supply cut off due to ruptured pipe in Sector 9 Market.',
    'Flooding and water leakage outside shops at Sector 9 Central Market.',
  ];

  for (let i = 0; i < complaints1043.length; i++) {
    await query(`
      INSERT INTO complaints (id, citizen_id, issue_id, description, location_name, latitude, longitude, issue_type, raw_severity, ai_summary, similarity_score, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      120 + i,
      1,
      1043,
      complaints1043[i],
      'Sector 9 Central Market, Gate 2',
      12.9810,
      77.6020,
      'Water Supply & Sanitation',
      'High',
      complaints1043[i],
      0.82,
      'In Progress',
    ]);
  }

  await query(`
    INSERT INTO actions (id, issue_id, user_id, action_type, description)
    VALUES 
    (4, 1043, 1, 'ISSUE_CREATED', 'High-priority pipeline rupture registered and dispatched to WSS emergency repair unit.'),
    (5, 1043, 3, 'FIELD_ACTION', 'Isolation valve closed to stop flooding. Replacement ductile iron collar sleeve mobilized.')
  `);

  // 5. Seed Overdue Issue #1044 (Electricity Board)
  const overdueDeadline = new Date(Date.now() - 14 * 3600 * 1000).toISOString();
  await query(`
    INSERT INTO issues (id, title, description, issue_type, location_name, latitude, longitude, severity, department_id, sla_hours, sla_deadline, status, verification_status, resolution_score, root_cause)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `, [
    1044,
    'Streetlight Grid Failure on Ring Road Flyover',
    'Complete blackout on a 1.2km stretch of Ring Road flyover due to transformer junction trip, posing collision hazard.',
    'Electricity & Lighting',
    'Outer Ring Road Flyover, Span 14-22',
    12.9600,
    77.5800,
    'Critical',
    3, // EB
    24,
    overdueDeadline,
    'Open',
    'Pending',
    45,
    'Underground feeder cable insulation breakdown after heavy moisture ingress.',
  ]);

  const complaints1044 = [
    'All streetlights off on Ring Road flyover, completely pitch black and dangerous.',
    'Dark flyover road on Outer Ring Road, high accident risk at night.',
    'Street light poles not functioning on Ring Road flyover stretch.',
  ];

  for (let i = 0; i < complaints1044.length; i++) {
    await query(`
      INSERT INTO complaints (id, citizen_id, issue_id, description, location_name, latitude, longitude, issue_type, raw_severity, ai_summary, similarity_score, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      130 + i,
      1,
      1044,
      complaints1044[i],
      'Outer Ring Road Flyover, Span 14-22',
      12.9600,
      77.5800,
      'Electricity & Lighting',
      'Critical',
      complaints1044[i],
      0.79,
      'Submitted',
    ]);
  }

  // 6. Seed Waste Management Issue #1045
  const swmDeadline = new Date(Date.now() + 18 * 3600 * 1000).toISOString();
  await query(`
    INSERT INTO issues (id, title, description, issue_type, location_name, latitude, longitude, severity, department_id, sla_hours, sla_deadline, status, verification_status, resolution_score, root_cause)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `, [
    1045,
    'Garbage Dump Overflow at Green Park Sector 4',
    'Multiple community waste bins overflowing for 4 consecutive days, emitting foul odor and spilling onto pedestrian pathway.',
    'Solid Waste Management',
    'Green Park Community Center, Sector 4',
    12.9550,
    77.6100,
    'Medium',
    4, // SWM
    36,
    swmDeadline,
    'Open',
    'Pending',
    65,
    'Compactor truck breakdown resulting in 48-hour municipal collection cycle delay.',
  ]);

  const complaints1045 = [
    'Overflowing trash bins at Sector 4 Green Park.',
    'Uncollected garbage spreading on road at Green Park Sector 4.',
    'Foul smell and overflowing waste containers near Green Park community center.',
  ];

  for (let i = 0; i < complaints1045.length; i++) {
    await query(`
      INSERT INTO complaints (id, citizen_id, issue_id, description, location_name, latitude, longitude, issue_type, raw_severity, ai_summary, similarity_score, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      140 + i,
      1,
      1045,
      complaints1045[i],
      'Green Park Community Center, Sector 4',
      12.9550,
      77.6100,
      'Solid Waste Management',
      'Medium',
      complaints1045[i],
      0.75,
      'Submitted',
    ]);
  }

  // 7. Seed Unrelated Complaints for clustering discrimination test
  const isolatedComplaints = [
    {
      id: 150,
      desc: 'Traffic signal timer stuck on red at MG Road / Brigade Junction.',
      loc: 'MG Road Junction',
      type: 'Traffic & Transport',
      sev: 'High',
    },
    {
      id: 151,
      desc: 'Dead branch hanging dangerously over electric pole in Indira Nagar 1st Block.',
      loc: 'Indira Nagar 1st Block',
      type: 'Electricity & Lighting',
      sev: 'Medium',
    },
  ];

  for (const iso of isolatedComplaints) {
    await query(`
      INSERT INTO complaints (id, citizen_id, description, location_name, issue_type, raw_severity, ai_summary, similarity_score, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      iso.id,
      1,
      iso.desc,
      iso.loc,
      iso.type,
      iso.sev,
      iso.desc,
      0,
      'Submitted',
    ]);
  }

  console.log('CivicLens database seed completed successfully!');
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
