export * from './uuid.js';
export * from './time.js';

export const NAVIGATION_DESTINATIONS = [
  'home',
  'library',
  'learning',
  'tracking',
  'calendar',
  'profile',
  'settings'
] as const;

export type NavigationDestination = (typeof NAVIGATION_DESTINATIONS)[number];

export interface NavigationItem {
  id: NavigationDestination;
  label: string;
  path: string;
  iconName: string;
}

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { id: 'home', label: 'Home', path: '/', iconName: 'Home' },
  { id: 'library', label: 'Library', path: '/library', iconName: 'FolderClosed' },
  { id: 'learning', label: 'Learning', path: '/learning', iconName: 'BookOpen' },
  { id: 'tracking', label: 'Tracking', path: '/tracking', iconName: 'Clock' },
  { id: 'calendar', label: 'Calendar', path: '/calendar', iconName: 'Calendar' },
  { id: 'profile', label: 'Profile', path: '/profile', iconName: 'User' },
  { id: 'settings', label: 'Settings', path: '/settings', iconName: 'Settings' }
] as const;

export const SHELL_DIMENSIONS = {
  headerHeightPx: 48,
  leftRailCollapsedWidthPx: 56,
  leftRailExpandedWidthPx: 240,
  rightAiPanelWidthPx: 340,
  islandGapPx: 8,
  islandBorderRadiusPx: 24
} as const;

export interface Workspace {
  id: string; // UUIDv7
  name: string;
  isGuest: boolean;
  createdAt: string;
  lastActiveAt: string;
  settings?: {
    railExpanded?: boolean;
    aiPanelOpen?: boolean;
    theme?: string;
  };
}

export interface GuestWorkspace extends Workspace {
  isGuest: true;
}

// ==========================================
// Phase 02: Home Domain Models
// ==========================================

export interface TaskItem {
  id: string;
  workspaceId?: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string | null;
  order: number;
}

export type StudyAssetType =
  | 'pdf'
  | 'slides'
  | 'video'
  | 'audio'
  | 'notes'
  | 'flashcards'
  | 'quiz'
  | 'browser';

export interface RecentStudyItem {
  id: string;
  title: string;
  subtitle: string;
  type: StudyAssetType;
  path: string;
  lastOpenedAt: string;
  progressPercent?: number;
  details?: string;
}

export interface DailyStudyGoal {
  date: string;
  targetMinutes: number;
  completedMinutes: number;
  streakDays: number;
  horizonDaysLeft: number;
  horizonSemesterName: string;
  horizonProgressPercent: number;
}

export interface DailyEditorial {
  quote: {
    text: string;
    author: string;
  };
  essay: {
    title: string;
    summary: string;
    readTimeMinutes: number;
    url?: string;
  };
}

// ==========================================
// Phase 03: Library Information Architecture
// Authoritative: Exactly two item types (Folders & Files)
// Notion-Style Workspace with Custom /folder Blocks
// ==========================================

export interface FolderLayoutSettings {
  view: 'gallery' | 'table'; // ONLY these 2 views
  showTitle: boolean; // default: true
  showIcon: boolean; // default: true
  cardPreview: 'cover' | 'content' | 'none'; // default: 'cover'
  cardSize: 'small' | 'medium' | 'large'; // default: 'medium'
  fitMedia: boolean; // default: true
  cardLayout: 'compact' | 'list'; // default: 'list' (icon + title below cover)
}

export const DEFAULT_FOLDER_LAYOUT_SETTINGS: FolderLayoutSettings = {
  view: 'gallery',
  showTitle: true,
  showIcon: true,
  cardPreview: 'cover',
  cardSize: 'medium',
  fitMedia: true,
  cardLayout: 'list'
};

export const STITCH_COVER_URL =
  'https://lh3.googleusercontent.com/aida/ALJJyrCUUiXZP7zKM47UBbi9Ui9sJM1qJKYBTf9qnxnZPFFryxTu-BnGQgun0ODNEHj4iux7e_DnoGJ7lI-bc2awaZiV62zgup4IWsQJiXVttIxAYu2RbxWB635_FprQip05-CRmBf9rQIPvPectj3HsHr7PxaqaL5jRYNeL3H_jHk1km2OdHTL6MFOIrWnCrZ7391zsayvAGRMB_XIAsJsLJux6DcknAAy-mRo32cLecIxkYHO2hq5Z_q4rigkB9j1Dz0-FUiiTkJ8_9Es';

