import { ArmDefinition, ArmSpecs, DHRow, FKResult, IKSolution, SingularityResult } from './types';
import { Mat3, MatrixMath, Vec3 } from '../math/matrix';

export const JointedArm: ArmDefinition = {
  id: 'jointed',
  name: 'Articulated / Anthropomorphic (R-R-R)',
  dof: 3,
  jointSequence: 'R-R-R',
  description: 'Three revolute joints mimicking the human waist, shoulder, and elbow for maximum dexterity.',
  joints: [
    {
      id: 'j1',
      name: 'Waist (J1)',
      symbol: 'θ₁',
      type: 'R',
      axis: 'z',
      min: -180,
      max: 180,
      defaultVal: 20,
      unit: 'deg',
      step: 1,
      description: 'Base yaw rotation around vertical Z axis'
    },
    {
      id: 'j2',
      name: 'Shoulder (J2)',
      symbol: 'θ₂',
      type: 'R',
      axis: 'y',
      min: -50,
      max: 130,
      defaultVal: 55,
      unit: 'deg',
      step: 1,
      description: 'Upper arm pitch rotation around horizontal axis'
    },
    {
      id: 'j3',
      name: 'Elbow (J3)',
      symbol: 'θ₃',
      type: 'R',
      axis: 'y',
      min: -150,
      max: 150,
      defaultVal: -65,
      unit: 'deg',
      step: 1,
      description: 'Forearm pitch rotation relative to upper arm'
    }
  ],
  defaultParameters: {
    baseHeight: 0.35,
    lengthL1: 0.45,
    lengthL2: 0.40
  },
  parameterDefs: [
    {
      id: 'baseHeight',
      name: 'Base Pedestal Height',
      value: 0.35,
      min: 0.15,
      max: 0.7,
      step: 0.05,
      unit: 'm',
      description: 'Height from floor to shoulder rotation pivot'
    },
    {
      id: 'lengthL1',
      name: 'Upper Arm Length (L1)',
      value: 0.45,
      min: 0.2,
      max: 0.9,
      step: 0.05,
      unit: 'm',
      description: 'Distance between shoulder and elbow joints'
    },
    {
      id: 'lengthL2',
      name: 'Forearm Length (L2)',
      value: 0.40,
      min: 0.15,
      max: 0.8,
      step: 0.05,
      unit: 'm',
      description: 'Distance between elbow joint and wrist/tool flange'
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
    const [q1Deg, q2Deg, q3Deg] = joints;
    const d1 = params.baseHeight ?? 0.35;
    const l1 = params.lengthL1 ?? 0.45;
    const l2 = params.lengthL2 ?? 0.40;

    const q1 = MatrixMath.deg2rad(q1Deg);
    const q2 = MatrixMath.deg2rad(q2Deg);
    const q3 = MatrixMath.deg2rad(q3Deg);

    // Planar forward kinematics in arm plane
    const r1 = l1 * Math.cos(q2);
    const z1 = d1 + l1 * Math.sin(q2);

    const r2 = r1 + l2 * Math.cos(q2 + q3);
    const z2 = z1 + l2 * Math.sin(q2 + q3);

    // Project onto 3D world with base yaw q1
    const p0: Vec3 = [0, 0, 0];
    const p1: Vec3 = [0, 0, d1];
    const p2: Vec3 = [r1 * Math.cos(q1), r1 * Math.sin(q1), z1];
    const p3: Vec3 = [r2 * Math.cos(q1), r2 * Math.sin(q1), z2];

    const t01 = MatrixMath.rotZ4(q1);
    t01[2][3] = d1;

    const t02 = MatrixMath.translation4(p2[0], p2[1], p2[2]);
    const t03 = MatrixMath.translation4(p3[0], p3[1], p3[2]);

    return {
      endEffector: p3,
      jointPositions: [p0, p1, p2, p3],
      transforms: [t01, t02, t03, t03],
      orientationEulerDeg: [0, MatrixMath.rad2deg(q2 + q3), q1Deg]
    };
  },

  ik(target: Vec3, params: Record<string, number>): IKSolution[] {
    const [tx, ty, tz] = target;
    const d1 = params.baseHeight ?? 0.35;
    const l1 = params.lengthL1 ?? 0.45;
    const l2 = params.lengthL2 ?? 0.40;
    const jDefs = this.joints;

    const solutions: IKSolution[] = [];

    const rXy = Math.sqrt(tx * tx + ty * ty);
    const dz = tz - d1;
    const Dsq = rXy * rXy + dz * dz;
    const D = Math.sqrt(Dsq);

    const maxReach = l1 + l2;
    const minReach = Math.abs(l1 - l2);

    const q1Rad = Math.atan2(ty, tx);
    const q1Deg = MatrixMath.rad2deg(q1Rad);

    const cosQ3Raw = (Dsq - l1 * l1 - l2 * l2) / (2 * l1 * l2);

    if (D > maxReach + 1e-4) {
      solutions.push({
        joints: [q1Deg, 0, 0],
        valid: false,
        branchName: 'Elbow-Up (Unreachable)',
        errorNorm: D - maxReach,
        violations: [`Target distance (${D.toFixed(3)}m) exceeds maximum arm reach (${maxReach.toFixed(3)}m)`]
      });
      return solutions;
    }

    if (D < minReach - 1e-4) {
      solutions.push({
        joints: [q1Deg, 90, -150],
        valid: false,
        branchName: 'Folded (Unreachable)',
        errorNorm: minReach - D,
        violations: [`Target distance (${D.toFixed(3)}m) is within inner dead zone (${minReach.toFixed(3)}m)`]
      });
      return solutions;
    }

    const cosQ3 = MatrixMath.clamp(cosQ3Raw, -1.0, 1.0);
    const sinQ3 = Math.sqrt(Math.max(0, 1 - cosQ3 * cosQ3));
    const gamma = Math.atan2(dz, rXy);

    // Two branches: Elbow-Up (q3 <= 0 in this convention) and Elbow-Down (q3 >= 0)
    const branches: { name: string; q3Sign: number }[] = [
      { name: 'Elbow-Up', q3Sign: -1 },
      { name: 'Elbow-Down', q3Sign: 1 }
    ];

    for (const b of branches) {
      const q3Rad = Math.atan2(b.q3Sign * sinQ3, cosQ3);
      const beta = Math.atan2(l2 * Math.sin(q3Rad), l1 + l2 * Math.cos(q3Rad));
      const q2Rad = gamma - beta;

      const q2Deg = MatrixMath.rad2deg(q2Rad);
      const q3Deg = MatrixMath.rad2deg(q3Rad);

      const violations: string[] = [];
      if (q1Deg < jDefs[0].min || q1Deg > jDefs[0].max) {
        violations.push(`J1 (${q1Deg.toFixed(1)}°) outside limits [${jDefs[0].min}°, ${jDefs[0].max}°]`);
      }
      if (q2Deg < jDefs[1].min || q2Deg > jDefs[1].max) {
        violations.push(`J2 Shoulder (${q2Deg.toFixed(1)}°) outside limits [${jDefs[1].min}°, ${jDefs[1].max}°]`);
      }
      if (q3Deg < jDefs[2].min || q3Deg > jDefs[2].max) {
        violations.push(`J3 Elbow (${q3Deg.toFixed(1)}°) outside limits [${jDefs[2].min}°, ${jDefs[2].max}°]`);
      }

      // Verify FK round-trip error
      const fkTest = this.fk([q1Deg, q2Deg, q3Deg], params);
      const err = MatrixMath.distance(target, fkTest.endEffector);

      solutions.push({
        joints: [q1Deg, q2Deg, q3Deg],
        valid: violations.length === 0 && err < 1e-3,
        branchName: b.name,
        errorNorm: err,
        violations
      });
    }

    return solutions;
  },

  jacobian(joints: number[], params: Record<string, number>): Mat3 {
    const [q1Deg, q2Deg, q3Deg] = joints;
    const l1 = params.lengthL1 ?? 0.45;
    const l2 = params.lengthL2 ?? 0.40;

    const q1 = MatrixMath.deg2rad(q1Deg);
    const q2 = MatrixMath.deg2rad(q2Deg);
    const q3 = MatrixMath.deg2rad(q3Deg);

    const c1 = Math.cos(q1);
    const s1 = Math.sin(q1);
    const c2 = Math.cos(q2);
    const s2 = Math.sin(q2);
    const c23 = Math.cos(q2 + q3);
    const s23 = Math.sin(q2 + q3);

    const rXy = l1 * c2 + l2 * c23;

    // x = rXy * c1
    // y = rXy * s1
    // z = d1 + l1 * s2 + l2 * s23
    // drXy/dq2 = -l1*s2 - l2*s23
    // drXy/dq3 = -l2*s23
    const dr2 = -l1 * s2 - l2 * s23;
    const dr3 = -l2 * s23;
    const dz2 = l1 * c2 + l2 * c23;
    const dz3 = l2 * c23;

    return [
      [-rXy * s1, dr2 * c1, dr3 * c1],
      [ rXy * c1, dr2 * s1, dr3 * s1],
      [ 0,        dz2,      dz3     ]
    ];
  },

  singularityCheck(joints: number[], params: Record<string, number>): SingularityResult {
    const [, q2Deg, q3Deg] = joints;
    const l1 = params.lengthL1 ?? 0.45;
    const l2 = params.lengthL2 ?? 0.40;

    const q2 = MatrixMath.deg2rad(q2Deg);
    const q3 = MatrixMath.deg2rad(q3Deg);
    const rXy = Math.abs(l1 * Math.cos(q2) + l2 * Math.cos(q2 + q3));

    // det(J) = l1 * l2 * sin(q3) * rXy
    const det = l1 * l2 * Math.sin(q3) * rXy;
    const manipulability = Math.abs(det);

    const isElbowSingular = Math.abs(Math.sin(q3)) < 0.05; // fully extended (q3=0) or folded (q3=180)
    const isShoulderSingular = rXy < 0.04; // wrist above base axis
    const isSingular = isElbowSingular || isShoulderSingular;

    let warning: string | undefined;
    if (isElbowSingular) {
      warning = 'Elbow is nearly locked straight (q3 ≈ 0°) or folded (boundary singularity). Loss of radial velocity!';
    } else if (isShoulderSingular) {
      warning = 'Wrist is positioned directly over the central base axis (r_xy ≈ 0). Waist rotation loses translation authority!';
    }

    const maxDet = l1 * l2 * (l1 + l2);
    const dist = maxDet > 0 ? Math.min(1, manipulability / (maxDet * 0.5)) : 0;

    return {
      determinant: det,
      manipulability,
      isSingular,
      distanceToSingularity: Math.max(0, Math.min(1, dist)),
      warning
    };
  },

  workspaceSampler(params: Record<string, number>, sampleCount = 700): Vec3[] {
    const d1 = params.baseHeight ?? 0.35;
    const l1 = params.lengthL1 ?? 0.45;
    const l2 = params.lengthL2 ?? 0.40;

    const pts: Vec3[] = [];
    const q1Steps = Math.floor(Math.sqrt(sampleCount) * 1.4);
    const planeSteps = Math.floor(sampleCount / q1Steps);

    for (let i = 0; i < q1Steps; i++) {
      const q1 = (i / q1Steps) * Math.PI * 2;
      for (let j = 0; j < planeSteps; j++) {
        // Sample circle boundary of the 2-link planar arm
        const phi = (j / planeSteps) * Math.PI * 2;
        // Outer boundary: fully outstretched elbow (q3=0), varying q2
        const rOut = l1 * Math.cos(phi) + l2 * Math.cos(phi);
        const zOut = d1 + l1 * Math.sin(phi) + l2 * Math.sin(phi);

        if (rOut >= 0) {
          pts.push([rOut * Math.cos(q1), rOut * Math.sin(q1), zOut]);
        }
      }
    }
    return pts;
  },

  specs(params: Record<string, number>): ArmSpecs {
    const d1 = params.baseHeight ?? 0.35;
    const l1 = params.lengthL1 ?? 0.45;
    const l2 = params.lengthL2 ?? 0.40;
    const rMax = l1 + l2;
    const rMin = Math.abs(l1 - l2);
    // Toroidal / spherical volume approximation
    const vol = (4 / 3) * Math.PI * (Math.pow(rMax, 3) - Math.pow(rMin, 3));

    return {
      type: 'jointed',
      name: 'Articulated Anthropomorphic Robot (R-R-R)',
      dof: 3,
      jointSequence: 'R-R-R',
      maxReach: rMax,
      minReach: rMin,
      workspaceShape: 'Swept Crescent / Toroidal Sphere',
      approxVolume: parseFloat(vol.toFixed(3)),
      footprint: `Ø${(rMax * 2).toFixed(1)}m spherical envelope`,
      totalHeight: `${(d1 + rMax).toFixed(2)}m`,
      singularityConditions: [
        'Boundary: Elbow fully extended (q3 = 0°) or fully folded (q3 = ±180°)',
        'Shoulder/Overhead: Wrist point directly on vertical base axis (r_xy = 0)'
      ],
      ikSolutionCount: 2,
      typicalPayloadKg: 10.0,
      repeatabilityMm: 0.03,
      maxToolSpeedMs: 2.5
    };
  },

  learnContent: {
    title: 'Jointed / Articulated (R-R-R) Robot (e.g. KUKA / FANUC)',
    subtitle: 'The Standard Six-Axis Arm Core Kinematics',
    description:
      'Articulated robots mimic human waist, shoulder, and elbow joints. By chaining three revolute axes, they achieve high flexibility, dexterity, and reach-to-footprint ratio, forming the positional foundation for 6-DOF industrial manipulators.',
    realWorldUses: [
      'Automotive spot and arc welding',
      'Industrial spray painting and surface polishing',
      'High-speed packaging, bin picking, and palletizing',
      'Collaborative assembly (cobots like Universal Robots UR series)'
    ],
    advantages: [
      'Exceptional dexterity: can reach over, under, and around obstacles',
      'Highest workspace volume to installation footprint ratio',
      'Capable of rapid sweeping motion with low rotational inertia'
    ],
    limitations: [
      'Multiple kinematic singularities (elbow lock and overhead singularity)',
      'Coupled non-linear inverse kinematics with multiple distinct branches (elbow-up / elbow-down)',
      'Structural deflection and precision drop at maximum outstretched reach'
    ],
    equations: {
      title: 'Articulated Closed-Form Kinematics',
      fk: [
        'r_{xy} = L_1 \\cos\\theta_2 + L_2 \\cos(\\theta_2 + \\theta_3)',
        'x = r_{xy} \\cos\\theta_1, \\quad y = r_{xy} \\sin\\theta_1',
        'z = d_1 + L_1 \\sin\\theta_2 + L_2 \\sin(\\theta_2 + \\theta_3)'
      ],
      ik: [
        '\\theta_1 = \\text{atan2}(y, x)',
        '\\cos\\theta_3 = \\frac{x^2 + y^2 + (z - d_1)^2 - L_1^2 - L_2^2}{2 L_1 L_2}',
        '\\theta_2 = \\text{atan2}(z - d_1, r_{xy}) - \\text{atan2}(L_2 \\sin\\theta_3, L_1 + L_2 \\cos\\theta_3)'
      ],
      jacobian:
        'J = \\begin{bmatrix} -r_{xy} s_1 & dr_2 c_1 & dr_3 c_1 \\\\ r_{xy} c_1 & dr_2 s_1 & dr_3 s_1 \\\\ 0 & dz_2 & dz_3 \\end{bmatrix}, \\quad \\det(J) = L_1 L_2 \\sin\\theta_3 \\cdot r_{xy}',
      singularities: '\\det(J) = 0 \\iff \\sin\\theta_3 = 0 \\;(\\text{Elbow lock}) \\quad \\text{or} \\quad r_{xy} = 0 \\;(\\text{Overhead singularity})'
    }
  },

  meshSpec: {
    baseColor: '#1e293b',
    linkColors: ['#0284c7', '#38bdf8', '#818cf8'],
    endEffectorColor: '#f59e0b',
    links: [
      { shape: 'cylinder', color: '#0284c7' },
      { shape: 'box', color: '#38bdf8' },
      { shape: 'box', color: '#818cf8' }
    ]
  }
};
