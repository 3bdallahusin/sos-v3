import { Dexie, type EntityTable } from 'dexie';
import JSZip from 'jszip';
import {
  generateUuidV7,
  type Workspace,
  type GuestWorkspace,
  type TaskItem,
  type RecentStudyItem,
  type LibraryFolder,
  type LibraryItem,
  type LibraryBackupManifest
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
  libraryFolders!: EntityTable<LibraryFolder, 'id'>;
  libraryItems!: EntityTable<LibraryItem, 'id'>;

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
    // Schema Version 4: Library folders and items catalog
    this.version(4).stores({
      libraryFolders: 'id, workspaceId, parentId, name, order, createdAt',
      libraryItems: 'id, workspaceId, folderId, type, title, updatedAt'
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
// Phase 03: Library Seed Data & Persistence
// ==========================================

export const INITIAL_LIBRARY_FOLDERS: LibraryFolder[] = [
  {
    id: 'folder-synaptic-plasticity',
    workspaceId: 'default-workspace',
    parentId: null,
    name: 'Synaptic Transmission & Plasticity',
    icon: '🧠',
    coverUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80',
    description: 'Folder workspace containing lecture notes and canonical learning assets',
    summaryBlocks: [
      {
        id: 'block-1',
        type: 'paragraph',
        text: 'Comprehensive study module focusing on chemical neurotransmission, presynaptic vesicle docking (SNARE complex), postsynaptic density specialization, and bidirectional synaptic plasticity (LTP/LTD).'
      },
      {
        id: 'block-2',
        type: 'callout',
        icon: '📌',
        title: 'Exam Key Point',
        text: 'NMDA receptor activation requires coincident glutamate binding and postsynaptic depolarization to relieve magnesium (Mg²⁺) blockade.'
      },
      {
        id: 'block-3',
        type: 'callout',
        icon: '💡',
        title: 'Core Mechanism',
        text: 'Synaptotagmin-1 acts as the primary low-affinity calcium sensor triggering synchronous neurotransmitter release within 200 microseconds of calcium influx.'
      }
    ],
    color: '#3F3F46',
    order: 0,
    createdAt: '2026-11-14T08:00:00Z',
    updatedAt: '2026-11-14T14:30:00Z'
  },
  {
    id: 'folder-neuroanatomy',
    workspaceId: 'default-workspace',
    parentId: null,
    name: 'Functional Neuroanatomy',
    icon: '🔬',
    coverUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
    description: 'Cerebral cortex mapping, subcortical nuclei, and ascending sensory pathways',
    color: '#27272A',
    order: 1,
    createdAt: '2026-11-14T09:00:00Z',
    updatedAt: '2026-11-14T12:00:00Z'
  }
];

export const INITIAL_LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: 'item-kandel-principles',
    workspaceId: 'default-workspace',
    folderId: 'folder-synaptic-plasticity',
    title: 'Kandel_Principles_Ch12.pdf',
    type: 'pdf',
    subtitle: 'Primary reading on synaptic mechanisms and quantal analysis',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    icon: 'file-text',
    sizeBytes: 14680064,
    readTimeMinutes: 45,
    createdAt: '2026-11-14T08:30:00Z',
    updatedAt: '2026-11-14T10:15:00Z'
  },
  {
    id: 'item-snare-deck',
    workspaceId: 'default-workspace',
    folderId: 'folder-synaptic-plasticity',
    title: 'SNARE_Machinery_Deck',
    type: 'slides',
    subtitle: '38 High-yield slide cards on v-SNARE / t-SNARE fusion',
    coverUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    icon: 'layers',
    sizeBytes: 8388608,
    readTimeMinutes: 20,
    createdAt: '2026-11-14T09:15:00Z',
    updatedAt: '2026-11-14T11:00:00Z'
  },
  {
    id: 'item-cellular-plasticity-notes',
    workspaceId: 'default-workspace',
    folderId: 'folder-synaptic-plasticity',
    title: 'Cellular_Plasticity_Synthesis.md',
    type: 'notes',
    subtitle: 'Markdown synthesis notes on CaMKII autophosphorylation',
    coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
    icon: 'file-code',
    sizeBytes: 49152,
    readTimeMinutes: 12,
    content: '# Cellular Plasticity Synthesis\n\n## Overview\nSynaptic plasticity is the biological process by which specific patterns of synaptic activity result in changes in synaptic strength over time.\n\n### CaMKII Activation\nCaMKII operates as a molecular memory device through subunit autophosphorylation at Thr286.',
    createdAt: '2026-11-14T10:00:00Z',
    updatedAt: '2026-11-14T12:00:00Z'
  },
  {
    id: 'item-stanford-lecture',
    workspaceId: 'default-workspace',
    folderId: 'folder-synaptic-plasticity',
    title: 'Stanford_Neuro_Lecture_04.mp4',
    type: 'video',
    subtitle: 'Video lecture on presynaptic facilitation & depression',
    coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    icon: 'video',
    sizeBytes: 340000000,
    readTimeMinutes: 45,
    createdAt: '2026-11-14T11:00:00Z',
    updatedAt: '2026-11-14T11:30:00Z'
  }
];

export async function loadLibraryFolders(workspaceId?: string): Promise<LibraryFolder[]> {
  try {
    const db = getLocalDatabase();
    const count = await db.libraryFolders.count();
    if (count === 0) {
      await db.libraryFolders.bulkAdd(INITIAL_LIBRARY_FOLDERS);
      return INITIAL_LIBRARY_FOLDERS;
    }
    const folders = await db.libraryFolders.toArray();
    return folders.sort((a, b) => a.order - b.order);
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

export async function deleteLibraryFolder(id: string, cascade = true): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.libraryFolders.delete(id);
    if (cascade) {
      // Find all child items and delete them
      const items = await db.libraryItems.where('folderId').equals(id).toArray();
      for (const item of items) {
        await db.libraryItems.delete(item.id);
      }
      // Also delete any child subfolders
      const subfolders = await db.libraryFolders.where('parentId').equals(id).toArray();
      for (const sub of subfolders) {
        await deleteLibraryFolder(sub.id, true);
      }
    }
  } catch (err) {
    console.warn('Failed to delete library folder from Dexie:', err);
    throw err;
  }
}

export async function loadLibraryItems(folderId?: string | null, workspaceId?: string): Promise<LibraryItem[]> {
  try {
    const db = getLocalDatabase();
    const count = await db.libraryItems.count();
    if (count === 0) {
      await db.libraryItems.bulkAdd(INITIAL_LIBRARY_ITEMS);
      if (folderId !== undefined) {
        return INITIAL_LIBRARY_ITEMS.filter(item => item.folderId === folderId);
      }
      return INITIAL_LIBRARY_ITEMS;
    }
    if (folderId !== undefined) {
      if (folderId === null) {
        return await db.libraryItems.filter(item => item.folderId === null).toArray();
      }
      return await db.libraryItems.where('folderId').equals(folderId).toArray();
    }
    return await db.libraryItems.toArray();
  } catch (err) {
    console.warn('Failed to load library items from Dexie:', err);
    if (folderId !== undefined) {
      return INITIAL_LIBRARY_ITEMS.filter(item => item.folderId === folderId);
    }
    return INITIAL_LIBRARY_ITEMS;
  }
}

export async function saveLibraryItem(item: LibraryItem): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.libraryItems.put(item);
  } catch (err) {
    console.warn('Failed to save library item in Dexie:', err);
    throw err;
  }
}

