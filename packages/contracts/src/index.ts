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
// Phase 03: Library Folder & File Contracts
// ==========================================

export const FolderLayoutSettingsSchema = z.object({
  view: z.enum(['gallery', 'table']),
  showTitle: z.boolean(),
  showIcon: z.boolean(),
  cardPreview: z.enum(['cover', 'content', 'none']),
  cardSize: z.enum(['small', 'medium', 'large']),
  fitMedia: z.boolean(),
  cardLayout: z.enum(['compact', 'list'])
});
export type FolderLayoutSettingsContract = z.infer<typeof FolderLayoutSettingsSchema>;

export const LibraryFolderSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  parentId: z.string().nullable().optional(),
  name: z.string().min(1),
  content: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]).optional(),
  layoutSettings: FolderLayoutSettingsSchema.optional(),
  icon: z.string().optional(),
  coverUrl: z.string().optional(),
  color: z.string().optional(),
  plainTextPreview: z.string().optional(),
  wordCount: z.number().int().nonnegative().optional(),
  readTimeMinutes: z.number().nonnegative().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type LibraryFolderContract = z.infer<typeof LibraryFolderSchema>;

export const LibraryFileSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  folderId: z.string().nullable().optional(),
  title: z.string().min(1),
  type: StudyAssetTypeSchema,
  path: z.string(),
  sizeBytes: z.number().nonnegative().optional(),
  sizeFormatted: z.string().optional(),
  icon: z.string().optional(),
  coverUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type LibraryFileContract = z.infer<typeof LibraryFileSchema>;

// Backwards-compatible document schema
export const LibraryDocumentSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  folderId: z.string().nullable().optional(),
  title: z.string().optional(),
  name: z.string().optional(),
  content: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]),
  plainTextPreview: z.string().optional(),
  wordCount: z.number().int().nonnegative().optional(),
  readTimeMinutes: z.number().nonnegative().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type LibraryDocumentContract = z.infer<typeof LibraryDocumentSchema>;

// ==========================================
// Phase 08: Profile Contracts
// ==========================================

export const ProfileTabSchema = z.enum(['posts', 'media', 'resources', 'communities', 'activity']);
export type ProfileTabContract = z.infer<typeof ProfileTabSchema>;

export const UserProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  handle: z.string().min(1),
  isAuthenticated: z.boolean(),
  email: z.string().email().optional(),
  institution: z.string().optional(),
  learningFocus: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  joinedDate: z.string(),
  location: z.string().optional(),
  website: z.string().optional(),
  academicTracks: z.array(z.string()).optional(),
  stats: z.object({
    followersCount: z.number().int().nonnegative().optional(),
    followingCount: z.number().int().nonnegative().optional(),
    studyTimeHours: z.number().nonnegative().optional(),
    streakDays: z.number().int().nonnegative().optional(),
    contributionsCount: z.number().int().nonnegative().optional()
  }).optional()
});
export type UserProfileContract = z.infer<typeof UserProfileSchema>;

export const UserPostDeckSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  tag: z.string().min(1),
  cardCount: z.number().int().nonnegative(),
  algorithm: z.string().min(1),
  forksCount: z.number().int().nonnegative()
});

export const UserPostSchema = z.object({
  id: z.string().min(1),
  authorId: z.string().min(1),
  authorName: z.string().min(1),
  authorHandle: z.string().min(1),
  authorAvatarUrl: z.string(),
  content: z.string(),
  createdAt: z.string(),
  likesCount: z.number().int().nonnegative(),
  commentsCount: z.number().int().nonnegative(),
  repostsCount: z.number().int().nonnegative(),
  isLiked: z.boolean().optional(),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(['image', 'whiteboard']).optional(),
  pinned: z.boolean().optional(),
  deck: UserPostDeckSchema.optional()
});
export type UserPostContract = z.infer<typeof UserPostSchema>;

