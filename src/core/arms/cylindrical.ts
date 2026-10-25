import { ArmDefinition, ArmSpecs, DHRow, FKResult, IKSolution, SingularityResult } from './types';
import { Mat3, Mat4, MatrixMath, Vec3 } from '../math/matrix';

export const CylindricalArm: ArmDefinition = {
  id: 'cylindrical',
  name: 'Cylindrical (R-P-P)',
  dof: 3,
  jointSequence: 'R-P-P',
  description: 'Revolute waist base rotation with linear vertical elevation and radial telescoping boom.',
  joints: [
    {
      id: 'j1',
      name: 'Waist Rotation',
      symbol: 'θ',
      type: 'R',
      axis: 'z',
      min: -180,
      max: 180,
      defaultVal: 35,
      unit: 'deg',
      step: 1,
      description: 'Revolute base rotation about the central vertical Z axis'
    },
    {
      id: 'j2',
      name: 'Radial Extension',
      symbol: 'r',
      type: 'P',
      axis: 'x',
      min: 0.1,
      max: 0.8,
      defaultVal: 0.45,
      unit: 'm',
      step: 0.01,
      description: 'Horizontal telescoping linear boom stroke'
    },
    {
      id: 'j3',
      name: 'Vertical Elevation',
      symbol: 'd_z',
      type: 'P',
      axis: 'z',
      min: 0.05,
      max: 0.85,
      defaultVal: 0.4,
      unit: 'm',
      step: 0.01,
      description: 'Vertical carriage translation along the center column'
    }
  ],
  defaultParameters: {
    columnRadius: 0.08,
    columnHeight: 1.0,
    minRadialReach: 0.1,
    maxRadialReach: 0.8,
    verticalStroke: 0.8
  },
  parameterDefs: [
    {
      id: 'columnRadius',
      name: 'Column Deadzone Radius',
      value: 0.08,
      min: 0.04,
      max: 0.25,
      step: 0.01,
      unit: 'm',
      description: 'Physical radius of column creating inner dead zone'
    },
    {
      id: 'maxRadialReach',
      name: 'Max Radial Boom Reach',
      value: 0.8,
      min: 0.3,
      max: 1.5,
      step: 0.05,
      unit: 'm',
      description: 'Maximum extended stroke of telescoping boom'
    },
    {
      id: 'verticalStroke',
      name: 'Vertical Travel',
      value: 0.8,
      min: 0.3,
      max: 1.4,
      step: 0.05,
      unit: 'm',
      description: 'Total vertical height range'
    }
  ],

  dhTable(joints: number[]): DHRow[] {
    const [thetaDeg, r, dz] = joints;
    return [
      { jointIndex: 1, theta: thetaDeg, d: dz, a: 0, alpha: 90, variable: 'theta' },
      { jointIndex: 2, theta: 0, d: dz, a: 0, alpha: 0, variable: 'd' },
      { jointIndex: 3, theta: 0, d: 0, a: r, alpha: 0, variable: 'd' }
    ];
  },

  fk(joints: number[]): FKResult {
    const [thDeg, r, dz] = joints;
    const thRad = MatrixMath.deg2rad(thDeg);

    const x = r * Math.cos(thRad);
    const y = r * Math.sin(thRad);
    const z = dz;

    const p0: Vec3 = [0, 0, 0];
    const p1: Vec3 = [0, 0, dz];
    const p2: Vec3 = [x * 0.4, y * 0.4, dz];
    const p3: Vec3 = [x, y, dz];

    const t01: Mat4 = MatrixMath.rotZ4(thRad);
    t01[2][3] = dz;
    const t02: Mat4 = MatrixMath.translation4(x * 0.5, y * 0.5, dz);
    const t03: Mat4 = MatrixMath.translation4(x, y, dz);

    return {
      endEffector: [x, y, z],
      jointPositions: [p0, p1, p2, p3],
      transforms: [t01, t02, t03, t03],
      orientationEulerDeg: [0, 0, thDeg]
    };
  },

  ik(target: Vec3, params: Record<string, number>): IKSolution[] {
    const [tx, ty, tz] = target;
    const jDefs = this.joints;
    const colRadius = params.columnRadius ?? 0.08;

    const r = Math.sqrt(tx * tx + ty * ty);
    const thRad = Math.atan2(ty, tx);
    const thDeg = MatrixMath.rad2deg(thRad);
    const dz = tz;

    const violations: string[] = [];
    if (r < colRadius) {
      violations.push(`Target inside column dead zone (radius ${colRadius.toFixed(2)}m)`);
    }
    if (r < jDefs[1].min || r > jDefs[1].max) {
      violations.push(`Radial distance (${r.toFixed(3)}m) outside boom range [${jDefs[1].min}, ${jDefs[1].max}]m`);
    }
    if (thDeg < jDefs[0].min || thDeg > jDefs[0].max) {
      violations.push(`Azimuth θ (${thDeg.toFixed(1)}°) outside waist limits [${jDefs[0].min}°, ${jDefs[0].max}°]`);
    }
    if (dz < jDefs[2].min || dz > jDefs[2].max) {
      violations.push(`Vertical height (${dz.toFixed(3)}m) outside column stroke [${jDefs[2].min}, ${jDefs[2].max}]m`);
    }

    const sol: IKSolution = {
      joints: [thDeg, r, dz],
      valid: violations.length === 0,
      branchName: 'Primary Cylindrical',
      errorNorm: 0,
      violations
    };

    return [sol];
  },

  jacobian(joints: number[]): Mat3 {
    const [thDeg, r] = joints;
    const th = MatrixMath.deg2rad(thDeg);
    const c = Math.cos(th);
    const s = Math.sin(th);

    // dx/d(th, r, z) = [ -r*s,  c, 0 ]
    // dy/d(th, r, z) = [  r*c,  s, 0 ]
    // dz/d(th, r, z) = [    0,  0, 1 ]
    return [
      [-r * s, c, 0],
      [ r * c, s, 0],
      [     0, 0, 1]
    ];
  },

  singularityCheck(joints: number[]): SingularityResult {
    const [, r] = joints;
    const det = -r; // |det| = r
    const manipulability = Math.abs(r);
    const isSingular = r < 0.05;

    return {
      determinant: det,
      manipulability,
      isSingular,
      distanceToSingularity: Math.max(0, Math.min(1, r / 0.75)),
      warning: isSingular
        ? 'Radial boom is fully retracted near center column axis (r ≈ 0). Waist rotation loses translation authority!'
        : undefined
    };
  },

  workspaceSampler(params: Record<string, number>, sampleCount = 600): Vec3[] {
    const rMin = params.columnRadius ?? 0.1;
    const rMax = params.maxRadialReach ?? 0.8;
    const zMin = 0.05;
    const zMax = zMin + (params.verticalStroke ?? 0.8);

    const pts: Vec3[] = [];
    const thSteps = Math.floor(Math.sqrt(sampleCount) * 1.5);
    const zSteps = Math.floor(sampleCount / thSteps);

    for (let i = 0; i < thSteps; i++) {
      const th = (i / thSteps) * Math.PI * 2;
      for (let j = 0; j <= zSteps; j++) {
        const z = zMin + (j / zSteps) * (zMax - zMin);
        // Outer boundary cylinder
        pts.push([rMax * Math.cos(th), rMax * Math.sin(th), z]);
        // Inner boundary cylinder (dead zone)
        if (j % 2 === 0) {
          pts.push([rMin * Math.cos(th), rMin * Math.sin(th), z]);
        }
      }
    }
    return pts;
  },

  specs(params: Record<string, number>): ArmSpecs {
    const rMin = params.columnRadius ?? 0.1;
    const rMax = params.maxRadialReach ?? 0.8;
    const h = params.verticalStroke ?? 0.8;
    const vol = Math.PI * (rMax * rMax - rMin * rMin) * h;

    return {
      type: 'cylindrical',
      name: 'Cylindrical Coordinate Robot (R-P-P)',
      dof: 3,
      jointSequence: 'R-P-P',
      maxReach: Math.sqrt(rMax * rMax + h * h),
      minReach: rMin,
      workspaceShape: 'Hollow Cylinder (Annulus sweep)',
      approxVolume: parseFloat(vol.toFixed(3)),
      footprint: `Ø${(rMax * 2).toFixed(1)}m cylindrical envelope`,
      totalHeight: `${(h + 0.2).toFixed(2)}m`,
      singularityConditions: ['Singular at r = 0 (boom fully retracted to central column)'],
      ikSolutionCount: 1,
      typicalPayloadKg: 15.0,
      repeatabilityMm: 0.05,
      maxToolSpeedMs: 1.8
    };
  },

  learnContent: {
    title: 'Cylindrical (R-P-P) Robot',
    subtitle: 'Rotational Base with Radial & Vertical Strokes',
    description:
      'The cylindrical manipulator combines a rotary base (theta) with two linear sliding axes (radius r and elevation z). Its workspace creates a hollow cylinder around the central structural column.',
    realWorldUses: [
      'Semiconductor wafer transfer in vacuum cassettes',
      'Die-casting and foundry machine tending',
      'Automated pallet loading around circular conveyors',
      'Pipe inspection and circular welding stations'
    ],
    advantages: [
      'Very compact base footprint relative to work volume',
      'Intuitive cylindrical coordinates (theta, r, z)',
      'Substantial vertical rigidity along the central column'
    ],
    limitations: [
      'Central column dead zone: cannot reach its own center (r < r_min)',
      'Singularity at r = 0 where rotary velocity produces zero end-effector linear velocity',
      'Linear horizontal boom can obstruct surrounding machinery during rotation'
    ],
    equations: {
      title: 'Cylindrical Kinematic Equations',
      fk: ['x = r \\cos(\\theta)', 'y = r \\sin(\\theta)', 'z = d_z'],
      ik: [
        '\\theta = \\text{atan2}(y, x)',
        'r = \\sqrt{x^2 + y^2}',
        'd_z = z'
      ],
      jacobian:
        'J = \\begin{bmatrix} -r \\sin\\theta & \\cos\\theta & 0 \\\\ r \\cos\\theta & \\sin\\theta & 0 \\\\ 0 & 0 & 1 \\end{bmatrix}, \\quad \\det(J) = -r',
      singularities: '\\det(J) = -r = 0 \\iff r = 0 \\quad (\\text{Loss of velocity tangent to azimuth})'
    }
  },

  meshSpec: {
    baseColor: '#1e293b',
    linkColors: ['#3b82f6', '#f97316', '#10b981'],
    endEffectorColor: '#eab308',
    links: [
      { shape: 'cylinder', color: '#3b82f6' },
      { shape: 'telescope', color: '#f97316' },
      { shape: 'quill', color: '#10b981' }
    ]
  }
};
