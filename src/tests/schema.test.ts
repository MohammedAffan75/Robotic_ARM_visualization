import { describe, it, expect } from 'vitest';
import { RobotConfigSchema } from '../store/schemas';

describe('Zod Schema Validation Tests', () => {
  it('should validate valid robot config file structure', () => {
    const validConfig = {
      version: 1,
      armType: 'jointed',
      joints: [20, 45, -60],
      target: [0.35, 0.15, 0.4],
      parameters: {
        baseHeight: 0.35,
        lengthL1: 0.45,
        lengthL2: 0.4
      },
      waypoints: [
        {
          id: 'wp-1',
          name: 'Home Position',
          joints: [0, 0, 0],
          endEffector: [0.85, 0, 0.35]
        }
      ],
      ikBranchIndex: 0,
      createdAt: '2026-10-25T14:00:00.000Z'
    };

    const result = RobotConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('should reject invalid or unsupported arm types', () => {
    const invalidConfig = {
      version: 1,
      armType: 'octopod_invalid_arm',
      joints: [0, 0, 0],
      target: [0, 0, 0],
      parameters: {},
      waypoints: []
    };

    const result = RobotConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('should reject non-3DOF joint tuples', () => {
    const invalidConfig = {
      version: 1,
      armType: 'jointed',
      joints: [0, 0], // only 2 joints instead of 3
      target: [0, 0, 0],
      parameters: {},
      waypoints: []
    };

    const result = RobotConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });
});
