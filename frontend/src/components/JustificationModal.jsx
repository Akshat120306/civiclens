import React, { useState } from 'react';
import { Gavel, Upload, AlertCircle, X } from 'lucide-react';
import { issuesApi } from '../api/client';

export default function JustificationModal({ issueId, isOpen, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const reset = () => {
    setReason('');
    setFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
  };

  // Refresh the passport only when the modal closes, so the AI verdict card
  // stays visible (refreshing mid-flow would unmount this modal).
  const handleClose = () => {
    if (result) onSuccess?.();
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please state why the issue is not resolved yet.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('reason', reason.trim());
      if (file) {
        formData.append('file', file);
      } else if (previewUrl) {
        formData.append('evidence_url', previewUrl);
      }
      const res = await issuesApi.submitJustification(issueId, formData);
      setResult(res.data.review);
    } catch (err) {
      console.error('Failed to submit justification', err);
      setError(err.response?.data?.error || 'Failed to submit justification.');
    } finally {
      setSubmitting(false);
    }
  };

  const verdictStyle = {
    ACCEPTED: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    REJECTED: 'bg-rose-50 border-rose-300 text-rose-900',
    NEEDS_MORE: 'bg-amber-50 border-amber-300 text-amber-900',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-[#7c2d12] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gavel className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base">Explain the SLA Breach</h3>
          </div>
          <button onClick={() => { handleClose(); }} className="text-slate-300 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          <div className="p-6 space-y-4">
            <div className={`p-4 rounded-lg border ${verdictStyle[result.verdict] || 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-sm">AI Verdict: {result.verdict.replace('_', ' ')}</span>
                <span className="text-[11px] font-bold opacity-80">{Math.round((result.confidence || 0) * 100)}% confidence</span>
              </div>
              <p className="text-xs leading-relaxed">{result.reasoning}</p>
            </div>
            <p className="text-[11px] text-slate-500">
              {result.verdict === 'ACCEPTED'
                ? 'The delay is now recorded as accountable and removed from the public Accountability Wall.'
                : 'This issue stays on the public Accountability Wall until a valid justification or a verified fix is provided.'}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => { handleClose(); }}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-xs text-slate-600">
              <strong>Issue #{issueId}</strong> has breached its service-level agreement. As the responsible
              department you must explain the delay with proof. The AI reviews every justification.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Reason for delay *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Underground cable fault required excavation permit; contractor mobilized, work order PWD-912 issued, delayed by continuous monsoon rain."
                rows={3}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supporting evidence (photo / document)</label>
              {previewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-300">
                  <img src={previewUrl} alt="Evidence" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreviewUrl(''); }}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-md text-[11px]"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50">
                  <Upload className="w-7 h-7 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700">Upload proof</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
              {!previewUrl && (
                <button
                  type="button"
                  onClick={() => setPreviewUrl('https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&auto=format&fit=crop&q=60')}
                  className="mt-1 text-[11px] text-orange-600 hover:underline font-medium"
                >
                  + Use sample work-order photo (demo)
                </button>
              )}
              <p className="mt-1 text-[11px] text-slate-500">Without evidence the AI will reject the justification.</p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => { handleClose(); }} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-white bg-orange-700 hover:bg-orange-600 rounded-lg shadow-sm disabled:opacity-50"
              >
                {submitting ? 'AI reviewing...' : 'Submit for AI Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