export const UserSharedResourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['deck', 'document', 'notes', 'cheatsheet']),
  cardsCount: z.number().int().nonnegative().optional(),
  forksCount: z.number().int().nonnegative(),
  tags: z.array(z.string()),
  updatedAt: z.string()
});
export type UserSharedResourceContract = z.infer<typeof UserSharedResourceSchema>;

export const UserCommunitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  handle: z.string().min(1),
  description: z.string(),
  membersCount: z.number().int().nonnegative(),
  icon: z.string().optional(),
  coverUrl: z.string().optional(),
  joinedAt: z.string(),
  role: z.enum(['member', 'moderator', 'admin'])
});
export type UserCommunityContract = z.infer<typeof UserCommunitySchema>;

export const DailyContributionSchema = z.object({
  date: z.string(),
  count: z.number().int().nonnegative(),
  level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
});

export const ProfileActivityMetricsSchema = z.object({
  totalStudyTimeHours: z.number().nonnegative(),
  currentStreakDays: z.number().int().nonnegative(),
  totalContributions: z.number().int().nonnegative(),
  yearLabel: z.string(),
  dateRangeLabel: z.string(),
  dailyContributions: z.array(DailyContributionSchema)
});
export type ProfileActivityMetricsContract = z.infer<typeof ProfileActivityMetricsSchema>;

export const AggregatedStudyStatsSchema = z.object({
  tasksCompleted: z.number().int().nonnegative(),
  tasksTotal: z.number().int().nonnegative(),
  libraryFoldersCount: z.number().int().nonnegative(),
  libraryFilesCount: z.number().int().nonnegative(),
  streakDays: z.number().int().nonnegative(),
  studyHours: z.number().nonnegative().nullable(),
  flashcardsReviewed: z.number().int().nonnegative().nullable()
});
export type AggregatedStudyStatsContract = z.infer<typeof AggregatedStudyStatsSchema>;

export const ProfileActivityItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['task_completed', 'library_folder_created', 'library_file_created', 'session_logged']),
  title: z.string().min(1),
  description: z.string().optional(),
  timestamp: z.string(),
  iconName: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional()
});
export type ProfileActivityItemContract = z.infer<typeof ProfileActivityItemSchema>;

export const PreMigrationSnapshotSchema = z.object({
  snapshotId: z.string().min(1),
  createdAt: z.string(),
  workspaceId: z.string().min(1),
  taskCount: z.number().int().nonnegative(),
  folderCount: z.number().int().nonnegative(),
  fileCount: z.number().int().nonnegative(),
  integrityHash: z.string().min(1)
});
export type PreMigrationSnapshotContract = z.infer<typeof PreMigrationSnapshotSchema>;

// ============================================================================
// Phase 09: Settings Contracts
// ============================================================================

export const AccountSettingsSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  email: z.string().email().or(z.string()),
  learningFocus: z.string(),
  plan: z.enum(['Free', 'Pro']),
  avatarUrl: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  education: z.string().optional(),
  coverImage: z.string().optional(),
  joinedDate: z.string().optional()
});
export type AccountSettingsContract = z.infer<typeof AccountSettingsSchema>;

export const UpdateAccountSettingsSchema = AccountSettingsSchema.partial();
export type UpdateAccountSettingsContract = z.infer<typeof UpdateAccountSettingsSchema>;

export const UsageSettingsSchema = z.object({
  planName: z.string(),
  planPrice: z.string(),
  planDescription: z.string(),
  aiCreditsUsed: z.number().nonnegative(),
  aiCreditsLimit: z.number().positive(),
  aiCreditsResetDays: z.number().nonnegative(),
  aiCreditsResetHours: z.number().nonnegative(),
  storageBytesUsed: z.number().nonnegative(),
  storageBytesLimit: z.number().positive(),
  availableResets: z.number().nonnegative()
});
export type UsageSettingsContract = z.infer<typeof UsageSettingsSchema>;

export const HorizonBarSettingsSchema = z.object({
  milestoneName: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  preset: z.enum(['current_year', 'semester', 'custom'])
});
export type HorizonBarSettingsContract = z.infer<typeof HorizonBarSettingsSchema>;

