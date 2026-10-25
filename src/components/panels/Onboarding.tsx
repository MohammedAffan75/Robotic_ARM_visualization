import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { Sparkles, ArrowRight, ArrowLeft, Check, Compass, Cpu, Move3d } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const isOpen = useUIStore((s) => s.onboardingOpen);
  const setIsOpen = useUIStore((s) => s.setOnboardingOpen);

  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to RoboKin 3-DOF Simulator',
      desc: 'An advanced, high-precision robotics simulator built with Three.js, React Three Fiber, and strict numerical kinematics. Explore forward & inverse kinematics, DH transforms, and velocity singularities.',
      icon: Cpu
    },
    {
      title: '6 Real Industrial Arm Architectures',
      desc: 'Switch between Cartesian (P-P-P), Cylindrical (R-P-P), Polar (R-R-P), Jointed Anthropomorphic (R-R-R), SCARA (R-R-P), and fully Custom 3-DOF arms with a single click in the top bar.',
      icon: Compass
    },
    {
      title: 'Interactive 3D Gizmo & Real-Time IK',
      desc: 'Drag the 3D target sphere in space using the translation gizmo. The inverse kinematics engine automatically computes all valid kinematic branches (Elbow Up/Down, Lefty/Righty). Target turns red when unreachable or within an inner dead zone.',
      icon: Move3d
    },
    {
      title: 'Trajectory Sequencer & Live Plots',
      desc: 'Record arm poses, play back smooth trajectories in joint space or Cartesian space, monitor velocity Jacobian determinants, and export datasets directly to CSV or JSON.',
      icon: Sparkles
    }
  ];

  const current = steps[step];
  const Icon = current.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setIsOpen(false);
      setStep(0);
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-dark-850 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Icon className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Step {step + 1} of {steps.length}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-bold text-slate-100">{current.title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{current.desc}</p>
        </div>

        {/* Step Indicator dots */}
        <div className="flex items-center gap-1.5 pt-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                step === i ? 'w-6 bg-cyan-400' : 'w-2 bg-dark-700'
              }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20"
          >
            <span>{step === steps.length - 1 ? 'Get Started' : 'Next'}</span>
            {step === steps.length - 1 ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
