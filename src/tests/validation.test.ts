import { describe, it, expect } from 'vitest';
import { getArmDefinition } from '../core/arms';
import { evaluateValidationRules, getWorstSeverity } from '../core/validation';

describe('Robotics Validation Engine Tests', () => {
  it('should detect joint limit violations (errors)', () => {
    const armDef = getArmDefinition('jointed');
    // J1 has limits [-180, 180]. Set to 200 (exceeds limit)
    const issues = evaluateValidationRules(
      {
        armType: 'jointed',
        joints: [200, 30, -30],
        target: [0.4, 0.2, 0.3],
        endEffector: [0.4, 0.2, 0.3],
        parameters: armDef.defaultParameters,
        ikReachable: true,
        ikViolations: [],
        isNearSingularity: false
      },
      armDef
    );

    const errorIssue = issues.find((i) => i.severity === 'error' && i.affectedJoint === 0);
    expect(errorIssue).toBeDefined();
    expect(errorIssue?.title).toContain('Above Limit');
    expect(getWorstSeverity(issues)).toBe('error');
  });

  it('should detect near-limit warnings (within 5 degrees)', () => {
    const armDef = getArmDefinition('jointed');
    // J1 upper limit is 180. Set to 178 (within 5 deg)
    const issues = evaluateValidationRules(
      {
        armType: 'jointed',
        joints: [178, 30, -30],
        target: [0.4, 0.2, 0.3],
        endEffector: [0.4, 0.2, 0.3],
        parameters: armDef.defaultParameters,
        ikReachable: true,
        ikViolations: [],
        isNearSingularity: false
      },
      armDef
    );

    const warningIssue = issues.find((i) => i.severity === 'warning' && i.affectedJoint === 0);
    expect(warningIssue).toBeDefined();
    expect(warningIssue?.title).toContain('Near Maximum');
    expect(getWorstSeverity(issues)).toBe('warning');
  });

  it('should detect kinematic singularities', () => {
    const armDef = getArmDefinition('cylindrical');
    // r = 0 is singular for cylindrical
    const singularity = armDef.singularityCheck([30, 0.01, 0.4], armDef.defaultParameters);
    expect(singularity.isSingular).toBe(true);
    expect(singularity.warning).toBeDefined();

    const issues = evaluateValidationRules(
      {
        armType: 'cylindrical',
        joints: [30, 0.01, 0.4],
        target: [0.01, 0, 0.4],
        endEffector: [0.01, 0, 0.4],
        parameters: armDef.defaultParameters,
        ikReachable: true,
        ikViolations: [],
        singularityWarning: singularity.warning,
        isNearSingularity: singularity.isSingular
      },
      armDef
    );

    const singIssue = issues.find((i) => i.id === 'arm-near-singularity');
    expect(singIssue).toBeDefined();
    expect(singIssue?.severity).toBe('warning');
  });

  it('should detect unreachable target errors', () => {
    const armDef = getArmDefinition('jointed');
    // Target way out at 5.0m (max reach is < 1.0m)
    const ikSolutions = armDef.ik([5.0, 0, 0.35], armDef.defaultParameters);
    expect(ikSolutions[0].valid).toBe(false);

    const issues = evaluateValidationRules(
      {
        armType: 'jointed',
        joints: [0, 0, 0],
        target: [5.0, 0, 0.35],
        endEffector: [0.85, 0, 0.35],
        parameters: armDef.defaultParameters,
        ikReachable: ikSolutions[0].valid,
        ikViolations: ikSolutions[0].violations,
        isNearSingularity: false
      },
      armDef
    );

    const unreachIssue = issues.find((i) => i.id === 'target-unreachable');
    expect(unreachIssue).toBeDefined();
    expect(unreachIssue?.severity).toBe('error');
  });
});
