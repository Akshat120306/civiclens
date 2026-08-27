import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../api/client';
import { FileText, Search, PlusCircle, ExternalLink, Filter, MapPin, Sparkles } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function ComplaintsList() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintsApi.getAll();
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error('Failed to fetch complaints', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const filtered = complaints.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.description?.toLowerCase().includes(q) ||
      c.location_name?.toLowerCase().includes(q) ||
      c.issue_type?.toLowerCase().includes(q) ||
      c.issue_title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Citizen Grievance Ingestion Stream</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Complaints Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Individual citizen reports, AI duplicate similarity tags, and linked Common Issues.
          </p>
        </div>

        <Link
          to="/complaints/new"
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Lodge New Complaint</span>
        </Link>
      </div>

      {/* Search Filter */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter complaints by keywords, locality (e.g. ABC College), or category..."
          className="w-full text-xs sm:text-sm focus:outline-none text-slate-800 placeholder-slate-400"
        />
        <span className="text-xs font-semibold text-slate-400 shrink-0">
          {filtered.length} Reports
        </span>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Loading complaints registry...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No complaints found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Description & Location</th>
                  <th className="py-3 px-4">AI Category</th>
                  <th className="py-3 px-4">Clustered Issue</th>
                  <th className="py-3 px-4">Similarity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Filed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{c.id}
                    </td>

                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-slate-900 line-clamp-1">{c.description}</div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{c.location_name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{c.issue_type || 'Civic Infrastructure'}</span>
                    </td>

                    <td className="py-3 px-4">
                      {c.issue_id ? (
                        <Link
                          to={`/issues/${c.issue_id}`}
                          className="inline-flex items-center space-x-1 font-bold text-blue-700 hover:text-blue-900 hover:underline"
                        >
                          <span>Issue #{c.issue_id}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {c.similarity_score ? (
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {Math.round(c.similarity_score * 100)}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Primary</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-right text-[11px] text-slate-400 whitespace-nowrap">
                      {formatDistanceToNow(parseISO(c.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