export const FocusTrackingSettingsSchema = z.object({
  automaticStudyTracking: z.boolean(),
  defaultPomodoroInterval: z.string().optional(),
  focusMinutes: z.number().int().min(1).max(180).default(50),
  breakMinutes: z.number().int().min(1).max(60).default(10)
});
export type FocusTrackingSettingsContract = z.infer<typeof FocusTrackingSettingsSchema>;

export const SoundMotionSettingsSchema = z.object({
  sessionCompletionChimes: z.boolean(),
  reducedMotion: z.enum(['os_default', 'enabled', 'disabled'])
});
export type SoundMotionSettingsContract = z.infer<typeof SoundMotionSettingsSchema>;

export const GeneralSettingsSchema = z.object({
  appLanguage: z.string(),
  horizonBar: HorizonBarSettingsSchema,
  focusTracking: FocusTrackingSettingsSchema,
  soundMotion: SoundMotionSettingsSchema,
  weekStartDay: z.enum(['saturday', 'monday']).default('saturday')
});
export type GeneralSettingsContract = z.infer<typeof GeneralSettingsSchema>;

export const UpdateGeneralSettingsSchema = z.object({
  appLanguage: z.string().optional(),
  horizonBar: HorizonBarSettingsSchema.partial().optional(),
  focusTracking: FocusTrackingSettingsSchema.partial().optional(),
  soundMotion: SoundMotionSettingsSchema.partial().optional(),
  weekStartDay: z.enum(['saturday', 'monday']).optional()
});
export type UpdateGeneralSettingsContract = z.infer<typeof UpdateGeneralSettingsSchema>;

export const LearnedMemoryItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: z.string(),
  createdAt: z.string()
});
export type LearnedMemoryItemContract = z.infer<typeof LearnedMemoryItemSchema>;

export const MemorySettingsSchema = z.object({
  enabled: z.boolean(),
  whoIAm: z.string(),
  whatIAmLearning: z.string(),
  howIPreferToLearn: z.string(),
  learnedMemories: z.array(LearnedMemoryItemSchema).optional()
});
export type MemorySettingsContract = z.infer<typeof MemorySettingsSchema>;

export const UpdateMemorySettingsSchema = MemorySettingsSchema.partial();
export type UpdateMemorySettingsContract = z.infer<typeof UpdateMemorySettingsSchema>;

export const SkillItemSchema = z.object({
  id: z.string().min(1),
  command: z.string().min(2),
  description: z.string().min(1),
  enabled: z.boolean(),
  systemPrompt: z.string(),
  isBuiltIn: z.boolean()
});
export type SkillItemContract = z.infer<typeof SkillItemSchema>;

export const CreateSkillSchema = z.object({
  command: z.string().min(2),
  description: z.string().min(1),
  systemPrompt: z.string().min(1)
});
export type CreateSkillContract = z.infer<typeof CreateSkillSchema>;

export const UpdateSkillSchema = z.object({
  command: z.string().min(2).optional(),
  description: z.string().min(1).optional(),
  systemPrompt: z.string().min(1).optional(),
  enabled: z.boolean().optional()
});
export type UpdateSkillContract = z.infer<typeof UpdateSkillSchema>;

export const UserSettingsSchema = z.object({
  account: AccountSettingsSchema,
  usage: UsageSettingsSchema,
  general: GeneralSettingsSchema,
  memory: MemorySettingsSchema,
  skills: z.array(SkillItemSchema)
});
export type UserSettingsContract = z.infer<typeof UserSettingsSchema>;

// ============================================================================
// Phase 05 & 06: Unified Tracking & Calendar Contracts
// ============================================================================

export const UserTopicSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  domainId: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string()
});
export type UserTopicContract = z.infer<typeof UserTopicSchema>;

export const CreateUserTopicSchema = z.object({
  name: z.string().min(1, 'Topic name is required')
});
export type CreateUserTopicContract = z.infer<typeof CreateUserTopicSchema>;

