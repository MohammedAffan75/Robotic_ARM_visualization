import { ArmDefinition, ArmSpecs, DHRow, FKResult, IKSolution, SingularityResult } from './types';
import { Mat3, MatrixMath, Vec3 } from '../math/matrix';

export const ScaraArm: ArmDefinition = {
  id: 'scara',
  name: 'SCARA (Selective Compliance) (R-R-P)',
  dof: 3,
  jointSequence: 'R-R-P',
  description: 'Two parallel revolute joints operating in the horizontal XY plane with a vertical prismatic Z quill.',
  joints: [
    {
      id: 'j1',
      name: 'Base Arm Yaw (J1)',
      symbol: 'θ₁',
      type: 'R',
      axis: 'z',
      min: -145,
      max: 145,
      defaultVal: 25,
      unit: 'deg',
      step: 1,
      description: 'First horizontal revolute arm link'
    },
    {
      id: 'j2',
      name: 'Elbow Yaw (J2)',
      symbol: 'θ₂',
      type: 'R',
      axis: 'z',
      min: -150,
      max: 150,
      defaultVal: 50,
      unit: 'deg',
      step: 1,
      description: 'Second horizontal revolute forearm link'
    },
    {
      id: 'j3',
      name: 'Quill Plunge (J3)',
      symbol: 'd₃',
      type: 'P',
      axis: 'z',
      min: 0.02,
      max: 0.35,
      defaultVal: 0.15,
      unit: 'm',
      step: 0.005,
      description: 'Vertical plunge stroke of linear quill'
    }
  ],
  defaultParameters: {
    baseHeight: 0.65,
    lengthL1: 0.40,
    lengthL2: 0.35,
    maxQuillStroke: 0.35
  },
  parameterDefs: [
    {
      id: 'baseHeight',
      name: 'Base Pedestal Height',
      value: 0.65,
      min: 0.3,
      max: 1.0,
      step: 0.05,
      unit: 'm',
      description: 'Elevation of horizontal planar arms above ground'
    },
    {
      id: 'lengthL1',
      name: 'Inner Link Length (L1)',
      value: 0.40,
      min: 0.2,
      max: 0.8,
      step: 0.05,
      unit: 'm',
      description: 'Length of first rotating horizontal link'
    },
    {
      id: 'lengthL2',
      name: 'Outer Link Length (L2)',
      value: 0.35,
      min: 0.15,
      max: 0.7,
      step: 0.05,
      unit: 'm',
      description: 'Length of second rotating horizontal link'
    }
  ],

  dhTable(joints: number[], params: Record<string, number>): DHRow[] {
    const [q1, q2, d3] = joints;
    const d1 = params.baseHeight ?? 0.65;
    const l1 = params.lengthL1 ?? 0.40;
    const l2 = params.lengthL2 ?? 0.35;

    return [
      { jointIndex: 1, theta: q1, d: d1, a: l1, alpha: 0, variable: 'theta' },
      { jointIndex: 2, theta: q2, d: 0, a: l2, alpha: 180, variable: 'theta' },
      { jointIndex: 3, theta: 0, d: d3, a: 0, alpha: 0, variable: 'd' }
    ];
  },

  fk(joints: number[], params: Record<string, number>): FKResult {
    const [q1Deg, q2Deg, d3] = joints;
    const d1 = params.baseHeight ?? 0.65;
    const l1 = params.lengthL1 ?? 0.40;
    const l2 = params.lengthL2 ?? 0.35;

    const q1 = MatrixMath.deg2rad(q1Deg);
    const q2 = MatrixMath.deg2rad(q2Deg);
    const q12 = q1 + q2;

    const p0: Vec3 = [0, 0, 0];
    const p1: Vec3 = [0, 0, d1];
    const p2: Vec3 = [l1 * Math.cos(q1), l1 * Math.sin(q1), d1];
    const p3: Vec3 = [
      p2[0] + l2 * Math.cos(q12),
      p2[1] + l2 * Math.sin(q12),
      d1 - d3
    ];

    const t01 = MatrixMath.rotZ4(q1);
    t01[2][3] = d1;
    const t02 = MatrixMath.translation4(p2[0], p2[1], d1);
    const t03 = MatrixMath.translation4(p3[0], p3[1], p3[2]);

    return {
      endEffector: p3,
      jointPositions: [p0, p1, p2, p3],
      transforms: [t01, t02, t03, t03],
      orientationEulerDeg: [0, 0, MatrixMath.rad2deg(q12)]
    };
  },

  ik(target: Vec3, params: Record<string, number>): IKSolution[] {
    const [tx, ty, tz] = target;
    const d1 = params.baseHeight ?? 0.65;
    const l1 = params.lengthL1 ?? 0.40;
    const l2 = params.lengthL2 ?? 0.35;
    const jDefs = this.joints;

    const solutions: IKSolution[] = [];
    const rSq = tx * tx + ty * ty;
    const r = Math.sqrt(rSq);
    const maxReach = l1 + l2;
    const minReach = Math.abs(l1 - l2);

    const d3 = d1 - tz;

    if (r > maxReach + 1e-4) {
      solutions.push({
        joints: [0, 0, d3],
        valid: false,
        branchName: 'Righty (Unreachable)',
        errorNorm: r - maxReach,
        violations: [`Target horizontal radius (${r.toFixed(3)}m) exceeds SCARA reach (${maxReach.toFixed(3)}m)`]
      });
      return solutions;
    }

    if (r < minReach - 1e-4) {
      solutions.push({
        joints: [0, 180, d3],
        valid: false,
        branchName: 'Folded (Unreachable)',
        errorNorm: minReach - r,
        violations: [`Target is within SCARA inner dead zone (${minReach.toFixed(3)}m)`]
      });
      return solutions;
    }

    const cosQ2Raw = (rSq - l1 * l1 - l2 * l2) / (2 * l1 * l2);
    const cosQ2 = MatrixMath.clamp(cosQ2Raw, -1.0, 1.0);
    const sinQ2 = Math.sqrt(Math.max(0, 1 - cosQ2 * cosQ2));

    // Two branches: Righty (elbow right / positive) and Lefty (elbow left / negative)
    const branches: { name: string; q2Sign: number }[] = [
      { name: 'Righty (Elbow Right)', q2Sign: 1 },
      { name: 'Lefty (Elbow Left)', q2Sign: -1 }
    ];

    for (const b of branches) {
      const q2Rad = Math.atan2(b.q2Sign * sinQ2, cosQ2);
      const q1Rad = Math.atan2(ty, tx) - Math.atan2(l2 * Math.sin(q2Rad), l1 + l2 * Math.cos(q2Rad));

      const q1Deg = MatrixMath.rad2deg(q1Rad);
      const q2Deg = MatrixMath.rad2deg(q2Rad);

      const violations: string[] = [];
      if (q1Deg < jDefs[0].min || q1Deg > jDefs[0].max) {
        violations.push(`J1 Base Yaw (${q1Deg.toFixed(1)}°) outside limits [${jDefs[0].min}°, ${jDefs[0].max}°]`);
      }
      if (q2Deg < jDefs[1].min || q2Deg > jDefs[1].max) {
        violations.push(`J2 Elbow Yaw (${q2Deg.toFixed(1)}°) outside limits [${jDefs[1].min}°, ${jDefs[1].max}°]`);
      }
      if (d3 < jDefs[2].min || d3 > jDefs[2].max) {
        violations.push(`J3 Quill Plunge (${d3.toFixed(3)}m) outside travel limits [${jDefs[2].min}, ${jDefs[2].max}]m`);
      }

      // Verify FK round-trip
      const fkTest = this.fk([q1Deg, q2Deg, d3], params);
      const err = MatrixMath.distance(target, fkTest.endEffector);

      solutions.push({
        joints: [q1Deg, q2Deg, d3],
        valid: violations.length === 0 && err < 1e-3,
        branchName: b.name,
        errorNorm: err,
        violations
      });
    }

    return solutions;
  },

  jacobian(joints: number[], params: Record<string, number>): Mat3 {
    const [q1Deg, q2Deg] = joints;
    const l1 = params.lengthL1 ?? 0.40;
    const l2 = params.lengthL2 ?? 0.35;

    const q1 = MatrixMath.deg2rad(q1Deg);
    const q2 = MatrixMath.deg2rad(q2Deg);
    const q12 = q1 + q2;

    const s1 = Math.sin(q1);
    const c1 = Math.cos(q1);
    const s12 = Math.sin(q12);
    const c12 = Math.cos(q12);

    return [
      [-l1 * s1 - l2 * s12, -l2 * s12,  0],
      [ l1 * c1 + l2 * c12,  l2 * c12,  0],
      [ 0,                  0,         -1]
    ];
  },

  singularityCheck(joints: number[], params: Record<string, number>): SingularityResult {
    const [, q2Deg] = joints;
    const l1 = params.lengthL1 ?? 0.40;
    const l2 = params.lengthL2 ?? 0.35;

    const q2 = MatrixMath.deg2rad(q2Deg);
    // det(J) = -l1 * l2 * sin(q2)
    const det = -l1 * l2 * Math.sin(q2);
    const manipulability = Math.abs(det);

    const isSingular = Math.abs(Math.sin(q2)) < 0.05;
    const maxDet = l1 * l2;
    const dist = maxDet > 0 ? Math.min(1, manipulability / maxDet) : 0;

    return {
      determinant: det,
      manipulability,
      isSingular,
      distanceToSingularity: Math.max(0, Math.min(1, dist)),
      warning: isSingular
        ? 'Elbow joint is fully extended (θ₂ ≈ 0°) or folded back (θ₂ ≈ ±180°). Loss of radial mobility in the XY plane!'
        : undefined
    };
  },

  workspaceSampler(params: Record<string, number>, sampleCount = 600): Vec3[] {
    const d1 = params.baseHeight ?? 0.65;
    const l1 = params.lengthL1 ?? 0.40;
    const l2 = params.lengthL2 ?? 0.35;
    const rMax = l1 + l2;
    const rMin = Math.abs(l1 - l2);
    const minZ = d1 - 0.35;
    const maxZ = d1 - 0.02;

    const pts: Vec3[] = [];
    const thSteps = Math.floor(Math.sqrt(sampleCount) * 1.5);
    const zSteps = Math.floor(sampleCount / thSteps);

    for (let i = 0; i < thSteps; i++) {
      const th = (i / thSteps) * Math.PI * 2;
      for (let j = 0; j <= zSteps; j++) {
        const z = minZ + (j / zSteps) * (maxZ - minZ);
        // Outer boundary cylinder
        pts.push([rMax * Math.cos(th), rMax * Math.sin(th), z]);
        // Inner deadzone cylinder
        if (j % 2 === 0 && rMin > 0.05) {
          pts.push([rMin * Math.cos(th), rMin * Math.sin(th), z]);
        }
      }
    }
    return pts;
  },

  specs(params: Record<string, number>): ArmSpecs {
    const d1 = params.baseHeight ?? 0.65;
    const l1 = params.lengthL1 ?? 0.40;
    const l2 = params.lengthL2 ?? 0.35;
    const rMax = l1 + l2;
    const rMin = Math.abs(l1 - l2);
    const zStroke = 0.33;
    const vol = Math.PI * (rMax * rMax - rMin * rMin) * zStroke;

    return {
      type: 'scara',
      name: 'SCARA Assembly Robot (R-R-P)',
      dof: 3,
      jointSequence: 'R-R-P',
      maxReach: rMax,
      minReach: rMin,
      workspaceShape: 'Hollow Flat Cylinder / Donut Slab',
      approxVolume: parseFloat(vol.toFixed(3)),
      footprint: `Ø${(rMax * 2).toFixed(1)}m cylindrical envelope`,
      totalHeight: `${(d1 + 0.15).toFixed(2)}m`,
      singularityConditions: [
        'Boundary: Elbow straight (θ₂ = 0°) or folded back (θ₂ = ±180°)'
      ],
      ikSolutionCount: 2,
      typicalPayloadKg: 5.0,
      repeatabilityMm: 0.015,
      maxToolSpeedMs: 3.2
    };
  },

  learnContent: {
    title: 'SCARA (Selective Compliance Articulated Robot Arm)',
    subtitle: 'High-Speed Precision Insertion & PCB Assembly',
    description:
      'Invented by Hiroshi Makino at Yamanashi University in 1978, the SCARA design provides compliant horizontal motion (XY) combined with high vertical stiffness (Z). This selective compliance makes it the gold standard for peg-in-hole assembly, electronics, and semiconductor packaging.',
    realWorldUses: [
      'High-speed PCB surface-mount pick and place',
      'Electronic device screw fastening and insertion',
      'Battery cell packaging and testing',
      'High-speed pharmaceutical bottling and sorting'
    ],
    advantages: [
      'Extremely high cycle speeds (> 3 m/s tool speed)',
      'High vertical stiffness with passive compliance in the XY plane to guide insertions',
      'Two distinct inverse kinematics branches (Lefty and Righty) for obstacle avoidance',
      'Superior repeatability (down to 15 microns)'
    ],
    limitations: [
      'Limited vertical Z stroke (typically 150 - 400 mm)',
      'Purely top-down vertical assembly orientation',
      'Singularity when the forearm link is collinear with the inner link (elbow lock)'
    ],
    equations: {
      title: 'SCARA Closed-Form Kinematics',
      fk: [
        'x = L_1 \\cos\\theta_1 + L_2 \\cos(\\theta_1 + \\theta_2)',
        'y = L_1 \\sin\\theta_1 + L_2 \\sin(\\theta_1 + \\theta_2)',
        'z = d_1 - d_3'
      ],
      ik: [
        '\\cos\\theta_2 = \\frac{x^2 + y^2 - L_1^2 - L_2^2}{2 L_1 L_2}',
        '\\theta_1 = \\text{atan2}(y, x) - \\text{atan2}(L_2 \\sin\\theta_2, L_1 + L_2 \\cos\\theta_2)',
        'd_3 = d_1 - z'
      ],
      jacobian:
        'J = \\begin{bmatrix} -L_1 s_1 - L_2 s_{12} & -L_2 s_{12} & 0 \\\\ L_1 c_1 + L_2 c_{12} & L_2 c_{12} & 0 \\\\ 0 & 0 & -1 \\end{bmatrix}, \\quad \\det(J) = -L_1 L_2 \\sin\\theta_2',
      singularities: '\\det(J) = 0 \\iff \\sin\\theta_2 = 0 \\quad (\\text{Elbow fully straight or folded})'
    }
  },

  meshSpec: {
    baseColor: '#0f172a',
    linkColors: ['#06b6d4', '#14b8a6', '#f43f5e'],
    endEffectorColor: '#a855f7',
    links: [
      { shape: 'box', color: '#06b6d4' },
      { shape: 'box', color: '#14b8a6' },
      { shape: 'quill', color: '#f43f5e' }
    ]
  }
};
