import { ArmDefinition, ArmSpecs, DHRow, FKResult, IKSolution, SingularityResult } from './types';
import { Mat3, Mat4, MatrixMath, Vec3 } from '../math/matrix';

export const CartesianArm: ArmDefinition = {
  id: 'cartesian',
  name: 'Cartesian (Gantry / Rectilinear)',
  dof: 3,
  jointSequence: 'P-P-P',
  description: 'Three orthogonal prismatic axes (X, Y, Z) forming a rectangular bounding workspace.',
  joints: [
    {
      id: 'j1',
      name: 'X-Axis Carriage',
      symbol: 'd_x',
      type: 'P',
      axis: 'x',
      min: -0.6,
      max: 0.6,
      defaultVal: 0.2,
      unit: 'm',
      step: 0.01,
      description: 'Linear carriage translation along the X bridge'
    },
    {
      id: 'j2',
      name: 'Y-Axis Cross-Slide',
      symbol: 'd_y',
      type: 'P',
      axis: 'y',
      min: -0.6,
      max: 0.6,
      defaultVal: 0.2,
      unit: 'm',
      step: 0.01,
      description: 'Linear cross-slide translation along the Y rail'
    },
    {
      id: 'j3',
      name: 'Z-Axis Mast / Quill',
      symbol: 'd_z',
      type: 'P',
      axis: 'z',
      min: 0.05,
      max: 0.9,
      defaultVal: 0.45,
      unit: 'm',
      step: 0.01,
      description: 'Vertical quill stroke along the Z column'
    }
  ],
  defaultParameters: {
    baseWidth: 1.4,
    baseDepth: 1.4,
    baseHeight: 1.1,
    strokeX: 1.2,
    strokeY: 1.2,
    strokeZ: 0.85
  },
  parameterDefs: [
    {
      id: 'strokeX',
      name: 'X Travel Range',
      value: 1.2,
      min: 0.4,
      max: 2.0,
      step: 0.05,
      unit: 'm',
      description: 'Total linear travel along X axis'
    },
    {
      id: 'strokeY',
      name: 'Y Travel Range',
      value: 1.2,
      min: 0.4,
      max: 2.0,
      step: 0.05,
      unit: 'm',
      description: 'Total linear travel along Y axis'
    },
    {
      id: 'strokeZ',
      name: 'Z Travel Range',
      value: 0.85,
      min: 0.3,
      max: 1.5,
      step: 0.05,
      unit: 'm',
      description: 'Total vertical travel along Z axis'
    }
  ],

  dhTable(joints: number[]): DHRow[] {
    const [qx, qy, qz] = joints;
    return [
      { jointIndex: 1, theta: 0, d: qx, a: 0, alpha: -90, variable: 'd' },
      { jointIndex: 2, theta: -90, d: qy, a: 0, alpha: -90, variable: 'd' },
      { jointIndex: 3, theta: 0, d: qz, a: 0, alpha: 0, variable: 'd' }
    ];
  },

  fk(joints: number[]): FKResult {
    const [qx, qy, qz] = joints;
    const ee: Vec3 = [qx, qy, qz];

    const p0: Vec3 = [0, 0, 0];
    const p1: Vec3 = [qx, 0, 0.9];
    const p2: Vec3 = [qx, qy, 0.9];
    const p3: Vec3 = [qx, qy, qz];

    const t01: Mat4 = MatrixMath.translation4(qx, 0, 0.9);
    const t02: Mat4 = MatrixMath.translation4(qx, qy, 0.9);
    const t03: Mat4 = MatrixMath.translation4(qx, qy, qz);

    return {
      endEffector: ee,
      jointPositions: [p0, p1, p2, p3],
      transforms: [t01, t02, t03, t03],
      orientationEulerDeg: [0, 0, 0]
    };
  },

  ik(target: Vec3, _params: Record<string, number>): IKSolution[] {
    const [tx, ty, tz] = target;
    const jDefs = this.joints;

    const violations: string[] = [];
    if (tx < jDefs[0].min || tx > jDefs[0].max) {
      violations.push(`X target (${tx.toFixed(3)}m) exceeds joint 1 limit [${jDefs[0].min}, ${jDefs[0].max}]`);
    }
    if (ty < jDefs[1].min || ty > jDefs[1].max) {
      violations.push(`Y target (${ty.toFixed(3)}m) exceeds joint 2 limit [${jDefs[1].min}, ${jDefs[1].max}]`);
    }
    if (tz < jDefs[2].min || tz > jDefs[2].max) {
      violations.push(`Z target (${tz.toFixed(3)}m) exceeds joint 3 limit [${jDefs[2].min}, ${jDefs[2].max}]`);
    }

    const sol: IKSolution = {
      joints: [tx, ty, tz],
      valid: violations.length === 0,
      branchName: 'Direct Orthogonal',
      errorNorm: 0,
      violations
    };

    return [sol];
  },

  jacobian(): Mat3 {
    // Identity Jacobian: dx/dq = [1 0 0; 0 1 0; 0 0 1]
    return MatrixMath.identity3();
  },

  singularityCheck(): SingularityResult {
    return {
      determinant: 1.0,
      manipulability: 1.0,
      isSingular: false,
      distanceToSingularity: 1.0
    };
  },

  workspaceSampler(params: Record<string, number>, sampleCount = 600): Vec3[] {
    const sx = params.strokeX ?? 1.2;
    const sy = params.strokeY ?? 1.2;
    const sz = params.strokeZ ?? 0.85;

    const halfX = sx / 2;
    const halfY = sy / 2;
    const minZ = 0.05;
    const maxZ = minZ + sz;

    const pts: Vec3[] = [];
    const stepN = Math.cbrt(sampleCount);
    for (let ix = 0; ix <= stepN; ix++) {
      const x = -halfX + (ix / stepN) * sx;
      for (let iy = 0; iy <= stepN; iy++) {
        const y = -halfY + (iy / stepN) * sy;
        for (let iz = 0; iz <= stepN; iz++) {
          const z = minZ + (iz / stepN) * (maxZ - minZ);
          // Sample mostly surface points
          if (
            ix === 0 || ix === Math.floor(stepN) ||
            iy === 0 || iy === Math.floor(stepN) ||
            iz === 0 || iz === Math.floor(stepN)
          ) {
            pts.push([x, y, z]);
          }
        }
      }
    }
    return pts;
  },

  specs(params: Record<string, number>): ArmSpecs {
    const sx = params.strokeX ?? 1.2;
    const sy = params.strokeY ?? 1.2;
    const sz = params.strokeZ ?? 0.85;
    const vol = sx * sy * sz;

    return {
      type: 'cartesian',
      name: 'Cartesian Gantry Arm',
      dof: 3,
      jointSequence: 'P-P-P',
      maxReach: Math.sqrt(Math.pow(sx / 2, 2) + Math.pow(sy / 2, 2) + Math.pow(sz, 2)),
      minReach: 0.05,
      workspaceShape: 'Rectangular Prism (Box)',
      approxVolume: parseFloat(vol.toFixed(3)),
      footprint: `${sx.toFixed(1)}m × ${sy.toFixed(1)}m`,
      totalHeight: `${(0.95 + sz).toFixed(2)}m`,
      singularityConditions: ['None! det(J) = 1 throughout entire workspace'],
      ikSolutionCount: 1,
      typicalPayloadKg: 25.0,
      repeatabilityMm: 0.02,
      maxToolSpeedMs: 1.5
    };
  },

  learnContent: {
    title: 'Cartesian (Gantry / Rectilinear) Robot',
    subtitle: 'Orthogonal 3-Axis Precision Kinematics',
    description:
      'Cartesian robots utilize three prismatic (sliding) joints perpendicular to one another. Their kinematics feature a constant identity Jacobian matrix, meaning Cartesian velocities directly equal joint speeds with zero kinematic coupling or singularities.',
    realWorldUses: [
      'CNC milling, routers, and laser cutters',
      '3D printing (CoreXY / Cartesian beds)',
      'Heavy-duty overhead pick-and-place gantries',
      'Automated warehouse palletizing'
    ],
    advantages: [
      'Trivially linear forward and inverse kinematics (1:1 mapping)',
      'Completely free of kinematic singularities across 100% of reach',
      'Uniform structural rigidity and high positioning repeatability',
      'Simple rectangular coordinate control with no non-linear terms'
    ],
    limitations: [
      'Very large physical footprint relative to reachable envelope',
      'Prismatic linear rails are difficult to seal from dust and chips',
      'Lower tool speeds compared to articulated revolving arms'
    ],
    equations: {
      title: 'Cartesian Kinematic Formulation',
      fk: ['x = q_1', 'y = q_2', 'z = q_3'],
      ik: ['q_1 = x', 'q_2 = y', 'q_3 = z'],
      jacobian: 'J = I_{3x3} = diag(1, 1, 1), \\quad \\det(J) = 1.0',
      singularities: '\\det(J) = 1 \\neq 0 \\implies \\text{No singularities exist in the operational domain.}'
    }
  },

  meshSpec: {
    baseColor: '#334155',
    linkColors: ['#0284c7', '#06b6d4', '#10b981'],
    endEffectorColor: '#f59e0b',
    links: [
      { shape: 'gantry', color: '#0284c7' },
      { shape: 'box', color: '#06b6d4' },
      { shape: 'quill', color: '#10b981' }
    ]
  }
};
