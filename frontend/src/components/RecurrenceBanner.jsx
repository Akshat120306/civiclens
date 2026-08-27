import React from 'react';
import { RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecurrenceBanner({ issueId, recurrenceCount = 1, similarityScore, triggerDescription, notes }) {
  return (
    <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-4.5 shadow-sm mb-6 animate-in fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold uppercase tracking-wide text-rose-900 bg-rose-200/80 px-2 py-0.5 rounded border border-rose-300">
                RECURRENCE DETECTED
              </span>
              <span className="text-xs font-bold text-rose-800">
                Event #{recurrenceCount} Recorded
              </span>
              {similarityScore && (
                <span className="text-xs font-mono font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded">
                  {Math.round(similarityScore * 100)}% Similarity Match
                </span>
              )}
            </div>

            <p className="mt-1.5 text-xs text-rose-950 font-semibold leading-relaxed">
              {notes || `AI Intelligence Engine matched a newly submitted citizen complaint with previously resolved Issue #${issueId}. This issue has been automatically flagged and reopened for senior engineering review.`}
            </p>

            {triggerDescription && (
              <div className="mt-2 text-xs bg-white/80 border border-rose-200 rounded p-2 text-slate-800 font-normal">
                <span className="font-semibold text-rose-900">Triggering Citizen Report:</span> "{triggerDescription}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
