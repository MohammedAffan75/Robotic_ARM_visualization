import React from 'react';
import { useArmStore } from '../../store/armStore';
import { useUIStore } from '../../store/uiStore';
import { getArmDefinition, ARM_TYPES } from '../../core/arms';
import { Columns } from 'lucide-react';

export const ComparePanel: React.FC = () => {
  const primaryType = useArmStore((s) => s.armType);
  const primaryJoints = useArmStore((s) => s.joints);
  const primaryParams = useArmStore((s) => s.parameters);
  const primarySingularity = useArmStore((s) => s.singularityInfo);
  const target = useArmStore((s) => s.target);

  const compareType = useUIStore((s) => s.compareArmType);
  const setCompareType = useUIStore((s) => s.setCompareArmType);

  const primaryDef = getArmDefinition(primaryType);
  const secondaryDef = getArmDefinition(compareType);

  const primarySpecs = primaryDef.specs(primaryParams);
  const secondarySpecs = secondaryDef.specs(secondaryDef.defaultParameters);

  // Compute secondary arm IK and singularity for the shared target
  const secIkSols = secondaryDef.ik(target, secondaryDef.defaultParameters);
  const secSol = secIkSols.find((s) => s.valid) || secIkSols[0];
  const secJoints: [number, number, number] = secSol
    ? [secSol.joints[0], secSol.joints[1], secSol.joints[2]]
    : [secondaryDef.joints[0].defaultVal, secondaryDef.joints[1].defaultVal, secondaryDef.joints[2].defaultVal];
  const secSingularity = secondaryDef.singularityCheck(secJoints, secondaryDef.defaultParameters);

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-slate-800 text-slate-100 select-none">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Columns className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Side-by-Side Arm Comparison
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Comparison Type Selectors */}
        <div className="p-3 rounded-xl bg-dark-850 border border-slate-800 space-y-2">
          <div className="text-xs text-slate-400">Select Secondary Robot to Compare:</div>
          <div className="grid grid-cols-2 gap-1.5">
            {ARM_TYPES.filter((t) => t !== primaryType).map((t) => {
              const d = getArmDefinition(t);
              const isSelected = compareType === t;
              return (
                <button
                  key={t}
                  onClick={() => setCompareType(t)}
                  className={`p-2 rounded-lg text-xs font-medium text-left border transition ${
                    isSelected
                      ? 'bg-purple-950/60 border-purple-500 text-purple-200 font-bold'
                      : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="truncate">{d.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{d.jointSequence}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Position Readout */}
        <div className="p-2.5 rounded-lg bg-dark-850 border border-slate-800 text-xs font-mono flex items-center justify-between">
          <span className="text-slate-400">Shared Target TCP:</span>
          <span className="text-cyan-400 font-bold">
            [{target.map((c) => c.toFixed(2)).join(', ')}] m
          </span>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Primary Arm Card */}
          <div className="p-3 rounded-xl bg-dark-850 border border-cyan-500/30 space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400">
                Primary Arm
              </span>
              <h3 className="text-xs font-bold text-slate-100 truncate">{primaryDef.name}</h3>
              <span className="text-[10px] font-mono text-slate-400">{primaryDef.jointSequence}</span>
            </div>

            {/* Reach & Volume */}
            <div className="space-y-1 text-xs font-mono">
              <div className="text-[10px] text-slate-500">Max Reach:</div>
              <div className="text-slate-200 font-semibold">{primarySpecs.maxReach.toFixed(2)} m</div>
              <div className="text-[10px] text-slate-500">Volume:</div>
              <div className="text-slate-200 font-semibold">{primarySpecs.approxVolume.toFixed(2)} m³</div>
            </div>

            {/* Joint Values for Target */}
            <div className="space-y-1 text-[11px] font-mono border-t border-slate-800 pt-2">
              <div className="text-[10px] text-slate-500">Joint Solution:</div>
              {primaryDef.joints.map((j, i) => (
                <div key={j.id} className="text-slate-300">
                  {j.symbol}: {primaryJoints[i].toFixed(1)}{j.unit}
                </div>
              ))}
            </div>

            {/* Manipulability */}
            <div className="border-t border-slate-800 pt-2">
              <div className="text-[10px] text-slate-500">Manipulability w:</div>
              <div className="text-sm font-bold font-mono text-cyan-400">
                {primarySingularity.manipulability.toFixed(3)}
              </div>
            </div>
          </div>

          {/* Secondary Arm Card */}
          <div className="p-3 rounded-xl bg-dark-850 border border-purple-500/30 space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400">
                Secondary Arm
              </span>
              <h3 className="text-xs font-bold text-slate-100 truncate">{secondaryDef.name}</h3>
              <span className="text-[10px] font-mono text-slate-400">{secondaryDef.jointSequence}</span>
            </div>

            {/* Reach & Volume */}
            <div className="space-y-1 text-xs font-mono">
              <div className="text-[10px] text-slate-500">Max Reach:</div>
              <div className="text-slate-200 font-semibold">{secondarySpecs.maxReach.toFixed(2)} m</div>
              <div className="text-[10px] text-slate-500">Volume:</div>
              <div className="text-slate-200 font-semibold">{secondarySpecs.approxVolume.toFixed(2)} m³</div>
            </div>

            {/* Joint Values for Target */}
            <div className="space-y-1 text-[11px] font-mono border-t border-slate-800 pt-2">
              <div className="text-[10px] text-slate-500">Joint Solution:</div>
              {secondaryDef.joints.map((j, i) => (
                <div key={j.id} className="text-slate-300">
                  {j.symbol}: {secJoints[i].toFixed(1)}{j.unit}
                </div>
              ))}
            </div>

            {/* Manipulability */}
            <div className="border-t border-slate-800 pt-2">
              <div className="text-[10px] text-slate-500">Manipulability w:</div>
              <div className="text-sm font-bold font-mono text-purple-400">
                {secSingularity.manipulability.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
