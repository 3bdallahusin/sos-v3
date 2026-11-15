import { create } from 'zustand';
import type { TaskItem, RecentStudyItem } from '@sos/domain';
import {
  loadHomeTasks,
  saveHomeTask,
  toggleHomeTaskCompletion,
  deleteHomeTask,
  loadRecentStudyItems
} from '@sos/persistence';

interface HomeStoreState {
  tasks: TaskItem[];
  recentItems: RecentStudyItem[];
  isLoading: boolean;

  loadHomeData: () => Promise<void>;
  addTask: (title: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useHomeStore = create<HomeStoreState>((set, get) => ({
  tasks: [],
  recentItems: [],
  isLoading: true,

  loadHomeData: async () => {
    try {
      set({ isLoading: true });
      const [tasks, recentItems] = await Promise.all([
        loadHomeTasks(),
        loadRecentStudyItems()
      ]);
      set({
        tasks,
        recentItems,
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
      tasks: [...state.tasks, newTask]
    }));

    await saveHomeTask(newTask);
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
  }
}));
