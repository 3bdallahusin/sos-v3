export * from './uuid.js';

export const NAVIGATION_DESTINATIONS = [
  'home',
  'library',
  'learning',
  'tracking',
  'calendar',
  'community',
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
  { id: 'community', label: 'Community', path: '/community', iconName: 'Users' },
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
// Phase 03: Library & Tiptap Document Models
// ==========================================

export interface LibraryDocument {
  id: string;
  workspaceId: string;
  folderId?: string | null;
  title: string;
  content: Record<string, unknown>; // Tiptap JSONContent structured tree
  plainTextPreview?: string;
  wordCount: number;
  readTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryFolder {
  id: string;
  workspaceId: string;
  name: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}