export const UserDomainSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  colorToken: z.string(),
  createdAt: z.string(),
  topics: z.array(UserTopicSchema).optional()
});
export type UserDomainContract = z.infer<typeof UserDomainSchema>;

export const CreateUserDomainSchema = z.object({
  name: z.string().min(1, 'Domain name is required'),
  colorToken: z.string().optional()
});
export type CreateUserDomainContract = z.infer<typeof CreateUserDomainSchema>;

export const StudySessionStatusSchema = z.enum([
  'planned',
  'in_progress',
  'completed',
  'missed',
  'cancelled'
]);
export type StudySessionStatusContract = z.infer<typeof StudySessionStatusSchema>;

export const StudySessionSourceSchema = z.enum([
  'calendar',
  'timer_adhoc',
  'historical_manual'
]);
export type StudySessionSourceContract = z.infer<typeof StudySessionSourceSchema>;

export const RecurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly']),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});
export type RecurrenceRuleContract = z.infer<typeof RecurrenceRuleSchema>;

export const TrackingSessionModeSchema = z.enum(['countdown', 'stopwatch']);
export type TrackingSessionModeContract = z.infer<typeof TrackingSessionModeSchema>;

export const PauseIntervalSchema = z.object({
  pausedAt: z.number().int().positive(),
  resumedAt: z.number().int().positive().nullable()
});
export type PauseIntervalContract = z.infer<typeof PauseIntervalSchema>;

export const TrackingIntervalSchema = z.object({
  startedAt: z.number().int().positive(),
  endedAt: z.number().int().positive().nullable()
});
export type TrackingIntervalContract = z.infer<typeof TrackingIntervalSchema>;

export const StudySessionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().min(1),
  domainId: z.string().nullable().optional(),
  domainName: z.string().min(1),
  topicId: z.string().nullable().optional(),
  topicName: z.string().nullable().optional(),
  status: StudySessionStatusSchema,
  source: StudySessionSourceSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  plannedStartTime: z.string().nullable().optional(),
  plannedEndTime: z.string().nullable().optional(),
  plannedDurationMinutes: z.number().int().nonnegative(),
  actualStartTimestamp: z.number().nullable().optional(),
  actualEndTimestamp: z.number().nullable().optional(),
  actualFocusSeconds: z.number().int().nonnegative(),
  actualBreakSeconds: z.number().int().nonnegative(),
  timerMode: TrackingSessionModeSchema,
  pauseIntervals: z.array(PauseIntervalSchema),
  notes: z.string().nullable().optional(),
  sortOrder: z.number().int(),
  seriesId: z.string().nullable().optional(),
  recurrenceRule: RecurrenceRuleSchema.nullable().optional(),
  isSeriesException: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type StudySessionContract = z.infer<typeof StudySessionSchema>;

export const StudySessionsSummarySchema = z.object({
  totalPlannedMinutes: z.number().nonnegative(),
  totalActualFocusSeconds: z.number().nonnegative(),
  plannedCount: z.number().nonnegative(),
  completedCount: z.number().nonnegative()
});
export type StudySessionsSummaryContract = z.infer<typeof StudySessionsSummarySchema>;

export const StudySessionsResponseSchema = z.object({
  sessions: z.array(StudySessionSchema),
  summary: StudySessionsSummarySchema
});
export type StudySessionsResponseContract = z.infer<typeof StudySessionsResponseSchema>;

// Backward compatibility alias for TrackingSessionSchema
export const TrackingSessionSchema = StudySessionSchema.partial().extend({
  id: z.string().min(1),
  title: z.string().min(1),
  mode: TrackingSessionModeSchema.optional(),
  status: StudySessionStatusSchema.optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  durationSeconds: z.number().optional(),
  durationMinutes: z.number().optional(),
  folderId: z.string().optional(),
  fileId: z.string().optional(),
  subtitle: z.string().optional()
});
export type TrackingSessionContract = z.infer<typeof TrackingSessionSchema>;

