import { z } from 'zod';

export const ArmTypeIdSchema = z.enum([
  'cartesian',
  'cylindrical',
  'polar',
  'jointed',
  'scara',
  'custom'
]);

export const WaypointSchema = z.object({
  id: z.string(),
  name: z.string(),
  joints: z.tuple([z.number(), z.number(), z.number()]),
  endEffector: z.tuple([z.number(), z.number(), z.number()]),
  timestamp: z.number().optional(),
  comment: z.string().optional()
});

export const RobotConfigSchema = z.object({
  version: z.literal(1),
  armType: ArmTypeIdSchema,
  joints: z.tuple([z.number(), z.number(), z.number()]),
  target: z.tuple([z.number(), z.number(), z.number()]),
  parameters: z.record(z.number()),
  waypoints: z.array(WaypointSchema),
  ikBranchIndex: z.number().optional(),
  createdAt: z.string().optional()
});

export type WaypointData = z.infer<typeof WaypointSchema>;
export type RobotConfigFile = z.infer<typeof RobotConfigSchema>;
