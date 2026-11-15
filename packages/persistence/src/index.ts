import { Dexie, type EntityTable } from 'dexie';
import { generateUuidV7, type Workspace, type GuestWorkspace } from '@sos/domain';

export interface ShellPreferenceRecord {
  key: string;
  value: unknown;
  updatedAt: string;
}

export class SosDexieDatabase extends Dexie {
  workspaces!: EntityTable<Workspace, 'id'>;
  shellPreferences!: EntityTable<ShellPreferenceRecord, 'key'>;

  constructor() {
    super('sos_local_v3');
    this.version(1).stores({
      workspaces: 'id, isGuest, lastActiveAt',
      shellPreferences: 'key, updatedAt'
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
  } catch (error) {
    console.warn(`Failed to persist shell preference "${key}":`, error);
  }
}
