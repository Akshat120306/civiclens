import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { issuesApi } from '../api/client';
import { 
  Layers, 
  Search, 
  Filter, 
  Clock, 
  RefreshCw, 
  ExternalLink, 
  ShieldAlert,
  CheckCircle2,
  Building2,
  MapPin
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function IssuesList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const activeTab = searchParams.get('tab') || 'ALL';
  const selectedDept = searchParams.get('dept') || '';

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedDept) params.department_id = selectedDept;

      if (activeTab === 'OPEN') params.status = 'Open';
      else if (activeTab === 'IN_PROGRESS') params.status = 'In Progress';
      else if (activeTab === 'RESOLVED') params.status = 'Resolved';
      else if (activeTab === 'VERIFIED') params.status = 'Verified';
      else if (activeTab === 'RECURRING') params.is_recurrent = 'true';

      const res = await issuesApi.getAll(params);
      setIssues(res.data.issues || []);
    } catch (err) {
      console.error('Failed to fetch issues', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [activeTab, selectedDept]);

  const handleTabChange = (tab) => {
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'ALL') nextParams.delete('tab');
    else nextParams.set('tab', tab);
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIssues();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Master Common Issues Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Clustered Civic Issues
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Aggregated grievances grouped into authoritative municipal work orders with active SLA tracking.
          </p>
        </div>

        <Link
          to="/complaints/new"
          className="bg-[#0B2545] hover:bg-blue-900 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <span>+ Lodge New Complaint</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'ALL', label: 'All Issues' },
          { id: 'OPEN', label: 'Open' },
          { id: 'IN_PROGRESS', label: 'In Progress' },
          { id: 'RESOLVED', label: 'Resolved' },
          { id: 'VERIFIED', label: 'Verified' },
          { id: 'RECURRING', label: '⚠️ Recurring Issues' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Dept Filter */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by issue title, landmark (e.g. ABC College), or category..."
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedDept}
              onChange={(e) => {
                const nextParams = new URLSearchParams(searchParams);
                if (e.target.value) nextParams.set('dept', e.target.value);
                else nextParams.delete('dept');
                setSearchParams(nextParams);
              }}
              className="w-full text-xs sm:text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="">All Departments</option>
              <option value="1">Public Works Department (PWD)</option>
              <option value="2">Water Supply & Sanitation (WSS)</option>
              <option value="3">Electricity Board (EB)</option>
              <option value="4">Solid Waste Management (SWM)</option>
              <option value="5">Traffic & Transport (TT)</option>
            </select>
          </div>
        </form>
      </div>

      {/* Issues Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
            Loading issues registry...
          </div>
        ) : issues.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
            No issues found matching criteria.
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
                      {issue.department_code || 'PWD'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <SeverityBadge severity={issue.severity} size="sm" />
                    <StatusBadge 
                      status={issue.status} 
                      verificationStatus={issue.verification_status} 
                      isRecurrent={issue.is_recurrent}
                      size="sm"
                    />
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-1">
                  {issue.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium mb-3 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{issue.location_name}</span>
                </p>

                {issue.is_recurrent && (
                  <div className="bg-rose-100/80 border border-rose-300 rounded p-2 text-xs text-rose-900 font-bold mb-3 flex items-center space-x-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-rose-700 animate-spin-slow shrink-0" />
                    <span>Recurrence Detected: {issue.recurrence_count} repeat event(s)</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 py-2.5 my-2 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Clustered</span>
                    <span className="font-bold text-slate-800">{issue.complaint_count} Complaints</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">SLA Window</span>
                    <span className="font-bold text-slate-800">{issue.sla_hours}h SLA</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Evidence</span>
                    <span className="font-bold text-slate-800">{issue.evidence_count || 0} Photos</span>
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
                    <span>Open Issue Passport</span>
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
