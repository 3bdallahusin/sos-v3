import { create } from 'zustand';
import type { NavigationDestination, GuestWorkspace } from '@sos/domain';
import { getShellPreference, setShellPreference } from '@sos/persistence';

export const DEFAULT_LEFT_RAIL_WIDTH = 240;
export const MIN_LEFT_RAIL_WIDTH = 180;
export const MAX_LEFT_RAIL_WIDTH = 320;
export const COLLAPSE_LEFT_RAIL_THRESHOLD = 130;
export const COLLAPSED_LEFT_RAIL_WIDTH = 56;

export const DEFAULT_RIGHT_AI_WIDTH = 340;
export const MIN_RIGHT_AI_WIDTH = 280;
export const MAX_RIGHT_AI_WIDTH = 620;

export const MIN_CENTRAL_WORKSPACE_WIDTH = 480;

const getInitialStoredNumber = (
  key: string,
  fallback: number,
  min: number,
  max: number
): number => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const val = Number(raw);
      if (!isNaN(val) && val >= min && val <= max) {
        return val;
      }
    }
  } catch {}
  return fallback;
};

interface ShellStoreState {
  railExpanded: boolean;
  aiPanelOpen: boolean;
  isAiPanelFullscreen: boolean;
  hasUnreadMessages: boolean;
  hasUnreadNotifications: boolean;
  workspace: GuestWorkspace | null;
  isInitializing: boolean;
  activeDestination: NavigationDestination;
  leftRailWidth: number;
  rightAiPanelWidth: number;
  isDragging: boolean;

  toggleRail: () => void;
  setRailExpanded: (expanded: boolean) => void;
  toggleAiPanel: () => void;
  setAiPanelOpen: (open: boolean) => void;
  toggleAiPanelFullscreen: () => void;
  setIsAiPanelFullscreen: (isFullscreen: boolean) => void;
  setHasUnreadMessages: (hasUnread: boolean) => void;
  setHasUnreadNotifications: (hasUnread: boolean) => void;
  setWorkspace: (workspace: GuestWorkspace | null) => void;
  setIsInitializing: (isInit: boolean) => void;
  setActiveDestination: (dest: NavigationDestination) => void;
  setLeftRailWidth: (width: number) => void;
  setRightAiPanelWidth: (width: number) => void;
  resetLeftRailWidth: () => void;
  resetRightAiPanelWidth: () => void;
  setIsDragging: (isDragging: boolean) => void;
  loadInitialPreferences: () => Promise<void>;
}