export const CURATED_DARK_COVERS = [
  'https://lh3.googleusercontent.com/aida/ALJJyrCppYJgL-GYWUGcXgXSYPwm3IPAk-aE0Sf70860-1g2XkWd_FaqehWV0dQBvC9YMJ00wFDSZe3oTzfKgnQdKSOg4P2W3Vj8IeoOMmJe4O2wwUcnod9D7jvuj24E2U-ErdD3Lm6f3p6XiS8ZXUB60Tzk54EmDjl-Vle-bOLHhZ6HsNos3utTfEYl4LglyVkLOPOlYpMtfPIi3UGn4WqHApDkhmhB8XrdU9lxqrN2PRsfomfNPFAD1DQF0zxC1e_FjWCQsHs0O4nPjVIE',
  'https://lh3.googleusercontent.com/aida/ALJJyrCQfYQ0CKNfVX8eakHETMtoaOAzj7C9WXbSdvUqLwk7VEVhH4urK90bJ-b1gn22ohaRQVYi58Vwmk8WWE0oalJEeR9Bh8xbT8AryGFH_2ikjp5GRDPkjDiqLyiC5pdlKbynlIBMFaVJ7zssLiWZ4X88gwv4e-TDkJHPhj6aRSnlhhluK1uZXoSTKZv57iSrpK_sgleEnfcjxPAE1baOJAOAgqaiFE1KRCGhQ9oMSOkF_alf6gAwfjvZBAYTXku1rk7jQdvb60WqbSQ',
  'https://lh3.googleusercontent.com/aida/ALJJyrB-LYNEwXec3HbM80Q8og614-W0skePBHOl0e2vMANEHMTLJmvs2DJs3sBwCcZe9Kd4hMAnAPwkOtH99NhxOpC9HiJmGgvKF1oSiMH9zsOzb4g6EzKkxH_R29txaaChA2jzhLhkTOGpemyYimUKo59O_l5PEOMd8scU14C3A0ywSdIL1WBZKimSVhlJBX9UPhMnTtcbiF5fSbaNt4BtGCtAm0vc2VYdjGNPv0VIuOA0Wl7HFi-AYKe8WRFzLZE_nH0l30L-gynmhOLCgKzbpQ',
  'https://lh3.googleusercontent.com/aida/ALJJyrBTHQuScTnoolPPDG6zyDhME_xBmhQ7J5XO_5G0j4zmotboy5Ng3QuViG-5mXDdqjInMGRSn9R03XKdzKfeuGw5ukHEedBjYqVkZsCqtknz3uZdUrMfIZonR2CjmrXcVxt1nJ7iALNwk0-PedjqSPRVr4vtMiNpWLiEt8Rddsi_vHz6fa3HjbBYQO5xZWRU7ikFASisKXwAFFbmDAAFlsrOVw2OTUQ4QN9tUouI6T6RO0K6Hr67a6YD9B5v_L7VOaQIhsYA46bRgE6561QniQ',
  'https://lh3.googleusercontent.com/aida/ALJJyrC5lS3XVTZYv8oAq3HWagRzx2gGITWdjX3sT0CF4qwch90bINlxGGkkG-w12AXL1vn-58McFzA4-lEW3EfAb5xWLRPO-EO5z7gSPaxkyIa4J2DmYzVRCrkbZLbUSB4M625houVeOdezrKJcAykiaxluj6CgZpKMW0leEFyCB0-JUzu4D0PfhrCLqIvQALqttnUKC1Cg5-FCk2CBWAmNmTRMwxFbDprfJPes2VQY_gNnifDPOY4uhUPTbpASAyhqYtqdEiMue9ONcw',
  'https://lh3.googleusercontent.com/aida/ALJJyrBZkz7dlBs7GaIesbfDcrn2Y3C0eltXr_Esg-aIiholr5AjLXfiKZmQnFKL1xLLIpx2WTg6pfs6wvptN_PPbJ1Mu-ps6NZVaAqORZkqsUnvobg72kTlfZU8fnrc9q0Tpi7jjEfHmJ99SbB3-Y8ZRlLJ7lyxyqAOt-vg_1Ez6ku7Rauh9f2LnyG_yxTs2EoaYjtOy2xF0el27_3rjljFKWD_MQ_V-L1JoMDhwEb_6gxB4r9FxvrYhd4Mubfs5LPBICgvKEBTOGBHRZQ'
] as const;

export function getFallbackCover(seed?: string): string {
  if (!seed) return CURATED_DARK_COVERS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CURATED_DARK_COVERS.length;
  return CURATED_DARK_COVERS[index];
}

export type CustomPropertyType = 'text' | 'number' | 'select' | 'date';

