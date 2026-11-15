import { z } from 'zod';
import { NAVIGATION_DESTINATIONS } from '@sos/domain';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
  version: z.string(),
  uptime: z.number().nonnegative()
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ReadinessResponseSchema = z.object({
  status: z.enum(['ready', 'not_ready']),
  database: z.enum(['connected', 'disconnected']),
  databaseName: z.string().optional(),
  databaseUser: z.string().optional(),
  timestamp: z.string().datetime(),
  error: z.string().optional()
});
export type ReadinessResponse = z.infer<typeof ReadinessResponseSchema>;

export const NavigationDestinationSchema = z.enum(NAVIGATION_DESTINATIONS);

export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  isGuest: z.boolean(),
  createdAt: z.string().datetime(),
  lastActiveAt: z.string().datetime(),
  settings: z.object({
    railExpanded: z.boolean().optional(),
    aiPanelOpen: z.boolean().optional(),
    theme: z.string().optional()
  }).optional()
});
export type WorkspaceContract = z.infer<typeof WorkspaceSchema>;
