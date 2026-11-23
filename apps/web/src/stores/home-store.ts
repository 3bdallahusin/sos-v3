import { create } from 'zustand';
import type { TaskItem, RecentStudyItem, SpacedRepetitionDeck } from '@sos/domain';
import {
  loadHomeTasks,
  saveHomeTask,
  toggleHomeTaskCompletion,
  deleteHomeTask,
  updateHomeTaskTitle,
  loadRecentStudyItems,
  touchRecentStudyItem,
  deleteRecentStudyItem,
  restoreRecentStudyItem,
  loadSpacedRepetitionDecks,
  reorderTasks
} from '@sos/persistence';

interface HomeStoreState {
  tasks: TaskItem[];
  recentItems: RecentStudyItem[];
  decks: SpacedRepetitionDeck[];
  isLoading: boolean;

  // Monochrome Undo Toast state
  undoToast: {
    isOpen: boolean;
    item: RecentStudyItem | null;
  };

  loadHomeData: () => Promise<void>;
  addTask: (title: string) => Promise<void>;
  updateTaskTitle: (id: string, title: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderHomeTasks: (orderedIds: string[]) => Promise<void>;
  deleteRecentItem: (id: string) => Promise<void>;
  undoDeleteRecentItem: () => Promise<void>;
  touchItem: (id: string, metadata?: Partial<RecentStudyItem>) => Promise<void>;
  dismissUndoToast: () => void;
}

let undoTimer: ReturnType<typeof setTimeout> | null = null;

export const useHomeStore = create<HomeStoreState>((set, get) => ({
  tasks: [],
  recentItems: [],
  decks: [],
  isLoading: true,
  undoToast: {
    isOpen: false,
    item: null
  },

  loadHomeData: async () => {
    try {
      set({ isLoading: true });
      const [tasks, recentItems, decks] = await Promise.all([
        loadHomeTasks(),
        loadRecentStudyItems(),
        loadSpacedRepetitionDecks()
      ]);
      set({
        tasks,
        recentItems,
        decks,
        isLoading: false
      });
    } catch (err) {
      console.warn('Failed to load home store data:', err);
      set({ isLoading: false });
    }
  },

  addTask: async (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: trimmed,
      completed: false,
      order: get().tasks.length,
      createdAt: new Date().toISOString()
    };

    set((state) => ({
      tasks: [newTask, ...state.tasks]
    }));

    await saveHomeTask(newTask);
  },

  updateTaskTitle: async (id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, title: trimmed } : t))
    }));

    await updateHomeTaskTitle(id, trimmed);
  },

  toggleTask: async (id: string) => {
    const currentTask = get().tasks.find((t) => t.id === id);
    if (!currentTask) return;

    const nextCompleted = !currentTask.completed;
    const nowIso = new Date().toISOString();

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: nextCompleted,
              completedAt: nextCompleted ? nowIso : null
            }
          : t
      )
    }));

    await toggleHomeTaskCompletion(id);
  },

  deleteTask: async (id: string) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id)
    }));

    await deleteHomeTask(id);
  },

  reorderHomeTasks: async (orderedIds: string[]) => {
    const current = get().tasks;
    const taskMap = new Map(current.map((t) => [t.id, t]));
    const reordered: TaskItem[] = [];
    for (const id of orderedIds) {
      const item = taskMap.get(id);
      if (item) reordered.push(item);
    }
    set({ tasks: reordered });
    await reorderTasks(orderedIds);
  },

  deleteRecentItem: async (id: string) => {
    const target = get().recentItems.find((item) => item.id === id);
    if (!target) return;

    // Immediately remove from local state
    set((state) => ({
      recentItems: state.recentItems.filter((item) => item.id !== id),
      undoToast: {
        isOpen: true,
        item: target
      }
    }));

    await deleteRecentStudyItem(id);

    // Auto-dismiss after 5 seconds
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      set({ undoToast: { isOpen: false, item: null } });
    }, 5000);
  },

  undoDeleteRecentItem: async () => {
    const { item } = get().undoToast;
    if (!item) return;

    if (undoTimer) clearTimeout(undoTimer);

    set((state) => ({
      recentItems: [item, ...state.recentItems],
      undoToast: { isOpen: false, item: null }
    }));

    await restoreRecentStudyItem(item);
  },

  touchItem: async (id: string, metadata?: Partial<RecentStudyItem>) => {
    await touchRecentStudyItem(id, metadata);
    const recentItems = await loadRecentStudyItems();
    set({ recentItems });
  },

  dismissUndoToast: () => {
    if (undoTimer) clearTimeout(undoTimer);
    set({ undoToast: { isOpen: false, item: null } });
  }
}));
