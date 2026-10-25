import { create } from 'zustand';
import { ArmTypeId } from '../core/arms/types';

export type CameraPreset = 'front' | 'side' | 'top' | 'iso' | 'followEE';
export type UnitSystem = 'deg/m' | 'rad/m' | 'deg/cm' | 'deg/mm';

interface OverlaysConfig {
  jointFrames: boolean;
  angleArcs: boolean;
  linkLabels: boolean;
  workspaceCloud: boolean;
  trailLine: boolean;
  jointLimitRings: boolean;
  motionArrows: boolean;
  gridFloor: boolean;
}

interface UIState {
  activeTab: 'fk' | 'ik' | 'params' | 'dh' | 'data' | 'specs' | 'learn' | 'compare' | 'waypoints' | 'logs';
  cameraPreset: CameraPreset;
  cameraTrigger: number; // incremented to signal camera rig to animate
  comparisonMode: boolean;
  compareArmType: ArmTypeId;
  overlays: OverlaysConfig;
  unitSystem: UnitSystem;
  panelsCollapsed: {
    left: boolean;
    right: boolean;
    bottom: boolean;
  };
  helpModalOpen: boolean;
  onboardingOpen: boolean;

  setActiveTab: (tab: UIState['activeTab']) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setComparisonMode: (enabled: boolean) => void;
  setCompareArmType: (type: ArmTypeId) => void;
  toggleOverlay: (key: keyof OverlaysConfig) => void;
  setOverlay: (key: keyof OverlaysConfig, val: boolean) => void;
  setUnitSystem: (units: UnitSystem) => void;
  togglePanel: (panel: 'left' | 'right' | 'bottom') => void;
  setHelpModalOpen: (open: boolean) => void;
  setOnboardingOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'fk',
  cameraPreset: 'iso',
  cameraTrigger: 0,
  comparisonMode: false,
  compareArmType: 'scara',
  overlays: {
    jointFrames: true,
    angleArcs: true,
    linkLabels: true,
    workspaceCloud: false,
    trailLine: true,
    jointLimitRings: true,
    motionArrows: true,
    gridFloor: true
  },
  unitSystem: 'deg/m',
  panelsCollapsed: {
    left: false,
    right: false,
    bottom: false
  },
  helpModalOpen: false,
  onboardingOpen: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setCameraPreset: (cameraPreset) =>
    set((state) => ({ cameraPreset, cameraTrigger: state.cameraTrigger + 1 })),
  setComparisonMode: (comparisonMode) => set({ comparisonMode }),
  setCompareArmType: (compareArmType) => set({ compareArmType }),
  toggleOverlay: (key) =>
    set((state) => ({
      overlays: { ...state.overlays, [key]: !state.overlays[key] }
    })),
  setOverlay: (key, val) =>
    set((state) => ({
      overlays: { ...state.overlays, [key]: val }
    })),
  setUnitSystem: (unitSystem) => set({ unitSystem }),
  togglePanel: (panel) =>
    set((state) => ({
      panelsCollapsed: {
        ...state.panelsCollapsed,
        [panel]: !state.panelsCollapsed[panel]
      }
    })),
  setHelpModalOpen: (helpModalOpen) => set({ helpModalOpen }),
  setOnboardingOpen: (onboardingOpen) => set({ onboardingOpen })
}));
