import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, issuesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  LayoutDashboard, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  Camera, 
  FileEdit, 
  ExternalLink,
  Filter,
  AlertTriangle,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import EvidenceModal from '../components/EvidenceModal';
import ActionModal from '../components/ActionModal';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function DepartmentDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDeptId, setSelectedDeptId] = useState('');

  // Modals
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getMetrics({
        department_id: selectedDeptId || undefined,
      });
      setDashboardData(res.data);
    } catch (err) {
      console.error('Failed to load department dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedDeptId]);

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await issuesApi.update(issueId, { status: newStatus });
      fetchDashboard();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p>Loading Department Command Center...</p>
      </div>
    );
  }

  const { metrics, departments = [], urgentQueue = [], allIssues = [], recentActivity = [] } = dashboardData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-4 h-4 text-rose-600" />
            <span>Municipal Operations Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Department SLA & Resolution Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Operational triage, committed SLA deadline tracking, field evidence verification, and recurrence management.
          </p>
        </div>

        {/* Department Switcher Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-700 shrink-0">Filter Department:</label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="text-xs font-semibold py-2 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none shadow-xs"
          >
            <option value="">All Municipal Departments</option>
            <option value="1">Public Works Department (PWD)</option>
            <option value="2">Water Supply & Sanitation (WSS)</option>
            <option value="3">Electricity Board (EB)</option>
            <option value="4">Solid Waste Management (SWM)</option>
            <option value="5">Traffic & Transport (TT)</option>
          </select>
        </div>
      </div>

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Work Orders</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalIssues}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{metrics.totalComplaintsClustered} Grievances</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">In Progress</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{metrics.inProgressIssues}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{metrics.openIssues} Pending Triage</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-rose-200 bg-rose-50/20 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">SLA Overdue</div>
            <div className="text-2xl font-black text-rose-700 mt-1">{metrics.overdueIssues}</div>
            <div className="text-[11px] text-rose-600 mt-0.5 font-semibold">Immediate Escalation</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-amber-200 bg-amber-50/20 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Approaching SLA</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{metrics.approachingSla}</div>
            <div className="text-[11px] text-amber-700 mt-0.5 font-medium">&lt; 12 Hours Left</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Resolved / Done</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.resolvedIssues}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">{metrics.resolutionRate}% Rate</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-rose-300 bg-rose-50/40 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Recurrence Alerts</div>
            <div className="text-2xl font-black text-rose-800 mt-1">{metrics.recurrentIssues}</div>
            <div className="text-[11px] text-rose-700 mt-0.5 font-semibold">Repeat Failures</div>
          </div>
        </div>
      )}

      {/* Urgent Attention Queue */}
      {urgentQueue && urgentQueue.length > 0 && (
        <div className="bg-white rounded-xl border border-rose-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-rose-100 pb-2">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-sm text-slate-900">Urgent SLA Attention Queue</h3>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {urgentQueue.length} Priority Work Orders
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentQueue.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-rose-50/30 rounded-lg border border-rose-200 hover:border-rose-300 transition-colors flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-blue-700">Issue #{item.id}</span>
                    <span className="font-bold text-slate-700">{item.department_code || 'PWD'}</span>
                    <SeverityBadge severity={item.severity} size="sm" />
                    {item.isOverdue && (
                      <span className="text-[10px] font-extrabold uppercase bg-rose-600 text-white px-1.5 py-0.5 rounded">
                        OVERDUE
                      </span>
                    )}
                    {item.is_recurrent === 1 && (
                      <span className="text-[10px] font-extrabold uppercase bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded">
                        RECURRING
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-slate-900 line-clamp-1">{item.title}</div>
                  <div className="text-slate-500 text-[11px]">{item.location_name}</div>
                </div>

                <Link
                  to={`/issues/${item.id}`}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold rounded text-xs shrink-0 flex items-center space-x-1"
                >
                  <span>Resolve</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Work Orders Management Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-base text-slate-900">Active Department Work Orders</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {allIssues.length} Registered Issues
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Issue ID</th>
                <th className="py-3 px-4">Title & Location</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status & Action</th>
                <th className="py-3 px-4">SLA Commitment</th>
                <th className="py-3 px-4 text-right">Quick Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {allIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-800">
                    <Link to={`/issues/${issue.id}`} className="hover:underline">
                      #{issue.id}
                    </Link>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <Link to={`/issues/${issue.id}`} className="font-bold text-slate-900 hover:text-blue-700 block truncate">
                      {issue.title}
                    </Link>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      📍 {issue.location_name} • {issue.complaint_count} reports
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800">{issue.department_code || 'PWD'}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <SeverityBadge severity={issue.severity} size="sm" />
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                      className="text-xs font-semibold py-1 px-2 border border-slate-300 rounded bg-white focus:outline-none"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Verified">Verified</option>
                      <option value="Reopened">Reopened</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-800">{issue.sla_hours}h</span>
                    {issue.is_recurrent === 1 && (
                      <span className="block text-[10px] font-bold text-rose-600">Recurrence Flagged</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIssueId(issue.id);
                        setIsEvidenceOpen(true);
                      }}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-[11px] border border-blue-200"
                      title="Upload Resolution Evidence"
                    >
                      + Evidence
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIssueId(issue.id);
                        setIsActionOpen(true);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[11px] border border-slate-300"
                      title="Record Milestone"
                    >
                      + Action
                    </button>

                    <Link
                      to={`/issues/${issue.id}`}
                      className="p-1 text-slate-400 hover:text-slate-800 inline-block align-middle"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence & Action Modals */}
      {selectedIssueId && (
        <>
          <EvidenceModal
            issueId={selectedIssueId}
            isOpen={isEvidenceOpen}
            onClose={() => {
              setIsEvidenceOpen(false);
              setSelectedIssueId(null);
            }}
            onSuccess={fetchDashboard}
          />

          <ActionModal
            issueId={selectedIssueId}
            isOpen={isActionOpen}
            onClose={() => {
              setIsActionOpen(false);
              setSelectedIssueId(null);
            }}
            onSuccess={fetchDashboard}
          />
        </>
      )}
    </div>
  );
}
