import React, { useRef } from 'react';
import {
  RotateCcw,
  RotateCw,
  Home,
  Dices,
  HelpCircle,
  Sparkles,
  Columns,
  Upload,
  Download,
  Cpu
} from 'lucide-react';
import { useArmStore } from '../../store/armStore';
import { useUIStore } from '../../store/uiStore';
import { ARM_TYPES, getArmDefinition } from '../../core/arms';
import { StatusBadge } from '../ui/StatusBadge';

export const Header: React.FC = () => {
  const armType = useArmStore((s) => s.armType);
  const worstSeverity = useArmStore((s) => s.worstSeverity);
  const validationIssues = useArmStore((s) => s.validationIssues);
  const setArmType = useArmStore((s) => s.setArmType);
  const homePose = useArmStore((s) => s.homePose);
  const randomizePose = useArmStore((s) => s.randomizePose);
  const undo = useArmStore((s) => s.undo);
  const redo = useArmStore((s) => s.redo);
  const canUndo = useArmStore((s) => s.canUndo());
  const canRedo = useArmStore((s) => s.canRedo());
  const exportConfig = useArmStore((s) => s.exportConfig);
  const importConfig = useArmStore((s) => s.importConfig);

  const comparisonMode = useUIStore((s) => s.comparisonMode);
  const setComparisonMode = useUIStore((s) => s.setComparisonMode);
  const setHelpModalOpen = useUIStore((s) => s.setHelpModalOpen);
  const setOnboardingOpen = useUIStore((s) => s.setOnboardingOpen);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const config = exportConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robokin-${config.armType}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importConfig(content);
        if (!res.success) {
          alert(res.error || 'Failed to import JSON config');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-dark-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Arm Type Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              RoboKin <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">3-DOF</span>
            </h1>
          </div>
        </div>

        {/* Arm Type Selector Carousel */}
        <div className="flex items-center gap-1 bg-dark-850 p-1 rounded-xl border border-slate-800">
          {ARM_TYPES.map((type) => {
            const def = getArmDefinition(type);
            const isSelected = armType === type;
            return (
              <button
                key={type}
                onClick={() => setArmType(type)}
                title={`${def.name} (${def.jointSequence})`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
                }`}
              >
                <span>{def.name.split(' ')[0]}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isSelected ? 'bg-slate-900/30 text-slate-950' : 'bg-dark-900 text-slate-500'}`}>
                  {def.jointSequence}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Status & Quick Controls */}
      <div className="flex items-center gap-3">
        {/* Worst Severity Badge */}
        <StatusBadge
          status={worstSeverity}
          count={validationIssues.length}
          onClick={() => setActiveTab('logs')}
        />

        {/* Action Toolbar: Undo, Redo, Home, Random */}
        <div className="flex items-center gap-1 bg-dark-850 p-1 rounded-lg border border-slate-800">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo Pose / Param (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-dark-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-dark-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />
          <button
            onClick={homePose}
            title="Return to Home Pose (H)"
            className="p-1.5 rounded hover:bg-dark-800 text-slate-400 hover:text-cyan-400 transition"
          >
            <Home className="w-4 h-4" />
          </button>
          <button
            onClick={randomizePose}
            title="Random Reachable Pose (R)"
            className="p-1.5 rounded hover:bg-dark-800 text-slate-400 hover:text-cyan-400 transition"
          >
            <Dices className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Toggle */}
        <button
          onClick={() => setComparisonMode(!comparisonMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
            comparisonMode
              ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
              : 'bg-dark-850 border-slate-800 text-slate-400 hover:text-white hover:bg-dark-800'
          }`}
          title="Toggle side-by-side comparison mode"
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Compare</span>
        </button>

        {/* Import / Export JSON */}
        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import robot config JSON"
            className="p-2 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportJSON}
            title="Export robot config JSON"
            className="p-2 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Tour & Help */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOnboardingOpen(true)}
            title="Start Onboarding Tour"
            className="p-2 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-cyan-400 border border-slate-800 transition"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={() => setHelpModalOpen(true)}
            title="Keyboard Shortcuts & Documentation (?)"
            className="p-2 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