export const CreateStudySessionInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  domainId: z.string().nullable().optional(),
  domainName: z.string().min(1, 'Domain name is required'),
  topicId: z.string().nullable().optional(),
  topicName: z.string().nullable().optional(),
  status: StudySessionStatusSchema.default('planned'),
  source: StudySessionSourceSchema.default('calendar'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  plannedStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  plannedEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  plannedDurationMinutes: z.number().int().positive().optional(),
  actualStartTimestamp: z.number().int().positive().optional(),
  actualEndTimestamp: z.number().int().positive().optional(),
  actualFocusSeconds: z.number().int().nonnegative().optional(),
  actualBreakSeconds: z.number().int().nonnegative().optional(),
  timerMode: TrackingSessionModeSchema.default('countdown'),
  notes: z.string().optional(),
  recurrenceRule: RecurrenceRuleSchema.optional()
});
export type CreateStudySessionInputContract = z.infer<typeof CreateStudySessionInputSchema>;

export const UpdateStudySessionInputSchema = z.object({
  title: z.string().min(1).optional(),
  domainId: z.string().nullable().optional(),
  domainName: z.string().min(1).optional(),
  topicId: z.string().nullable().optional(),
  topicName: z.string().nullable().optional(),
  status: StudySessionStatusSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  plannedStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  plannedEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  plannedDurationMinutes: z.number().int().positive().optional(),
  timerMode: TrackingSessionModeSchema.optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
  scope: z.enum(['single', 'following']).optional()
});
export type UpdateStudySessionInputContract = z.infer<typeof UpdateStudySessionInputSchema>;

export const CompleteStudySessionInputSchema = z.object({
  actualFocusSeconds: z.number().int().nonnegative(),
  actualBreakSeconds: z.number().int().nonnegative().default(0),
  actualEndTimestamp: z.number().int().positive().optional(),
  pauseIntervals: z.array(PauseIntervalSchema).optional(),
  notes: z.string().optional()
});
export type CompleteStudySessionInputContract = z.infer<typeof CompleteStudySessionInputSchema>;

export const CalendarEventTypeSchema = z.enum([
  'study_block',
  'exam_deadline',
  'assignment',
  'review_session'
]);
export type CalendarEventTypeContract = z.infer<typeof CalendarEventTypeSchema>;

export const CalendarEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: CalendarEventTypeSchema,
  startTime: z.string(),
  endTime: z.string(),
  folderId: z.string().nullable().optional(),
  fileId: z.string().nullable().optional(),
  resourceMeta: z.string().optional(),
  notes: z.string().optional(),
  completed: z.boolean(),
  linkedSessionId: z.string().nullable().optional(),
  actualDurationMinutes: z.number().nonnegative().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type CalendarEventContract = z.infer<typeof CalendarEventSchema>;

export const CreateCalendarEventSchema = CalendarEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completed: true
}).extend({
  completed: z.boolean().optional()
});
export type CreateCalendarEventContract = z.infer<typeof CreateCalendarEventSchema>;

export const UpdateCalendarEventSchema = CalendarEventSchema.partial();
export type UpdateCalendarEventContract = z.infer<typeof UpdateCalendarEventSchema>;

// Dynamic domain schema accepting any user-created domain string
export const LearningBlockDomainSchema = z.string().min(1);
export type LearningBlockDomainContract = z.infer<typeof LearningBlockDomainSchema>;

export const LearningBlockSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  domain: z.string().min(1),
  topic: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.number().int().positive(),
  status: StudySessionStatusSchema.optional(),
  seriesId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type LearningBlockContract = z.infer<typeof LearningBlockSchema>;

export const CalendarBlocksSummarySchema = z.object({
  totalMinutes: z.number().nonnegative(),
  formattedDuration: z.string(),
  blockCount: z.number().nonnegative()
});
export type CalendarBlocksSummaryContract = z.infer<typeof CalendarBlocksSummarySchema>;

