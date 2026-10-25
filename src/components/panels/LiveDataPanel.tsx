import React from 'react';
import { useArmStore } from '../../store/armStore';
import { getArmDefinition } from '../../core/arms';
import { useRollingBuffer } from '../../hooks/useRollingBuffer';
import { Activity, Gauge, Zap, TrendingUp, Crosshair } from 'lucide-react';

export const LiveDataPanel: React.FC = () => {
  const armType = useArmStore((s) => s.armType);
  const joints = useArmStore((s) => s.joints);
  const parameters = useArmStore((s) => s.parameters);
  const fkResult = useArmStore((s) => s.fkResult);
  const jacobian = useArmStore((s) => s.jacobianMatrix);
  const singularity = useArmStore((s) => s.singularityInfo);

  const armDef = getArmDefinition(armType);
  const specs = armDef.specs(parameters);
  const telemetryData = useRollingBuffer(10, 10);

  const ee = fkResult.endEffector;
  const currentReach = Math.sqrt(ee[0] * ee[0] + ee[1] * ee[1] + ee[2] * ee[2]);
  const reachPercentage = Math.min(100, Math.max(0, (currentReach / Math.max(0.1, specs.maxReach)) * 100));

  const latestSpeed = telemetryData.length > 0 ? telemetryData[telemetryData.length - 1].speed : 0;

  // Simple, ultra-fast canvas/SVG plot renderer
  const renderMiniChart = (
    data: number[],
    color: string,
    minVal: number,
    maxVal: number
  ) => {
    if (data.length < 2) {
      return (
        <div className="h-16 flex items-center justify-center text-[10px] text-slate-500 font-mono">
          Sampling buffer...
        </div>
      );
    }

    const range = Math.max(0.01, maxVal - minVal);
    const width = 280;
    const height = 64;

    const pointsStr = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const normY = Math.min(1, Math.max(0, (val - minVal) / range));
        const y = height - normY * (height - 8) - 4;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg className="w-full h-16 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsStr}
        />
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-slate-800 text-slate-100 select-none">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Real-Time Kinematic Telemetry
          </h2>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live 20Hz
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Reach Percentage */}
          <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Reach %
              </span>
              <span className="font-mono text-[10px]">{currentReach.toFixed(2)}m</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-100">
              {reachPercentage.toFixed(1)}%
            </div>
            <div className="w-full bg-dark-800 h-1 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  reachPercentage > 95 ? 'bg-rose-500' : 'bg-cyan-400'
                }`}
                style={{ width: `${reachPercentage}%` }}
              />
            </div>
          </div>

          {/* Manipulability Index */}
          <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Manipulability
              </span>
              <span className="font-mono text-[10px]">w = |det J|</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-100">
              {singularity.manipulability.toFixed(4)}
            </div>
            <div className="w-full bg-dark-800 h-1 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  singularity.isSingular ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${singularity.distanceToSingularity * 100}%` }}
              />
            </div>
          </div>

          {/* Current Speed */}
          <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Tool Speed
              </span>
              <span className="font-mono text-[10px]">m/s</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-100">
              {latestSpeed.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Rated: {specs.maxToolSpeedMs} m/s
            </div>
          </div>

          {/* Jacobian Determinant */}
          <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-purple-400" /> det(Jacobian)
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-100">
              {singularity.determinant.toFixed(4)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono truncate">
              {singularity.isSingular ? '⚠️ Near Singularity' : 'Condition Normal'}
            </div>
          </div>
        </div>

        {/* 3x3 Jacobian Matrix Display */}
        <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Velocity Jacobian Matrix [J]</span>
            <span className="text-[10px] font-mono text-slate-400">v_ee = J · q̇</span>
          </div>
          <div className="grid grid-cols-3 gap-1 font-mono text-xs text-center">
            {jacobian.map((row, r) =>
              row.map((val, c) => (
                <div
                  key={`j-${r}-${c}`}
                  className="p-1.5 bg-dark-900 border border-slate-800 rounded text-slate-200"
                >
                  {val.toFixed(2)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Rolling Plots (10-second history) */}
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800/80">
            10-Second Rolling Telemetry
          </div>

          {/* Joint 1 vs Time */}
          <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="text-sky-400">{armDef.joints[0].name} ({armDef.joints[0].symbol})</span>
              <span className="font-mono text-xs text-slate-300">
                {joints[0].toFixed(1)}{armDef.joints[0].unit}
              </span>
            </div>
            {renderMiniChart(
              telemetryData.map((d) => d.q1),
              '#38bdf8',
              armDef.joints[0].min,
              armDef.joints[0].max
            )}
          </div>

          {/* Joint 2 vs Time */}
          <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="text-teal-400">{armDef.joints[1].name} ({armDef.joints[1].symbol})</span>
              <span className="font-mono text-xs text-slate-300">
                {joints[1].toFixed(1)}{armDef.joints[1].unit}
              </span>
            </div>
            {renderMiniChart(
              telemetryData.map((d) => d.q2),
              '#14b8a6',
              armDef.joints[1].min,
              armDef.joints[1].max
            )}
          </div>

          {/* Joint 3 vs Time */}
          <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="text-purple-400">{armDef.joints[2].name} ({armDef.joints[2].symbol})</span>
              <span className="font-mono text-xs text-slate-300">
                {joints[2].toFixed(1)}{armDef.joints[2].unit}
              </span>
            </div>
            {renderMiniChart(
              telemetryData.map((d) => d.q3),
              '#a855f7',
              armDef.joints[2].min,
              armDef.joints[2].max
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
