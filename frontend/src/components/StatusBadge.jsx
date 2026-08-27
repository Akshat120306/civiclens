import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, RefreshCw, XCircle, ShieldCheck, FileCheck } from 'lucide-react';

export default function StatusBadge({ status, verificationStatus, isRecurrent, size = 'md' }) {
  let bg = 'bg-blue-50 text-blue-700 border-blue-200';
  let Icon = Clock;
  let label = status || 'Open';

  const normalized = (status || '').toLowerCase();
  const vNorm = (verificationStatus || '').toLowerCase();

  if (isRecurrent || normalized === 'reopened' || normalized === 'recurring') {
    bg = 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
    Icon = RefreshCw;
    label = 'Recurrence Flagged';
  } else if (vNorm === 'verified' || normalized === 'verified') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
    Icon = ShieldCheck;
    label = 'Verified Resolved';
  } else if (vNorm === 'disputed') {
    bg = 'bg-red-50 text-red-700 border-red-300 font-semibold';
    Icon = XCircle;
    label = 'Resolution Disputed';
  } else if (normalized === 'resolved') {
    bg = 'bg-teal-50 text-teal-700 border-teal-200';
    Icon = CheckCircle2;
    label = 'Resolved (Audit Pending)';
  } else if (normalized === 'in progress') {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = Clock;
    label = 'In Progress';
  } else if (normalized === 'clustered') {
    bg = 'bg-purple-50 text-purple-700 border-purple-200';
    Icon = FileCheck;
    label = 'Clustered to Issue';
  }

  const sizeClasses = size === 'sm' 
    ? 'text-[11px] px-2 py-0.5 space-x-1' 
    : 'text-xs px-2.5 py-1 space-x-1.5';

  return (
    <span className={`inline-flex items-center rounded-md border ${bg} ${sizeClasses} shadow-sm`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
}
