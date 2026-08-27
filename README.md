# CivicLens (POWER RANGERS) - SIH Prototype

**AI-powered Civic Issue Intelligence and Resolution Tracking Platform** built for Smart India Hackathon 2026 by Team POWER RANGERS.

---

## 1. Quick Start Commands

### Install All Dependencies
```bash
npm run install:all
```

### Seed Database with Demo Scenario
```bash
npm run seed
```

### Start Backend (Port 5000)
```bash
npm run dev:backend
```

### Start Frontend (Port 5173)
```bash
npm run dev:frontend
```

---

## 2. Demo User Credentials

1-Click Quick Demo Login buttons are built into the UI on `/login` and the top navigation dropdown:

- **Citizen**: `citizen@civiclens.gov` / `password123`
- **PWD Officer**: `officer.pwd@civiclens.gov` / `password123`
- **Water Dept Officer**: `officer.water@civiclens.gov` / `password123`
- **Electricity Officer**: `officer.eb@civiclens.gov` / `password123`
- **Municipal Admin**: `admin@civiclens.gov` / `password123`

---

## 3. URLs

- **Public Portal (No Login)**: [http://localhost:5173/public](http://localhost:5173/public)
- **Login / Role Switcher**: [http://localhost:5173/login](http://localhost:5173/login)
- **Lodge Complaint (Live AI Preview)**: [http://localhost:5173/complaints/new](http://localhost:5173/complaints/new)
- **Complaints Ledger**: [http://localhost:5173/complaints](http://localhost:5173/complaints)
- **Common Issues Registry**: [http://localhost:5173/issues](http://localhost:5173/issues)
- **Issue Passport #1042**: [http://localhost:5173/issues/1042](http://localhost:5173/issues/1042)
- **Department Command Center**: [http://localhost:5173/department](http://localhost:5173/department)

---

## 4. Key Judge Demonstration Sequence

1. **Public Portal (`/public`)**: Open without login. Observe live metrics and Issue #1042 marked 'Resolved'.
2. **Lodge Complaint (`/complaints/new`)**: Click Preset A (*"Road has a huge pothole outside ABC College"*). Observe **LIVE AI duplicate preview** showing 88% similarity match with Issue #1042.
3. **Submit Complaint**: System clusters the complaint into Common Issue #1042.
4. **Issue Passport (`/issues/1042`)**: View 13 aggregated complaints, SLA timer, evidence photos, and dynamic AI Resolution Quality Score (88/100).
5. **Citizen Audit**: Click *"Audit / Verify Resolution"* -> select `DISPUTE`. Status updates immediately to *"Resolution Disputed — review required"*.
6. **Department Action (`/department`)**: Log in as PWD Officer. View Urgent Attention Queue, upload resolution proof photo, and mark resolved.
7. **Recurrence Detection Test (`/complaints/new`)**: Click Preset B (*"Pothole has appeared again near ABC College"*). Submit and observe the **RECURRENCE DETECTED** banner automatically flagging repeat failure on Issue #1042!