export const CalendarBlocksResponseSchema = z.object({
  blocks: z.array(LearningBlockSchema),
  summary: CalendarBlocksSummarySchema
});
export type CalendarBlocksResponseContract = z.infer<typeof CalendarBlocksResponseSchema>;

export const CreateLearningBlockSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  domain: z.string().min(1, 'Domain is required'),
  topic: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid start time (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid end time (HH:mm)'),
  recurrenceRule: RecurrenceRuleSchema.optional()
}).refine((data) => {
  return data.startTime < data.endTime;
}, {
  message: 'End time must be strictly after start time',
  path: ['endTime']
});
export type CreateLearningBlockContract = z.infer<typeof CreateLearningBlockSchema>;

export const UpdateLearningBlockSchema = z.object({
  title: z.string().min(1).optional(),
  domain: z.string().min(1).optional(),
  topic: z.string().nullable().optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'missed', 'cancelled']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  scope: z.enum(['single', 'following']).optional()
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return data.startTime < data.endTime;
  }
  return true;
}, {
  message: 'End time must be strictly after start time',
  path: ['endTime']
});
export type UpdateLearningBlockContract = z.infer<typeof UpdateLearningBlockSchema>;

export const AnalyticsDataPointSchema = z.object({
  label: z.string(),
  dateKey: z.string(),
  actualHours: z.number(),
  plannedHours: z.number()
});

export const DomainDistributionItemSchema = z.object({
  domainName: z.string(),
  domainId: z.string().optional(),
  fieldName: z.string().optional(),
  fieldId: z.string().optional(),
  hours: z.number(),
  percentage: z.number(),
  colorHex: z.string()
});

export const TrackingAnalyticsResponseSchema = z.object({
  period: z.enum(['day', 'week', 'month']),
  referenceDate: z.string(),
  totalFocusHours: z.number(),
  dailyAverageHours: z.number(),
  adherenceRate: z.number(),
  learningHoursPoints: z.array(AnalyticsDataPointSchema),
  studyHoursPoints: z.array(AnalyticsDataPointSchema),
  domainDistribution: z.array(DomainDistributionItemSchema),
  fieldDistribution: z.array(DomainDistributionItemSchema),
  activeDomainCount: z.number(),
  activeFieldCount: z.number()
});
export type TrackingAnalyticsResponseContract = z.infer<typeof TrackingAnalyticsResponseSchema>;

export const AnnualHeatmapDaySchema = z.object({
  date: z.string(),
  dayLabel: z.string(),
  hours: z.number(),
  level: z.number(),
  isFuture: z.boolean()
});
export type AnnualHeatmapDay = z.infer<typeof AnnualHeatmapDaySchema>;

export const AnnualHeatmapResponseSchema = z.object({
  weeks: z.array(z.array(AnnualHeatmapDaySchema)),
  totalHours: z.number(),
  currentStreak: z.number(),
  dailyAverageHours: z.number().optional(),
  startDate: z.string(),
  endDate: z.string()
});
export type AnnualHeatmapResponseContract = z.infer<typeof AnnualHeatmapResponseSchema>;

// ==========================================
// Master SOS Library Contracts
// ==========================================

export const SOSFileTypeSchema = z.enum([
  'folder',
  'pdf',
  'docx',
  'slides',
  'spreadsheet',
  'image',
  'video',
  'audio',
  'browser',
  'note',
  'flashcards',
  'quiz',
  'exam',
  'board'
]);
export type SOSFileTypeContract = z.infer<typeof SOSFileTypeSchema>;

export const LibraryAncestorSchema = z.object({
  _id: z.string(),
  name: z.string()
});
export type LibraryAncestorContract = z.infer<typeof LibraryAncestorSchema>;

export const LibraryStorageMetadataSchema = z.object({
  storagePath: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  url: z.string().optional()
});
export type LibraryStorageMetadataContract = z.infer<typeof LibraryStorageMetadataSchema>;

