import React from 'react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ValidationIssue } from '../../core/validation';

interface ToastContainerProps {
  issues: ValidationIssue[];
  onDismiss?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ issues, onDismiss }) => {
  // Show the most critical 3 issues as non-blocking floating alerts
  const displayIssues = issues.slice(0, 3);

  if (displayIssues.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {displayIssues.map((issue) => {
        const isError = issue.severity === 'error';
        const isWarning = issue.severity === 'warning';

        return (
          <div
            key={issue.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-2 ${
              isError
                ? 'bg-rose-950/85 border-rose-500/40 text-rose-100'
                : isWarning
                ? 'bg-amber-950/85 border-amber-500/40 text-amber-100'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            {isError ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : isWarning ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold uppercase tracking-wider">{issue.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">{issue.cause}</p>
              {issue.suggestedFix && (
                <p className="text-[11px] text-slate-400 mt-1 italic">
                  💡 {issue.suggestedFix}
                </p>
              )}
            </div>

            {onDismiss && (
              <button
                onClick={() => onDismiss(issue.id)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
