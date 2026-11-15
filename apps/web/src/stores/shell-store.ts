import { create } from 'zustand';
import type { NavigationDestination, GuestWorkspace } from '@sos/domain';
import { getShellPreference, setShellPreference } from '@sos/persistence';

interface ShellStoreState {
  railExpanded: boolean;
  aiPanelOpen: boolean;
  hasUnreadMessages: boolean;
  hasUnreadNotifications: boolean;
  workspace: GuestWorkspace | null;
  isInitializing: boolean;
  activeDestination: NavigationDestination;

  toggleRail: () => void;
  setRailExpanded: (expanded: boolean) => void;
  toggleAiPanel: () => void;
  setAiPanelOpen: (open: boolean) => void;
  setHasUnreadMessages: (hasUnread: boolean) => void;
  setHasUnreadNotifications: (hasUnread: boolean) => void;
  setWorkspace: (workspace: GuestWorkspace | null) => void;
  setIsInitializing: (isInit: boolean) => void;
  setActiveDestination: (dest: NavigationDestination) => void;
  loadInitialPreferences: () => Promise<void>;
}

export const useShellStore = create<ShellStoreState>((set, get) => ({
  railExpanded: false,
  aiPanelOpen: true,
  hasUnreadMessages: false,
  hasUnreadNotifications: false,
  workspace: null,
  isInitializing: true,
  activeDestination: 'home',

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
    set({ aiPanelOpen: next });
    setShellPreference('shell:aiPanelOpen', next);
  },

  setAiPanelOpen: (open: boolean) => {
    set({ aiPanelOpen: open });
    setShellPreference('shell:aiPanelOpen', open);
  },

  setHasUnreadMessages: (hasUnreadMessages) => set({ hasUnreadMessages }),
  setHasUnreadNotifications: (hasUnreadNotifications) => set({ hasUnreadNotifications }),

  setWorkspace: (workspace) => set({ workspace }),
  setIsInitializing: (isInitializing) => set({ isInitializing }),
  setActiveDestination: (activeDestination) => set({ activeDestination }),

  loadInitialPreferences: async () => {
    const [savedRail, savedAi] = await Promise.all([
      getShellPreference('shell:railExpanded', false),
      getShellPreference('shell:aiPanelOpen', true)
    ]);
    set({
      railExpanded: Boolean(savedRail),
      aiPanelOpen: Boolean(savedAi)
    });
  }
}));
