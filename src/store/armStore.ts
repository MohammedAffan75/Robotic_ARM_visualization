import { create } from 'zustand';
import { ArmDefinition, ArmTypeId, FKResult, IKSolution, SingularityResult } from '../core/arms/types';
import { ARM_REGISTRY, getArmDefinition } from '../core/arms';
import { Mat3, Vec3 } from '../core/math/matrix';
import { evaluateValidationRules, getWorstSeverity, IssueSeverity, ValidationIssue } from '../core/validation';
import { RobotConfigFile, RobotConfigSchema } from './schemas';
import { useLogStore } from './logStore';

interface HistorySnapshot {
  joints: [number, number, number];
  parameters: Record<string, number>;
}

interface ArmState {
  armType: ArmTypeId;
  joints: [number, number, number];
  target: Vec3;
  parameters: Record<string, number>;
  selectedBranchIndex: number;

  // Computed state
  fkResult: FKResult;
  ikSolutions: IKSolution[];
  jacobianMatrix: Mat3;
  singularityInfo: SingularityResult;
  validationIssues: ValidationIssue[];
  worstSeverity: IssueSeverity | 'ok';

  // History for Undo / Redo
  history: HistorySnapshot[];
  historyIndex: number;

  // Actions
  setArmType: (type: ArmTypeId) => void;
  setJoints: (joints: [number, number, number], recordHistory?: boolean) => void;
  setJoint: (index: number, val: number) => void;
  setTarget: (target: Vec3, syncJoints?: boolean) => void;
  setParameters: (params: Record<string, number>) => void;
  setParameter: (key: string, val: number) => void;
  setSelectedBranchIndex: (idx: number) => void;

  homePose: () => void;
  resetPose: () => void;
  randomizePose: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  importConfig: (jsonStr: string) => { success: boolean; error?: string };
  exportConfig: () => RobotConfigFile;
}

const STORAGE_KEY = 'robokin_robot_config_v1';

function computeKinematicsState(
  armDef: ArmDefinition,
  joints: [number, number, number],
  target: Vec3,
  params: Record<string, number>,
  branchIdx: number
) {
  const fkResult = armDef.fk(joints, params);
  const ikSolutions = armDef.ik(target, params, joints);
  const jacobianMatrix = armDef.jacobian(joints, params);
  const singularityInfo = armDef.singularityCheck(joints, params);

  const selectedSol = ikSolutions[branchIdx] ?? ikSolutions[0];
  const ikReachable = selectedSol ? selectedSol.valid : false;
  const ikViolations = selectedSol ? selectedSol.violations : ['Target is unreachable'];

  const validationIssues = evaluateValidationRules(
    {
      armType: armDef.id,
      joints,
      target,
      endEffector: fkResult.endEffector,
      parameters: params,
      ikReachable,
      ikViolations,
      singularityWarning: singularityInfo.warning,
      isNearSingularity: singularityInfo.isSingular
    },
    armDef
  );

  const worstSeverity = getWorstSeverity(validationIssues);

  return {
    fkResult,
    ikSolutions,
    jacobianMatrix,
    singularityInfo,
    validationIssues,
    worstSeverity
  };
}

function loadSavedState(): Partial<RobotConfigFile> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const valid = RobotConfigSchema.safeParse(parsed);
    if (valid.success) {
      return valid.data;
    }
  } catch {
    // Ignore storage parse error
  }
  return null;
}

