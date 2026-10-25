import React from 'react';
import { useArmStore } from '../../store/armStore';
import { getArmDefinition } from '../../core/arms';
import { BookOpen, CheckCircle2, AlertTriangle, Cpu, FunctionSquare } from 'lucide-react';

export const LearnCard: React.FC = () => {
  const armType = useArmStore((s) => s.armType);
  const armDef = getArmDefinition(armType);
  const content = armDef.learnContent;

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-slate-800 text-slate-100 select-none">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Robotics Engineering Guide
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
          Theory & Math
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Header Title & Overview */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/40 via-dark-850 to-dark-850 border border-cyan-500/20 space-y-1.5">
          <h3 className="text-sm font-bold text-cyan-200">{content.title}</h3>
          <p className="text-xs font-medium text-cyan-400/90">{content.subtitle}</p>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {content.description}
          </p>
        </div>

        {/* Real-World Industrial Applications */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Industrial Applications</span>
          </div>
          <div className="space-y-1.5">
            {content.realWorldUses.map((use, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-dark-850 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2"
              >
                <span className="text-cyan-400 font-bold">•</span>
                <span>{use}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Advantages & Strengths */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Key Advantages</span>
          </div>
          <div className="space-y-1.5">
            {content.advantages.map((adv, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-dark-850 border border-emerald-950/30 text-xs text-slate-300 flex items-start gap-2"
              >
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{adv}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Architectural Limitations */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Kinematic Trade-Offs</span>
          </div>
          <div className="space-y-1.5">
            {content.limitations.map((lim, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-dark-850 border border-amber-950/30 text-xs text-slate-300 flex items-start gap-2"
              >
                <span className="text-amber-400 font-bold">⚠️</span>
                <span>{lim}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mathematical Formulation (LaTeX styled) */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            <FunctionSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Kinematic Derivation & Equations</span>
          </div>

          {/* Forward Kinematics Equations */}
          <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-1.5">
            <div className="text-xs font-semibold text-cyan-300">Forward Kinematics:</div>
            <div className="space-y-1 font-mono text-xs text-slate-200 bg-dark-900 p-2 rounded border border-slate-800">
              {content.equations.fk.map((eq, i) => (
                <div key={i}>{eq}</div>
              ))}
            </div>
          </div>

          {/* Inverse Kinematics Equations */}
          <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-1.5">
            <div className="text-xs font-semibold text-cyan-300">Inverse Kinematics:</div>
            <div className="space-y-1 font-mono text-xs text-slate-200 bg-dark-900 p-2 rounded border border-slate-800">
              {content.equations.ik.map((eq, i) => (
                <div key={i}>{eq}</div>
              ))}
            </div>
          </div>

          {/* Velocity Jacobian & Singularity Condition */}
          <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 space-y-1.5">
            <div className="text-xs font-semibold text-cyan-300">Jacobian & Determinant:</div>
            <div className="font-mono text-xs text-slate-200 bg-dark-900 p-2 rounded border border-slate-800 overflow-x-auto">
              {content.equations.jacobian}
            </div>
            <div className="text-[11px] text-amber-300/90 pt-1">
              Singularity Criterion:
            </div>
            <div className="font-mono text-xs text-amber-200 bg-amber-950/20 p-2 rounded border border-amber-800/30">
              {content.equations.singularities}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
