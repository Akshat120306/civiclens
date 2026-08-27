import React, { useState } from 'react';
import { ShieldCheck, XCircle, AlertCircle, X } from 'lucide-react';
import { issuesApi } from '../api/client';

export default function VerificationModal({ issueId, currentStatus, isOpen, onClose, onSuccess }) {
  const [selectedStatus, setSelectedStatus] = useState('VERIFIED');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await issuesApi.submitVerification(issueId, {
        status: selectedStatus,
        notes: notes.trim() || `Citizen verification audit: ${selectedStatus}`,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to submit verification', err);
      setError(err.response?.data?.error || 'Failed to submit verification audit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0B2545] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Citizen Verification Audit</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Please audit the resolution of <strong>Issue #{issueId}</strong> based on field reality. Your feedback updates the official civic accountability ledger.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 3 Choice Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Audit Verdict
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedStatus('VERIFIED')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all ${
                  selectedStatus === 'VERIFIED'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                }`}
              >
                <ShieldCheck className={`w-5 h-5 mb-1 ${selectedStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs">VERIFY</span>
                <span className="text-[10px] text-slate-500 font-normal">Repair satisfactory</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('DISPUTE')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all ${
                  selectedStatus === 'DISPUTE'
                    ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                }`}
              >
                <XCircle className={`w-5 h-5 mb-1 ${selectedStatus === 'DISPUTE' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span className="text-xs">DISPUTE</span>
                <span className="text-[10px] text-slate-500 font-normal">Unresolved / poor</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('NEEDS_REVIEW')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all ${
                  selectedStatus === 'NEEDS_REVIEW'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                }`}
              >
                <AlertCircle className={`w-5 h-5 mb-1 ${selectedStatus === 'NEEDS_REVIEW' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="text-xs">NEEDS REVIEW</span>
                <span className="text-[10px] text-slate-500 font-normal">Partial repair</span>
              </button>
            </div>
          </div>

          {selectedStatus === 'DISPUTE' && (
            <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-md text-xs text-rose-900 font-medium">
              ⚠️ <strong>Resolution disputed — review required.</strong> This issue will be reopened and escalated to senior department engineers.
            </div>
          )}

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field Observation Remarks
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Visited site today. Potholes have been filled with hot-mix asphalt and smooth finish verified."
              rows={3}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-600 rounded-lg shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting Audit...' : 'Submit Verification Verdict'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
