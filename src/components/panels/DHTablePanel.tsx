import React, { useState } from 'react';
import { useArmStore } from '../../store/armStore';
import { getArmDefinition } from '../../core/arms';
import { Table, Layers } from 'lucide-react';
import { Mat4 } from '../../core/math/matrix';

export const DHTablePanel: React.FC = () => {
  const armType = useArmStore((s) => s.armType);
  const joints = useArmStore((s) => s.joints);
  const parameters = useArmStore((s) => s.parameters);
  const fkResult = useArmStore((s) => s.fkResult);

  const [selectedTransformIdx, setSelectedTransformIdx] = useState<number>(3);

  const armDef = getArmDefinition(armType);
  const dhRows = armDef.dhTable(joints, parameters);

  const renderMatrix4x4 = (m: Mat4) => {
    return (
      <div className="grid grid-cols-4 gap-1 p-2 bg-dark-900 rounded-lg border border-slate-800 font-mono text-[11px] text-center">
        {m.map((row, r) =>
          row.map((val, c) => {
            const isTranslation = c === 3 && r < 3;
            return (
              <div
                key={`${r}-${c}`}
                className={`p-1.5 rounded ${
                  isTranslation
                    ? 'bg-cyan-950/40 text-cyan-300 font-semibold border border-cyan-800/40'
                    : 'text-slate-300'
                }`}
              >
                {val.toFixed(3)}
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-slate-800 text-slate-100 select-none">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Denavit-Hartenberg (DH) Parameters
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-850 text-slate-400 border border-slate-800">
          Standard Convention
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* DH Parameter Table */}
        <div className="rounded-xl border border-slate-800 bg-dark-850 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-dark-900 border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Joint (i)</th>
                <th className="py-2.5 px-3">θᵢ (deg)</th>
                <th className="py-2.5 px-3">dᵢ (m)</th>
                <th className="py-2.5 px-3">aᵢ (m)</th>
                <th className="py-2.5 px-3">αᵢ (deg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono">
              {dhRows.map((row) => {
                const isThetaVar = row.variable === 'theta';
                const isDVar = row.variable === 'd';

                return (
                  <tr key={row.jointIndex} className="hover:bg-dark-800/50 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      J{row.jointIndex}
                    </td>
                    <td
                      className={`py-2.5 px-3 ${
                        isThetaVar
                          ? 'text-cyan-400 font-bold bg-cyan-950/20'
                          : 'text-slate-400'
                      }`}
                    >
                      {row.theta.toFixed(1)}°
                    </td>
                    <td
                      className={`py-2.5 px-3 ${
                        isDVar
                          ? 'text-cyan-400 font-bold bg-cyan-950/20'
                          : 'text-slate-400'
                      }`}
                    >
                      {row.d.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{row.a.toFixed(3)}</td>
                    <td className="py-2.5 px-3 text-slate-400">{row.alpha.toFixed(1)}°</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-2 bg-dark-900/50 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between px-3">
            <span>Highlighted cells indicate active joint variables</span>
            <span className="font-mono text-cyan-400">Tᵢ = Rot_z(θ) Trans_z(d) Trans_x(a) Rot_x(α)</span>
          </div>
        </div>

        {/* 4x4 Homogeneous Transformation Matrix Inspector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Transformation Matrices [T₀ᵢ]</span>
            </span>
          </div>

          <div className="flex rounded-lg bg-dark-850 p-1 border border-slate-800 text-xs font-mono">
            {['T₀₁', 'T₀₂', 'T₀₃', 'T₀_TCP'].map((label, idx) => (
              <button
                key={label}
                onClick={() => setSelectedTransformIdx(idx)}
                className={`flex-1 py-1 rounded transition text-center ${
                  selectedTransformIdx === idx
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {fkResult.transforms[selectedTransformIdx] && (
            <div className="space-y-2">
              {renderMatrix4x4(fkResult.transforms[selectedTransformIdx])}
              <div className="text-[10px] text-slate-400 flex items-center justify-between px-1 font-mono">
                <span>Left 3×3: Rotation matrix R</span>
                <span className="text-cyan-400">Right column: [X, Y, Z] position</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
