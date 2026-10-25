/**
 * Pure TypeScript linear algebra utilities for 3-DOF robot arm kinematics.
 * No external dependencies. High performance and numerically stable.
 */

export type Vec3 = [number, number, number];
export type Mat3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];
export type Mat4 = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number]
];

export const MatrixMath = {
  identity3(): Mat3 {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
  },

  identity4(): Mat4 {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];
  },

  det3(m: Mat3): number {
    return (
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
      m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
      m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    );
  },

  inv3(m: Mat3): Mat3 | null {
    const det = this.det3(m);
    if (Math.abs(det) < 1e-12) return null;
    const invDet = 1 / det;

    return [
      [
        (m[1][1] * m[2][2] - m[1][2] * m[2][1]) * invDet,
        (m[0][2] * m[2][1] - m[0][1] * m[2][2]) * invDet,
        (m[0][1] * m[1][2] - m[0][2] * m[1][1]) * invDet
      ],
      [
        (m[1][2] * m[2][0] - m[1][0] * m[2][2]) * invDet,
        (m[0][0] * m[2][2] - m[0][2] * m[2][0]) * invDet,
        (m[0][2] * m[1][0] - m[0][0] * m[1][2]) * invDet
      ],
      [
        (m[1][0] * m[2][1] - m[1][1] * m[2][0]) * invDet,
        (m[0][1] * m[2][0] - m[0][0] * m[2][1]) * invDet,
        (m[0][0] * m[1][1] - m[0][1] * m[1][0]) * invDet
      ]
    ];
  },

  transpose3(m: Mat3): Mat3 {
    return [
      [m[0][0], m[1][0], m[2][0]],
      [m[0][1], m[1][1], m[2][1]],
      [m[0][2], m[1][2], m[2][2]]
    ];
  },

  multiply3x3(a: Mat3, b: Mat3): Mat3 {
    const res = this.identity3();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        res[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
      }
    }
    return res;
  },

  multiply3xVec(m: Mat3, v: Vec3): Vec3 {
    return [
      m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
      m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
      m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]
    ];
  },

  multiply4x4(a: Mat4, b: Mat4): Mat4 {
    const res: Mat4 = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        res[i][j] =
          a[i][0] * b[0][j] +
          a[i][1] * b[1][j] +
          a[i][2] * b[2][j] +
          a[i][3] * b[3][j];
      }
    }
    return res;
  },

  multiply4xVec3(m: Mat4, v: Vec3): Vec3 {
    return [
      m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2] + m[0][3],
      m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2] + m[1][3],
      m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2] + m[2][3]
    ];
  },

  translation4(x: number, y: number, z: number): Mat4 {
    return [
      [1, 0, 0, x],
      [0, 1, 0, y],
      [0, 0, 1, z],
      [0, 0, 0, 1]
    ];
  },

  rotX4(rad: number): Mat4 {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [
      [1, 0, 0, 0],
      [0, c, -s, 0],
      [0, s, c, 0],
      [0, 0, 0, 1]
    ];
  },

  rotY4(rad: number): Mat4 {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [
      [c, 0, s, 0],
      [0, 1, 0, 0],
      [-s, 0, c, 0],
      [0, 0, 0, 1]
    ];
  },

  rotZ4(rad: number): Mat4 {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [
      [c, -s, 0, 0],
      [s, c, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];
  },

  extractTranslation(m: Mat4): Vec3 {
    return [m[0][3], m[1][3], m[2][3]];
  },

  /**
   * Yoshikawa's manipulability index: w = sqrt(det(J * J^T))
   * For square 3x3: w = |det(J)|
   */
  manipulability(j: Mat3): number {
    const det = this.det3(j);
    return Math.abs(det);
  },

  /**
   * Vector distance
   */
  distance(a: Vec3, b: Vec3): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  norm(v: Vec3): number {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  },

  deg2rad(deg: number): number {
    return (deg * Math.PI) / 180;
  },

  rad2deg(rad: number): number {
    return (rad * 180) / Math.PI;
  },

  clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }
};