export interface CustomPropertyDefinition {
  id: string;
  name: string;
  type: CustomPropertyType;
}

export interface LibraryFolder {
  id: string; // Use 'library-root' for the main /library canvas
  workspaceId: string;
  parentId?: string | null; // null for 'library-root'; 'library-root' or parent folder ID for nested folders
  name: string;
  icon?: string;
  coverUrl?: string; // Optional cover image URL or curated dark preset
  content?: unknown[]; // BlockNote Block[] structured tree
  layoutSettings?: FolderLayoutSettings;
  color?: string;
  plainTextPreview?: string;
  wordCount?: number;
  readTimeMinutes?: number;
  customProperties?: CustomPropertyDefinition[];
  customPropertyValues?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryFile {
  id: string;
  workspaceId: string;
  folderId?: string | null; // Defaults to 'library-root' or specific folder ID
  title: string;
  type: StudyAssetType;
  path: string;
  sizeBytes?: number;
  sizeFormatted?: string;
  icon?: string;
  coverUrl?: string;
  customPropertyValues?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export const CANONICAL_INITIAL_FOLDERS: LibraryFolder[] = [
  {
    id: 'folder-planning',
    workspaceId: 'default-workspace',
    parentId: 'library-root',
    name: '[ PLANNING ]',
    icon: '📁',
    color: '#3F3F46',
    layoutSettings: {
      view: 'table',
      showTitle: true,
      showIcon: true,
      cardPreview: 'cover',
      cardSize: 'medium',
      fitMedia: true,
      cardLayout: 'list'
    },
    content: [
      {
        id: 'bn-planning-callout',
        type: 'callout',
        props: { icon: 'pin' },
        content: [
          {
            type: 'text',
            text: 'Planning & Schedule: Daily study blocks, milestones, and reading assignments.',
            styles: {}
          }
        ],
        children: []
      },
      {
        id: 'bn-planning-folder-block',
        type: 'folder',
        props: { folderId: 'folder-planning' },
        children: []
      }
    ],
    plainTextPreview: 'Academic Study Planning & Daily Workflows.',
    wordCount: 6,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T07:40:00Z',
    updatedAt: '2026-11-14T07:40:00Z'
  },
  {
    id: 'folder-day-planning',
    workspaceId: 'default-workspace',
    parentId: 'folder-planning',
    name: 'DAY PLANNING [ 8 AM ]',
    icon: '📁',
    color: '#3F3F46',
    layoutSettings: { ...DEFAULT_FOLDER_LAYOUT_SETTINGS },
    content: [
      {
        id: 'bn-day-planning-callout',
        type: 'callout',
        props: { icon: 'pin' },
        content: [
          {
            type: 'text',
            text: 'Daily morning study schedule, focus tracking blocks, and high-priority review tasks.',
            styles: {}
          }
        ],
        children: []
      },
      {
        id: 'bn-day-planning-p1',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [
          {
            type: 'text',
            text: '08:00 AM – 10:30 AM: Deep focus on Kandel Principles Ch. 12 (Neurobiology & Synaptic Transmission).',
            styles: {}
          }
        ],
        children: []
      }
    ],
    plainTextPreview: 'Daily morning study schedule and time blocking.',
    wordCount: 7,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T08:00:00Z',
    updatedAt: '2026-11-14T08:00:00Z'
  },
  {
    id: 'folder-month-planning',
    workspaceId: 'default-workspace',
    parentId: 'folder-planning',
    name: 'MONTH PLANNING',
    icon: '📁',
    color: '#3F3F46',
    layoutSettings: { ...DEFAULT_FOLDER_LAYOUT_SETTINGS },
    content: [],
    plainTextPreview: 'Long-term monthly study milestones and targets.',
    wordCount: 6,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T08:00:00Z',
    updatedAt: '2026-11-14T08:00:00Z'
  },
  {
    id: 'folder-decagon',
    workspaceId: 'default-workspace',
    parentId: 'library-root',
    name: '[ THE DECAGON ]',
    icon: '🏛️',
    color: '#3F3F46',
    layoutSettings: {
      view: 'gallery',
      showTitle: true,
      showIcon: true,
      cardPreview: 'cover',
      cardSize: 'small',
      fitMedia: true,
      cardLayout: 'list'
    },
    content: [
      {
        id: 'bn-decagon-callout',
        type: 'callout',
        props: { icon: 'pin' },
        content: [
          {
            type: 'text',
            text: 'The Decagon: Core academic tracks and modules for medical and engineering curricula.',
            styles: {}
          }
        ],
        children: []
      },
      {
        id: 'bn-decagon-folder-block',
        type: 'folder',
        props: { folderId: 'folder-decagon' },
        children: []
      }
    ],
    plainTextPreview: 'The Decagon — Core academic tracks and modules.',
    wordCount: 12,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T07:45:00Z',
    updatedAt: '2026-11-14T07:45:00Z'
  },
  {
    id: 'folder-tech',
    workspaceId: 'default-workspace',
    parentId: 'folder-decagon',
    name: '1. TECH',
    icon: 'cpu',
    coverUrl: CURATED_DARK_COVERS[0],
    color: '#3F3F46',
    layoutSettings: { ...DEFAULT_FOLDER_LAYOUT_SETTINGS },
    content: [
      {
        id: 'bn-tech-callout',
        type: 'callout',
        props: { icon: 'pin' },
        content: [
          {
            type: 'text',
            text: '1. TECH — Computational architectures, algorithmic reasoning, and systems design.',
            styles: {}
          }
        ],
        children: []
      },
      {
        id: 'bn-tech-notes',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [
          {
            type: 'text',
            text: 'Foundational study notes on systems engineering, neural architectures, and computational models.',
            styles: {}
          }
        ],
        children: []
      }
    ],
    plainTextPreview: 'Technical systems and computational architectures.',
    wordCount: 5,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T08:00:00Z',
    updatedAt: '2026-11-14T08:00:00Z'
  },
  {
    id: 'folder-business',
    workspaceId: 'default-workspace',
    parentId: 'folder-decagon',
    name: '2. BUSINESS',
    icon: 'briefcase',
    coverUrl: CURATED_DARK_COVERS[1],
    color: '#3F3F46',
    layoutSettings: { ...DEFAULT_FOLDER_LAYOUT_SETTINGS },
    content: [],
    plainTextPreview: 'Economics, venture design, and market strategy.',
    wordCount: 6,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T08:00:00Z',
    updatedAt: '2026-11-14T08:00:00Z'
  },
  {
    id: 'folder-ppe',
    workspaceId: 'default-workspace',
    parentId: 'folder-decagon',
    name: '3. PPE',
    icon: 'landmark',
    coverUrl: CURATED_DARK_COVERS[2],
    color: '#3F3F46',
    layoutSettings: { ...DEFAULT_FOLDER_LAYOUT_SETTINGS },
    content: [],
    plainTextPreview: 'Philosophy, Politics, and Economics foundational seminar.',
    wordCount: 6,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T08:00:00Z',
    updatedAt: '2026-11-14T08:00:00Z'
  }
];

export const CANONICAL_INITIAL_FILES: LibraryFile[] = [
  {
    id: 'file-kandel-pdf',
    workspaceId: 'default-workspace',
    folderId: 'folder-planning',
    title: 'Kandel_Principles_Ch12.pdf',
    type: 'pdf',
    coverUrl: CURATED_DARK_COVERS[3],
    path: '/learning?fileId=file-kandel-pdf&type=pdf',
    sizeFormatted: '14.2 MB',
    createdAt: '2026-11-14T11:00:00Z',
    updatedAt: '2026-11-14T11:00:00Z'
  },
  {
    id: 'file-cellular-slides',
    workspaceId: 'default-workspace',
    folderId: 'folder-planning',
    title: 'Cellular_Slides.pptx',
    type: 'slides',
    coverUrl: CURATED_DARK_COVERS[1],
    path: '/learning?fileId=file-cellular-slides&type=slides',
    sizeFormatted: 'Nov 14',
    createdAt: '2026-11-14T11:20:00Z',
    updatedAt: '2026-11-14T11:20:00Z'
  },
  {
    id: 'file-usmle-atlas',
    workspaceId: 'default-workspace',
    folderId: 'folder-decagon',
    title: 'USMLE_Atlas.pdf',
    type: 'pdf',
    coverUrl: CURATED_DARK_COVERS[3],
    path: '/learning?fileId=file-usmle-atlas&type=pdf',
    sizeFormatted: '12.8 MB',
    createdAt: '2026-11-14T09:30:00Z',
    updatedAt: '2026-11-14T09:30:00Z'
  },
  {
    id: 'file-synaptic-ltp',
    workspaceId: 'default-workspace',
    folderId: 'folder-decagon',
    title: 'Synaptic_LTP.mp4',
    type: 'video',
    coverUrl: CURATED_DARK_COVERS[4],
    path: '/learning?fileId=file-synaptic-ltp&type=video',
    sizeFormatted: '48.5 MB',
    createdAt: '2026-11-14T10:00:00Z',
    updatedAt: '2026-11-14T10:00:00Z'
  }
];

// Backwards-compatible document alias mapping to Folder
export interface LibraryDocument extends Omit<LibraryFolder, 'content' | 'name'> {
  title: string;
  name?: string;
  folderId?: string | null;
  content?: any;
}

// ==========================================
// Phase 08: Profile Domain Models
// ==========================================

export type ProfileTab = 'posts' | 'media' | 'resources' | 'communities' | 'activity';

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  isAuthenticated: boolean;
  email?: string;
  institution?: string;
  learningFocus?: string;
  bio?: string;
  avatarUrl?: string;
  coverImage?: string;
  joinedDate: string;
  location?: string;
  education?: string;
  website?: string;
  academicTracks?: string[];
  stats?: {
    followersCount?: number;
    followingCount?: number;
    studyTimeHours?: number;
    streakDays?: number;
    contributionsCount?: number;
  };
}

export interface UserPostDeck {
  id: string;
  title: string;
  tag: string;
  cardCount: number;
  algorithm: string;
  forksCount: number;
}

export interface UserPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatarUrl: string;
  content: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  isLiked?: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'whiteboard';
  pinned?: boolean;
  deck?: UserPostDeck;
}

