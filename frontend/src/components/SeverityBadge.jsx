import React from 'react';
import { AlertCircle, AlertOctagon, Info, ShieldAlert } from 'lucide-react';

export default function SeverityBadge({ severity, size = 'md' }) {
  const norm = (severity || 'Medium').toLowerCase();

  let bg = 'bg-slate-100 text-slate-700 border-slate-300';
  let Icon = Info;

  if (norm === 'critical') {
    bg = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
    Icon = AlertOctagon;
  } else if (norm === 'high') {
    bg = 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
    Icon = ShieldAlert;
  } else if (norm === 'medium') {
    bg = 'bg-blue-50 text-blue-800 border-blue-200';
    Icon = AlertCircle;
  } else if (norm === 'low') {
    bg = 'bg-slate-100 text-slate-700 border-slate-200';
    Icon = Info;
  }

  const sizeClasses = size === 'sm' 
    ? 'text-[11px] px-2 py-0.5 space-x-1' 
    : 'text-xs px-2.5 py-1 space-x-1.5';

  return (
    <span className={`inline-flex items-center rounded-md border ${bg} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{severity || 'Medium'}</span>
    </span>
  );
}
