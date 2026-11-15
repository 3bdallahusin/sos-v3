import { Dexie, type EntityTable } from 'dexie';
import {
  generateUuidV7,
  type Workspace,
  type GuestWorkspace,
  type TaskItem,
  type RecentStudyItem
} from '@sos/domain';

export interface ShellPreferenceRecord {
  key: string;
  value: unknown;
  updatedAt: string;
}

export class SosDexieDatabase extends Dexie {
  workspaces!: EntityTable<Workspace, 'id'>;
  shellPreferences!: EntityTable<ShellPreferenceRecord, 'key'>;
  tasks!: EntityTable<TaskItem, 'id'>;
  recentItems!: EntityTable<RecentStudyItem, 'id'>;

  constructor() {
    super('sos_local_v3');
    this.version(1).stores({
      workspaces: 'id, isGuest, lastActiveAt',
      shellPreferences: 'key, updatedAt'
    });
    this.version(2).stores({
      workspaces: 'id, isGuest, lastActiveAt',
      shellPreferences: 'key, updatedAt',
      tasks: 'id, workspaceId, completed, order, createdAt',
      recentItems: 'id, type, lastOpenedAt',
      quickNotes: 'id, workspaceId, createdAt'
    });
    // Schema Version 3: Cleanly drops obsolete quickNotes object store without affecting existing tables
    this.version(3).stores({
      quickNotes: null
    });
    // Schema Version 4: Cleanly drops rejected Phase 03 experimental tables
    this.version(4).stores({
      libraryFolders: null,
      libraryItems: null
    });
  }
}

let dbInstance: SosDexieDatabase | null = null;

export function getLocalDatabase(): SosDexieDatabase {
  if (!dbInstance) {
    dbInstance = new SosDexieDatabase();
  }
  return dbInstance;
}

export async function initializeOrResumeGuestWorkspace(): Promise<GuestWorkspace> {
  const db = getLocalDatabase();
  const existingGuest = await db.workspaces
    .filter(ws => Boolean(ws.isGuest))
    .first();

  const now = new Date().toISOString();

  if (existingGuest) {
    await db.workspaces.update(existingGuest.id, {
      lastActiveAt: now
    });
    return {
      ...existingGuest,
      isGuest: true,
      lastActiveAt: now
    };
  }

  const newGuest: GuestWorkspace = {
    id: generateUuidV7(),
    name: 'Guest Workspace',
    isGuest: true,
    createdAt: now,
    lastActiveAt: now,
    settings: {
      railExpanded: false,
      aiPanelOpen: true,
      theme: 'obsidian'
    }
  };

  await db.workspaces.add(newGuest);
  return newGuest;
}

export async function getShellPreference<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = getLocalDatabase();
    const record = await db.shellPreferences.get(key);
    if (!record) return defaultValue;
    return record.value as T;
  } catch {
    return defaultValue;
  }
}

export async function setShellPreference(key: string, value: unknown): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.shellPreferences.put({
      key,
      value,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn(`Failed to persist preference ${key}:`, err);
  }
}

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Neurobiology Lecture 04',
    completed: false,
    order: 0,
    createdAt: '2026-11-14T08:00:00Z'
  },
  {
    id: 'task-2',
    title: 'Review 14 Due Cards — SNARE Deck',
    completed: false,
    order: 1,
    createdAt: '2026-11-14T08:05:00Z'
  },
  {
    id: 'task-3',
    title: 'Complete Kv1.1 Assessment',
    completed: false,
    order: 2,
    createdAt: '2026-11-14T08:10:00Z'
  },
  {
    id: 'task-4',
    title: 'Summarize CaMKII notes',
    completed: true,
    completedAt: '2026-11-14T09:30:00Z',
    order: 3,
    createdAt: '2026-11-14T08:15:00Z'
  }
];

export const INITIAL_RECENT_ITEMS: RecentStudyItem[] = [
  {
    id: 'kandel-pdf',
    title: 'Kandel_Principles_Ch12.pdf',
    subtitle: 'Page 42',
    type: 'pdf',
    path: '/learning',
    lastOpenedAt: '2026-11-14T10:15:00Z'
  },
  {
    id: 'stanford-video',
    title: 'Stanford_Neuro_Lecture_04.mp4',
    subtitle: '16:48 / 45:00',
    type: 'video',
    path: '/learning',
    lastOpenedAt: '2026-11-14T11:30:00Z'
  },
  {
    id: 'plasticity-notes',
    title: 'Cellular_Plasticity_Synthesis.md',
    subtitle: 'Section 2',
    type: 'notes',
    path: '/learning',
    lastOpenedAt: '2026-11-14T12:00:00Z'
  },
  {
    id: 'snare-flashcards',
    title: 'SNARE_Machinery_Deck',
    subtitle: 'Card 14 / 50',
    type: 'flashcards',
    path: '/learning',
    lastOpenedAt: '2026-11-14T13:45:00Z'
  }
];

export async function loadHomeTasks(workspaceId?: string): Promise<TaskItem[]> {
  try {
    const db = getLocalDatabase();
    const count = await db.tasks.count();
    if (count === 0) {
      await db.tasks.bulkAdd(INITIAL_TASKS);
      return INITIAL_TASKS;
    }
    const all = await db.tasks.toArray();
    return all.sort((a, b) => a.order - b.order);
  } catch (err) {
    console.warn('Failed to load tasks from Dexie:', err);
    return INITIAL_TASKS;
  }
}

export async function saveHomeTask(task: TaskItem): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.tasks.put(task);
  } catch (err) {
    console.warn('Failed to save task to Dexie:', err);
  }
}

export async function toggleHomeTaskCompletion(id: string): Promise<boolean> {
  try {
    const db = getLocalDatabase();
    const existing = await db.tasks.get(id);
    if (!existing) return false;
    const nextCompleted = !existing.completed;
    await db.tasks.update(id, {
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : null
    });
    return nextCompleted;
  } catch (err) {
    console.warn('Failed to toggle task in Dexie:', err);
    return false;
  }
}

export async function deleteHomeTask(id: string): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.tasks.delete(id);
  } catch (err) {
    console.warn('Failed to delete task in Dexie:', err);
  }
}

export async function loadRecentStudyItems(): Promise<RecentStudyItem[]> {
  try {
    const db = getLocalDatabase();
    const count = await db.recentItems.count();
    if (count === 0) {
      await db.recentItems.bulkAdd(INITIAL_RECENT_ITEMS);
      return INITIAL_RECENT_ITEMS;
    }
    return await db.recentItems.toArray();
  } catch (err) {
    console.warn('Failed to load recent study items from Dexie:', err);
    return INITIAL_RECENT_ITEMS;
  }
}

export async function saveRecentStudyItem(item: RecentStudyItem): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.recentItems.put(item);
  } catch (err) {
    console.warn('Failed to save recent item to Dexie:', err);
  }
}
