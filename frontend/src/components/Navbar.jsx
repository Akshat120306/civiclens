import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  ShieldAlert, 
  FileText, 
  PlusCircle, 
  LayoutDashboard, 
  Globe, 
  LogIn, 
  LogOut, 
  User, 
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleQuickSwitch = async (email) => {
    try {
      await login(email, 'password123');
      setDropdownOpen(false);
    } catch (err) {
      console.error('Quick switch failed', err);
    }
  };

  return (
    <header className="bg-[#0B2545] text-white sticky top-0 z-50 shadow-md border-b border-slate-700">
      {/* Top Civic Banner */}
      <div className="bg-[#07182E] text-slate-300 text-xs py-1 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-slate-200">Smart India Hackathon 2026</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 font-semibold">Team POWER RANGERS</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span>AI Grievance Intelligence Engine</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Deterministic NLP + Gemini Ready</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md group-hover:bg-blue-500 transition-colors">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-white">CivicLens</span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded border border-blue-400/30">
                  Prototype
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-normal">Municipal Intelligence & SLA Tracker</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/public"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/public') || isActive('/')
                  ? 'bg-blue-700/80 text-white font-semibold shadow-inner'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4 text-blue-300" />
              <span>Public Portal</span>
            </Link>

            <Link
              to="/issues"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/issues')
                  ? 'bg-blue-700/80 text-white font-semibold shadow-inner'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-300" />
              <span>Common Issues</span>
            </Link>

            <Link
              to="/complaints/new"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/complaints/new')
                  ? 'bg-blue-700/80 text-white font-semibold shadow-inner'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-300" />
              <span>Lodge Complaint</span>
            </Link>

            <Link
              to="/complaints"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/complaints')
                  ? 'bg-blue-700/80 text-white font-semibold shadow-inner'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-300" />
              <span>Complaints Ledger</span>
            </Link>

            <Link
              to="/department"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/department')
                  ? 'bg-blue-700/80 text-white font-semibold shadow-inner'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-rose-300" />
              <span>Dept Command</span>
            </Link>
          </nav>

          {/* User / Quick Switcher */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-600 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="font-semibold text-slate-100 truncate max-w-[120px]">{user.name.split(' ')[0]}</div>
                    <div className="text-[10px] text-blue-300 uppercase tracking-wide font-medium">{user.role}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                      <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                        {user.role} {user.department_name ? `• ${user.department_name}` : ''}
                      </span>
                    </div>

                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Demo Role Switcher
                    </div>

                    <button
                      onClick={() => handleQuickSwitch('citizen@civiclens.gov')}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
                    >
                      <span>Citizen (Rahul Sharma)</span>
                      {user.email === 'citizen@civiclens.gov' && <span className="text-blue-600 text-[11px] font-bold">Active</span>}
                    </button>

                    <button
                      onClick={() => handleQuickSwitch('officer.pwd@civiclens.gov')}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
                    >
                      <span>PWD Officer (Vikram Singh)</span>
                      {user.email === 'officer.pwd@civiclens.gov' && <span className="text-blue-600 text-[11px] font-bold">Active</span>}
                    </button>

                    <button
                      onClick={() => handleQuickSwitch('admin@civiclens.gov')}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
                    >
                      <span>Municipal Admin (Sunita Rao)</span>
                      {user.email === 'admin@civiclens.gov' && <span className="text-blue-600 text-[11px] font-bold">Active</span>}
                    </button>

                    <div className="border-t border-slate-100 mt-2 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setDropdownOpen(false);
                          navigate('/login');
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shadow"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Demo Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
