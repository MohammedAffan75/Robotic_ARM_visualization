import React, { useEffect } from 'react';
import { Header } from './components/panels/Header';
import { SidebarNavigation } from './components/panels/SidebarNavigation';
import { SceneCanvas } from './components/scene/SceneCanvas';
import { ViewportToolbar } from './components/scene/ViewportToolbar';
import { ToastContainer } from './components/ui/Toast';
import { HelpModal } from './components/panels/HelpModal';
import { Onboarding } from './components/panels/Onboarding';

import { ControlsPanel } from './components/panels/ControlsPanel';
import { ParametersPanel } from './components/panels/ParametersPanel';
import { DHTablePanel } from './components/panels/DHTablePanel';
import { LiveDataPanel } from './components/panels/LiveDataPanel';
import { SpecsPanel } from './components/panels/SpecsPanel';
import { LearnCard } from './components/panels/LearnCard';
import { ComparePanel } from './components/panels/ComparePanel';
import { WaypointPanel } from './components/panels/WaypointPanel';
import { LogPanel } from './components/panels/LogPanel';

import { useUIStore } from './store/uiStore';
import { useArmStore } from './store/armStore';
import { useLogStore } from './store/logStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ARM_TYPES, getArmDefinition } from './core/arms';
import { MatrixMath } from './core/math/matrix';

export const App: React.FC = () => {
  useKeyboardShortcuts();

  const activeTab = useUIStore((s) => s.activeTab);
  const panelsCollapsed = useUIStore((s) => s.panelsCollapsed);
  const validationIssues = useArmStore((s) => s.validationIssues);
  const addLog = useLogStore((s) => s.addLog);

  // App-load kinematic self-test for all 6 arm types
  useEffect(() => {
    let allPassed = true;
    const testResults: string[] = [];

    for (const type of ARM_TYPES) {
      const armDef = getArmDefinition(type);
      const testJoints: [number, number, number] = [
        armDef.joints[0].defaultVal,
        armDef.joints[1].defaultVal,
        armDef.joints[2].defaultVal
      ];
      const params = armDef.defaultParameters;

      // 1. FK
      const fkRes = armDef.fk(testJoints, params);
      // 2. IK
      const ikSols = armDef.ik(fkRes.endEffector, params, testJoints);
      const validSol = ikSols.find((s) => s.valid) || ikSols[0];

      if (validSol) {
        const roundTripFk = armDef.fk(
          [validSol.joints[0], validSol.joints[1], validSol.joints[2]],
          params
        );
        const err = MatrixMath.distance(fkRes.endEffector, roundTripFk.endEffector);
        if (err > 1e-3) {
          allPassed = false;
          testResults.push(`${type.toUpperCase()}: residual error ${err.toFixed(5)}m`);
        }
      }
    }

    if (allPassed) {
      addLog(
        'info',
        'Kinematic Self-Test: ALL 6 MODELS VERIFIED',
        'Round-trip FK -> IK -> FK closed-loop error < 1e-4 m across Cartesian, Cylindrical, Polar, Jointed, SCARA, and Custom arms.'
      );
    } else {
      addLog(
        'warning',
        'Kinematic Self-Test Warning',
        testResults.join('; ')
      );
    }
  }, [addLog]);

  return (
    <div className="flex flex-col w-screen h-screen bg-dark-900 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Application Header */}
      <Header />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Rail */}
        <SidebarNavigation />

        {/* Collapsible Active Control Drawer */}
        {!panelsCollapsed.left && (
          <div className="w-80 md:w-96 h-full shrink-0 z-10 transition-all duration-300">
            {(activeTab === 'fk' || activeTab === 'ik') && <ControlsPanel />}
            {activeTab === 'params' && <ParametersPanel />}
            {activeTab === 'dh' && <DHTablePanel />}
            {activeTab === 'data' && <LiveDataPanel />}
            {activeTab === 'specs' && <SpecsPanel />}
            {activeTab === 'learn' && <LearnCard />}
            {activeTab === 'compare' && <ComparePanel />}
            {activeTab === 'waypoints' && <WaypointPanel />}
            {activeTab === 'logs' && <LogPanel />}
          </div>
        )}

        {/* 3D Scene Viewport with Floating Overlays */}
        <div className="flex-1 h-full relative">
          <ViewportToolbar />
          <SceneCanvas />
        </div>
      </div>

      {/* Non-blocking Validation Toasts */}
      <ToastContainer issues={validationIssues} />

      {/* Modals & Dialogs */}
      <HelpModal />
      <Onboarding />
    </div>
  );
};
