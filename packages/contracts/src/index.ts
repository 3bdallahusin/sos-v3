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
// Phase 03: Library Contracts
// ==========================================

export const LibraryItemTypeSchema = z.enum([
  'pdf',
  'notes',
  'video',
  'audio',
  'slides',
  'flashcards',
  'page'
]);
export type LibraryItemTypeContract = z.infer<typeof LibraryItemTypeSchema>;

export const FolderSummaryBlockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['paragraph', 'callout']),
  title: z.string().optional(),
  text: z.string(),
  icon: z.string().optional()
});
export type FolderSummaryBlockContract = z.infer<typeof FolderSummaryBlockSchema>;

export const LibraryFolderSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  parentId: z.string().nullable(),
  name: z.string().min(1),
  icon: z.string().optional(),
  coverUrl: z.string().optional(),
  description: z.string().optional(),
  summaryBlocks: z.array(FolderSummaryBlockSchema).optional(),
  color: z.string().optional(),
  order: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type LibraryFolderContract = z.infer<typeof LibraryFolderSchema>;

export const LibraryItemSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  folderId: z.string().nullable(),
  title: z.string().min(1),
  type: LibraryItemTypeSchema,
  subtitle: z.string().optional(),
  coverUrl: z.string().optional(),
  icon: z.string().optional(),
  sizeBytes: z.number().nonnegative().optional(),
  readTimeMinutes: z.number().nonnegative().optional(),
  assetPath: z.string().optional(),
  content: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type LibraryItemContract = z.infer<typeof LibraryItemSchema>;

export const LibraryViewModeSchema = z.enum(['gallery', 'list', 'table']);
export type LibraryViewModeContract = z.infer<typeof LibraryViewModeSchema>;

export const LibraryCardSizeSchema = z.enum(['compact', 'normal', 'spacious']);
export type LibraryCardSizeContract = z.infer<typeof LibraryCardSizeSchema>;

export const LibraryViewSettingsSchema = z.object({
  viewMode: LibraryViewModeSchema,
  cardSize: LibraryCardSizeSchema,
  sortBy: z.enum(['name', 'updatedAt', 'createdAt', 'type']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});
export type LibraryViewSettingsContract = z.infer<typeof LibraryViewSettingsSchema>;

export const LibraryBackupManifestSchema = z.object({
  version: z.number().int().positive(),
  appName: z.literal('SOS'),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  workspaceId: z.string().optional(),
  checksum: z.string().min(1),
  foldersCount: z.number().int().nonnegative(),
  itemsCount: z.number().int().nonnegative()
});
export type LibraryBackupManifestContract = z.infer<typeof LibraryBackupManifestSchema>;