export interface UserSharedResource {
  id: string;
  title: string;
  description?: string;
  type: 'deck' | 'document' | 'notes' | 'cheatsheet';
  cardsCount?: number;
  forksCount: number;
  tags: string[];
  updatedAt: string;
}

export interface UserCommunity {
  id: string;
  name: string;
  handle: string;
  description: string;
  membersCount: number;
  icon?: string;
  coverUrl?: string;
  joinedAt: string;
  role: 'member' | 'moderator' | 'admin';
}

export interface DailyContribution {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ProfileActivityMetrics {
  totalStudyTimeHours: number;
  currentStreakDays: number;
  totalContributions: number;
  yearLabel: string;
  dateRangeLabel: string;
  dailyContributions: DailyContribution[];
}

export interface AggregatedStudyStats {
  tasksCompleted: number;
  tasksTotal: number;
  libraryFoldersCount: number;
  libraryFilesCount: number;
  streakDays: number;
  studyHours: number | null;
  flashcardsReviewed: number | null;
}

export interface ProfileActivityItem {
  id: string;
  type: 'task_completed' | 'library_folder_created' | 'library_file_created' | 'session_logged';
  title: string;
  description?: string;
  timestamp: string;
  iconName?: string;
  meta?: Record<string, unknown>;
}

export interface PreMigrationSnapshot {
  snapshotId: string;
  createdAt: string;
  workspaceId: string;
  taskCount: number;
  folderCount: number;
  fileCount: number;
  integrityHash: string;
}

// ============================================================================
// Phase 09: Settings Domain Models
// ============================================================================

export type SettingsTab = 'account' | 'usage' | 'general' | 'memory' | 'skills';

export interface AccountSettings {
  name: string;
  username: string;
  email: string;
  learningFocus: string;
  plan: 'Free' | 'Pro';
  avatarUrl?: string;
  bio?: string;
  location?: string;
  education?: string;
  coverImage?: string;
  joinedDate?: string;
}

export interface UsageSettings {
  planName: string;
  planPrice: string;
  planDescription: string;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  aiCreditsResetDays: number;
  aiCreditsResetHours: number;
  storageBytesUsed: number;
  storageBytesLimit: number;
  availableResets: number;
}

export interface HorizonBarSettings {
  milestoneName: string;
  startDate: string;
  endDate: string;
  preset: 'current_year' | 'semester' | 'custom';
}

export interface FocusTrackingSettings {
  automaticStudyTracking: boolean;
  defaultPomodoroInterval?: string;
  focusMinutes: number;
  breakMinutes: number;
}

export interface SoundMotionSettings {
  sessionCompletionChimes: boolean;
  reducedMotion: 'os_default' | 'enabled' | 'disabled';
}

export interface GeneralSettings {
  appLanguage: string;
  horizonBar: HorizonBarSettings;
  focusTracking: FocusTrackingSettings;
  soundMotion: SoundMotionSettings;
  weekStartDay?: 'saturday' | 'monday';
}

export interface LearnedMemoryItem {
  id: string;
  text: string;
  category: 'Pedagogy' | 'Domain Knowledge' | 'Habits' | 'Formatting' | string;
  createdAt: string;
}

export interface MemorySettings {
  enabled: boolean;
  whoIAm: string;
  whatIAmLearning: string;
  howIPreferToLearn: string;
  learnedMemories?: LearnedMemoryItem[];
}

export interface SkillItem {
  id: string;
  command: string;
  description: string;
  enabled: boolean;
  systemPrompt: string;
  isBuiltIn: boolean;
}

export interface SkillsSettings {
  skills: SkillItem[];
}

export interface UserSettings {
  account: AccountSettings;
  usage: UsageSettings;
  general: GeneralSettings;
  memory: MemorySettings;
  skills: SkillItem[];
}

// ============================================================================
// Phase 05 & 06: Unified Tracking & Calendar Domain Models
// ============================================================================

export interface UserDomain {
  id: string;
  userId: string;
  name: string;
  colorToken: string;
  createdAt: string;
  topics?: UserTopic[];
}

export interface UserTopic {
  id: string;
  userId: string;
  domainId: string;
  name: string;
  createdAt: string;
}

export type StudySessionStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'missed'
  | 'cancelled';

export type StudySessionSource =
  | 'calendar'
  | 'timer_adhoc'
  | 'historical_manual';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly';
  daysOfWeek?: number[]; // 0=Sun..6=Sat
  endDate?: string; // YYYY-MM-DD
}

