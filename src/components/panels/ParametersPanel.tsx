import React from 'react';
import { useArmStore } from '../../store/armStore';
import { useUIStore } from '../../store/uiStore';
import { getArmDefinition } from '../../core/arms';
import { NumberInput } from '../ui/NumberInput';
import { Sliders, RotateCcw, Ruler } from 'lucide-react';

export const ParametersPanel: React.FC = () => {
  const armType = useArmStore((s) => s.armType);
  const parameters = useArmStore((s) => s.parameters);
  const setParameter = useArmStore((s) => s.setParameter);
  const setParameters = useArmStore((s) => s.setParameters);

  const unitSystem = useUIStore((s) => s.unitSystem);
  const setUnitSystem = useUIStore((s) => s.setUnitSystem);

  const armDef = getArmDefinition(armType);

  const handleResetParameters = () => {
    setParameters({ ...armDef.defaultParameters });
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-slate-800 text-slate-100 select-none">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Geometric Parameters
          </h2>
        </div>
        <button
          onClick={handleResetParameters}
          title="Reset to arm default dimensions"
          className="flex items-center gap-1 px-2 py-1 bg-dark-850 hover:bg-dark-800 border border-slate-800 rounded text-[11px] text-slate-400 hover:text-white transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Defaults</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Unit System Selection */}
        <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Ruler className="w-3.5 h-3.5 text-cyan-400" />
            <span>Measurement Units</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {(['deg/m', 'rad/m', 'deg/cm', 'deg/mm'] as const).map((unit) => (
              <button
                key={unit}
                onClick={() => setUnitSystem(unit)}
                className={`py-1.5 px-2 rounded-lg font-mono text-xs transition ${
                  unitSystem === unit
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-dark-900 text-slate-400 hover:bg-dark-800 hover:text-white'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Arm Parameter Inputs */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800/80">
            {armDef.name} Dimensions
          </div>

          {armDef.parameterDefs.map((p) => {
            const currentVal = parameters[p.id] ?? p.value;
            return (
              <div key={p.id} className="space-y-1">
                <NumberInput
                  label={p.name}
                  value={currentVal}
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  unit={p.unit}
                  onChange={(newVal) => setParameter(p.id, newVal)}
                />
                <p className="text-[10px] text-slate-500 px-1">{p.description}</p>
              </div>
            );
          })}
        </div>

        {/* Joint Limits Configuration */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800/80">
            Joint Hard Limits
          </div>

          {armDef.joints.map((j) => (
            <div
              key={j.id}
              className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="font-mono text-cyan-400 font-bold bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800 text-[10px]">
                    {j.symbol}
                  </span>
                  {j.name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  [{j.min}, {j.max}] {j.unit}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumberInput
                  label="Min Limit"
                  value={j.min}
                  unit={j.unit}
                  disabled
                  onChange={() => {}}
                />
                <NumberInput
                  label="Max Limit"
                  value={j.max}
                  unit={j.unit}
                  disabled
                  onChange={() => {}}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
