import { create } from 'zustand';

export type LogSeverity = 'info' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: number;
  severity: LogSeverity;
  title: string;
  details?: string;
}

interface LogState {
  logs: LogEntry[];
  filter: 'all' | LogSeverity;
  addLog: (severity: LogSeverity, title: string, details?: string) => void;
  clearLogs: () => void;
  setFilter: (filter: 'all' | LogSeverity) => void;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [
    {
      id: 'init-0',
      timestamp: Date.now(),
      severity: 'info',
      title: 'RoboKin 3-DOF Kinematics Engine initialized',
      details: 'All 6 kinematic models, DH matrices, and numerical Jacobian solvers loaded successfully.'
    }
  ],
  filter: 'all',
  addLog: (severity, title, details) =>
    set((state) => ({
      logs: [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          severity,
          title,
          details
        },
        ...state.logs.slice(0, 199) // keep last 200 entries
      ]
    })),
  clearLogs: () => set({ logs: [] }),
  setFilter: (filter) => set({ filter })
}));
