import { create } from 'zustand';
import type {
  UserSettings,
  AccountSettings,
  UsageSettings,
  GeneralSettings,
  MemorySettings,
  LearnedMemoryItem,
  SkillItem,
  SettingsTab
} from '@sos/domain';
import {
  getUserSettings,
  updateAccountSettings,
  updateGeneralSettings,
  updateMemorySettings,
  getUsageSettings,
  getSkills,
  saveSkill,
  toggleSkill,
  deleteSkill,
  deleteAccountData,
  DEFAULT_USER_SETTINGS
} from '@sos/persistence';
import { useTrackingStore } from './tracking-store.js';

const SETTINGS_STORAGE_KEY = 'sos_user_settings_v3';

function getInitialSettings(): { settings: UserSettings; isHydrated: boolean } {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.general?.horizonBar?.milestoneName) {
          return { settings: parsed, isHydrated: true };
        }
      }
    } catch {}
  }
  return { settings: DEFAULT_USER_SETTINGS, isHydrated: false };
}

interface SettingsStoreState {
  activeTab: SettingsTab;
  settings: UserSettings;
  isLoading: boolean;
  isHydrated: boolean;
  isSaving: boolean;
  skillEditorModal: {
    isOpen: boolean;
    skill?: SkillItem;
  };
  deleteAccountModalOpen: boolean;
  undoMemory: { item: LearnedMemoryItem; index: number } | null;