export async function deleteLibraryItem(id: string): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.libraryItems.delete(id);
  } catch (err) {
    console.warn('Failed to delete library item from Dexie:', err);
    throw err;
  }
}

export async function moveLibraryItem(itemId: string, targetFolderId: string | null): Promise<void> {
  try {
    const db = getLocalDatabase();
    const existing = await db.libraryItems.get(itemId);
    if (!existing) return;
    await db.libraryItems.update(itemId, {
      folderId: targetFolderId,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to move library item in Dexie:', err);
    throw err;
  }
}

// ==========================================
// Phase 03: Early Data Portability & Disaster Recovery (.sos)
// ==========================================

export async function computeSha256(data: string | Uint8Array): Promise<string> {
  const encoded = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hashBuffer = await globalThis.crypto.subtle.digest(
    'SHA-256',
    encoded as unknown as BufferSource
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function exportSosBackup(workspaceId?: string): Promise<{
  blob: Blob;
  filename: string;
  checksum: string;
  manifest: LibraryBackupManifest;
}> {
  const db = getLocalDatabase();
  const folders = await db.libraryFolders.toArray();
  const items = await db.libraryItems.toArray();

  const dataPayload = JSON.stringify(
    {
      version: 1,
      appName: 'SOS',
      schemaVersion: 4,
      workspaceId: workspaceId || 'default-workspace',
      folders,
      items
    },
    null,
    2
  );

  const checksum = await computeSha256(dataPayload);
  const now = new Date().toISOString();

  const manifest: LibraryBackupManifest = {
    version: 1,
    appName: 'SOS',
    schemaVersion: 4,
    exportedAt: now,
    workspaceId: workspaceId || 'default-workspace',
    checksum,
    foldersCount: folders.length,
    itemsCount: items.length
  };

  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('data.json', dataPayload);

  const blob = await zip.generateAsync({ type: 'blob' });
  const dateStr = now.slice(0, 10);
  const filename = `sos-library-backup-${dateStr}.sos`;

  return { blob, filename, checksum, manifest };
}

export async function validateAndRestoreSosBackup(fileData: Blob | ArrayBuffer | Uint8Array): Promise<{
  success: boolean;
  error?: string;
  restoredFolders: number;
  restoredItems: number;
}> {
  try {
    const zip = await JSZip.loadAsync(fileData);
    const manifestFile = zip.file('manifest.json');
    const dataFile = zip.file('data.json');

    if (!manifestFile || !dataFile) {
      return {
        success: false,
        error: 'Invalid SOS archive: missing manifest.json or data.json',
        restoredFolders: 0,
        restoredItems: 0
      };
    }

    const manifestText = await manifestFile.async('text');
    const dataText = await dataFile.async('text');

    const manifest = JSON.parse(manifestText) as LibraryBackupManifest;
    if (manifest.appName !== 'SOS') {
      return {
        success: false,
        error: 'Incompatible archive: not a valid SOS backup archive',
        restoredFolders: 0,
        restoredItems: 0
      };
    }

    // Verify SHA-256 checksum
    const computedChecksum = await computeSha256(dataText);
    if (computedChecksum.toLowerCase() !== manifest.checksum.toLowerCase()) {
      return {
        success: false,
        error: `Integrity check failed: checksum mismatch (expected ${manifest.checksum.slice(0, 8)}..., computed ${computedChecksum.slice(0, 8)}...)`,
        restoredFolders: 0,
        restoredItems: 0
      };
    }

    const parsedData = JSON.parse(dataText);
    const folders = (parsedData.folders || []) as LibraryFolder[];
    const items = (parsedData.items || []) as LibraryItem[];

    const db = getLocalDatabase();
    await db.transaction('rw', db.libraryFolders, db.libraryItems, async () => {
      for (const folder of folders) {
        await db.libraryFolders.put(folder);
      }
      for (const item of items) {
        await db.libraryItems.put(item);
      }
    });

    return {
      success: true,
      restoredFolders: folders.length,
      restoredItems: items.length
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: `Failed to restore archive: ${err instanceof Error ? err.message : String(err)}`,
      restoredFolders: 0,
      restoredItems: 0
    };
  }
}

