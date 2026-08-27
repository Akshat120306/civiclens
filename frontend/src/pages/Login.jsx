import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, LogIn, Shield, User, HardHat, Droplets, Zap, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/issues';

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error', err);
      setError(err.response?.data?.error || 'Invalid credentials. Please check and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    setError('');

    try {
      await login(demoEmail, 'password123');
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Quick login error', err);
      setError(err.response?.data?.error || 'Failed to login with demo credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 bg-[#0B2545] rounded-xl flex items-center justify-center mx-auto shadow-lg text-white mb-3">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">CivicLens Access Portal</h2>
          <p className="text-xs text-slate-500 mt-1">
            Smart India Hackathon Prototype • Team POWER RANGERS
          </p>
        </div>

        {/* 1-Click Judge Demo Credentials */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2 flex items-center justify-between">
            <span>⚡ 1-Click Judge Demo Logins</span>
            <span className="text-[10px] font-normal text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Ready</span>
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('citizen@civiclens.gov')}
              className="w-full text-left px-3 py-2 bg-white hover:bg-blue-100/50 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>Citizen Demo (Rahul Sharma)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">citizen@civiclens.gov</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('officer.pwd@civiclens.gov')}
              className="w-full text-left px-3 py-2 bg-white hover:bg-blue-100/50 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center space-x-2">
                <HardHat className="w-4 h-4 text-amber-600" />
                <span>PWD Officer Demo (Vikram Singh)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">officer.pwd@civiclens.gov</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('officer.water@civiclens.gov')}
              className="w-full text-left px-3 py-2 bg-white hover:bg-blue-100/50 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-blue-600" />
                <span>Water Dept Officer (Priya Nair)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">officer.water@civiclens.gov</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin@civiclens.gov')}
              className="w-full text-left px-3 py-2 bg-white hover:bg-blue-100/50 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Municipal Admin (Sunita Rao)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">admin@civiclens.gov</span>
            </button>
          </div>
        </div>

        {/* Standard Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. citizen@civiclens.gov"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#0B2545] hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
