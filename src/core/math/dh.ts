import { Mat4, MatrixMath } from './matrix';

export interface DHSegment {
  theta: number; // joint angle (rad)
  d: number;     // link offset along z (m)
  a: number;     // link length along x (m)
  alpha: number; // link twist about x (rad)
}

/**
 * Computes the 4x4 standard Denavit-Hartenberg transformation matrix:
 * T_i^(i-1) = Rot_z(theta_i) * Trans_z(d_i) * Trans_x(a_i) * Rot_x(alpha_i)
 */
export function dhTransform(dh: DHSegment): Mat4 {
  const { theta, d, a, alpha } = dh;
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);

  return [
    [ct, -st * ca,  st * sa, a * ct],
    [st,  ct * ca, -ct * sa, a * st],
    [0,   sa,       ca,      d     ],
    [0,   0,        0,       1     ]
  ];
}

/**
 * Computes forward kinematics chain from an array of DH segments.
 * Returns each cumulative transform T0_i and link positions.
 */
export function chainDHTransforms(segments: DHSegment[]): {
  transforms: Mat4[];
  positions: [number, number, number][];
} {
  let currentT = MatrixMath.identity4();
  const transforms: Mat4[] = [currentT];
  const positions: [number, number, number][] = [[0, 0, 0]];

  for (const seg of segments) {
    const ti = dhTransform(seg);
    currentT = MatrixMath.multiply4x4(currentT, ti);
    transforms.push(currentT);
    positions.push(MatrixMath.extractTranslation(currentT));
  }

  return { transforms, positions };
}