export const LibraryArtifactMetricsSchema = z.object({
  pageCount: z.number().int().nonnegative().optional(),
  currentPage: z.number().int().nonnegative().optional(),
  slideCount: z.number().int().nonnegative().optional(),
  sheetCount: z.number().int().nonnegative().optional(),
  rowCount: z.number().int().nonnegative().optional(),
  durationSeconds: z.number().nonnegative().optional(),
  cardCount: z.number().int().nonnegative().optional(),
  dueCount: z.number().int().nonnegative().optional(),
  questionCount: z.number().int().nonnegative().optional(),
  totalPoints: z.number().nonnegative().optional(),
  wordCount: z.number().int().nonnegative().optional()
});
export type LibraryArtifactMetricsContract = z.infer<typeof LibraryArtifactMetricsSchema>;

export const LibraryArtifactDataSchema = z.object({
  linkedArtifactId: z.string().optional(),
  externalUrl: z.string().optional(),
  metrics: LibraryArtifactMetricsSchema.optional()
});
export type LibraryArtifactDataContract = z.infer<typeof LibraryArtifactDataSchema>;

export const LibraryItemContractSchema = z.object({
  _id: z.string(),
  id: z.string(),
  name: z.string().min(1),
  itemKind: z.enum(['folder', 'file']),
  fileType: SOSFileTypeSchema,
  parentId: z.string().nullable(),
  ancestors: z.array(LibraryAncestorSchema),
  icon: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  storage: LibraryStorageMetadataSchema.optional(),
  artifactData: LibraryArtifactDataSchema.optional(),
  childCount: z.number().int().nonnegative().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type LibraryItemContract = z.infer<typeof LibraryItemContractSchema>;

export const GetLibraryItemsQuerySchema = z.object({
  parentId: z.string().nullable().optional(),
  search: z.string().optional(),
  filter: z.enum([
    'all',
    'folders',
    'files',
    'documents',
    'media',
    'notes',
    'flashcards',
    'quizzes',
    'exams',
    'browser'
  ]).optional(),
  sortBy: z.enum(['name', 'updatedAt', 'size', 'type']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});
export type GetLibraryItemsQueryContract = z.infer<typeof GetLibraryItemsQuerySchema>;

export const LibraryItemsResponseSchema = z.object({
  breadcrumbs: z.array(LibraryAncestorSchema),
  items: z.array(LibraryItemContractSchema)
});
export type LibraryItemsResponseContract = z.infer<typeof LibraryItemsResponseSchema>;

export const CreateFolderRequestSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().nullable().optional(),
  icon: z.string().nullable().optional()
});
export type CreateFolderRequestContract = z.infer<typeof CreateFolderRequestSchema>;

export const CreateArtifactRequestSchema = z.object({
  name: z.string().min(1).max(100),
  fileType: SOSFileTypeSchema,
  parentId: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  externalUrl: z.string().optional(),
  linkedArtifactId: z.string().optional(),
  metrics: LibraryArtifactMetricsSchema.optional()
});
export type CreateArtifactRequestContract = z.infer<typeof CreateArtifactRequestSchema>;

export const UpdateLibraryItemRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().nullable().optional(),
  parentId: z.string().nullable().optional()
});
export type UpdateLibraryItemRequestContract = z.infer<typeof UpdateLibraryItemRequestSchema>;

// ==========================================
// Phase 08: Profile Telemetry Contracts
// ==========================================

export const ProfileTelemetryResponseSchema = z.object({
  totalStudyTimeHours: z.number(),
  totalStudyTimeFormatted: z.string(),
  currentStreakDays: z.number(),
  currentStreakFormatted: z.string(),
  dailyAverageHours: z.number(),
  dailyAverageFormatted: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  dateRangeLabel: z.string(),
  weeks: z.array(z.array(AnnualHeatmapDaySchema))
});
export type ProfileTelemetryResponseContract = z.infer<typeof ProfileTelemetryResponseSchema>;




