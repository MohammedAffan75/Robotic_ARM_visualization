import React, { useState } from 'react';
import { useArmStore } from '../../store/armStore';
import { getArmDefinition } from '../../core/arms';
import { Slider } from '../ui/Slider';
import { NumberInput } from '../ui/NumberInput';
import { Compass, Move3d, CheckCircle2, AlertTriangle, ArrowUpDown, CornerUpRight } from 'lucide-react';
import { Vec3 } from '../../core/math/matrix';

export const ControlsPanel: React.FC = () => {
  const [subTab, setSubTab] = useState<'fk' | 'ik'>('fk');

  const armType = useArmStore((s) => s.armType);
  const joints = useArmStore((s) => s.joints);
  const target = useArmStore((s) => s.target);
  const ikSolutions = useArmStore((s) => s.ikSolutions);
  const selectedBranchIndex = useArmStore((s) => s.selectedBranchIndex);
  const setJoint = useArmStore((s) => s.setJoint);
  const setTarget = useArmStore((s) => s.setTarget);
  const setSelectedBranchIndex = useArmStore((s) => s.setSelectedBranchIndex);

  const armDef = getArmDefinition(armType);

  const handleJogCartesian = (axis: 0 | 1 | 2, delta: number) => {
    const nextTarget: Vec3 = [...target];
    nextTarget[axis] += delta;
    setTarget(nextTarget, true);
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-slate-800 text-slate-100 select-none">
      {/* Sub-tab Switcher: FK vs IK */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex rounded-lg bg-dark-850 p-1 border border-slate-800">
          <button
            onClick={() => setSubTab('fk')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition ${
              subTab === 'fk'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Forward Kinematics</span>
          </button>
          <button
            onClick={() => setSubTab('ik')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition ${
              subTab === 'ik'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Move3d className="w-3.5 h-3.5" />
            <span>Inverse Kinematics</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ================= FORWARD KINEMATICS ================= */}
        {subTab === 'fk' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Joint Space Controls
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">
                {armDef.jointSequence}
              </span>
            </div>

            {armDef.joints.map((j, idx) => {
              const val = joints[idx];
              const range = j.max - j.min;
              const threshold = j.type === 'R' ? 5 : range * 0.05;
              const isNearLimit = val - j.min <= threshold || j.max - val <= threshold;
              const isAtLimit = val <= j.min + 1e-4 || val >= j.max - 1e-4;

              return (
                <div
                  key={j.id}
                  className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-1 hover:border-slate-700 transition"
                >
                  <Slider
                    label={j.name}
                    symbol={j.symbol}
                    value={val}
                    min={j.min}
                    max={j.max}
                    step={j.step}
                    unit={j.unit}
                    onChange={(newVal) => setJoint(idx, newVal)}
                    isNearLimit={isNearLimit}
                    isAtLimit={isAtLimit}
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{j.type === 'R' ? 'Revolute Angle' : 'Prismatic Stroke'}</span>
                    <span className="font-mono text-slate-300">
                      Axis: {j.axis.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= INVERSE KINEMATICS ================= */}
        {subTab === 'ik' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Cartesian Target Coordinates
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Units: meters</span>
            </div>

            {/* Target Coordinate Inputs */}
            <div className="space-y-2">
              <NumberInput
                label="Target X"
                symbol="X"
                value={parseFloat(target[0].toFixed(3))}
                step={0.01}
                unit="m"
                onChange={(v) => handleJogCartesian(0, v - target[0])}
              />
              <NumberInput
                label="Target Y"
                symbol="Y"
                value={parseFloat(target[1].toFixed(3))}
                step={0.01}
                unit="m"
                onChange={(v) => handleJogCartesian(1, v - target[1])}
              />
              <NumberInput
                label="Target Z"
                symbol="Z"
                value={parseFloat(target[2].toFixed(3))}
                step={0.01}
                unit="m"
                onChange={(v) => handleJogCartesian(2, v - target[2])}
              />
            </div>

            {/* Cartesian Incremental Jog Buttons */}
            <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Incremental Jog (±20mm)</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                <button
                  onClick={() => handleJogCartesian(0, -0.02)}
                  className="p-1.5 bg-dark-900 border border-slate-700 rounded hover:bg-dark-750 text-slate-300 hover:text-white"
                >
                  -X
                </button>
                <button
                  onClick={() => handleJogCartesian(1, 0.02)}
                  className="p-1.5 bg-dark-900 border border-slate-700 rounded hover:bg-dark-750 text-slate-300 hover:text-white"
                >
                  +Y
                </button>
                <button
                  onClick={() => handleJogCartesian(0, 0.02)}
                  className="p-1.5 bg-dark-900 border border-slate-700 rounded hover:bg-dark-750 text-slate-300 hover:text-white"
                >
                  +X
                </button>
                <button
                  onClick={() => handleJogCartesian(2, -0.02)}
                  className="p-1.5 bg-dark-900 border border-slate-700 rounded hover:bg-dark-750 text-slate-300 hover:text-white"
                >
                  -Z
                </button>
                <button
                  onClick={() => handleJogCartesian(1, -0.02)}
                  className="p-1.5 bg-dark-900 border border-slate-700 rounded hover:bg-dark-750 text-slate-300 hover:text-white"
                >
                  -Y
                </button>
                <button
                  onClick={() => handleJogCartesian(2, 0.02)}
                  className="p-1.5 bg-dark-900 border border-slate-700 rounded hover:bg-dark-750 text-slate-300 hover:text-white"
                >
                  +Z
                </button>
              </div>
            </div>

            {/* IK Solutions & Branches */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>IK Solution Branches</span>
                <span className="text-[11px] text-cyan-400 font-mono">
                  {ikSolutions.length} Branch{ikSolutions.length > 1 ? 'es' : ''}
                </span>
              </div>

              <div className="space-y-2">
                {ikSolutions.map((sol, idx) => {
                  const isSelected = selectedBranchIndex === idx;
                  return (
                    <button
                      key={sol.branchName + idx}
                      onClick={() => setSelectedBranchIndex(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        isSelected
                          ? sol.valid
                            ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-100 shadow-sm'
                            : 'bg-rose-950/40 border-rose-500/60 text-rose-100'
                          : 'bg-dark-850 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <CornerUpRight className="w-3.5 h-3.5" />
                          {sol.branchName}
                        </span>
                        {sol.valid ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-rose-400 font-mono">
                            <AlertTriangle className="w-3 h-3" /> Error
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                        <span>q₁: {sol.joints[0].toFixed(1)}</span>
                        <span>q₂: {sol.joints[1].toFixed(1)}</span>
                        <span>q₃: {sol.joints[2].toFixed(1)}</span>
                      </div>

                      {sol.errorNorm !== undefined && (
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          FK residual error: {(sol.errorNorm * 1000).toFixed(2)} mm
                        </div>
                      )}

                      {sol.violations.length > 0 && (
                        <div className="mt-2 text-[10px] text-rose-300 space-y-0.5">
                          {sol.violations.map((v, i) => (
                            <div key={i}>• {v}</div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
