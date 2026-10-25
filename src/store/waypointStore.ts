import { create } from 'zustand';
import { WaypointData } from './schemas';
import { Vec3 } from '../core/math/matrix';

export type InterpolationMode = 'joint' | 'cartesian';

export interface CustomPreset {
  id: string;
  name: string;
  createdAt: number;
  waypoints: WaypointData[];
}

const CUSTOM_PRESETS_KEY = 'robokin_custom_presets';

function loadCustomPresetsFromStorage(): CustomPreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    return raw ? (JSON.parse(raw) as CustomPreset[]) : [];
  } catch {
    return [];
  }
}

function saveCustomPresetsToStorage(presets: CustomPreset[]): void {
  try {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
  } catch { /* quota exceeded — silently ignore */ }
}

interface WaypointState {
  waypoints: WaypointData[];
  isPlaying: boolean;
  currentPlaybackIndex: number;
  mode: InterpolationMode;
  loop: boolean;
  speedFactor: number; // 0.2 to 3.0
  customPresets: CustomPreset[];

  addWaypoint: (name: string, joints: [number, number, number], endEffector: Vec3) => void;
  removeWaypoint: (id: string) => void;
  reorderWaypoints: (fromIndex: number, toIndex: number) => void;
  clearWaypoints: () => void;
  setWaypoints: (waypoints: WaypointData[]) => void;

  setPlaying: (playing: boolean) => void;
  setCurrentIndex: (index: number) => void;
  setMode: (mode: InterpolationMode) => void;
  setLoop: (loop: boolean) => void;
  setSpeedFactor: (speed: number) => void;

  loadPreset: (type: 'pickAndPlace' | 'circle' | 'square', armType: string) => void;
  saveCustomPreset: (name: string) => void;
  loadCustomPreset: (id: string) => void;
  deleteCustomPreset: (id: string) => void;
  exportCSV: () => string;
}

export const useWaypointStore = create<WaypointState>((set, get) => ({
  waypoints: [],
  isPlaying: false,
  currentPlaybackIndex: 0,
  mode: 'joint',
  loop: true,
  speedFactor: 1.0,
  customPresets: loadCustomPresetsFromStorage(),

  addWaypoint: (name, joints, endEffector) =>
    set((state) => ({
      waypoints: [
        ...state.waypoints,
        {
          id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: name || `Waypoint ${state.waypoints.length + 1}`,
          joints: [joints[0], joints[1], joints[2]],
          endEffector: [endEffector[0], endEffector[1], endEffector[2]],
          timestamp: Date.now()
        }
      ]
    })),

  removeWaypoint: (id) =>
    set((state) => ({
      waypoints: state.waypoints.filter((w) => w.id !== id)
    })),

  reorderWaypoints: (fromIndex, toIndex) =>
    set((state) => {
      if (
        fromIndex < 0 ||
        fromIndex >= state.waypoints.length ||
        toIndex < 0 ||
        toIndex >= state.waypoints.length
      ) {
        return state;
      }
      const newWaypoints = [...state.waypoints];
      const [moved] = newWaypoints.splice(fromIndex, 1);
      newWaypoints.splice(toIndex, 0, moved);
      return { waypoints: newWaypoints };
    }),

  clearWaypoints: () => set({ waypoints: [], isPlaying: false, currentPlaybackIndex: 0 }),

  setWaypoints: (waypoints) => set({ waypoints, currentPlaybackIndex: 0 }),

  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentIndex: (currentPlaybackIndex) => set({ currentPlaybackIndex }),
  setMode: (mode) => set({ mode }),
  setLoop: (loop) => set({ loop }),
  setSpeedFactor: (speedFactor) => set({ speedFactor }),

  loadPreset: (presetType) => {
    // Standard trajectory points in reachable space
    let pts: { name: string; target: Vec3 }[] = [];

    if (presetType === 'pickAndPlace') {
      pts = [
        { name: 'Home Standby', target: [0.35, 0.0, 0.45] },
        { name: 'Above Pick Location', target: [0.4, 0.2, 0.35] },
        { name: 'Pick Contact', target: [0.4, 0.2, 0.12] },
        { name: 'Lift with Object', target: [0.4, 0.2, 0.4] },
        { name: 'Above Place Target', target: [0.2, -0.35, 0.4] },
        { name: 'Place Lower', target: [0.2, -0.35, 0.12] },
        { name: 'Retract Clear', target: [0.2, -0.35, 0.45] }
      ];
    } else if (presetType === 'circle') {
      const numPts = 8;
      const center: Vec3 = [0.35, 0.0, 0.35];
      const radius = 0.15;
      for (let i = 0; i < numPts; i++) {
        const angle = (i / numPts) * Math.PI * 2;
        pts.push({
          name: `Circle Arc ${i * 45}°`,
          target: [
            center[0] + radius * Math.cos(angle),
            center[1] + radius * Math.sin(angle),
            center[2]
          ]
        });
      }
    } else if (presetType === 'square') {
      const z = 0.35;
      pts = [
        { name: 'Square Corner A', target: [0.25, -0.15, z] },
        { name: 'Square Corner B', target: [0.45, -0.15, z] },
        { name: 'Square Corner C', target: [0.45, 0.15, z] },
        { name: 'Square Corner D', target: [0.25, 0.15, z] }
      ];
    }

    const newWps: WaypointData[] = pts.map((p, idx) => ({
      id: `preset-${presetType}-${idx}-${Date.now()}`,
      name: p.name,
      // Rough default joint estimation; will be resolved by kinematics
      joints: [p.target[0] * 50, p.target[1] * 50, p.target[2]],
      endEffector: p.target,
      timestamp: Date.now()
    }));

    set({ waypoints: newWps, currentPlaybackIndex: 0, isPlaying: false });
  },

  saveCustomPreset: (name) => {
    const { waypoints, customPresets } = get();
    if (waypoints.length === 0) return;
    const newPreset: CustomPreset = {
      id: `custom-${Date.now()}`,
      name: name.trim() || `Custom Preset ${customPresets.length + 1}`,
      createdAt: Date.now(),
      waypoints: waypoints.map((w) => ({ ...w }))
    };
    const updated = [...customPresets, newPreset];
    saveCustomPresetsToStorage(updated);
    set({ customPresets: updated });
  },

  loadCustomPreset: (id) => {
    const { customPresets } = get();
    const preset = customPresets.find((p) => p.id === id);
    if (!preset) return;
    set({ waypoints: preset.waypoints.map((w) => ({ ...w })), currentPlaybackIndex: 0, isPlaying: false });
  },

  deleteCustomPreset: (id) => {
    const { customPresets } = get();
    const updated = customPresets.filter((p) => p.id !== id);
    saveCustomPresetsToStorage(updated);
    set({ customPresets: updated });
  },

  exportCSV: () => {
    const { waypoints } = get();
    const headers = 'Step,Name,TimeSec,Joint1,Joint2,Joint3,X_m,Y_m,Z_m\n';
    const rows = waypoints.map((w, i) => {
      const time = (i * 1.5).toFixed(2);
      return `${i + 1},"${w.name}",${time},${w.joints[0].toFixed(3)},${w.joints[1].toFixed(3)},${w.joints[2].toFixed(3)},${w.endEffector[0].toFixed(3)},${w.endEffector[1].toFixed(3)},${w.endEffector[2].toFixed(3)}`;
    });
    return headers + rows.join('\n');
  }
}));