export type TrackingSessionMode = 'countdown' | 'stopwatch';
export type TrackingSessionStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'focus_running'
  | 'focus_paused'
  | 'break_running'
  | 'break_paused';

export type TrackingTimerState =
  | 'idle'
  | 'focus_running'
  | 'focus_paused'
  | 'break_running'
  | 'break_paused'
  | 'completed';

export interface PauseInterval {
  pausedAt: number; // epoch ms
  resumedAt: number | null; // epoch ms
}

export interface TrackingInterval {
  startedAt: number; // epoch ms
  endedAt: number | null; // epoch ms
}

/**
 * Unified StudySession model in PostgreSQL & application domain.
 * Unifies historical local TrackingSession, CalendarEvent, and LearningBlock.
 */
export interface StudySession {
  id: string;
  userId: string;
  title: string;
  domainId?: string | null;
  domainName: string;
  topicId?: string | null;
  topicName?: string | null;
  status: StudySessionStatus;
  source: StudySessionSource;
  date: string; // YYYY-MM-DD
  plannedStartTime?: string | null; // HH:mm (24h)
  plannedEndTime?: string | null; // HH:mm (24h)
  plannedDurationMinutes: number;
  actualStartTimestamp?: number | null; // epoch ms
  actualEndTimestamp?: number | null; // epoch ms
  actualFocusSeconds: number;
  actualBreakSeconds: number;
  timerMode: TrackingSessionMode;
  pauseIntervals: PauseInterval[];
  notes?: string | null;
  sortOrder: number;
  seriesId?: string | null;
  recurrenceRule?: RecurrenceRule | null;
  isSeriesException?: boolean;
  createdAt: string;
  updatedAt: string;

