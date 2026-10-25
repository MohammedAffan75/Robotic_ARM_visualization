import React from 'react';

interface SliderProps {
  label: string;
  symbol?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (val: number) => void;
  isNearLimit?: boolean;
  isAtLimit?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  symbol,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
  isNearLimit = false,
  isAtLimit = false
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const trackColor = isAtLimit
    ? 'bg-rose-500'
    : isNearLimit
    ? 'bg-amber-500'
    : 'bg-cyan-500';

  return (
    <div className="flex flex-col gap-1.5 py-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300 flex items-center gap-1.5">
          {symbol && (
            <span className="font-mono text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
              {symbol}
            </span>
          )}
          {label}
        </span>
        <div className="flex items-center gap-1 font-mono text-xs">
          <input
            type="number"
            value={value}
            step={step}
            min={min}
            max={max}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              if (!isNaN(num)) onChange(num);
            }}
            className="w-16 px-1.5 py-0.5 rounded bg-dark-900 border border-slate-700 text-right text-slate-100 focus:outline-none focus:border-cyan-500"
          />
          <span className="text-slate-400 text-[11px] w-7">{unit}</span>
        </div>
      </div>

      <div className="relative flex items-center h-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
        />
        {/* Fill track highlight */}
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-l-lg pointer-events-none transition-all ${trackColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};
