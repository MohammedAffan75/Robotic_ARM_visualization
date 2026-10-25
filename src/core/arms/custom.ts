import { ArmDefinition, ArmSpecs, DHRow, FKResult, IKSolution, SingularityResult } from './types';
import { Mat3, MatrixMath, Vec3 } from '../math/matrix';
import { analyzeJacobian, computeNumericalJacobian } from '../math/jacobian';
import { solveDLS } from '../math/dls';

export const CustomArm: ArmDefinition = {
  id: 'custom',
  name: 'Custom 3-DOF (Configurable R/P)',
  dof: 3,
  jointSequence: 'R-R-R (Configurable)',
  description: 'User-customizable 3-DOF robot arm with configurable Revolute/Prismatic joints and DLS numerical IK solver.',
  joints: [
    {
      id: 'j1',
      name: 'Joint 1 (Waist)',
      symbol: 'q₁',
      type: 'R',
      axis: 'z',
      min: -180,
      max: 180,
      defaultVal: 15,
      unit: 'deg',
      step: 1,
      description: 'First joint (Rotary or Prismatic along Z)'
    },
    {
      id: 'j2',
      name: 'Joint 2 (Shoulder)',
      symbol: 'q₂',
      type: 'R',
      axis: 'y',
      min: -90,
      max: 90,
      defaultVal: 45,
      unit: 'deg',
      step: 1,
      description: 'Second joint (Rotary pitch or Prismatic)'
    },
    {
      id: 'j3',
      name: 'Joint 3 (Forearm)',
      symbol: 'q₃',
      type: 'R',
      axis: 'y',
      min: -120,
      max: 120,
      defaultVal: -30,
      unit: 'deg',
      step: 1,
      description: 'Third joint (Rotary or Prismatic telescoping)'
    }
  ],
  defaultParameters: {
    baseHeight: 0.35,
    lengthL1: 0.45,
    lengthL2: 0.40,
    joint1IsPrismatic: 0, // 0 = Revolute, 1 = Prismatic
    joint2IsPrismatic: 0,
    joint3IsPrismatic: 0
  },
  parameterDefs: [
    {
      id: 'baseHeight',
      name: 'Base Height',
      value: 0.35,
      min: 0.1,
      max: 0.8,
      step: 0.05,
      unit: 'm',
      description: 'Elevation of first joint pivot above floor'
    },
    {
      id: 'lengthL1',
      name: 'Link 1 Length',
      value: 0.45,
      min: 0.2,
      max: 0.9,
      step: 0.05,
      unit: 'm',
      description: 'Length of first articulated link'
    },
    {
      id: 'lengthL2',
      name: 'Link 2 Length',
      value: 0.40,
      min: 0.2,
      max: 0.8,
      step: 0.05,
      unit: 'm',
      description: 'Length of second articulated link'
    }
  ],

  dhTable(joints: number[], params: Record<string, number>): DHRow[] {
    const [q1, q2, q3] = joints;
    const d1 = params.baseHeight ?? 0.35;
    const l1 = params.lengthL1 ?? 0.45;
    const l2 = params.lengthL2 ?? 0.40;

    return [
      { jointIndex: 1, theta: q1, d: d1, a: 0, alpha: 90, variable: 'theta' },
      { jointIndex: 2, theta: q2, d: 0, a: l1, alpha: 0, variable: 'theta' },
      { jointIndex: 3, theta: q3, d: 0, a: l2, alpha: 0, variable: 'theta' }
    ];
  },

  fk(joints: number[], params: Record<string, number>): FKResult {
    const [q1Val, q2Val, q3Val] = joints;
    const d1 = params.baseHeight ?? 0.35;
    const l1 = params.lengthL1 ?? 0.45;
    const l2 = params.lengthL2 ?? 0.40;

    const j1Prism = (params.joint1IsPrismatic ?? 0) === 1;
    const j2Prism = (params.joint2IsPrismatic ?? 0) === 1;
    const j3Prism = (params.joint3IsPrismatic ?? 0) === 1;

    // Joint 1
    const q1Rad = j1Prism ? 0 : MatrixMath.deg2rad(q1Val);
    const zBase = d1 + (j1Prism ? q1Val : 0);

    // Joint 2
    const q2Rad = j2Prism ? 0 : MatrixMath.deg2rad(q2Val);
    const link1Len = l1 + (j2Prism ? q2Val : 0);

    // Joint 3
    const q3Rad = j3Prism ? 0 : MatrixMath.deg2rad(q3Val);
    const link2Len = l2 + (j3Prism ? q3Val : 0);

    const r1 = link1Len * Math.cos(q2Rad);
    const z1 = zBase + link1Len * Math.sin(q2Rad);

    const r2 = r1 + link2Len * Math.cos(q2Rad + q3Rad);
    const z2 = z1 + link2Len * Math.sin(q2Rad + q3Rad);

    const p0: Vec3 = [0, 0, 0];
    const p1: Vec3 = [0, 0, zBase];
    const p2: Vec3 = [r1 * Math.cos(q1Rad), r1 * Math.sin(q1Rad), z1];
    const p3: Vec3 = [r2 * Math.cos(q1Rad), r2 * Math.sin(q1Rad), z2];

    const t01 = MatrixMath.rotZ4(q1Rad);
    t01[2][3] = zBase;
    const t02 = MatrixMath.translation4(p2[0], p2[1], p2[2]);
    const t03 = MatrixMath.translation4(p3[0], p3[1], p3[2]);

    return {
      endEffector: p3,
      jointPositions: [p0, p1, p2, p3],
      transforms: [t01, t02, t03, t03],
      orientationEulerDeg: [0, MatrixMath.rad2deg(q2Rad + q3Rad), MatrixMath.rad2deg(q1Rad)]
    };
  },

  ik(target: Vec3, params: Record<string, number>, currentJoints?: number[]): IKSolution[] {
    const jDefs = this.joints;
    const limits = jDefs.map((j) => ({ min: j.min, max: j.max }));

    const fkFn = (q: number[]): Vec3 => this.fk(q, params).endEffector;

    // Multi-start DLS optimization
    const seeds: number[][] = [
      currentJoints ? [...currentJoints] : [15, 45, -30],
      [0, 30, -30],
      [45, 60, -60],
      [-45, 30, 30],
      [0, 70, 45]
    ];

    let bestResult = solveDLS(target, seeds[0], fkFn, limits, { maxIterations: 80, tolerance: 1e-4 });

    for (let s = 1; s < seeds.length; s++) {
      if (bestResult.finalError < 1e-3) break;
      const res = solveDLS(target, seeds[s], fkFn, limits, { maxIterations: 60, tolerance: 1e-4 });
      if (res.finalError < bestResult.finalError) {
        bestResult = res;
      }
    }

    const violations: string[] = [];
    for (let i = 0; i < 3; i++) {
      if (bestResult.joints[i] < limits[i].min || bestResult.joints[i] > limits[i].max) {
        violations.push(
          `${jDefs[i].name} (${bestResult.joints[i].toFixed(2)}) exceeds limit [${limits[i].min}, ${limits[i].max}]`
        );
      }
    }

    if (bestResult.finalError > 1e-2) {
      violations.push(`Numerical solver failed to converge (residual error ${bestResult.finalError.toFixed(4)}m)`);
    }

    const sol: IKSolution = {
      joints: bestResult.joints,
      valid: violations.length === 0 && bestResult.finalError < 1e-3,
      branchName: 'DLS Numerical Optimization',
      errorNorm: bestResult.finalError,
      violations
    };

    return [sol];
  },

  jacobian(joints: number[], params: Record<string, number>): Mat3 {
    const fkFn = (q: number[]): Vec3 => this.fk(q, params).endEffector;
    return computeNumericalJacobian(fkFn, joints);
  },

  singularityCheck(joints: number[], params: Record<string, number>): SingularityResult {
    const J = this.jacobian(joints, params);
    const analysis = analyzeJacobian(J, 0.005);

    return {
      determinant: analysis.determinant,
      manipulability: analysis.manipulability,
      isSingular: analysis.isNearSingularity,
      distanceToSingularity: analysis.singularityDistance,
      warning: analysis.isNearSingularity
        ? `Manipulator approaching singularity condition (condition number = ${analysis.conditionNumber.toFixed(1)})`
        : undefined
    };
  },

  workspaceSampler(params: Record<string, number>, sampleCount = 600): Vec3[] {
    const d1 = params.baseHeight ?? 0.35;
    const l1 = params.lengthL1 ?? 0.45;
    const l2 = params.lengthL2 ?? 0.40;
    const rMax = l1 + l2;

    const pts: Vec3[] = [];
    const steps = Math.floor(Math.sqrt(sampleCount));
    for (let i = 0; i < steps; i++) {
      const q1 = (i / steps) * Math.PI * 2;
      for (let j = 0; j < steps; j++) {
        const phi = (j / steps) * Math.PI;
        const r = rMax * Math.sin(phi);
        const z = d1 + rMax * Math.cos(phi);
        pts.push([r * Math.cos(q1), r * Math.sin(q1), z]);
      }
    }
    return pts;
  },

  specs(params: Record<string, number>): ArmSpecs {
    const l1 = params.lengthL1 ?? 0.45;
    const l2 = params.lengthL2 ?? 0.40;
    const rMax = l1 + l2;
    const vol = (4 / 3) * Math.PI * Math.pow(rMax, 3);

    return {
      type: 'custom',
      name: 'Custom Configurable 3-DOF Arm',
      dof: 3,
      jointSequence: 'User Selected (R / P)',
      maxReach: rMax,
      minReach: 0.1,
      workspaceShape: 'Arbitrary 3D Volume',
      approxVolume: parseFloat(vol.toFixed(3)),
      footprint: `Configurable envelope (~${(rMax * 2).toFixed(1)}m)`,
      totalHeight: `${(0.35 + rMax).toFixed(2)}m`,
      singularityConditions: ['Detected dynamically via numerical Jacobian determinant'],
      ikSolutionCount: 1,
      typicalPayloadKg: 8.0,
      repeatabilityMm: 0.05,
      maxToolSpeedMs: 2.0
    };
  },

  learnContent: {
    title: 'Custom Configurable 3-DOF Manipulator',
    subtitle: 'Numerical Inverse Kinematics & General Mechanics',
    description:
      'When an arm design does not have a closed-form geometric inverse kinematics solution, robotics engineers employ iterative numerical solvers such as Damped Least Squares (DLS). DLS balances positional accuracy with joint velocity damping to smoothly transition near singularities.',
    realWorldUses: [
      'Prototyping novel mechanism designs and test benches',
      'Snake and continuum robot approximation',
      'Telescoping crane and boom kinematics',
      'Research lab experimental test rigs'
    ],
    advantages: [
      'Extensible to arbitrary joint configurations and axes',
      'Numerical DLS solver gracefully avoids numerical instability at singular points',
      'Joint limit clamping integrated directly into the iteration loop'
    ],
    limitations: [
      'Iterative solvers take more CPU cycles than closed-form formulas',
      'Convergence depends on the initial seed pose and local minima',
      'Does not natively enumerate all disjoint homotopy branches at once'
    ],
    equations: {
      title: 'Damped Least Squares Numerical IK Formulation',
      fk: ['p = f(q_1, q_2, q_3) \\quad \\text{via DH transforms}'],
      ik: [
        '\\Delta q = J^T (J J^T + \\lambda^2 I)^{-1} (p_{target} - p(q))',
        'q_{k+1} = \\text{clamp}(q_k + \\Delta q, q_{min}, q_{max})'
      ],
      jacobian: 'J_{ij} = \\frac{\\partial f_i}{\\partial q_j} \\approx \\frac{f_i(q + h e_j) - f_i(q - h e_j)}{2h}',
      singularities: 'w = \\sqrt{\\det(J J^T)} \\to 0 \\implies \\lambda^2 > 0 \\text{ prevents infinite velocity inversion}'
    }
  },

  meshSpec: {
    baseColor: '#1e293b',
    linkColors: ['#10b981', '#f59e0b', '#06b6d4'],
    endEffectorColor: '#ec4899',
    links: [
      { shape: 'cylinder', color: '#10b981' },
      { shape: 'box', color: '#f59e0b' },
      { shape: 'quill', color: '#06b6d4' }
    ]
  }
};
