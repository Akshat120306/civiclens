import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { issuesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Camera, 
  FileEdit, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Layers,
  Sparkles,
  ArrowLeft,
  Calendar,
  User,
  Image as ImageIcon
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import SLACountdown from '../components/SLACountdown';
import AIQualityBadge from '../components/AIQualityBadge';
import RecurrenceBanner from '../components/RecurrenceBanner';
import VerificationModal from '../components/VerificationModal';
import EvidenceModal from '../components/EvidenceModal';
import ActionModal from '../components/ActionModal';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

export default function IssuePassport() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  const [passportData, setPassportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);

  const fetchPassport = async () => {
    try {
      setLoading(true);
      const res = await issuesApi.getById(id);
      setPassportData(res.data);
    } catch (err) {
      console.error('Failed to load issue passport', err);
      setError('Issue passport not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassport();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p>Loading authoritative Issue Passport #{id}...</p>
      </div>
    );
  }

  if (error || !passportData?.issue) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        <p className="text-red-600 font-bold mb-4">{error || 'Issue not found'}</p>
        <Link to="/issues" className="text-blue-600 underline font-semibold">
          Return to Master Issues Registry
        </Link>
      </div>
    );
  }

  const { issue, complaints = [], actions = [], evidence = [], verifications = [], recurrenceEvents = [], qualityScore } = passportData;

  const isOfficerOrAdmin = user?.role === 'officer' || user?.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Back Link & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link to="/issues" className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Master Issues Registry</span>
        </Link>

        {/* Action Controls for Demo Testing */}
        <div className="flex items-center space-x-2">
          {/* Citizen Verification Button */}
          <button
            onClick={() => setIsVerificationOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit / Verify Resolution</span>
          </button>

          {/* Department Action Controls */}
          <button
            onClick={() => setIsEvidenceOpen(true)}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <Camera className="w-4 h-4" />
            <span>Upload Evidence</span>
          </button>

          <button
            onClick={() => setIsActionOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <FileEdit className="w-4 h-4" />
            <span>Log Milestone</span>
          </button>
        </div>
      </div>

      {/* Recurrence Detection Alert Banner */}
      {(issue.is_recurrent === 1 || issue.recurrence_count > 0 || recurrenceEvents.length > 0) && (
        <RecurrenceBanner
          issueId={issue.id}
          recurrenceCount={issue.recurrence_count || recurrenceEvents.length}
          triggerDescription={recurrenceEvents[0]?.trigger_description}
          notes={recurrenceEvents[0]?.notes}
        />
      )}

      {/* Main Passport Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span className="font-mono text-sm font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                ISSUE #{issue.id}
              </span>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                {issue.department_name || 'Public Works Department (PWD)'}
              </span>
              <SeverityBadge severity={issue.severity} />
              <StatusBadge
                status={issue.status}
                verificationStatus={issue.verification_status}
                isRecurrent={issue.is_recurrent}
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {issue.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{issue.location_name}</span>
            </p>
          </div>

          <div className="lg:text-right space-y-1 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Aggregated Grievances
            </span>
            <div className="text-3xl font-black text-slate-900">
              {issue.complaint_count || complaints.length} <span className="text-sm font-normal text-slate-500">Citizen Reports</span>
            </div>
            <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded inline-block">
              Clustered via NLP Similarity
            </span>
          </div>
        </div>

        {/* SLA Status & AI Resolution Quality Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SLACountdown
            slaHours={issue.sla_hours}
            slaDeadline={issue.sla_deadline}
            status={issue.status}
          />
          <AIQualityBadge qualityScore={qualityScore} />
        </div>

        {/* Issue Description & Root Cause */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Grievance Summary
            </span>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              {issue.description}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              AI Root Cause Assessment
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {issue.root_cause || 'Material fatigue, high vehicular tonnage, and monsoon drainage overflow.'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Left (Complaints & Evidence) / Right (Timeline & Audits) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Aggregated Complaints & Field Evidence */}
        <div className="lg:col-span-7 space-y-6">
          {/* Resolution Evidence Gallery */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Resolution Evidence</h3>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {evidence.length} Photo(s)
              </span>
            </div>

            {evidence.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                <p>No resolution evidence uploaded yet by the assigned department.</p>
                <button
                  onClick={() => setIsEvidenceOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  + Upload Resolution Photo (Demo)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {evidence.map((ev) => (
                  <div key={ev.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <img
                      src={ev.file_url}
                      alt="Field resolution proof"
                      className="w-full h-52 object-cover"
                    />
                    <div className="p-3.5 bg-slate-50 text-xs space-y-1">
                      <p className="font-bold text-slate-900">{ev.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Uploaded by: <strong>{ev.uploaded_by_name || 'Municipal Officer'}</strong></span>
                        <span>{formatDistanceToNow(parseISO(ev.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aggregated Citizen Complaints Accordion */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Aggregated Citizen Reports ({complaints.length})
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">Clustered Grievances</span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-50 hover:bg-blue-50/40 rounded-lg border border-slate-200 transition-colors text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">Complaint #{c.id}</span>
                    <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      {c.similarity_score ? `${Math.round(c.similarity_score * 100)}% Similarity` : 'Primary'}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium">{c.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>{c.location_name}</span>
                    <span>{formatDistanceToNow(parseISO(c.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Operational Timeline & Citizen Audits */}
        <div className="lg:col-span-5 space-y-6">
          {/* Citizen Verification Audit Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Citizen Verification Audit</h3>
              </div>
              <span className="text-xs font-bold text-slate-600">
                Status: {issue.verification_status || 'Pending'}
              </span>
            </div>

            {verifications.length > 0 ? (
              <div className="space-y-2">
                {verifications.map((v) => (
                  <div
                    key={v.id}
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      v.status === 'VERIFIED'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : v.status === 'DISPUTED'
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{v.status === 'VERIFIED' ? '✓ Resolution Verified' : v.status === 'DISPUTED' ? '✕ Resolution Disputed' : '⚠️ Needs Secondary Review'}</span>
                      <span className="text-[10px] opacity-80">{formatDistanceToNow(parseISO(v.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="font-medium">{v.notes}</p>
                    <div className="text-[10px] opacity-75">Audited by: {v.citizen_name || 'Citizen'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Awaiting citizen field audit to confirm repair quality.
              </p>
            )}

            <button
              onClick={() => setIsVerificationOpen(true)}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors border border-slate-300"
            >
              Submit Audit Verdict (Verify / Dispute)
            </button>
          </div>

          {/* Operational Activity Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-base text-slate-900">Activity Timeline</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">Milestone Logs</span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {actions.map((act) => (
                <div key={act.id} className="relative text-xs space-y-0.5">
                  {/* Dot */}
                  <span className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                    act.action_type === 'RECURRENCE_ALERT'
                      ? 'bg-rose-600'
                      : act.action_type === 'CITIZEN_VERIFICATION'
                      ? 'bg-emerald-600'
                      : act.action_type === 'EVIDENCE_UPLOAD'
                      ? 'bg-blue-600'
                      : 'bg-slate-700'
                  }`} />

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                      {act.action_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDistanceToNow(parseISO(act.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <p className="text-slate-700 font-medium leading-relaxed">
                    {act.description}
                  </p>

                  <div className="text-[10px] text-slate-400">
                    Recorded by: {act.user_name || 'System'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <VerificationModal
        issueId={issue.id}
        currentStatus={issue.verification_status}
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        onSuccess={fetchPassport}
      />

      <EvidenceModal
        issueId={issue.id}
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        onSuccess={fetchPassport}
      />

      <ActionModal
        issueId={issue.id}
        isOpen={isActionOpen}
        onClose={() => setIsActionOpen(false)}
        onSuccess={fetchPassport}
      />
    </div>
  );
}
