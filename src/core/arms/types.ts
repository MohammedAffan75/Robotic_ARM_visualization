import { Mat3, Mat4, Vec3 } from '../math/matrix';

export type JointType = 'R' | 'P';
export type JointAxis = 'x' | 'y' | 'z';
export type ArmTypeId = 'cartesian' | 'cylindrical' | 'polar' | 'jointed' | 'scara' | 'custom';

export interface JointDefinition {
  id: string;
  name: string;
  symbol: string;
  type: JointType;
  axis: JointAxis;
  min: number;
  max: number;
  defaultVal: number;
  unit: 'deg' | 'm';
  step: number;
  description: string;
}

export interface ParameterDefinition {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: 'm' | 'deg';
  description: string;
}

export interface DHRow {
  jointIndex: number;
  theta: number; // in degrees or radians
  d: number;
  a: number;
  alpha: number; // in degrees or radians
  variable: 'theta' | 'd';
}

export interface FKResult {
  endEffector: Vec3;
  jointPositions: Vec3[]; // [Base(0,0,0), Joint1, Joint2, Joint3, EndEffector]
  transforms: Mat4[]; // T01, T02, T03, T0e
  orientationEulerDeg: Vec3;
}

export interface IKSolution {
  joints: number[]; // [q1, q2, q3]
  valid: boolean;
  branchName: string;
  errorNorm: number; // distance between FK(joints) and target
  violations: string[]; // list of joint limit or geometric violation messages
}

export interface SingularityResult {
  determinant: number;
  manipulability: number;
  isSingular: boolean;
  distanceToSingularity: number; // normalized score 0 (singular) to 1 (well conditioned)
  warning?: string;
}

export interface ArmSpecs {
  type: ArmTypeId;
  name: string;
  dof: number;
  jointSequence: string; // e.g. "P-P-P", "R-P-P", "R-R-R"
  maxReach: number;
  minReach: number;
  workspaceShape: string;
  approxVolume: number; // m^3
  footprint: string;
  totalHeight: string;
  singularityConditions: string[];
  ikSolutionCount: number;
  typicalPayloadKg: number;
  repeatabilityMm: number;
  maxToolSpeedMs: number;
}

export interface LearnCardContent {
  title: string;
  subtitle: string;
  description: string;
  realWorldUses: string[];
  advantages: string[];
  limitations: string[];
  equations: {
    title: string;
    fk: string[];
    ik: string[];
    jacobian: string;
    singularities: string;
  };
}

export interface LinkMeshSpec {
  color: string;
  radius?: number;
  shape: 'box' | 'cylinder' | 'gantry' | 'telescope' | 'quill';
}

export interface ArmMeshSpec {
  baseColor: string;
  linkColors: [string, string, string];
  endEffectorColor: string;
  links: LinkMeshSpec[];
}

export interface ArmDefinition {
  id: ArmTypeId;
  name: string;
  dof: number;
  jointSequence: string;
  description: string;
  joints: JointDefinition[];
  defaultParameters: Record<string, number>;
  parameterDefs: ParameterDefinition[];
  dhTable: (joints: number[], params: Record<string, number>) => DHRow[];
  fk: (joints: number[], params: Record<string, number>) => FKResult;
  ik: (target: Vec3, params: Record<string, number>, currentJoints?: number[]) => IKSolution[];
  jacobian: (joints: number[], params: Record<string, number>) => Mat3;
  singularityCheck: (joints: number[], params: Record<string, number>) => SingularityResult;
  workspaceSampler: (params: Record<string, number>, sampleCount?: number) => Vec3[];
  specs: (params: Record<string, number>) => ArmSpecs;
  learnContent: LearnCardContent;
  meshSpec: ArmMeshSpec;
}
