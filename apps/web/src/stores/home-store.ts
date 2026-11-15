import { create } from 'zustand';
import type { TaskItem, RecentStudyItem, QuickCaptureNote } from '@sos/domain';
import {
  loadHomeTasks,
  saveHomeTask,
  toggleHomeTaskCompletion,
  deleteHomeTask,
  loadRecentStudyItems,
  loadQuickCaptureNotes,
  saveQuickCaptureNote
} from '@sos/persistence';

interface HomeStoreState {
  tasks: TaskItem[];
  recentItems: RecentStudyItem[];
  quickNotes: QuickCaptureNote[];
  isLoading: boolean;
  isQuickCaptureOpen: boolean;

  loadHomeData: () => Promise<void>;
  addTask: (title: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addQuickCaptureNote: (title: string, content: string, tags?: string[]) => Promise<QuickCaptureNote>;
  setQuickCaptureOpen: (open: boolean) => void;
}

export const useHomeStore = create<HomeStoreState>((set, get) => ({
  tasks: [],
  recentItems: [],
  quickNotes: [],
  isLoading: true,
  isQuickCaptureOpen: false,

  loadHomeData: async () => {
    try {
      set({ isLoading: true });
      const [tasks, recentItems, quickNotes] = await Promise.all([
        loadHomeTasks(),
        loadRecentStudyItems(),
        loadQuickCaptureNotes()
      ]);
      set({
        tasks,
        recentItems,
        quickNotes,
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
  },

  addQuickCaptureNote: async (title: string, content: string, tags: string[] = []) => {
    const newNote: QuickCaptureNote = {
      id: `note-${Date.now()}`,
      title: title.trim() || 'Untitled Scratchpad Note',
      content,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set((state) => ({
      quickNotes: [newNote, ...state.quickNotes],
      isQuickCaptureOpen: false
    }));

    await saveQuickCaptureNote(newNote);
    return newNote;
  },

  setQuickCaptureOpen: (open: boolean) => {
    set({ isQuickCaptureOpen: open });
  }
}));