  // Backward compatibility aliases for existing components
  fieldName?: string;
  subjectName?: string;
  subtitle?: string;
  startTime?: number; // epoch ms alias for actualStartTimestamp
  endTime?: number;   // epoch ms alias for actualEndTimestamp
  durationMinutes?: number;
  durationSeconds?: number;
  isManual?: boolean;
  calendarEventId?: string | null;
}

// Backward compatibility alias
export type TrackingSession = StudySession & {
  mode?: TrackingSessionMode;
  startTime?: number;
  endTime?: number;
  durationSeconds?: number;
  durationMinutes?: number;
  calendarEventId?: string;
  fieldId?: string;
  folderId?: string;
  order?: number;
};

export type AnalyticsPeriod = 'day' | 'week' | 'month';

export interface CrossFilterState {
  domainName?: string;
  fieldName?: string; // Backward compatibility alias
  dateKey?: string;
}

export interface SessionHistoryFilter {
  search: string;
  domainId?: string; // 'all' | domainId
  fieldId?: string; // Backward compatibility alias
  topic?: string; // 'all' | topicName
  subject?: string; // Backward compatibility alias
  dateRange: 'this_week' | 'last_week' | 'this_month' | 'all';
}

export interface AnalyticsDataPoint {
  label: string; // e.g. "Mon", "09:00", "Week 1"
  dateKey: string; // YYYY-MM-DD or YYYY-MM-DD-HH
  actualHours: number;
  plannedHours: number;
}

export interface DomainDistributionItem {
  domainName: string;
  domainId?: string;
  fieldName?: string; // Backward compatibility alias
  fieldId?: string; // Backward compatibility alias
  hours: number;
  percentage: number;
  colorHex: string;
}

export type FieldDistributionItem = DomainDistributionItem;

