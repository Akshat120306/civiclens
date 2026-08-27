import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar';
import PublicPortal from './pages/PublicPortal';
import Login from './pages/Login';
import ComplaintSubmit from './pages/ComplaintSubmit';
import ComplaintsList from './pages/ComplaintsList';
import ComplaintDetail from './pages/ComplaintDetail';
import IssuesList from './pages/IssuesList';
import IssuePassport from './pages/IssuePassport';
import DepartmentDashboard from './pages/DepartmentDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Portal (Open to all without login) */}
              <Route path="/" element={<PublicPortal />} />
              <Route path="/public" element={<PublicPortal />} />

              {/* Authentication */}
              <Route path="/login" element={<Login />} />

              {/* Citizen Grievances */}
              <Route path="/complaints" element={<ComplaintsList />} />
              <Route path="/complaints/new" element={<ComplaintSubmit />} />
              <Route path="/complaints/:id" element={<ComplaintDetail />} />

              {/* Master Clustered Issues & Issue Passport */}
              <Route path="/issues" element={<IssuesList />} />
              <Route path="/issues/:id" element={<IssuePassport />} />

              {/* Municipal Department Command Center */}
              <Route path="/department" element={<DepartmentDashboard />} />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-[#07182E] text-slate-400 text-xs py-6 border-t border-slate-800 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-200">CivicLens Platform</span> • Smart India Hackathon Prototype 2026
              </div>
              <div className="flex items-center space-x-4 text-slate-400">
                <span>Team POWER RANGERS</span>
                <span>•</span>
                <span>Deterministic AI Engine + Gemini Fallback</span>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
