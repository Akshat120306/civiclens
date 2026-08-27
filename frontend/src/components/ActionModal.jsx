import React, { useState } from 'react';
import { FileEdit, X, AlertCircle } from 'lucide-react';
import { issuesApi } from '../api/client';

export default function ActionModal({ issueId, isOpen, onClose, onSuccess }) {
  const [actionType, setActionType] = useState('FIELD_INSPECTION');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide details of the action taken.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await issuesApi.addAction(issueId, {
        action_type: actionType,
        description: description.trim(),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to record action', err);
      setError(err.response?.data?.error || 'Failed to record operational action.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0B2545] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileEdit className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">Record Operational Milestone</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Milestone Type
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="FIELD_INSPECTION">Site Inspection Completed</option>
              <option value="WORK_ORDER_ISSUED">Work Order Dispatched</option>
              <option value="MATERIAL_DEPLOYMENT">Machinery / Material Mobilized</option>
              <option value="REPAIR_IN_PROGRESS">Active Repair in Progress</option>
              <option value="INTER_DEPT_COORDINATION">Inter-Department Coordination</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field Notes / Action Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Junior Engineer visited site. Assigned repair team #4 with 4 tons of cold aggregate asphalt mix."
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
              {submitting ? 'Recording...' : 'Log Operational Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
