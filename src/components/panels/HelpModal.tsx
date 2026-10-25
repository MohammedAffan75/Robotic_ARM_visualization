import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { X, Keyboard, Cpu, HelpCircle } from 'lucide-react';

export const HelpModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.helpModalOpen);
  const setIsOpen = useUIStore((s) => s.setHelpModalOpen);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'H', desc: 'Return robot arm to Home pose' },
    { key: 'R', desc: 'Generate a random reachable pose' },
    { key: 'Space', desc: 'Play / Pause waypoint trajectory' },
    { key: 'Ctrl + Z', desc: 'Undo pose or parameter change' },
    { key: 'Ctrl + Y', desc: 'Redo pose or parameter change' },
    { key: '1', desc: 'Camera: Front orthogonal view' },
    { key: '2', desc: 'Camera: Side profile view' },
    { key: '3', desc: 'Camera: Top-down plan view' },
    { key: '4', desc: 'Camera: Isometric perspective' },
    { key: '5', desc: 'Camera: Follow End-Effector (TCP)' },
    { key: '?', desc: 'Toggle this keyboard shortcuts & help guide' }
  ];

  const concepts = [
    {
      term: 'Denavit-Hartenberg (DH)',
      definition:
        'Standard convention utilizing 4 parameters (θ, d, a, α) per link to represent 4×4 spatial transformations between robotic joints.'
    },
    {
      term: 'Kinematic Singularity',
      definition:
        'Postures where the Jacobian matrix loses full rank (det(J) → 0). The robot loses one or more degrees of freedom in Cartesian space and demands infinite joint speeds for infinitesimal end-effector motion.'
    },
    {
      term: 'Manipulability Index (w)',
      definition:
        'Yoshikawa’s metric w = |det(J)| quantifying the kinematic dexterity and isotropic velocity transmission from joint space to Cartesian space.'
    },
    {
      term: 'Damped Least Squares (DLS)',
      definition:
        'Levenberg-Marquardt numerical inversion J_dls = J^T (J J^T + λ² I)^(-1) allowing robust numerical IK convergence through and near singularities without wild unbounded velocities.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-dark-850 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              RoboKin User Manual & Shortcuts
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Keyboard Shortcuts */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-800">
              <Keyboard className="w-4 h-4 text-cyan-400" />
              <span>Keyboard Shortcuts</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {shortcuts.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-dark-900 border border-slate-800"
                >
                  <span className="text-slate-400">{s.desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-dark-800 border border-slate-700 text-cyan-400 font-mono text-[11px] font-bold">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Core Robotics Concepts */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-800">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Key Robotics Kinematic Concepts</span>
            </h4>
            <div className="space-y-2">
              {concepts.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-dark-900 border border-slate-800 space-y-1"
                >
                  <div className="font-bold text-cyan-300">{c.term}</div>
                  <p className="text-slate-400 leading-relaxed">{c.definition}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-dark-900 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