  setActiveTab: (tab: SettingsTab) => void;
  loadSettings: () => Promise<void>;
  updateAccount: (patch: Partial<AccountSettings>) => Promise<void>;
  updateGeneral: (patch: Partial<GeneralSettings>) => Promise<void>;
  updateMemory: (patch: Partial<MemorySettings>) => Promise<void>;
  deleteLearnedMemory: (id: string) => Promise<void>;
  restoreLearnedMemory: () => Promise<void>;
  clearUndoMemory: () => void;
  toggleSkill: (id: string) => Promise<void>;
  saveSkill: (skillData: {
    id?: string;
    command: string;
    description: string;
    systemPrompt: string;
  }) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  openSkillEditor: (skill?: SkillItem) => void;
  closeSkillEditor: () => void;
  setDeleteAccountModalOpen: (open: boolean) => void;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => {
  const initial = getInitialSettings();

  return {
    activeTab: 'account',
    settings: initial.settings,
    isLoading: !initial.isHydrated,
    isHydrated: initial.isHydrated,
    isSaving: false,
    skillEditorModal: {
      isOpen: false,
      skill: undefined
    },
    deleteAccountModalOpen: false,
    undoMemory: null,

    setActiveTab: (tab: SettingsTab) => {
      set({ activeTab: tab });
    },

    loadSettings: async () => {
      if (!get().isHydrated) {
        set({ isLoading: true });
      }
      try {
        // 1. Try local Dexie persistence first for instant zero-latency loading
        const local = await getUserSettings();
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(local));
          } catch {}
        }
        set({ settings: local, isLoading: false, isHydrated: true });

      if (local.general?.focusTracking) {
        const ft = local.general.focusTracking;
        const focusMins = ft.focusMinutes ?? (
          ft.defaultPomodoroInterval ? parseInt(ft.defaultPomodoroInterval, 10) : 50
        );
        const breakMins = ft.breakMinutes ?? 10;
        useTrackingStore.getState().syncWithPomodoroInterval(focusMins, breakMins);
      }

      // 2. Refresh usage calculation dynamically
      const usage = await getUsageSettings();
      set((state) => ({
        settings: {
          ...state.settings,
          usage
        }
      }));

      // 3. Sync with backend API in background if online
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const apiSettings: UserSettings = await res.json();
          set((state) => ({
            settings: {
              ...apiSettings,
              usage: state.settings.usage // keep dynamic client storage calculation
            }
          }));
          if (apiSettings.account) {
            await updateAccountSettings(apiSettings.account);
          }
        }
      } catch {}
    } catch (err) {
      console.warn('Failed to load settings:', err);
      set({ isLoading: false });
    }
  },

  updateAccount: async (patch: Partial<AccountSettings>) => {
    set((state) => ({
      settings: {
        ...state.settings,
        account: {
          ...state.settings.account,
          ...patch
        }
      },
      isSaving: true
    }));
    try {
      const updated = await updateAccountSettings(patch);
      set((state) => {
        const nextSettings = {
          ...state.settings,
          account: updated
        };
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
          } catch {}
        }
        return {
          settings: nextSettings,
          isSaving: false
        };
      });

      // Notify backend
      try {
        await fetch('/api/settings/account', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        });
      } catch {}
    } catch (err) {
      console.error('Failed to update account settings:', err);
      set({ isSaving: false });
    }
  },

  updateGeneral: async (patch: Partial<GeneralSettings>) => {
    if (patch.focusTracking) {
      const ft = patch.focusTracking;
      const currentFt = get().settings.general.focusTracking;
      const focusMins = ft.focusMinutes ?? (
        ft.defaultPomodoroInterval ? parseInt(ft.defaultPomodoroInterval, 10) : currentFt.focusMinutes
      );
      const breakMins = ft.breakMinutes ?? currentFt.breakMinutes;
      useTrackingStore.getState().syncWithPomodoroInterval(focusMins, breakMins);
    }
    set((state) => {
      const currentFt = state.settings.general.focusTracking;
      const newFocusMins = patch.focusTracking?.focusMinutes ?? currentFt.focusMinutes;
      const newBreakMins = patch.focusTracking?.breakMinutes ?? currentFt.breakMinutes;
      return {
        settings: {
          ...state.settings,
          general: {
            ...state.settings.general,
            ...patch,
            focusTracking: {
              ...currentFt,
              ...(patch.focusTracking || {}),
              focusMinutes: newFocusMins,
              breakMinutes: newBreakMins,
              defaultPomodoroInterval: `${newFocusMins}m / ${newBreakMins}m`
            },
            horizonBar: {
              ...state.settings.general.horizonBar,
              ...(patch.horizonBar || {})
            },
            soundMotion: {
              ...state.settings.general.soundMotion,
              ...(patch.soundMotion || {})
            }
          }
        },
        isSaving: true
      };
    });
    try {
      const updated = await updateGeneralSettings(patch);
      set((state) => {
        const nextSettings = {
          ...state.settings,
          general: updated
        };
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
          } catch {}
        }
        return {
          settings: nextSettings,
          isSaving: false
        };
      });

      // Notify backend
      try {
        await fetch('/api/settings/general', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        });
      } catch {}
    } catch (err) {
      console.error('Failed to update general settings:', err);
      set({ isSaving: false });
    }
  },

  updateMemory: async (patch: Partial<MemorySettings>) => {
    set((state) => ({
      settings: {
        ...state.settings,
        memory: {
          ...state.settings.memory,
          ...patch
        }
      },
      isSaving: true
    }));
    try {
      const updated = await updateMemorySettings(patch);
      set((state) => ({
        settings: {
          ...state.settings,
          memory: updated
        },
        isSaving: false
      }));

      // Notify backend
      try {
        await fetch('/api/settings/memory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        });
      } catch {}
    } catch (err) {
      console.error('Failed to update memory settings:', err);
      set({ isSaving: false });
    }
  },

  deleteLearnedMemory: async (id: string) => {
    const state = get();
    const currentList = state.settings.memory.learnedMemories || [];
    const index = currentList.findIndex((m) => m.id === id);
    if (index === -1) return;
    const item = currentList[index];

    const nextList = currentList.filter((m) => m.id !== id);
    set({
      undoMemory: { item, index },
      settings: {
        ...state.settings,
        memory: {
          ...state.settings.memory,
          learnedMemories: nextList
        }
      }
    });

    try {
      await updateMemorySettings({ learnedMemories: nextList });
      try {
        await fetch('/api/settings/memory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ learnedMemories: nextList })
        });
      } catch {}
    } catch (err) {
      console.error('Failed to delete learned memory:', err);
    }
  },

  restoreLearnedMemory: async () => {
    const state = get();
    if (!state.undoMemory) return;
    const { item, index } = state.undoMemory;
    const currentList = [...(state.settings.memory.learnedMemories || [])];
    currentList.splice(index, 0, item);

    set({
      undoMemory: null,
      settings: {
        ...state.settings,
        memory: {
          ...state.settings.memory,
          learnedMemories: currentList
        }
      }
    });

    try {
      await updateMemorySettings({ learnedMemories: currentList });
      try {
        await fetch('/api/settings/memory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ learnedMemories: currentList })
        });
      } catch {}
    } catch (err) {
      console.error('Failed to restore learned memory:', err);
    }
  },

  clearUndoMemory: () => {
    set({ undoMemory: null });
  },

  toggleSkill: async (id: string) => {
    try {
      const updated = await toggleSkill(id);
      set((state) => ({
        settings: {
          ...state.settings,
          skills: state.settings.skills.map((s) => (s.id === id ? updated : s))
        }
      }));

      try {
        await fetch(`/api/settings/skills/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: updated.enabled })
        });
      } catch {}
    } catch (err) {
      console.error('Failed to toggle skill:', err);
    }
  },

  saveSkill: async (skillData) => {
    set({ isSaving: true });
    try {
      const saved = await saveSkill(skillData);
      set((state) => {
        const existing = state.settings.skills.some((s) => s.id === saved.id);
        const nextSkills = existing
          ? state.settings.skills.map((s) => (s.id === saved.id ? saved : s))
          : [...state.settings.skills, saved];
        return {
          settings: {
            ...state.settings,
            skills: nextSkills
          },
          isSaving: false,
          skillEditorModal: { isOpen: false, skill: undefined }
        };
      });

      // Sync backend
      try {
        if (skillData.id) {
          await fetch(`/api/settings/skills/${skillData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(skillData)
          });
        } else {
          await fetch('/api/settings/skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(skillData)
          });
        }
      } catch {}
    } catch (err) {
      console.error('Failed to save skill:', err);
      set({ isSaving: false });
    }
  },

  deleteSkill: async (id: string) => {
    try {
      await deleteSkill(id);
      set((state) => ({
        settings: {
          ...state.settings,
          skills: state.settings.skills.filter((s) => s.id !== id)
        },
        skillEditorModal: { isOpen: false, skill: undefined }
      }));

      try {
        await fetch(`/api/settings/skills/${id}`, {
          method: 'DELETE'
        });
      } catch {}
    } catch (err) {
      console.error('Failed to delete skill:', err);
    }
  },

  deleteAccount: async () => {
    set({ isSaving: true });
    try {
      await deleteAccountData();
      const fresh = await getUserSettings();
      set({
        settings: fresh,
        isSaving: false,
        deleteAccountModalOpen: false
      });

      try {
        await fetch('/api/settings/delete-account', { method: 'POST' });
      } catch {}
    } catch (err) {
      console.error('Failed to purge account:', err);
      set({ isSaving: false });
    }
  },

  openSkillEditor: (skill?: SkillItem) => {
    set({ skillEditorModal: { isOpen: true, skill } });
  },

  closeSkillEditor: () => {
    set({ skillEditorModal: { isOpen: false, skill: undefined } });
  },

  setDeleteAccountModalOpen: (open: boolean) => {
    set({ deleteAccountModalOpen: open });
  }
};
});
