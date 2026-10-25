import { MatrixMath, Vec3 } from './matrix';
import { computeNumericalJacobian } from './jacobian';

export interface DLSSolveOptions {
  maxIterations?: number;
  tolerance?: number;
  dampingLambda?: number;
  stepClamp?: number;
}

export interface DLSSolveResult {
  joints: number[];
  converged: boolean;
  iterations: number;
  finalError: number;
}

/**
 * Solves Inverse Kinematics numerically using Damped Least Squares (Levenberg-Marquardt):
 * dq = J^T * (J * J^T + lambda^2 * I)^(-1) * e
 */
export function solveDLS(
  target: Vec3,
  initialJoints: number[],
  fkFn: (joints: number[]) => Vec3,
  limits?: { min: number; max: number }[],
  options?: DLSSolveOptions
): DLSSolveResult {
  const maxIter = options?.maxIterations ?? 60;
  const tol = options?.tolerance ?? 1e-4;
  const lambda = options?.dampingLambda ?? 0.05;
  const stepClamp = options?.stepClamp ?? 0.35;

  let q = [...initialJoints];
  let iterations = 0;
  let finalError = 0;

  for (let it = 0; it < maxIter; it++) {
    iterations = it + 1;
    const currentPos = fkFn(q);
    const error: Vec3 = [
      target[0] - currentPos[0],
      target[1] - currentPos[1],
      target[2] - currentPos[2]
    ];

    finalError = MatrixMath.norm(error);
    if (finalError < tol) {
      return { joints: q, converged: true, iterations, finalError };
    }

    // Compute Jacobian at current pose
    const J = computeNumericalJacobian(fkFn, q);

    // Compute J * J^T (3x3)
    const Jt = MatrixMath.transpose3(J);
    const JJt = MatrixMath.multiply3x3(J, Jt);

    // Add damping: JJt + lambda^2 * I
    const lambdaSq = lambda * lambda;
    for (let i = 0; i < 3; i++) {
      JJt[i][i] += lambdaSq;
    }

    // Invert damped matrix
    const invJJt = MatrixMath.inv3(JJt);
    if (!invJJt) {
      // Degenerate case; break
      break;
    }

    // Damped pseudoinverse: J_dls = J^T * invJJt
    const J_dls = MatrixMath.multiply3x3(Jt, invJJt);

    // Step dq = J_dls * error
    let dq = MatrixMath.multiply3xVec(J_dls, error);

    // Clamp step to avoid wild oscillations
    const stepNorm = MatrixMath.norm(dq);
    if (stepNorm > stepClamp) {
      const scale = stepClamp / stepNorm;
      dq = [dq[0] * scale, dq[1] * scale, dq[2] * scale];
    }

    // Update joint angles
    for (let i = 0; i < 3; i++) {
      q[i] += dq[i];
      if (limits && limits[i]) {
        q[i] = MatrixMath.clamp(q[i], limits[i].min, limits[i].max);
      }
    }
  }

  const finalPos = fkFn(q);
  finalError = MatrixMath.distance(target, finalPos);

  return {
    joints: q,
    converged: finalError < tol * 5,
    iterations,
    finalError
  };
}
