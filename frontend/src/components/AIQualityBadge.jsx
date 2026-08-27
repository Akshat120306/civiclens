import React, { useState } from 'react';
import { Sparkles, Info, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function AIQualityBadge({ qualityScore }) {
  const [expanded, setExpanded] = useState(false);

  if (!qualityScore) {
    return null;
  }

  const { score = 75, grade = 'Good', factors = [] } = qualityScore;

  let colorClasses = 'border-blue-200 bg-blue-50/50 text-blue-900';
  let scoreColor = 'text-blue-700';

  if (score >= 85) {
    colorClasses = 'border-emerald-200 bg-emerald-50/40 text-emerald-950';
    scoreColor = 'text-emerald-700';
  } else if (score >= 70) {
    colorClasses = 'border-blue-200 bg-blue-50/40 text-blue-950';
    scoreColor = 'text-blue-700';
  } else if (score >= 50) {
    colorClasses = 'border-amber-200 bg-amber-50/40 text-amber-950';
    scoreColor = 'text-amber-700';
  } else {
    colorClasses = 'border-rose-200 bg-rose-50/40 text-rose-950';
    scoreColor = 'text-rose-700';
  }

  return (
    <div className={`rounded-xl border ${colorClasses} p-4 shadow-sm transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Resolution Quality Index
              </span>
              <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                AI-Assisted Prototype Assessment
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Objective algorithmic audit based on SLA, evidence, citizen verification & recurrence
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className={`text-2xl font-black ${scoreColor}`}>
              {score} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{grade}</div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded-md transition-colors"
            title="Toggle Factor Breakdown"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && factors && factors.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
            Assessment Factor Breakdown
          </div>
          <div className="space-y-1.5">
            {factors.map((f, i) => (
              <div key={i} className="flex items-start justify-between text-xs bg-white/70 p-2 rounded-md border border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className={`font-mono font-bold text-xs ${f.points.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {f.points}
                  </span>
                  <span className="font-semibold text-slate-800">{f.name}:</span>
                  <span className="text-slate-600">{f.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
