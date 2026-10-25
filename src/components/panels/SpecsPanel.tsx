import React, { useState } from 'react';
import { useArmStore } from '../../store/armStore';
import { getArmDefinition, ARM_TYPES } from '../../core/arms';
import { ARM_LIMITATIONS_DATA } from '../../core/specs/limitations';
import { generateSpecsJSON, generateSpecsMarkdown } from '../../core/specs/generator';
import { FileText, Download, AlertOctagon } from 'lucide-react';

export const SpecsPanel: React.FC = () => {
  const armType = useArmStore((s) => s.armType);
  const joints = useArmStore((s) => s.joints);
  const parameters = useArmStore((s) => s.parameters);

  const [compareView, setCompareView] = useState(false);

  const armDef = getArmDefinition(armType);
  const specs = armDef.specs(parameters);
  const limitations = ARM_LIMITATIONS_DATA[armType];

  const handleExport = (format: 'md' | 'json') => {
    const content = format === 'md'
      ? generateSpecsMarkdown(armDef, parameters)
      : generateSpecsJSON(armDef, parameters);
    const blob = new Blob([content], {
      type: format === 'md' ? 'text/markdown' : 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${armDef.id}-specs.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-slate-800 text-slate-100 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Specifications & Limitations
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCompareView(!compareView)}
            className={`px-2 py-1 rounded text-[11px] font-medium border transition ${
              compareView
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                : 'bg-dark-850 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Compare All
          </button>
          <button
            onClick={() => handleExport('md')}
            title="Export Spec Sheet as Markdown"
            className="flex items-center gap-1 px-2 py-1 bg-dark-850 hover:bg-dark-800 border border-slate-800 rounded text-[11px] text-slate-300 transition"
          >
            <Download className="w-3 h-3" />
            <span>MD</span>
          </button>
          <button
            onClick={() => handleExport('json')}
            title="Export Spec Sheet as JSON"
            className="flex items-center gap-1 px-2 py-1 bg-dark-850 hover:bg-dark-800 border border-slate-800 rounded text-[11px] text-slate-300 transition"
          >
            <Download className="w-3 h-3" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ================= COMPARE ALL ARMS VIEW ================= */}
        {compareView ? (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
              Comparative Analysis Across All 6 Manipulator Architectures
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-dark-850">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-dark-900 border-b border-slate-800 text-slate-400 font-mono">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Joints</th>
                    <th className="py-2.5 px-3">Workspace</th>
                    <th className="py-2.5 px-3">Singularities</th>
                    <th className="py-2.5 px-3">IK Sols</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {ARM_TYPES.map((t) => {
                    const d = getArmDefinition(t);
                    const sp = d.specs(d.defaultParameters);
                    const isSelected = t === armType;
                    return (
                      <tr
                        key={t}
                        className={`transition ${
                          isSelected
                            ? 'bg-cyan-950/30 text-cyan-200 font-bold border-l-2 border-cyan-400'
                            : 'hover:bg-dark-800/40 text-slate-400'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-semibold text-slate-200">
                          {d.name.split(' ')[0]}
                        </td>
                        <td className="py-2.5 px-3 text-cyan-400">{d.jointSequence}</td>
                        <td className="py-2.5 px-3 truncate max-w-[120px]">{sp.workspaceShape}</td>
                        <td className="py-2.5 px-3 truncate max-w-[140px] text-amber-400/90">
                          {sp.singularityConditions[0]}
                        </td>
                        <td className="py-2.5 px-3">{sp.ikSolutionCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {/* Live Joint Utilization Chips */}
            <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Active Joint Stroke & Limit Status</span>
                <span className="text-[10px] font-mono text-cyan-400">Live Feedback</span>
              </div>
              <div className="space-y-2">
                {armDef.joints.map((j, idx) => {
                  const val = joints[idx];
                  const range = j.max - j.min;
                  const pct = Math.min(100, Math.max(0, ((val - j.min) / range) * 100));
                  const isNear = val - j.min <= 5 || j.max - val <= 5;
                  const isAt = val <= j.min + 0.1 || val >= j.max - 0.1;

                  return (
                    <div key={j.id} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-300 font-medium">
                          {j.name} ({j.symbol}): {val.toFixed(1)}{j.unit}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            isAt
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : isNear
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {pct.toFixed(0)}% used {isAt ? '• HARD STOP' : isNear ? '• NEAR LIMIT' : '• OK'}
                        </span>
                      </div>
                      <div className="w-full bg-dark-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isAt ? 'bg-rose-500' : isNear ? 'bg-amber-400' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Specifications Grid */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800/80">
                Live Technical Specifications
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-dark-850 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Max Reach</div>
                  <div className="text-slate-200 font-bold">{specs.maxReach.toFixed(3)} m</div>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-850 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Inner Deadzone</div>
                  <div className="text-slate-200 font-bold">{specs.minReach.toFixed(3)} m</div>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-850 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Approx. Volume</div>
                  <div className="text-slate-200 font-bold">{specs.approxVolume.toFixed(3)} m³</div>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-850 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">IK Branches</div>
                  <div className="text-slate-200 font-bold">{specs.ikSolutionCount} Solution(s)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-850 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Rated Payload</div>
                  <div className="text-slate-200 font-bold">{specs.typicalPayloadKg} kg</div>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-850 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Repeatability</div>
                  <div className="text-slate-200 font-bold">±{specs.repeatabilityMm} mm</div>
                </div>
              </div>
            </div>

            {/* Architectural Limitations */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800/80 flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                <span>Architectural Limitations</span>
              </div>
              <div className="space-y-1.5">
                {limitations?.inherentLimitations.map((lim, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-dark-850 border border-slate-800/80 text-xs text-slate-300 leading-snug flex items-start gap-2"
                  >
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{lim}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Singularity Conditions */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800/80">
                Singularity Boundary Conditions
              </div>
              <div className="space-y-1.5">
                {specs.singularityConditions.map((cond, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/30 text-xs text-amber-200 leading-snug"
                  >
                    {cond}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
