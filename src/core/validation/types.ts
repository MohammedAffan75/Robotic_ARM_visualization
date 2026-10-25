export type IssueSeverity = 'info' | 'warning' | 'error';

export interface ValidationIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  cause: string;
  suggestedFix: string;
  affectedJoint?: number; // 0, 1, or 2
  timestamp?: number;
}

export interface ValidationContext {
  armType: string;
  joints: number[];
  target: [number, number, number];
  endEffector: [number, number, number];
  parameters: Record<string, number>;
  ikReachable: boolean;
  ikViolations: string[];
  singularityWarning?: string;
  isNearSingularity: boolean;
  currentSpeed?: number;
  maxSpeed?: number;
}
