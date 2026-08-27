import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../api/client';
import { 
  Building2, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle2, 
  RefreshCw,
  ExternalLink,
  Users,
  BarChart3,
  TrendingUp,
  FileText
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function PublicPortal() {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issuesRes, statsRes] = await Promise.all([
        publicApi.getIssues({
          department_code: selectedDept || undefined,
          status: selectedStatus || undefined,
          search: search.trim() || undefined,
        }),
        publicApi.getStats(),
      ]);
      setIssues(issuesRes.data.issues || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Failed to fetch public portal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDept, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Civic Header */}
      <div className="bg-gradient-to-r from-[#0B2545] to-[#134074] rounded-2xl p-8 text-white shadow-xl border border-slate-700">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold border border-blue-400/30">
            <ShieldCheck className="w-4 h-4 text-blue-300" />
            <span>Open Civic Accountability Portal (No Login Required)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Municipal Grievance Intelligence & SLA Transparency
          </h1>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            Real-time public audit of municipal grievances, AI issue clustering, committed SLA resolution deadlines, and citizen-verified repairs. Fully anonymized open civic data.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/complaints/new"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-lg shadow-md transition-colors flex items-center space-x-1.5"
            >
              <span>+ Lodge Citizen Complaint</span>
            </Link>
            <Link
              to="/issues"
              className="bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg border border-white/20 transition-colors"
            >
              Explore Master Issues Registry
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Citizen Complaints</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{stats.totalComplaints}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Clustered into <span className="font-bold text-slate-800">{stats.totalIssues}</span> common municipal issues
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>SLA Compliance</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">{stats.slaCompliance}%</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              {stats.overdueCount > 0 ? `${stats.overdueCount} issues breached SLA` : 'All issues on schedule'}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Resolution Rate</span>
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-3xl font-extrabold text-teal-700">{stats.resolutionRate}%</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              {stats.resolvedCount} completed ({stats.verifiedCount} citizen verified)
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Recurrence Alerts</span>
              <RefreshCw className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-3xl font-extrabold text-rose-600">{stats.recurringCount}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Repeated failures detected post-resolution
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by issue title, location (e.g. ABC College), or category..."
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="">All Departments</option>
              <option value="PWD">Public Works Department (PWD)</option>
              <option value="WSS">Water Supply & Sanitation (WSS)</option>
              <option value="EB">Electricity Board (EB)</option>
              <option value="SWM">Solid Waste Management (SWM)</option>
              <option value="TT">Traffic & Transport (TT)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Verified">Verified</option>
              <option value="Reopened">Reopened (Recurring)</option>
            </select>
          </div>
        </form>
      </div>

      {/* Public Issues Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>Public Issues Accountability Registry</span>
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              {issues.length} Records
            </span>
          </h2>
          <span className="text-xs text-slate-500">Citizen PII strictly protected</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
            Loading public grievance registry...
          </div>
        ) : issues.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
            No matching issues found for the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className={`bg-white rounded-xl p-5 border transition-all hover:shadow-md ${
                  issue.is_recurrent ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      ISSUE #{issue.id}
                    </span>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {issue.department_code || 'MUNICIPAL'}
                    </span>
                  </div>
                  <StatusBadge 
                    status={issue.status} 
                    verificationStatus={issue.verification_status} 
                    isRecurrent={issue.is_recurrent}
                  />
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-1">
                  {issue.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium mb-3">
                  📍 {issue.location_name}
                </p>

                {issue.is_recurrent && (
                  <div className="bg-rose-100/70 border border-rose-300 rounded p-2 text-xs text-rose-900 font-bold mb-3 flex items-center space-x-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-rose-700 animate-spin-slow shrink-0" />
                    <span>Recurrence Detected: {issue.recurrence_count} repeat event(s) post-resolution</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 py-2.5 my-2 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Complaints</span>
                    <span className="font-bold text-slate-800">{issue.complaint_count} Citizen Reports</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">SLA Commitment</span>
                    <span className="font-bold text-slate-800">{issue.sla_hours} Hours</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">AI Quality Score</span>
                    <span className="font-extrabold text-indigo-700">{issue.qualityScore} / 100</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400 font-medium">
                    Updated {formatDistanceToNow(parseISO(issue.updated_at || issue.created_at), { addSuffix: true })}
                  </div>
                  <Link
                    to={`/issues/${issue.id}`}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 hover:underline"
                  >
                    <span>View Issue Passport</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
