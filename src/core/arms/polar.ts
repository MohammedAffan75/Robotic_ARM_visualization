import { ArmDefinition, ArmSpecs, DHRow, FKResult, IKSolution, SingularityResult } from './types';
import { Mat3, Mat4, MatrixMath, Vec3 } from '../math/matrix';

export const PolarArm: ArmDefinition = {
  id: 'polar',
  name: 'Polar / Spherical (R-R-P)',
  dof: 3,
  jointSequence: 'R-R-P',
  description: 'Spherical coordinates manipulator with rotary waist, pitching shoulder, and extending linear boom.',
  joints: [
    {
      id: 'j1',
      name: 'Base Azimuth',
      symbol: 'θ',
      type: 'R',
      axis: 'z',
      min: -180,
      max: 180,
      defaultVal: 30,
      unit: 'deg',
      step: 1,
      description: 'Waist azimuth angle around vertical Z axis'
    },
    {
      id: 'j2',
      name: 'Elevation Pitch',
      symbol: 'φ',
      type: 'R',
      axis: 'y',
      min: -30,
      max: 85,
      defaultVal: 25,
      unit: 'deg',
      step: 1,
      description: 'Shoulder elevation angle above horizontal plane'
    },
    {
      id: 'j3',
      name: 'Telescoping Boom',
      symbol: 'r',
      type: 'P',
      axis: 'x',
      min: 0.2,
      max: 0.9,
      defaultVal: 0.55,
      unit: 'm',
      step: 0.01,
      description: 'Radial linear stroke of telescoping boom'
    }
  ],
  defaultParameters: {
    baseHeight: 0.4,
    minBoomLength: 0.2,
    maxBoomLength: 0.9
  },
  parameterDefs: [
    {
      id: 'baseHeight',
      name: 'Pedestal Base Height',
      value: 0.4,
      min: 0.1,
      max: 0.8,
      step: 0.05,
      unit: 'm',
      description: 'Height of shoulder pivot above floor'
    },
    {
      id: 'maxBoomLength',
      name: 'Max Boom Extension',
      value: 0.9,
      min: 0.4,
      max: 1.5,
      step: 0.05,
      unit: 'm',
      description: 'Maximum radial stroke length'
    }
  ],

  dhTable(joints: number[], params: Record<string, number>): DHRow[] {
    const [thDeg, phiDeg, r] = joints;
    const d1 = params.baseHeight ?? 0.4;
    return [
      { jointIndex: 1, theta: thDeg, d: d1, a: 0, alpha: -90, variable: 'theta' },
      { jointIndex: 2, theta: phiDeg - 90, d: 0, a: 0, alpha: 90, variable: 'theta' },
      { jointIndex: 3, theta: 0, d: r, a: 0, alpha: 0, variable: 'd' }
    ];
  },

  fk(joints: number[], params: Record<string, number>): FKResult {
    const [thDeg, phiDeg, r] = joints;
    const d1 = params.baseHeight ?? 0.4;

    const thRad = MatrixMath.deg2rad(thDeg);
    const phiRad = MatrixMath.deg2rad(phiDeg);

    const rCosPhi = r * Math.cos(phiRad);
    const x = rCosPhi * Math.cos(thRad);
    const y = rCosPhi * Math.sin(thRad);
    const z = d1 + r * Math.sin(phiRad);

    const p0: Vec3 = [0, 0, 0];
    const p1: Vec3 = [0, 0, d1];
    const p2: Vec3 = [
      (r * 0.4) * Math.cos(phiRad) * Math.cos(thRad),
      (r * 0.4) * Math.cos(phiRad) * Math.sin(thRad),
      d1 + (r * 0.4) * Math.sin(phiRad)
    ];
    const p3: Vec3 = [x, y, z];

    const t01: Mat4 = MatrixMath.rotZ4(thRad);
    t01[2][3] = d1;
    const t02 = MatrixMath.multiply4x4(t01, MatrixMath.rotY4(-phiRad));
    const t03 = MatrixMath.multiply4x4(t02, MatrixMath.translation4(r, 0, 0));

    return {
      endEffector: [x, y, z],
      jointPositions: [p0, p1, p2, p3],
      transforms: [t01, t02, t03, t03],
      orientationEulerDeg: [0, phiDeg, thDeg]
    };
  },

  ik(target: Vec3, params: Record<string, number>): IKSolution[] {
    const [tx, ty, tz] = target;
    const d1 = params.baseHeight ?? 0.4;
    const jDefs = this.joints;

    const dz = tz - d1;
    const rXy = Math.sqrt(tx * tx + ty * ty);
    const r = Math.sqrt(rXy * rXy + dz * dz);

    const thRad = Math.atan2(ty, tx);
    const thDeg = MatrixMath.rad2deg(thRad);

    const phiRad = Math.atan2(dz, rXy);
    const phiDeg = MatrixMath.rad2deg(phiRad);

    const violations: string[] = [];
    if (r < jDefs[2].min || r > jDefs[2].max) {
      violations.push(`Radial reach (${r.toFixed(3)}m) outside boom limits [${jDefs[2].min}, ${jDefs[2].max}]m`);
    }
    if (phiDeg < jDefs[1].min || phiDeg > jDefs[1].max) {
      violations.push(`Elevation φ (${phiDeg.toFixed(1)}°) outside pitch limits [${jDefs[1].min}°, ${jDefs[1].max}°]`);
    }
    if (thDeg < jDefs[0].min || thDeg > jDefs[0].max) {
      violations.push(`Waist azimuth θ (${thDeg.toFixed(1)}°) outside limits [${jDefs[0].min}°, ${jDefs[0].max}°]`);
    }

    const sol: IKSolution = {
      joints: [thDeg, phiDeg, r],
      valid: violations.length === 0,
      branchName: 'Direct Spherical',
      errorNorm: 0,
      violations
    };

    return [sol];
  },

  jacobian(joints: number[]): Mat3 {
    const [thDeg, phiDeg, r] = joints;
    const th = MatrixMath.deg2rad(thDeg);
    const phi = MatrixMath.deg2rad(phiDeg);

    const cTh = Math.cos(th);
    const sTh = Math.sin(th);
    const cPh = Math.cos(phi);
    const sPh = Math.sin(phi);

    return [
      [-r * cPh * sTh, -r * sPh * cTh, cPh * cTh],
      [ r * cPh * cTh, -r * sPh * sTh, cPh * sTh],
      [ 0,              r * cPh,       sPh      ]
    ];
  },

  singularityCheck(joints: number[]): SingularityResult {
    const [, phiDeg, r] = joints;
    const phiRad = MatrixMath.deg2rad(phiDeg);
    const det = r * r * Math.cos(phiRad);
    const manipulability = Math.abs(det);

    const isNearPoles = Math.abs(Math.abs(phiDeg) - 90) < 5 || Math.abs(phiDeg) > 85;
    const isCollapsed = r < 0.15;
    const isSingular = isNearPoles || isCollapsed;

    let warning: string | undefined;
    if (isNearPoles) {
      warning = 'Shoulder elevation is near ±90° (gimbal lock). Azimuth θ aligns with radial axis, losing a Cartesian degree of freedom!';
    } else if (isCollapsed) {
      warning = 'Boom is fully retracted near pivot (r ≈ 0).';
    }

    return {
      determinant: det,
      manipulability,
      isSingular,
      distanceToSingularity: Math.max(0, Math.min(1, Math.cos(phiRad) * (r / 0.8))),
      warning
    };
  },

  workspaceSampler(params: Record<string, number>, sampleCount = 600): Vec3[] {
    const d1 = params.baseHeight ?? 0.4;
    const rMin = 0.2;
    const rMax = params.maxBoomLength ?? 0.9;
    const minPhi = MatrixMath.deg2rad(-30);
    const maxPhi = MatrixMath.deg2rad(80);

    const pts: Vec3[] = [];
    const phiSteps = Math.floor(Math.sqrt(sampleCount));
    const thSteps = Math.floor(sampleCount / phiSteps);

    for (let i = 0; i < thSteps; i++) {
      const th = (i / thSteps) * Math.PI * 2;
      for (let j = 0; j <= phiSteps; j++) {
        const phi = minPhi + (j / phiSteps) * (maxPhi - minPhi);
        const cp = Math.cos(phi);
        const sp = Math.sin(phi);

        // Outer spherical shell
        pts.push([rMax * cp * Math.cos(th), rMax * cp * Math.sin(th), d1 + rMax * sp]);
        // Inner spherical shell
        if (j % 2 === 0) {
          pts.push([rMin * cp * Math.cos(th), rMin * cp * Math.sin(th), d1 + rMin * sp]);
        }
      }
    }
    return pts;
  },

  specs(params: Record<string, number>): ArmSpecs {
    const d1 = params.baseHeight ?? 0.4;
    const rMin = 0.2;
    const rMax = params.maxBoomLength ?? 0.9;
    const solidAngle = 2 * Math.PI * (Math.sin(MatrixMath.deg2rad(80)) - Math.sin(MatrixMath.deg2rad(-30)));
    const vol = (1 / 3) * (Math.pow(rMax, 3) - Math.pow(rMin, 3)) * solidAngle;

    return {
      type: 'polar',
      name: 'Polar / Spherical Robot (R-R-P)',
      dof: 3,
      jointSequence: 'R-R-P',
      maxReach: rMax,
      minReach: rMin,
      workspaceShape: 'Spherical Shell Sector (Cone Sweep)',
      approxVolume: parseFloat(vol.toFixed(3)),
      footprint: `Ø${(rMax * 2).toFixed(1)}m spherical envelope`,
      totalHeight: `${(d1 + rMax).toFixed(2)}m`,
      singularityConditions: [
        'Singular at φ = ±90° (pointing straight up/down, azimuth loses horizontal control)',
        'Singular at r = 0 (collapsed boom)'
      ],
      ikSolutionCount: 1,
      typicalPayloadKg: 20.0,
      repeatabilityMm: 0.08,
      maxToolSpeedMs: 2.0
    };
  },

  learnContent: {
    title: 'Polar / Spherical (R-R-P) Robot (e.g. Unimate)',
    subtitle: 'Classic Heritage of Modern Industrial Robotics',
    description:
      'The Unimate—the very first industrial robot installed at GM in 1961—was a polar/spherical coordinate robot. It combines waist azimuth θ, shoulder elevation pitch φ, and a telescoping radial boom r.',
    realWorldUses: [
      'Unimate-style heritage manufacturing and die-casting',
      'Automotive spot welding on assembly lines',
      'Aircraft fuselage riveters and surface polishers',
      'Large naval artillery and mobile crane loaders'
    ],
    advantages: [
      'Large hemispherical reaching volume from a compact base pedestal',
      'High mechanical leverage when boom is retracted',
      'Easy spherical coordinate indexing'
    ],
    limitations: [
      'Singularity pointing directly vertical (φ = 90°), causing gimbal lock',
      'Telescoping boom requires high maintenance and protective bellows',
      'Variable positional deflection along long boom extensions'
    ],
    equations: {
      title: 'Polar Coordinate Kinematics',
      fk: [
        'x = r \\cos\\phi \\cos\\theta',
        'y = r \\cos\\phi \\sin\\theta',
        'z = d_1 + r \\sin\\phi'
      ],
      ik: [
        '\\theta = \\text{atan2}(y, x)',
        '\\phi = \\text{atan2}(z - d_1, \\sqrt{x^2 + y^2})',
        'r = \\sqrt{x^2 + y^2 + (z - d_1)^2}'
      ],
      jacobian:
        'J = \\begin{bmatrix} -r c_\\phi s_\\theta & -r s_\\phi c_\\theta & c_\\phi c_\\theta \\\\ r c_\\phi c_\\theta & -r s_\\phi s_\\theta & c_\\phi s_\\theta \\\\ 0 & r c_\\phi & s_\\phi \\end{bmatrix}, \\quad \\det(J) = r^2 \\cos\\phi',
      singularities: '\\det(J) = r^2 \\cos\\phi = 0 \\iff r = 0 \\quad \\text{or} \\quad \\phi = \\pm 90^\\circ'
    }
  },

  meshSpec: {
    baseColor: '#1e293b',
    linkColors: ['#6366f1', '#a855f7', '#ec4899'],
    endEffectorColor: '#f43f5e',
    links: [
      { shape: 'cylinder', color: '#6366f1' },
      { shape: 'box', color: '#a855f7' },
      { shape: 'telescope', color: '#ec4899' }
    ]
  }
};
