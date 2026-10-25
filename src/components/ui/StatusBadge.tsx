import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { IssueSeverity } from '../../core/validation';

interface StatusBadgeProps {
  status: IssueSeverity | 'ok';
  count?: number;
  onClick?: () => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, count = 0, onClick }) => {
  const configs = {
    ok: {
      label: 'Optimal Kinematics',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2,
      dot: 'bg-emerald-400'
    },
    info: {
      label: 'System Info',
      bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      icon: Info,
      dot: 'bg-sky-400'
    },
    warning: {
      label: 'Kinematic Warning',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: AlertTriangle,
      dot: 'bg-amber-400'
    },
    error: {
      label: 'Target / Limit Violation',
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: AlertOctagon,
      dot: 'bg-rose-400'
    }
  };

  const current = configs[status] || configs.ok;
  const Icon = current.icon;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm ${current.bg}`}
    >
      <span className={`w-2 h-2 rounded-full ${current.dot} animate-pulse`} />
      <Icon className="w-3.5 h-3.5" />
      <span>{current.label}</span>
      {count > 0 && (
        <span className="px-1.5 py-0.2 rounded-full bg-slate-900/40 text-[10px] font-mono">
          {count}
        </span>
      )}
    </button>
  );
};
