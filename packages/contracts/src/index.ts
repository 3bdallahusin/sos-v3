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

// ==========================================
// Phase 02: Home Contracts
// ==========================================

export const TaskItemSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().optional(),
  title: z.string().min(1),
  completed: z.boolean(),
  createdAt: z.string(),
  completedAt: z.string().nullable().optional(),
  order: z.number().int()
});
export type TaskItemContract = z.infer<typeof TaskItemSchema>;

export const StudyAssetTypeSchema = z.enum([
  'pdf',
  'slides',
  'video',
  'audio',
  'notes',
  'flashcards',
  'quiz',
  'browser'
]);

export const RecentStudyItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string(),
  type: StudyAssetTypeSchema,
  path: z.string(),
  lastOpenedAt: z.string(),
  progressPercent: z.number().min(0).max(100).optional(),
  details: z.string().optional()
});
export type RecentStudyItemContract = z.infer<typeof RecentStudyItemSchema>;

export const DailyStudyGoalSchema = z.object({
  date: z.string(),
  targetMinutes: z.number().nonnegative(),
  completedMinutes: z.number().nonnegative(),
  streakDays: z.number().nonnegative(),
  horizonDaysLeft: z.number().int(),
  horizonSemesterName: z.string().optional(),
  horizonProgressPercent: z.number().min(0).max(100)
});
export type DailyStudyGoalContract = z.infer<typeof DailyStudyGoalSchema>;

// ==========================================
// Phase 03: Library Document & Folder Contracts
// ==========================================

export const LibraryDocumentSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  folderId: z.string().nullable().optional(),
  title: z.string(),
  content: z.record(z.string(), z.unknown()),
  plainTextPreview: z.string().optional(),
  wordCount: z.number().int().nonnegative(),
  readTimeMinutes: z.number().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type LibraryDocumentContract = z.infer<typeof LibraryDocumentSchema>;

export const LibraryFolderSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type LibraryFolderContract = z.infer<typeof LibraryFolderSchema>;



