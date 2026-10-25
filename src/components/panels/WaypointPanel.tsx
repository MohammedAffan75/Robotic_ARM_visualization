import React, { useEffect, useRef, useState } from 'react';
import { useWaypointStore } from '../../store/waypointStore';
import { useArmStore } from '../../store/armStore';
import { useLogStore } from '../../store/logStore';
import {
  Play,
  Pause,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Repeat,
  Download,
  ListOrdered,
  Sparkles,
  BookmarkPlus,
  FolderOpen,
  X,
  Check
} from 'lucide-react';
import { Vec3 } from '../../core/math/matrix';

export const WaypointPanel: React.FC = () => {
  const waypoints = useWaypointStore((s) => s.waypoints);
  const isPlaying = useWaypointStore((s) => s.isPlaying);
  const currentIdx = useWaypointStore((s) => s.currentPlaybackIndex);
  const mode = useWaypointStore((s) => s.mode);
  const loop = useWaypointStore((s) => s.loop);
  const speedFactor = useWaypointStore((s) => s.speedFactor);
  const customPresets = useWaypointStore((s) => s.customPresets);

  const addWaypoint = useWaypointStore((s) => s.addWaypoint);
  const removeWaypoint = useWaypointStore((s) => s.removeWaypoint);
  const reorderWaypoints = useWaypointStore((s) => s.reorderWaypoints);
  const clearWaypoints = useWaypointStore((s) => s.clearWaypoints);
  const setPlaying = useWaypointStore((s) => s.setPlaying);
  const setCurrentIndex = useWaypointStore((s) => s.setCurrentIndex);
  const setMode = useWaypointStore((s) => s.setMode);
  const setLoop = useWaypointStore((s) => s.setLoop);
  const setSpeedFactor = useWaypointStore((s) => s.setSpeedFactor);
  const loadPreset = useWaypointStore((s) => s.loadPreset);
  const saveCustomPreset = useWaypointStore((s) => s.saveCustomPreset);
  const loadCustomPreset = useWaypointStore((s) => s.loadCustomPreset);
  const deleteCustomPreset = useWaypointStore((s) => s.deleteCustomPreset);
  const exportCSV = useWaypointStore((s) => s.exportCSV);

  const armType = useArmStore((s) => s.armType);
  const joints = useArmStore((s) => s.joints);
  const fkResult = useArmStore((s) => s.fkResult);
  const setJoints = useArmStore((s) => s.setJoints);
  const setTarget = useArmStore((s) => s.setTarget);

  // Save-preset form state
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [presetName, setPresetName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSaveForm) {
      setPresetName(`My Preset ${customPresets.length + 1}`);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showSaveForm]);

  const handleSavePreset = () => {
    const name = presetName.trim() || `My Preset ${customPresets.length + 1}`;
    saveCustomPreset(name);
    useLogStore.getState().addLog('info', 'Preset Saved', `Saved "${name}" with ${waypoints.length} waypoints`);
    setShowSaveForm(false);
    setPresetName('');
  };

  // Trajectory Playback Loop
  const animFrameRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying || waypoints.length < 2) return;

    let lastTime = performance.now();

    const stepTrajectory = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Segment duration ~ 1.5 seconds / speedFactor
      const segDuration = Math.max(0.2, 1.4 / speedFactor);
      progressRef.current += dt / segDuration;

      if (progressRef.current >= 1.0) {
        progressRef.current = 0;
        const nextIdx = currentIdx + 1;
        if (nextIdx >= waypoints.length) {
          if (loop) {
            setCurrentIndex(0);
          } else {
            setPlaying(false);
            return;
          }
        } else {
          setCurrentIndex(nextIdx);
        }
      }

      const p0 = waypoints[currentIdx];
      const p1 = waypoints[(currentIdx + 1) % waypoints.length];
      const t = Math.min(1.0, Math.max(0, progressRef.current));
      // Smooth cosine easing
      const easedT = 0.5 * (1 - Math.cos(Math.PI * t));

      if (mode === 'joint') {
        // Joint space interpolation
        const interpolatedJoints: [number, number, number] = [
          p0.joints[0] + (p1.joints[0] - p0.joints[0]) * easedT,
          p0.joints[1] + (p1.joints[1] - p0.joints[1]) * easedT,
          p0.joints[2] + (p1.joints[2] - p0.joints[2]) * easedT
        ];
        setJoints(interpolatedJoints, false);
      } else {
        // Cartesian space interpolation + IK
        const interpolatedTarget: Vec3 = [
          p0.endEffector[0] + (p1.endEffector[0] - p0.endEffector[0]) * easedT,
          p0.endEffector[1] + (p1.endEffector[1] - p0.endEffector[1]) * easedT,
          p0.endEffector[2] + (p1.endEffector[2] - p0.endEffector[2]) * easedT
        ];
        setTarget(interpolatedTarget, true);
      }

      animFrameRef.current = requestAnimationFrame(stepTrajectory);
    };

    animFrameRef.current = requestAnimationFrame(stepTrajectory);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, currentIdx, waypoints, mode, loop, speedFactor, setJoints, setTarget, setCurrentIndex, setPlaying]);

  const handleCaptureCurrentPose = () => {
    addWaypoint(`Pose ${waypoints.length + 1}`, joints, fkResult.endEffector);
    useLogStore.getState().addLog('info', 'Waypoint Saved', `Saved waypoint at [${fkResult.endEffector.map((c) => c.toFixed(2)).join(', ')}]`);
  };

  const handleDownloadCSV = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robokin-trajectory-${armType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-slate-800 text-slate-100 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Trajectory &amp; Waypoints
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDownloadCSV}
            disabled={waypoints.length === 0}
            title="Export trajectory CSV"
            className="flex items-center gap-1 px-2 py-1 bg-dark-850 hover:bg-dark-800 border border-slate-800 rounded text-[11px] text-slate-300 disabled:opacity-40 transition"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>
          <button
            onClick={clearWaypoints}
            disabled={waypoints.length === 0}
            title="Clear all waypoints"
            className="p-1 bg-dark-850 hover:bg-dark-800 border border-slate-800 rounded text-slate-400 hover:text-rose-400 disabled:opacity-40 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Playback Transport Controls */}
        <div className="p-3.5 rounded-xl bg-dark-850 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPlaying(!isPlaying)}
              disabled={waypoints.length < 2}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40 disabled:pointer-events-none'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Playback</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Trajectory</span>
                </>
              )}
            </button>
            <button
              onClick={() => setLoop(!loop)}
              title="Toggle continuous looping"
              className={`ml-2 p-2 rounded-lg border transition ${
                loop
                  ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                  : 'bg-dark-900 text-slate-500 border-slate-800'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Interpolation Space Mode */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Interpolation Space:</span>
            <div className="flex rounded-md bg-dark-900 p-0.5 border border-slate-800 text-[11px] font-mono">
              <button
                onClick={() => setMode('joint')}
                className={`px-2 py-0.5 rounded transition ${
                  mode === 'joint' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Joint Space
              </button>
              <button
                onClick={() => setMode('cartesian')}
                className={`px-2 py-0.5 rounded transition ${
                  mode === 'cartesian' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Cartesian (IK)
              </button>
            </div>
          </div>

          {/* Speed Slider */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Execution Speed:</span>
            <span className="font-mono text-cyan-400 font-bold">{speedFactor.toFixed(1)}×</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            value={speedFactor}
            onChange={(e) => setSpeedFactor(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-dark-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Action: Capture + Save as Preset */}
        <div className="flex gap-2">
          <button
            onClick={handleCaptureCurrentPose}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 transition"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Record Pose</span>
          </button>
          <button
            onClick={() => setShowSaveForm((v) => !v)}
            disabled={waypoints.length === 0}
            title="Save current waypoints as a named preset"
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition disabled:opacity-40 ${
              showSaveForm
                ? 'bg-violet-600 text-white border-violet-500'
                : 'bg-dark-850 hover:bg-dark-800 border-slate-700 hover:border-violet-500/60 text-slate-200'
            }`}
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Save Preset</span>
          </button>
        </div>

        {/* Inline Save Preset Form */}
        {showSaveForm && (
          <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/40 space-y-2 animate-in fade-in duration-150">
            <p className="text-[11px] text-violet-300 font-semibold uppercase tracking-wider">
              Name your preset ({waypoints.length} waypoints)
            </p>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSavePreset();
                  if (e.key === 'Escape') setShowSaveForm(false);
                }}
                placeholder="e.g. Welding Path A"
                maxLength={40}
                className="flex-1 bg-dark-900 border border-violet-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-violet-400 transition"
              />
              <button
                onClick={handleSavePreset}
                disabled={waypoints.length === 0}
                title="Confirm save"
                className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition disabled:opacity-40"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowSaveForm(false)}
                title="Cancel"
                className="p-2 rounded-lg bg-dark-900 hover:bg-dark-800 border border-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Built-in Trajectory Presets */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Industrial Trajectory Presets</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              onClick={() => loadPreset('pickAndPlace', armType)}
              className="p-2 rounded-lg bg-dark-850 hover:bg-dark-800 border border-slate-800 text-slate-300 hover:text-white text-center transition"
            >
              Pick &amp; Place
            </button>
            <button
              onClick={() => loadPreset('circle', armType)}
              className="p-2 rounded-lg bg-dark-850 hover:bg-dark-800 border border-slate-800 text-slate-300 hover:text-white text-center transition"
            >
              Circle Arc
            </button>
            <button
              onClick={() => loadPreset('square', armType)}
              className="p-2 rounded-lg bg-dark-850 hover:bg-dark-800 border border-slate-800 text-slate-300 hover:text-white text-center transition"
            >
              Square Box
            </button>
          </div>
        </div>

        {/* Custom Presets Section */}
        {customPresets.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
              <FolderOpen className="w-3.5 h-3.5 text-violet-400" />
              <span>My Custom Presets</span>
              <span className="ml-auto font-mono text-violet-400">{customPresets.length}</span>
            </div>
            <div className="space-y-1">
              {customPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-dark-850 border border-violet-900/40 hover:border-violet-700/50 transition group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-200 truncate">{preset.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {preset.waypoints.length} pts ·{' '}
                      {new Date(preset.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => {
                        loadCustomPreset(preset.id);
                        useLogStore.getState().addLog('info', 'Preset Loaded', `Loaded "${preset.name}"`);
                      }}
                      title="Load this preset"
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-900/40 hover:bg-violet-700/60 text-violet-300 text-[11px] font-semibold transition"
                    >
                      <FolderOpen className="w-3 h-3" />
                      Load
                    </button>
                    <button
                      onClick={() => deleteCustomPreset(preset.id)}
                      title="Delete this preset"
                      className="p-1 rounded-md text-slate-600 hover:text-rose-400 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waypoints Sequence List with Drag/Move Reordering */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            <span>Waypoints Sequence</span>
            <span className="font-mono text-cyan-400">{waypoints.length} Point(s)</span>
          </div>

          {waypoints.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No waypoints saved yet. Record a pose or load a preset!
            </div>
          ) : (
            <div className="space-y-1.5">
              {waypoints.map((wp, idx) => {
                const isCurrent = isPlaying && currentIdx === idx;
                return (
                  <div
                    key={wp.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition ${
                      isCurrent
                        ? 'bg-cyan-950/40 border-cyan-400 text-cyan-100 shadow-sm'
                        : 'bg-dark-850 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-dark-900 border border-slate-700 flex items-center justify-center font-mono text-[10px] text-slate-400 shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">{wp.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          [{wp.endEffector.map((c) => c.toFixed(2)).join(', ')}]
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => reorderWaypoints(idx, idx - 1)}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1 text-slate-500 hover:text-white disabled:opacity-20"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => reorderWaypoints(idx, idx + 1)}
                        disabled={idx === waypoints.length - 1}
                        title="Move Down"
                        className="p-1 text-slate-500 hover:text-white disabled:opacity-20"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeWaypoint(wp.id)}
                        title="Delete Waypoint"
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