export const useShellStore = create<ShellStoreState>((set, get) => ({
  railExpanded: false,
  aiPanelOpen: false,
  isAiPanelFullscreen: false,
  hasUnreadMessages: false,
  hasUnreadNotifications: false,
  workspace: null,
  isInitializing: true,
  activeDestination: 'home',
  leftRailWidth: getInitialStoredNumber(
    'sos:leftRailWidth',
    DEFAULT_LEFT_RAIL_WIDTH,
    MIN_LEFT_RAIL_WIDTH,
    MAX_LEFT_RAIL_WIDTH
  ),
  rightAiPanelWidth: getInitialStoredNumber(
    'sos:rightAiPanelWidth',
    DEFAULT_RIGHT_AI_WIDTH,
    MIN_RIGHT_AI_WIDTH,
    MAX_RIGHT_AI_WIDTH
  ),
  isDragging: false,

  toggleRail: () => {
    const next = !get().railExpanded;
    set({ railExpanded: next });
    setShellPreference('shell:railExpanded', next);
  },

  setRailExpanded: (expanded: boolean) => {
    set({ railExpanded: expanded });
    setShellPreference('shell:railExpanded', expanded);
  },

  toggleAiPanel: () => {
    const next = !get().aiPanelOpen;
    set({
      aiPanelOpen: next,
      isAiPanelFullscreen: false
    });
    setShellPreference('shell:aiPanelOpen', next);
  },

  setAiPanelOpen: (open: boolean) => {
    set({
      aiPanelOpen: open,
      isAiPanelFullscreen: open ? get().isAiPanelFullscreen : false
    });
    setShellPreference('shell:aiPanelOpen', open);
  },

  toggleAiPanelFullscreen: () => {
    const next = !get().isAiPanelFullscreen;
    set({
      isAiPanelFullscreen: next,
      aiPanelOpen: true
    });
  },

  setIsAiPanelFullscreen: (isAiPanelFullscreen: boolean) => {
    set({
      isAiPanelFullscreen,
      aiPanelOpen: isAiPanelFullscreen ? true : get().aiPanelOpen
    });
  },

  setHasUnreadMessages: (hasUnreadMessages) => set({ hasUnreadMessages }),
  setHasUnreadNotifications: (hasUnreadNotifications) => set({ hasUnreadNotifications }),

  setWorkspace: (workspace) => set({ workspace }),
  setIsInitializing: (isInitializing) => set({ isInitializing }),
  setActiveDestination: (activeDestination) => set({ activeDestination }),

  setLeftRailWidth: (width: number) => {
    const clamped = Math.max(
      MIN_LEFT_RAIL_WIDTH,
      Math.min(MAX_LEFT_RAIL_WIDTH, width)
    );
    set({ leftRailWidth: clamped });
    try {
      localStorage.setItem('sos:leftRailWidth', String(clamped));
    } catch {}
    setShellPreference('shell:leftRailWidth', clamped);
  },

  resetLeftRailWidth: () => {
    set({ leftRailWidth: DEFAULT_LEFT_RAIL_WIDTH, railExpanded: true });
    try {
      localStorage.setItem('sos:leftRailWidth', String(DEFAULT_LEFT_RAIL_WIDTH));
    } catch {}
    setShellPreference('shell:leftRailWidth', DEFAULT_LEFT_RAIL_WIDTH);
    setShellPreference('shell:railExpanded', true);
  },

  setRightAiPanelWidth: (width: number) => {
    const clamped = Math.max(
      MIN_RIGHT_AI_WIDTH,
      Math.min(MAX_RIGHT_AI_WIDTH, width)
    );
    set({ rightAiPanelWidth: clamped });
    try {
      localStorage.setItem('sos:rightAiPanelWidth', String(clamped));
    } catch {}
    setShellPreference('shell:rightAiPanelWidth', clamped);
  },

  resetRightAiPanelWidth: () => {
    set({ rightAiPanelWidth: DEFAULT_RIGHT_AI_WIDTH, aiPanelOpen: true });
    try {
      localStorage.setItem('sos:rightAiPanelWidth', String(DEFAULT_RIGHT_AI_WIDTH));
    } catch {}
    setShellPreference('shell:rightAiPanelWidth', DEFAULT_RIGHT_AI_WIDTH);
    setShellPreference('shell:aiPanelOpen', true);
  },

  setIsDragging: (isDragging: boolean) => set({ isDragging }),

  loadInitialPreferences: async () => {
    const isLearning = typeof window !== 'undefined' && window.location.pathname.startsWith('/learning');
    const [savedRail, savedAi, savedLeftWidth, savedRightWidth] = await Promise.all([
      getShellPreference('shell:railExpanded', false),
      getShellPreference('shell:aiPanelOpen', false),
      getShellPreference('shell:leftRailWidth', get().leftRailWidth),
      getShellPreference('shell:rightAiPanelWidth', get().rightAiPanelWidth)
    ]);
    const validLeft = Number(savedLeftWidth);
    const validRight = Number(savedRightWidth);
    set({
      railExpanded: Boolean(savedRail),
      aiPanelOpen: isLearning ? Boolean(savedAi) : false,
      leftRailWidth:
        !isNaN(validLeft) && validLeft >= MIN_LEFT_RAIL_WIDTH
          ? validLeft
          : DEFAULT_LEFT_RAIL_WIDTH,
      rightAiPanelWidth:
        !isNaN(validRight) && validRight >= MIN_RIGHT_AI_WIDTH
          ? validRight
          : DEFAULT_RIGHT_AI_WIDTH
    });
  }
}));