export interface TrackingAnalyticsReport {
  period: AnalyticsPeriod;
  referenceDate: string; // ISO string
  totalFocusHours: number;
  dailyAverageHours: number;
  adherenceRate: number; // percentage (0..100)
  learningHoursPoints: AnalyticsDataPoint[];
  studyHoursPoints: AnalyticsDataPoint[]; // Backward compatibility alias
  domainDistribution: DomainDistributionItem[];
  fieldDistribution: DomainDistributionItem[]; // Backward compatibility alias
  activeDomainCount: number;
  activeFieldCount: number; // Backward compatibility alias
}

export type TrackingAnalyticsResponse = TrackingAnalyticsReport;

export interface AnnualHeatmapDay {
  date: string; // YYYY-MM-DD
  dayLabel: string;
  hours: number;
  level: number; // 0..4
  isFuture: boolean;
}

export interface AnnualHeatmapResponse {
  weeks: AnnualHeatmapDay[][];
  totalHours: number;
  currentStreak: number;
  startDate: string;
  endDate: string;
}

export interface WeeklyDayStudyHours {
  dayName: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  dateStr: string; // YYYY-MM-DD
  hours: number;
  isCurrentDay: boolean;
  percentageOfMax: number;
}

export interface WeeklySubjectStudyTime {
  folderId: string;
  subjectName: string;
  hours: number;
  percentage: number;
  colorClass?: string;
}

export interface WeeklyTrackingStats {
  dailyAverageHours: number;
  totalHours: number;
  days: WeeklyDayStudyHours[];
  subjects: WeeklySubjectStudyTime[];
}

export type CalendarEventType = 'study_block' | 'exam_deadline' | 'assignment' | 'review_session';

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  startTime: string; // ISO 8601 string
  endTime: string; // ISO 8601 string
  folderId?: string | null;
  fileId?: string | null;
  resourceMeta?: string;
  notes?: string;
  completed: boolean;
  linkedSessionId?: string | null;
  actualDurationMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type LearningBlockDomain = string;

export const CALENDAR_DOMAIN_COLORS: Record<string, string> = {
  'Computer Science': '#60A5FA',
  'Economics': '#94A3B8',
  'Philosophy': '#E4E4E7',
  'Languages': '#FBBF24',
  'Cognitive Science': '#818CF8',
  'default': '#60A5FA'
};

export interface LearningBlock {
  id: string;
  title: string;
  domain: string;
  topic?: string | null;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour)
  endTime: string; // HH:mm (24-hour)
  durationMinutes: number; // Computed integer
  status?: StudySessionStatus;
  seriesId?: string | null;
  actualFocusSeconds?: number;
  actualBreakSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarBlocksSummary {
  totalMinutes: number;
  formattedDuration: string;
  blockCount: number;
}

export interface FlashcardCard {
  id: string;
  front: string;
  back: string;
  dueDate: string; // ISO 8601
  intervalDays?: number;
  repetition?: number;
}

export interface SpacedRepetitionDeck {
  id: string;
  title: string;
  totalCards: number;
  dueCount: number;
  lastStudiedAt?: string;
  cards?: FlashcardCard[];
}

// ==========================================
// Phase 04: Learning Workspace Domain Models
// ==========================================

export type LearningToolType =
  | 'new-tab'
  | 'new_tab'
  | 'pdf'
  | 'docx'
  | 'slides'
  | 'board'
  | 'spreadsheet'
  | 'images'
  | 'videos'
  | 'audios'
  | 'browser'
  | 'notes'
  | 'flashcards'
  | 'quizzes'
  | 'exam';

