import { Dexie, type EntityTable } from 'dexie';
import {
  generateUuidV7,
  type Workspace,
  type GuestWorkspace,
  type TaskItem,
  type RecentStudyItem,
  type LibraryDocument,
  type LibraryFolder
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
  libraryDocuments!: EntityTable<LibraryDocument, 'id'>;
  libraryFolders!: EntityTable<LibraryFolder, 'id'>;

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
    // Schema Version 5: Rebuilt Tiptap-centric Library documents and folder organization
    this.version(5).stores({
      libraryDocuments: 'id, workspaceId, folderId, title, updatedAt',
      libraryFolders: 'id, workspaceId, name, updatedAt'
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

// ==========================================
// Phase 03: Library Documents (Tiptap-centered)
// ==========================================

export const INITIAL_LIBRARY_FOLDERS: LibraryFolder[] = [
  {
    id: 'folder-neurobiology',
    workspaceId: 'default-workspace',
    name: 'Neurobiology & Synapse',
    icon: '🧠',
    color: '#3F3F46',
    createdAt: '2026-11-14T08:00:00Z',
    updatedAt: '2026-11-14T08:00:00Z'
  },
  {
    id: 'folder-molecular-bio',
    workspaceId: 'default-workspace',
    name: 'Molecular Genetics',
    icon: '🧬',
    color: '#27272A',
    createdAt: '2026-11-14T08:30:00Z',
    updatedAt: '2026-11-14T08:30:00Z'
  }
];

export const INITIAL_LIBRARY_DOCUMENTS: LibraryDocument[] = [
  {
    id: 'doc-synaptic-plasticity',
    workspaceId: 'default-workspace',
    folderId: 'folder-neurobiology',
    title: 'Synaptic Plasticity & Memory Synthesis',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Synaptic Plasticity & Memory Synthesis' }]
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Synaptic plasticity is the biological foundation of learning and memory in the central nervous system. It describes the activity-dependent modification of synaptic transmission strength across chemical synapses.'
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '1. Induction Mechanisms (NMDA-Dependent LTP)' }]
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Long-Term Potentiation (LTP) at the CA3-CA1 Schaffer collateral pathway requires coincident presynaptic glutamate release and postsynaptic depolarization to displace Mg²⁺ ions blocking the NMDA receptor pore.'
            }
          ]
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: '“Coincidence detection by NMDA receptors represents Hebb’s postulate formulated at the single-channel biophysical level.”'
                }
              ]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '2. High-Yield Study Checklist' }]
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Review CaMKII subunit autophosphorylation at Thr286' }]
                }
              ]
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Analyze retrograde messengers: Nitric Oxide (NO) and endocannabinoids' }]
                }
              ]
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Differentiate Early-LTP (protein kinase activation) from Late-LTP (CREB-dependent gene transcription)' }]
                }
              ]
            }
          ]
        }
      ]
    },
    plainTextPreview:
      'Synaptic plasticity is the biological foundation of learning and memory in the central nervous system.',
    wordCount: 85,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T09:00:00Z',
    updatedAt: '2026-11-14T10:30:00Z'
  }
];

export async function loadLibraryDocuments(workspaceId?: string): Promise<LibraryDocument[]> {
  try {
    const db = getLocalDatabase();
    const count = await db.libraryDocuments.count();
    if (count === 0) {
      await db.libraryDocuments.bulkAdd(INITIAL_LIBRARY_DOCUMENTS);
      return INITIAL_LIBRARY_DOCUMENTS;
    }
    const docs = await db.libraryDocuments.toArray();
    return docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.warn('Failed to load library documents from Dexie:', err);
    return INITIAL_LIBRARY_DOCUMENTS;
  }
}

export async function getLibraryDocument(id: string): Promise<LibraryDocument | undefined> {
  try {
    const db = getLocalDatabase();
    return await db.libraryDocuments.get(id);
  } catch (err) {
    console.warn(`Failed to get document ${id} from Dexie:`, err);
    return undefined;
  }
}

export async function saveLibraryDocument(doc: LibraryDocument): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.libraryDocuments.put(doc);
  } catch (err) {
    console.warn('Failed to save library document in Dexie:', err);
    throw err;
  }
}

export async function deleteLibraryDocument(id: string): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.libraryDocuments.delete(id);
  } catch (err) {
    console.warn('Failed to delete library document from Dexie:', err);
    throw err;
  }
}

export async function loadLibraryFolders(workspaceId?: string): Promise<LibraryFolder[]> {
  try {
    const db = getLocalDatabase();
    const count = await db.libraryFolders.count();
    if (count === 0) {
      await db.libraryFolders.bulkAdd(INITIAL_LIBRARY_FOLDERS);
      return INITIAL_LIBRARY_FOLDERS;
    }
    return await db.libraryFolders.toArray();
  } catch (err) {
    console.warn('Failed to load library folders from Dexie:', err);
    return INITIAL_LIBRARY_FOLDERS;
  }
}

export async function saveLibraryFolder(folder: LibraryFolder): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.libraryFolders.put(folder);
  } catch (err) {
    console.warn('Failed to save library folder in Dexie:', err);
    throw err;
  }
}

export async function deleteLibraryFolder(id: string): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.libraryFolders.delete(id);
    // Unassign documents from deleted folder
    const docs = await db.libraryDocuments.where('folderId').equals(id).toArray();
    for (const doc of docs) {
      await db.libraryDocuments.update(doc.id, { folderId: null, updatedAt: new Date().toISOString() });
    }
  } catch (err) {
    console.warn('Failed to delete library folder from Dexie:', err);
    throw err;
  }
}

