-- CivicLens Database Schema
-- Compatible with PostgreSQL and SQLite

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  contact_email VARCHAR(255),
  default_sla_hours INTEGER DEFAULT 72,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'citizen', 'officer', 'admin'
  department_id INTEGER REFERENCES departments(id),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  issue_type VARCHAR(100) NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  latitude REAL,
  longitude REAL,
  severity VARCHAR(50) NOT NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
  department_id INTEGER REFERENCES departments(id),
  sla_hours INTEGER DEFAULT 72,
  sla_deadline TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'Open', -- 'Open', 'In Progress', 'Resolved', 'Closed', 'Reopened'
  verification_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Verified', 'Disputed', 'Needs Review'
  verification_notes TEXT,
  resolution_score INTEGER DEFAULT 75,
  resolution_summary TEXT,
  recurrence_count INTEGER DEFAULT 0,
  is_recurrent INTEGER DEFAULT 0, -- 0 for false, 1 for true
  root_cause TEXT,
  is_escalated INTEGER DEFAULT 0, -- 1 = overdue with no / rejected justification -> public headline
  escalation_reason TEXT,         -- why it is on the Accountability Wall
  ai_resolution_verdict VARCHAR(50), -- AI call on resolution evidence: 'APPROVED', 'INSUFFICIENT'
  ai_resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY,
  citizen_id INTEGER REFERENCES users(id),
  issue_id INTEGER REFERENCES issues(id),
  description TEXT NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  latitude REAL,
  longitude REAL,
  image_url VARCHAR(500),
  issue_type VARCHAR(100),
  raw_severity VARCHAR(50),
  ai_summary TEXT,
  similarity_score REAL,
  status VARCHAR(50) DEFAULT 'Submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS actions (
  id INTEGER PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues(id),
  user_id INTEGER REFERENCES users(id),
  action_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence (
  id INTEGER PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues(id),
  action_id INTEGER REFERENCES actions(id),
  file_url VARCHAR(500) NOT NULL,
  description TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verifications (
  id INTEGER PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues(id),
  citizen_id INTEGER REFERENCES users(id),
  status VARCHAR(50) NOT NULL, -- 'VERIFIED', 'DISPUTED', 'NEEDS_REVIEW'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recurrence_events (
  id INTEGER PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues(id),
  trigger_complaint_id INTEGER REFERENCES complaints(id),
  similarity_score REAL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accountability: when an issue breaches its SLA, the responsible department
-- must file a justification (reason + evidence). The AI reviews it and the
-- resolution evidence, and decides whether the excuse / fix is acceptable.
CREATE TABLE IF NOT EXISTS justifications (
  id INTEGER PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues(id),
  submitted_by INTEGER REFERENCES users(id),
  reason TEXT NOT NULL,            -- why the issue is still not resolved
  evidence_url VARCHAR(500),       -- proof backing the reason
  ai_verdict VARCHAR(50),          -- 'ACCEPTED', 'REJECTED', 'NEEDS_MORE'
  ai_reasoning TEXT,               -- AI explanation of the verdict
  ai_confidence REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
