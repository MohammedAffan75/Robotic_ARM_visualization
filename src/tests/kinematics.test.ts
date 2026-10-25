import { describe, it, expect } from 'vitest';
import { ARM_TYPES, getArmDefinition } from '../core/arms';
import { MatrixMath } from '../core/math/matrix';

describe('Kinematics Round-Trip FK -> IK -> FK Tests', () => {
  for (const armType of ARM_TYPES) {
    it(`should successfully round-trip 20 random reachable poses for ${armType.toUpperCase()}`, () => {
      const armDef = getArmDefinition(armType);
      const params = armDef.defaultParameters;
      const jDefs = armDef.joints;

      let testedCount = 0;
      let maxError = 0;

      for (let trial = 0; trial < 20; trial++) {
        // Generate random reachable joint values well within hard stops
        const qOriginal: [number, number, number] = [
          jDefs[0].min + (jDefs[0].max - jDefs[0].min) * (0.2 + Math.random() * 0.6),
          jDefs[1].min + (jDefs[1].max - jDefs[1].min) * (0.2 + Math.random() * 0.6),
          jDefs[2].min + (jDefs[2].max - jDefs[2].min) * (0.2 + Math.random() * 0.6)
        ];

        // 1. Forward Kinematics
        const fkInitial = armDef.fk(qOriginal, params);
        const targetPos = fkInitial.endEffector;

        // 2. Inverse Kinematics
        const ikSolutions = armDef.ik(targetPos, params, qOriginal);
        expect(ikSolutions.length).toBeGreaterThan(0);

        // Find solution that matches target
        const validSol = ikSolutions.find((s) => s.valid) || ikSolutions[0];
        expect(validSol).toBeDefined();

        // 3. Round-trip FK
        const fkReconstructed = armDef.fk(
          [validSol.joints[0], validSol.joints[1], validSol.joints[2]],
          params
        );

        const posError = MatrixMath.distance(targetPos, fkReconstructed.endEffector);
        if (posError > maxError) maxError = posError;

        // Allow tolerance (custom numerical solver tolerance ~ 1e-3, analytical closed-form ~ 1e-6)
        const tol = armType === 'custom' ? 2e-3 : 1e-4;
        expect(posError).toBeLessThan(tol);
        testedCount++;
      }

      expect(testedCount).toBe(20);
    });
  }
});
