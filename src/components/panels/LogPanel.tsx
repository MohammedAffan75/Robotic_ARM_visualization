import React from 'react';
import { useLogStore } from '../../store/logStore';
import { Terminal, Trash2, Filter, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export const LogPanel: React.FC = () => {
  const logs = useLogStore((s) => s.logs);
  const filter = useLogStore((s) => s.filter);
  const setFilter = useLogStore((s) => s.setFilter);
  const clearLogs = useLogStore((s) => s.clearLogs);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.severity === filter;
  });

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-slate-800 text-slate-100 select-none">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            System & Kinematics Log
          </h2>
        </div>
        <button
          onClick={clearLogs}
          title="Clear system log"
          className="p-1 rounded bg-dark-850 hover:bg-dark-800 border border-slate-800 text-slate-400 hover:text-white transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Severity Filter Bar */}
      <div className="p-3 border-b border-slate-800/80 bg-dark-850/50 flex items-center gap-1.5 text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
        {(['all', 'info', 'warning', 'error'] as const).map((sev) => {
          const isSelected = filter === sev;
          const count = sev === 'all' ? logs.length : logs.filter((l) => l.severity === sev).length;

          return (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono transition capitalize ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-dark-900 text-slate-400 hover:text-white hover:bg-dark-800'
              }`}
            >
              {sev} ({count})
            </button>
          );
        })}
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No log events recorded matching filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            const isError = log.severity === 'error';
            const isWarning = log.severity === 'warning';

            return (
              <div
                key={log.id}
                className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition ${
                  isError
                    ? 'bg-rose-950/25 border-rose-800/40 text-rose-200'
                    : isWarning
                    ? 'bg-amber-950/25 border-amber-800/40 text-amber-200'
                    : 'bg-dark-850 border-slate-800 text-slate-300'
                }`}
              >
                {isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="uppercase font-bold tracking-wider">{log.severity}</span>
                    <span>{timeStr}</span>
                  </div>
                  <div className="font-semibold text-xs mt-0.5">{log.title}</div>
                  {log.details && (
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {log.details}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
