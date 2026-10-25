import React from 'react';

interface NumberInputProps {
  label: string;
  symbol?: string;
  value: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  label,
  symbol,
  value,
  step = 0.01,
  unit = 'm',
  onChange,
  min,
  max,
  disabled = false
}) => {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-dark-850/80 border border-slate-800 hover:border-slate-700 transition">
      <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
        {symbol && (
          <span className="font-mono text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40 text-[11px]">
            {symbol}
          </span>
        )}
        {label}
      </span>

      <div className="flex items-center gap-1 font-mono text-xs">
        <input
          type="number"
          value={isNaN(value) ? '' : value}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(e) => {
            const num = parseFloat(e.target.value);
            if (!isNaN(num)) onChange(num);
          }}
          className="w-20 px-2 py-1 rounded bg-dark-900 border border-slate-700 text-right text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
        />
        <span className="text-slate-400 text-[11px] w-6">{unit}</span>
      </div>
    </div>
  );
};
