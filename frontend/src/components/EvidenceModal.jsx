import React, { useState } from 'react';
import { Camera, Upload, AlertCircle, X, CheckCircle } from 'lucide-react';
import { issuesApi } from '../api/client';

export default function EvidenceModal({ issueId, isOpen, onClose, onSuccess }) {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [markResolved, setMarkResolved] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !previewUrl) {
      setError('Please upload a photo of the completed field work.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('file_url', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=60');
      }
      formData.append('description', description.trim() || 'Visual repair completion documentation');
      formData.append('mark_resolved', markResolved);

      await issuesApi.uploadEvidence(issueId, formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to upload evidence', err);
      setError(err.response?.data?.error || 'Failed to submit resolution evidence.');
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
            <Camera className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">Submit Resolution Evidence</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Upload photographic proof and operational work summary for <strong>Issue #{issueId}</strong> to verify resolution quality.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Field Completion Photo *
            </label>

            {previewUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-300 mb-2">
                <img src={previewUrl} alt="Evidence preview" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl('');
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-md text-xs shadow-md"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-700">Click to upload resolution photo</span>
                <span className="text-[11px] text-slate-500">PNG, JPG, WebP up to 10MB</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}

            {/* Quick Demo Preset Photo */}
            {!previewUrl && (
              <button
                type="button"
                onClick={() => setPreviewUrl('https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=60')}
                className="mt-1 text-[11px] text-blue-600 hover:underline font-medium"
              >
                + Use Sample Completed Road Repair Photo (Demo Preset)
              </button>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Action Taken & Materials Used
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Excavated 120m stretch, filled sub-base with compacted aggregate, and completed 50mm hot-mix asphalt overlay."
              rows={3}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Mark as Resolved checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="mark_resolved"
              checked={markResolved}
              onChange={(e) => setMarkResolved(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="mark_resolved" className="text-xs font-medium text-slate-800 cursor-pointer">
              Mark Issue Status as <strong>RESOLVED</strong> (triggers Citizen Verification Audit)
            </label>
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
              className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-600 rounded-lg shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
            >
              {submitting ? 'Uploading Evidence...' : 'Submit Resolution Proof'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
