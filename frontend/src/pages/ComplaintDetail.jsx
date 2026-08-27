import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaintsApi } from '../api/client';
import { FileText, MapPin, Building2, ExternalLink, Sparkles, ArrowLeft, Clock } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function ComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        setLoading(true);
        const res = await complaintsApi.getById(id);
        setComplaint(res.data.complaint);
      } catch (err) {
        console.error('Failed to load complaint', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaint();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">
        Loading complaint record #{id}...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">
        Complaint #{id} not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link to="/complaints" className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Complaints Ledger</span>
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-mono text-sm font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                COMPLAINT #{complaint.id}
              </span>
              <StatusBadge status={complaint.status} />
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-2">
              {complaint.description}
            </h1>
            <p className="text-xs text-slate-500 flex items-center space-x-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{complaint.location_name}</span>
            </p>
          </div>

          {complaint.raw_severity && (
            <SeverityBadge severity={complaint.raw_severity} />
          )}
        </div>

        {/* Linked Common Issue Box */}
        {complaint.issue_id && (
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                Clustered into Authoritative Common Issue
              </div>
              <div className="font-bold text-sm text-slate-900">
                Issue #{complaint.issue_id}: {complaint.issue_title}
              </div>
              <div className="text-xs text-slate-600">
                Department: <strong>{complaint.department_name}</strong> • SLA: <strong>{complaint.sla_hours}h</strong>
              </div>
            </div>

            <Link
              to={`/issues/${complaint.issue_id}`}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 shrink-0"
            >
              <span>Open Issue Passport</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Image Attachment */}
        {complaint.image_url && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Citizen Attachment Photo
            </div>
            <img
              src={complaint.image_url}
              alt="Complaint attachment"
              className="w-full max-h-80 object-cover rounded-lg border border-slate-200 shadow-xs"
            />
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Reported By</span>
            <span className="font-semibold text-slate-800">{complaint.citizen_name || 'Anonymous Citizen'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Submission Date</span>
            <span className="font-semibold text-slate-800">
              {formatDistanceToNow(parseISO(complaint.created_at), { addSuffix: true })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Semantic Similarity Score</span>
            <span className="font-bold text-indigo-700">
              {complaint.similarity_score ? `${Math.round(complaint.similarity_score * 100)}% Match` : 'Primary Anchor'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
