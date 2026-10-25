import React, { Component, ErrorInfo, ReactNode, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Environment, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useArmStore } from '../../store/armStore';
import { useUIStore } from '../../store/uiStore';
import { getArmDefinition } from '../../core/arms';
import { Floor } from './Floor';
import { CameraRig } from './CameraRig';
import { ArmModel } from './ArmModel';
import { TargetGizmo } from './TargetGizmo';
import { TrailLine } from './TrailLine';
import { WorkspaceCloud } from './WorkspaceCloud';
import { ComparisonScene } from './ComparisonScene';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGL 3D Canvas Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-dark-900 text-slate-200 p-6 text-center">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-bold text-red-200 mb-1">WebGL Scene Encountered an Error</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              {this.state.error?.message || 'WebGL hardware context was lost or failed to compile shaders.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-red-500/20"
            >
              <RefreshCw className="w-4 h-4" /> Reload 3D Scene
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Fallback-safe Environment component for HDR reflections
 */
class EnvironmentErrorBoundary extends Component<{ children: ReactNode }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export const SceneCanvas: React.FC = () => {
  const armType = useArmStore((s) => s.armType);
  const joints = useArmStore((s) => s.joints);
  const parameters = useArmStore((s) => s.parameters);
  const fkResult = useArmStore((s) => s.fkResult);
  const target = useArmStore((s) => s.target);
  const worstSeverity = useArmStore((s) => s.worstSeverity);
  const setTarget = useArmStore((s) => s.setTarget);

  const overlays = useUIStore((s) => s.overlays);
  const comparisonMode = useUIStore((s) => s.comparisonMode);
  const armDef = getArmDefinition(armType);

  const status = worstSeverity === 'error' ? 'error' : worstSeverity === 'warning' ? 'warning' : 'ok';

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#0f172a] to-[#1e293b] overflow-hidden select-none">
      <CanvasErrorBoundary>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [4.5, -4.5, 3.2], fov: 45, up: [0, 0, 1] }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
            powerPreference: 'high-performance'
          }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
        >
          {/* Main Three-Point Studio Lighting */}
          <ambientLight intensity={0.6} />
          <hemisphereLight args={['#bcd4ff', '#1a1f2e', 0.7]} />
          <directionalLight
            position={[6, 10, 6]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-near={0.1}
            shadow-camera-far={40}
            shadow-camera-left={-8}
            shadow-camera-right={8}
            shadow-camera-top={8}
            shadow-camera-bottom={-8}
            shadow-bias={-0.0004}
          />
          <directionalLight position={[-6, 4, -4]} intensity={0.6} />

          {/* HDR Environment for PBR Reflections */}
          <EnvironmentErrorBoundary>
            <Suspense fallback={null}>
              <Environment preset="city" />
            </Suspense>
          </EnvironmentErrorBoundary>

          <Suspense fallback={null}>
            {/* Z-up Grid Floor & Shadow Plane */}
            {overlays.gridFloor && <Floor />}

            {/* Z-up Camera Orbit Controls with Auto-Fit */}
            <CameraRig />

            {/* 3D Robot Arm Model */}
            {comparisonMode ? (
              <ComparisonScene />
            ) : (
              <ArmModel
                armDef={armDef}
                joints={joints}
                parameters={parameters}
                fkResult={fkResult}
                overlays={overlays}
              />
            )}

            {/* Draggable Target Gizmo */}
            <TargetGizmo
              position={target}
              onChange={(newPos) => setTarget(newPos, true)}
              status={status}
            />

            {/* Trajectory Trail Line */}
            {overlays.trailLine && <TrailLine currentPos={fkResult.endEffector} />}

            {/* Workspace Point Cloud Boundary */}
            {overlays.workspaceCloud && (
              <WorkspaceCloud armDef={armDef} parameters={parameters} visible={true} />
            )}

            {/* Orientation Labeled Gizmo Helper in Z-up */}
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport
                axisColors={['#ef4444', '#22c55e', '#3b82f6']}
                labelColor="#ffffff"
                labels={['X', 'Y', 'Z']}
              />
            </GizmoHelper>
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
};
