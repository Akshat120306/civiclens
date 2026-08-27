import React from 'react';
import { Clock, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';

export default function SLACountdown({ slaHours = 72, slaDeadline, status }) {
  const isDone = ['Resolved', 'Closed', 'Verified'].includes(status);

  if (isDone) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-emerald-800">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">SLA Resolution Status</div>
            <div className="text-sm font-bold text-emerald-900">Resolved within {slaHours}h SLA Commitment</div>
          </div>
        </div>
        <span className="text-[11px] font-bold uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
          Complied
        </span>
      </div>
    );
  }

  if (!slaDeadline) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-700">
          <Clock className="w-5 h-5 text-slate-500 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-slate-500">Committed SLA Window</div>
            <div className="text-sm font-bold text-slate-800">{slaHours} Hours Standard</div>
          </div>
        </div>
      </div>
    );
  }

  const deadlineDate = typeof slaDeadline === 'string' ? parseISO(slaDeadline) : slaDeadline;
  const overdue = isPast(deadlineDate);
  const now = new Date();
  const diffHours = Math.round((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));

  if (overdue) {
    return (
      <div className="bg-rose-50 border border-rose-300 rounded-lg p-3 flex items-center justify-between animate-pulse">
        <div className="flex items-center space-x-2.5 text-rose-900">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-rose-700">SLA Breach Detected</div>
            <div className="text-sm font-extrabold text-rose-950">
              Overdue by {formatDistanceToNow(deadlineDate)}
            </div>
          </div>
        </div>
        <span className="text-[11px] font-extrabold uppercase bg-rose-200 text-rose-900 px-2.5 py-1 rounded shadow-sm">
          Escalated
        </span>
      </div>
    );
  }

  const isWarning = diffHours <= 12;

  return (
    <div className={`border rounded-lg p-3 flex items-center justify-between ${
      isWarning ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-blue-50 border-blue-200 text-blue-900'
    }`}>
      <div className="flex items-center space-x-2.5">
        {isWarning ? (
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        ) : (
          <Clock className="w-5 h-5 text-blue-600 shrink-0" />
        )}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Committed SLA Deadline ({slaHours}h)
          </div>
          <div className="text-sm font-bold text-slate-900">
            {formatDistanceToNow(deadlineDate, { addSuffix: true })} ({diffHours}h remaining)
          </div>
        </div>
      </div>
      <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded ${
        isWarning ? 'bg-amber-200 text-amber-900' : 'bg-blue-200 text-blue-900'
      }`}>
        {isWarning ? 'Approaching Breach' : 'On Track'}
      </span>
    </div>
  );
}
