import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { useLogStore } from '../../store/logStore';
import {
  Sliders,
  Compass,
  Table,
  Activity,
  FileText,
  BookOpen,
  Columns,
  ListOrdered,
  Terminal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const SidebarNavigation: React.FC = () => {
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const panelsCollapsed = useUIStore((s) => s.panelsCollapsed);
  const togglePanel = useUIStore((s) => s.togglePanel);

  const logCount = useLogStore((s) => s.logs.length);

  const tabs = [
    { id: 'fk' as const, label: 'Controls', icon: Compass },
    { id: 'params' as const, label: 'Parameters', icon: Sliders },
    { id: 'dh' as const, label: 'DH Table', icon: Table },
    { id: 'data' as const, label: 'Live Data', icon: Activity },
    { id: 'specs' as const, label: 'Specs', icon: FileText },
    { id: 'learn' as const, label: 'Learn', icon: BookOpen },
    { id: 'compare' as const, label: 'Compare', icon: Columns },
    { id: 'waypoints' as const, label: 'Waypoints', icon: ListOrdered },
    { id: 'logs' as const, label: 'Logs', icon: Terminal, badge: logCount }
  ];

  return (
    <aside className="w-16 h-full bg-dark-900 border-r border-slate-800 flex flex-col items-center py-3 select-none z-20 shrink-0">
      <div className="flex-1 flex flex-col gap-1.5 w-full px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected =
            activeTab === tab.id || (tab.id === 'fk' && activeTab === 'ik');

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`relative flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-dark-850'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] tracking-tight truncate max-w-full">
                {tab.label}
              </span>

              {tab.badge !== undefined && tab.badge > 0 && !isSelected && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse / Expand Toggle */}
      <div className="pt-2 border-t border-slate-800 w-full px-2 flex justify-center">
        <button
          onClick={() => togglePanel('left')}
          title={panelsCollapsed.left ? 'Expand Side Panel' : 'Collapse Side Panel'}
          className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-dark-850 transition"
        >
          {panelsCollapsed.left ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
