import { ArmDefinition } from '../arms/types';
import { IssueSeverity, ValidationContext, ValidationIssue } from './types';

export function evaluateValidationRules(
  ctx: ValidationContext,
  armDef: ArmDefinition
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Joint limit checks & near-limit warnings
  for (let i = 0; i < 3; i++) {
    const jDef = armDef.joints[i];
    const val = ctx.joints[i];
    if (val === undefined || isNaN(val)) {
      issues.push({
        id: `joint-${i}-nan`,
        severity: 'error',
        title: `Invalid value for ${jDef.name}`,
        cause: `Joint value is NaN or undefined`,
        suggestedFix: `Reset joint to default value (${jDef.defaultVal}${jDef.unit})`,
        affectedJoint: i
      });
      continue;
    }

    const range = jDef.max - jDef.min;
    const threshold = jDef.type === 'R' ? 5 : range * 0.05;

    if (val < jDef.min - 1e-4) {
      const exceed = (jDef.min - val).toFixed(2);
      issues.push({
        id: `joint-${i}-below-min`,
        severity: 'error',
        title: `${jDef.name} Below Limit`,
        cause: `Current value (${val.toFixed(2)}${jDef.unit}) violates lower limit (${jDef.min}${jDef.unit}) by ${exceed}${jDef.unit}`,
        suggestedFix: `Increase joint position or adjust joint limits in Parameters panel`,
        affectedJoint: i
      });
    } else if (val > jDef.max + 1e-4) {
      const exceed = (val - jDef.max).toFixed(2);
      issues.push({
        id: `joint-${i}-above-max`,
        severity: 'error',
        title: `${jDef.name} Above Limit`,
        cause: `Current value (${val.toFixed(2)}${jDef.unit}) violates upper limit (${jDef.max}${jDef.unit}) by ${exceed}${jDef.unit}`,
        suggestedFix: `Decrease joint position or adjust joint limits in Parameters panel`,
        affectedJoint: i
      });
    } else if (val - jDef.min <= threshold) {
      issues.push({
        id: `joint-${i}-near-min`,
        severity: 'warning',
        title: `${jDef.name} Near Minimum`,
        cause: `Joint is within ${threshold.toFixed(1)}${jDef.unit} of lower limit (${jDef.min}${jDef.unit})`,
        suggestedFix: `Move away from joint limit to prevent hard stop collision`,
        affectedJoint: i
      });
    } else if (jDef.max - val <= threshold) {
      issues.push({
        id: `joint-${i}-near-max`,
        severity: 'warning',
        title: `${jDef.name} Near Maximum`,
        cause: `Joint is within ${threshold.toFixed(1)}${jDef.unit} of upper limit (${jDef.max}${jDef.unit})`,
        suggestedFix: `Move away from joint limit to prevent hard stop collision`,
        affectedJoint: i
      });
    }
  }

  // 2. Unreachable Target & Dead Zone
  if (!ctx.ikReachable) {
    for (const v of ctx.ikViolations) {
      const isDeadZone = v.toLowerCase().includes('dead zone') || v.toLowerCase().includes('folded');
      issues.push({
        id: isDeadZone ? 'target-dead-zone' : 'target-unreachable',
        severity: 'error',
        title: isDeadZone ? 'Target in Inner Dead Zone' : 'Target Unreachable',
        cause: v,
        suggestedFix: isDeadZone
          ? 'Drag target farther away from the central column/base pivot'
          : 'Drag target closer to the arm base within reach envelope'
      });
    }
  }

  // 3. Singularity Warning
  if (ctx.isNearSingularity && ctx.singularityWarning) {
    issues.push({
      id: 'arm-near-singularity',
      severity: 'warning',
      title: 'Near Kinematic Singularity',
      cause: ctx.singularityWarning,
      suggestedFix: 'Jog joints slightly off the singular alignment to restore Cartesian mobility'
    });
  }

  // 4. Floor collision check
  if (ctx.endEffector[2] < 0.0) {
    issues.push({
      id: 'ee-below-floor',
      severity: 'warning',
      title: 'End-Effector Below Ground Floor',
      cause: `Tool position Z is ${ctx.endEffector[2].toFixed(3)}m (beneath floor datum plane z = 0)`,
      suggestedFix: 'Raise joint heights or elevate IK target above ground'
    });
  }

  // 5. Speed exceedance check
  if (ctx.currentSpeed && ctx.maxSpeed && ctx.currentSpeed > ctx.maxSpeed) {
    issues.push({
      id: 'speed-exceeded',
      severity: 'warning',
      title: 'Joint Velocity Exceeded',
      cause: `Tool speed (${ctx.currentSpeed.toFixed(2)} m/s) exceeded maximum safe limit (${ctx.maxSpeed.toFixed(2)} m/s)`,
      suggestedFix: 'Trajectory speed has been smoothly clamped to rated limit'
    });
  }

  return issues;
}

export function getWorstSeverity(issues: ValidationIssue[]): IssueSeverity | 'ok' {
  if (issues.some((i) => i.severity === 'error')) return 'error';
  if (issues.some((i) => i.severity === 'warning')) return 'warning';
  if (issues.some((i) => i.severity === 'info')) return 'info';
  return 'ok';
}
