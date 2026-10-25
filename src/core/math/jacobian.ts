import { Mat3, MatrixMath, Vec3 } from './matrix';

export interface JacobianAnalysis {
  jacobian: Mat3;
  determinant: number;
  manipulability: number;
  conditionNumber: number; // ratio of max to min singular value estimate
  isNearSingularity: boolean;
  singularityDistance: number; // 0 (singular) to 1 (isotropic/optimal)
}

/**
 * Computes numerical Jacobian for any 3-DOF arm given its FK function.
 * Uses central differences: dFK/dq_i = (FK(q + h) - FK(q - h)) / (2h)
 */
export function computeNumericalJacobian(
  fkFn: (joints: number[]) => Vec3,
  joints: number[],
  eps = 1e-5
): Mat3 {
  const J: Mat3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  for (let i = 0; i < 3; i++) {
    const qPlus = [...joints];
    const qMinus = [...joints];
    qPlus[i] += eps;
    qMinus[i] -= eps;

    const pPlus = fkFn(qPlus);
    const pMinus = fkFn(qMinus);

    J[0][i] = (pPlus[0] - pMinus[0]) / (2 * eps);
    J[1][i] = (pPlus[1] - pMinus[1]) / (2 * eps);
    J[2][i] = (pPlus[2] - pMinus[2]) / (2 * eps);
  }

  return J;
}

/**
 * Cross-checks analytical Jacobian against numerical Jacobian.
 * Returns max absolute element-wise error.
 */
export function crossCheckJacobian(
  analyticalJ: Mat3,
  numericalJ: Mat3
): { maxError: number; matches: boolean } {
  let maxError = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const err = Math.abs(analyticalJ[r][c] - numericalJ[r][c]);
      if (err > maxError) maxError = err;
    }
  }
  return {
    maxError,
    matches: maxError < 1e-3
  };
}

/**
 * Detailed singularity analysis from a 3x3 Jacobian
 */
export function analyzeJacobian(J: Mat3, singularityThreshold = 0.005): JacobianAnalysis {
  const det = MatrixMath.det3(J);
  const manipulability = MatrixMath.manipulability(J);

  // Approximate condition number via Frobenius norm vs det
  // Norm of J
  let fNormSq = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      fNormSq += J[r][c] * J[r][c];
    }
  }
  const fNorm = Math.sqrt(fNormSq);

  // Normalized singularity distance metric (0 = singular, 1 = well conditioned)
  // Characteristic scale factor based on Frobenius norm cubed vs determinant
  const theoreticalMaxDet = Math.pow(Math.max(0.1, fNorm / Math.sqrt(3)), 3);
  const normalizedScore = theoreticalMaxDet > 1e-6
    ? Math.min(1.0, manipulability / theoreticalMaxDet)
    : 0;

  const isNear = manipulability < singularityThreshold;

  return {
    jacobian: J,
    determinant: det,
    manipulability,
    conditionNumber: manipulability > 1e-6 ? fNorm / manipulability : 999.0,
    isNearSingularity: isNear,
    singularityDistance: Math.max(0, Math.min(1, normalizedScore))
  };
}