function saveState(state: {
  armType: ArmTypeId;
  joints: [number, number, number];
  target: Vec3;
  parameters: Record<string, number>;
  selectedBranchIndex: number;
}) {
  try {
    const payload: RobotConfigFile = {
      version: 1,
      armType: state.armType,
      joints: state.joints,
      target: state.target,
      parameters: state.parameters,
      waypoints: [],
      ikBranchIndex: state.selectedBranchIndex,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage write error
  }
}

const saved = loadSavedState();
const initialArmType: ArmTypeId = saved?.armType ?? 'jointed';
const initialArmDef = getArmDefinition(initialArmType);
const initialJoints: [number, number, number] = saved?.joints ?? [
  initialArmDef.joints[0].defaultVal,
  initialArmDef.joints[1].defaultVal,
  initialArmDef.joints[2].defaultVal
];
const initialParams = saved?.parameters ?? { ...initialArmDef.defaultParameters };
const initialFk = initialArmDef.fk(initialJoints, initialParams);
const initialTarget: Vec3 = saved?.target ?? initialFk.endEffector;
const initialBranchIdx = saved?.ikBranchIndex ?? 0;

const initialKinematics = computeKinematicsState(
  initialArmDef,
  initialJoints,
  initialTarget,
  initialParams,
  initialBranchIdx
);

export const useArmStore = create<ArmState>((set, get) => ({
  armType: initialArmType,
  joints: initialJoints,
  target: initialTarget,
  parameters: initialParams,
  selectedBranchIndex: initialBranchIdx,

  ...initialKinematics,

  history: [{ joints: initialJoints, parameters: initialParams }],
  historyIndex: 0,

  setArmType: (newType: ArmTypeId) => {
    const armDef = getArmDefinition(newType);
    const newJoints: [number, number, number] = [
      armDef.joints[0].defaultVal,
      armDef.joints[1].defaultVal,
      armDef.joints[2].defaultVal
    ];
    const newParams = { ...armDef.defaultParameters };
    const fkRes = armDef.fk(newJoints, newParams);
    const newTarget = fkRes.endEffector;

    const kin = computeKinematicsState(armDef, newJoints, newTarget, newParams, 0);

    useLogStore.getState().addLog('info', `Switched to ${armDef.name}`, `Pose reset to default home position.`);

    const newState = {
      armType: newType,
      joints: newJoints,
      target: newTarget,
      parameters: newParams,
      selectedBranchIndex: 0,
      ...kin,
      history: [{ joints: newJoints, parameters: newParams }],
      historyIndex: 0
    };

    saveState(newState);
    set(newState);
  },

  setJoints: (newJoints, recordHistory = true) => {
    const state = get();
    const armDef = getArmDefinition(state.armType);
    const kin = computeKinematicsState(
      armDef,
      newJoints,
      state.target,
      state.parameters,
      state.selectedBranchIndex
    );

    let newHistory = state.history;
    let newHistIdx = state.historyIndex;

    if (recordHistory) {
      newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ joints: newJoints, parameters: state.parameters });
      if (newHistory.length > 50) newHistory.shift();
      newHistIdx = newHistory.length - 1;
    }

    const nextState = {
      joints: newJoints,
      ...kin,
      history: newHistory,
      historyIndex: newHistIdx
    };

    saveState({ ...state, ...nextState });
    set(nextState);
  },

  setJoint: (index, val) => {
    const { joints } = get();
    const nextJoints: [number, number, number] = [...joints];
    nextJoints[index] = val;
    get().setJoints(nextJoints, true);
  },

  setTarget: (target, syncJoints = true) => {
    const state = get();
    const armDef = getArmDefinition(state.armType);

    if (syncJoints) {
      const ikSols = armDef.ik(target, state.parameters, state.joints);
      const chosenSol = ikSols[state.selectedBranchIndex] ?? ikSols[0];

      if (chosenSol && chosenSol.valid) {
        const newJoints: [number, number, number] = [
          chosenSol.joints[0],
          chosenSol.joints[1],
          chosenSol.joints[2]
        ];
        const kin = computeKinematicsState(
          armDef,
          newJoints,
          target,
          state.parameters,
          state.selectedBranchIndex
        );

        set({
          target,
          joints: newJoints,
          ...kin
        });
        return;
      }
    }

    // Even if unreachable or not syncing joints, update target & re-evaluate validation
    const kin = computeKinematicsState(
      armDef,
      state.joints,
      target,
      state.parameters,
      state.selectedBranchIndex
    );
    set({ target, ...kin });
  },

  setParameters: (parameters) => {
    const state = get();
    const armDef = getArmDefinition(state.armType);
    const kin = computeKinematicsState(
      armDef,
      state.joints,
      state.target,
      parameters,
      state.selectedBranchIndex
    );

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({ joints: state.joints, parameters });
    if (newHistory.length > 50) newHistory.shift();

    const next = {
      parameters,
      ...kin,
      history: newHistory,
      historyIndex: newHistory.length - 1
    };

    saveState({ ...state, ...next });
    set(next);
  },

  setParameter: (key, val) => {
    const { parameters } = get();
    get().setParameters({ ...parameters, [key]: val });
  },

  setSelectedBranchIndex: (selectedBranchIndex) => {
    const state = get();
    const armDef = getArmDefinition(state.armType);
    const chosenSol = state.ikSolutions[selectedBranchIndex];

    if (chosenSol && chosenSol.valid) {
      const newJoints: [number, number, number] = [
        chosenSol.joints[0],
        chosenSol.joints[1],
        chosenSol.joints[2]
      ];
      const kin = computeKinematicsState(
        armDef,
        newJoints,
        state.target,
        state.parameters,
        selectedBranchIndex
      );
      set({
        selectedBranchIndex,
        joints: newJoints,
        ...kin
      });
      useLogStore.getState().addLog('info', `Switched to IK branch: ${chosenSol.branchName}`);
    } else {
      set({ selectedBranchIndex });
    }
  },

  homePose: () => {
    const state = get();
    const armDef = getArmDefinition(state.armType);
    const homeJoints: [number, number, number] = [
      armDef.joints[0].defaultVal,
      armDef.joints[1].defaultVal,
      armDef.joints[2].defaultVal
    ];
    const fkRes = armDef.fk(homeJoints, state.parameters);
    get().setJoints(homeJoints, true);
    set({ target: fkRes.endEffector });
    useLogStore.getState().addLog('info', `Arm returned to Home Pose`);
  },

  resetPose: () => {
    get().homePose();
  },

  randomizePose: () => {
    const state = get();
    const armDef = getArmDefinition(state.armType);
    const randJoints: [number, number, number] = [
      armDef.joints[0].min + Math.random() * (armDef.joints[0].max - armDef.joints[0].min) * 0.8 + (armDef.joints[0].max - armDef.joints[0].min) * 0.1,
      armDef.joints[1].min + Math.random() * (armDef.joints[1].max - armDef.joints[1].min) * 0.8 + (armDef.joints[1].max - armDef.joints[1].min) * 0.1,
      armDef.joints[2].min + Math.random() * (armDef.joints[2].max - armDef.joints[2].min) * 0.8 + (armDef.joints[2].max - armDef.joints[2].min) * 0.1
    ];
    const fkRes = armDef.fk(randJoints, state.parameters);
    get().setJoints(randJoints, true);
    set({ target: fkRes.endEffector });
    useLogStore.getState().addLog('info', `Generated Random Pose within valid joint range`);
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  undo: () => {
    const state = get();
    if (!state.canUndo()) return;
    const targetIdx = state.historyIndex - 1;
    const snapshot = state.history[targetIdx];
    const armDef = getArmDefinition(state.armType);
    const kin = computeKinematicsState(
      armDef,
      snapshot.joints,
      state.target,
      snapshot.parameters,
      state.selectedBranchIndex
    );
    set({
      joints: snapshot.joints,
      parameters: snapshot.parameters,
      historyIndex: targetIdx,
      ...kin
    });
  },

  redo: () => {
    const state = get();
    if (!state.canRedo()) return;
    const targetIdx = state.historyIndex + 1;
    const snapshot = state.history[targetIdx];
    const armDef = getArmDefinition(state.armType);
    const kin = computeKinematicsState(
      armDef,
      snapshot.joints,
      state.target,
      snapshot.parameters,
      state.selectedBranchIndex
    );
    set({
      joints: snapshot.joints,
      parameters: snapshot.parameters,
      historyIndex: targetIdx,
      ...kin
    });
  },

  importConfig: (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const validation = RobotConfigSchema.safeParse(parsed);
      if (!validation.success) {
        return {
          success: false,
          error: `Zod Validation Error: ${validation.error.issues.map((i) => i.message).join(', ')}`
        };
      }
      const data = validation.data;
      const armDef = ARM_REGISTRY[data.armType];
      if (!armDef) {
        return { success: false, error: `Unknown arm type: ${data.armType}` };
      }

      const kin = computeKinematicsState(
        armDef,
        data.joints,
        data.target,
        data.parameters,
        data.ikBranchIndex ?? 0
      );

      set({
        armType: data.armType,
        joints: data.joints,
        target: data.target,
        parameters: data.parameters,
        selectedBranchIndex: data.ikBranchIndex ?? 0,
        ...kin,
        history: [{ joints: data.joints, parameters: data.parameters }],
        historyIndex: 0
      });

      useLogStore.getState().addLog('info', `Config imported successfully`, `Loaded ${armDef.name} configuration.`);
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Invalid JSON file structure'
      };
    }
  },

  exportConfig: () => {
    const state = get();
    return {
      version: 1,
      armType: state.armType,
      joints: state.joints,
      target: state.target,
      parameters: state.parameters,
      waypoints: [],
      ikBranchIndex: state.selectedBranchIndex,
      createdAt: new Date().toISOString()
    };
  }
}));