export interface LearningTab {
  id: string;
  toolType: LearningToolType;
  title: string;
  resourceId?: string;
  active: boolean;
  savedState?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export type FlashcardStatus = 'learning' | 'review' | 'mastered';

export interface SM2Flashcard {
  id: string;
  deckId: string;
  topicTag: string; // e.g. "QUESTION • MOLECULAR BIOLOGY"
  subTopic: string; // e.g. "Long-Term Potentiation (LTP)"
  question: string;
  answerTitle: string; // e.g. "The NMDA Receptor (NMDAR)"
  answer: string;
  mechanismSnippet?: string;
  sourceReference?: string;
  easeFactor: number; // default 2.5
  interval: number; // in days (or fractions for learning)
  repetitions: number;
  nextReviewDate: string; // ISO 8601
  status: FlashcardStatus;
  orderIndex: number;
}

export interface SM2Deck {
  id: string;
  title: string;
  topic: string;
  totalCards: number;
  learningCount: number;
  reviewCount: number;
  masteredCount: number;
  cards?: SM2Flashcard[];
  createdAt: string;
  updatedAt: string;
}

export type SM2RatingGrade = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface SM2ReviewInput {
  cardId: string;
  grade: SM2RatingGrade;
}

export interface SM2ReviewResult {
  card: SM2Flashcard;
  deckStats: {
    totalCards: number;
    learningCount: number;
    reviewCount: number;
    masteredCount: number;
  };
  intervalLabel: string;
}

export interface QuizOptionItem {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionNumber: number;
  question: string;
  options: QuizOptionItem[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  distractorRationales?: Record<string, string>;
  isFlagged?: boolean;
  userSelectedOption?: 'A' | 'B' | 'C' | 'D' | null;
}

export interface QuizItem {
  id: string;
  title: string;
  module: string;
  totalQuestions: number;
  questions?: QuizQuestion[];
  createdAt: string;
}

export interface QuizSessionState {
  quizId: string;
  title: string;
  module: string;
  currentQuestionIndex: number;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  flagged: Record<string, boolean>;
  score: number;
  answeredCount: number;
  elapsedSeconds: number;
  isFinished: boolean;
  questions: QuizQuestion[];
}

export interface ExamViolationLog {
  id: string;
  timestamp: string;
  event: 'tab_switched' | 'window_blur' | 'fullscreen_exit';
  details: string;
}

export interface ExamSession {
  id: string;
  title: string;
  module: string;
  sessionToken: string; // e.g. "8F2A-94B1-CC03"
  totalQuestions: number;
  currentQuestionNumber: number;
  timeRemainingSeconds: number; // e.g. 2535 for 42:15
  totalSeconds: number;
  status: 'active' | 'completed' | 'terminated';
  score: number;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  flagged: Record<string, boolean>;
  integrityLogs: ExamViolationLog[];
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaChapter {
  timestamp: number; // in seconds
  title: string;
}

export interface MediaItem {
  id: string;
  type: 'video' | 'audio';
  title: string;
  subtitle: string;
  instructor?: string;
  mediaUrl: string;
  durationSeconds: number;
  currentTimestampSeconds: number;
  chapters: MediaChapter[];
  tags?: string[];
  bannerUrl?: string;
}

export interface TranscriptSegment {
  id: string;
  mediaId: string;
  startTime: number;
  endTime: number;
  formattedTime: string;
  text: string;
  speaker?: string;
  isHighlighted?: boolean;
}

export interface LearningRecentItem {
  id: string;
  title: string;
  type: LearningToolType;
  metaText: string;
  lastOpened: string;
  resourceId?: string;
  targetToolName: string;
}

export interface SavedNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  sourceContext: string;
  createdAt: string;
}

export interface LearningAiContextInfo {
  activeTool: LearningToolType;
  headerBadge: string;
  systemContext: string;
  suggestedPrompts: string[];
  isLocked: boolean;
  sessionToken?: string;
  currentTimestamp?: string;
}

// ==========================================
// Master SOS Library Module Data Model
// ==========================================

export type LibraryItemKind = 'folder' | 'file';

export type SOSFileType =
  | 'folder'
  | 'pdf'
  | 'docx'
  | 'slides'
  | 'spreadsheet'
  | 'image'
  | 'video'
  | 'audio'
  | 'browser'
  | 'note'
  | 'flashcards'
  | 'quiz'
  | 'exam'
  | 'board';

export interface LibraryAncestor {
  _id: string;
  name: string;
}

export interface LibraryStorageMetadata {
  storagePath?: string;
  mimeType?: string;
  sizeBytes?: number;
  url?: string;
}

export interface LibraryArtifactMetrics {
  pageCount?: number;
  currentPage?: number;
  slideCount?: number;
  sheetCount?: number;
  rowCount?: number;
  durationSeconds?: number;
  cardCount?: number;
  dueCount?: number;
  questionCount?: number;
  totalPoints?: number;
  wordCount?: number;
}

export interface LibraryArtifactData {
  linkedArtifactId?: string;
  externalUrl?: string;
  metrics?: LibraryArtifactMetrics;
}

export interface LibraryItem {
  _id: string;
  id: string; // Dual-access compatibility across Postgres, Mongo, and Dexie
  name: string;
  itemKind: LibraryItemKind;
  fileType: SOSFileType;
  parentId: string | null;
  ancestors: LibraryAncestor[];
  icon?: string | null;
  coverImage?: string | null;
  storage?: LibraryStorageMetadata;
  artifactData?: LibraryArtifactData;
  childCount?: number;
  position?: number;
  createdAt: string;
  updatedAt: string;
}




