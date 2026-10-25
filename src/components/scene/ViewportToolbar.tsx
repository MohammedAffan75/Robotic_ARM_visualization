import React from 'react';
import { useUIStore, CameraPreset } from '../../store/uiStore';
import { Eye, Camera } from 'lucide-react';

export const ViewportToolbar: React.FC = () => {
  const overlays = useUIStore((s) => s.overlays);
  const toggleOverlay = useUIStore((s) => s.toggleOverlay);
  const cameraPreset = useUIStore((s) => s.cameraPreset);
  const setCameraPreset = useUIStore((s) => s.setCameraPreset);

  const cameraOptions: { id: CameraPreset; label: string; shortcut: string }[] = [
    { id: 'front', label: 'Front', shortcut: '1' },
    { id: 'side', label: 'Side', shortcut: '2' },
    { id: 'top', label: 'Top', shortcut: '3' },
    { id: 'iso', label: 'Iso', shortcut: '4' },
    { id: 'followEE', label: 'Follow TCP', shortcut: '5' }
  ];

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none select-none">
      {/* Camera Presets Selector */}
      <div className="pointer-events-auto flex items-center gap-1 p-1 bg-dark-900/85 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-1 px-2 text-[11px] font-semibold text-slate-400 border-r border-slate-800">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>Camera</span>
        </div>
        {cameraOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setCameraPreset(opt.id)}
            title={`Switch to ${opt.label} view (${opt.shortcut})`}
            className={`px-2 py-1 rounded-lg text-xs font-mono transition ${
              cameraPreset === opt.id
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-dark-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 3D Overlays Toggle Bar */}
      <div className="pointer-events-auto flex items-center gap-1 p-1 bg-dark-900/85 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl text-xs">
        <div className="flex items-center gap-1 px-2 text-[11px] font-semibold text-slate-400 border-r border-slate-800">
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Overlays</span>
        </div>

        <button
          onClick={() => toggleOverlay('jointFrames')}
          className={`px-2 py-1 rounded-lg font-mono text-[11px] transition ${
            overlays.jointFrames
              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle RGB Coordinate Frames at Joint Links"
        >
          Frames
        </button>

        <button
          onClick={() => toggleOverlay('motionArrows')}
          className={`px-2 py-1 rounded-lg font-mono text-[11px] transition ${
            overlays.motionArrows
              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Rotary & Linear Motion Arrows"
        >
          Arrows
        </button>

        <button
          onClick={() => toggleOverlay('angleArcs')}
          className={`px-2 py-1 rounded-lg font-mono text-[11px] transition ${
            overlays.angleArcs
              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Swept Angle Arcs & Limit Guides"
        >
          Angle Arcs
        </button>

        <button
          onClick={() => toggleOverlay('trailLine')}
          className={`px-2 py-1 rounded-lg font-mono text-[11px] transition ${
            overlays.trailLine
              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Fading End-Effector Trajectory Trail"
        >
          Trail
        </button>

        <button
          onClick={() => toggleOverlay('workspaceCloud')}
          className={`px-2 py-1 rounded-lg font-mono text-[11px] transition ${
            overlays.workspaceCloud
              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Reachable Workspace Point Cloud"
        >
          Workspace Cloud
        </button>
      </div>
    </div>
  );
};
