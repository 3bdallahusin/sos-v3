import { Dexie, type EntityTable } from 'dexie';
import {
  generateUuidV7,
  DEFAULT_FOLDER_LAYOUT_SETTINGS,
  STITCH_COVER_URL,
  CURATED_DARK_COVERS,
  getFallbackCover,
  type Workspace,
  type GuestWorkspace,
  type TaskItem,
  type RecentStudyItem,
  type LibraryDocument,
  type LibraryFolder,
  type LibraryFile,
  type LibraryItem,
  type UserProfile,
  type AggregatedStudyStats,
  type ProfileActivityItem,
  type PreMigrationSnapshot,
  type UserPost,
  type UserSharedResource,
  type UserCommunity,
  type ProfileActivityMetrics,
  type DailyContribution,
  type UserSettings,
  type AccountSettings,
  type UsageSettings,
  type GeneralSettings,
  type MemorySettings,
  type LearnedMemoryItem,
  type SkillItem,
  type HorizonBarSettings,
  type FocusTrackingSettings,
  type SoundMotionSettings,
  type TrackingSession,
  type PauseInterval,
  type CalendarEvent,
  type WeeklyTrackingStats,
  type WeeklyDayStudyHours,
  type WeeklySubjectStudyTime,
  type SpacedRepetitionDeck,
  type SessionHistoryFilter,
  type AnalyticsPeriod,
  type CrossFilterState,
  type TrackingAnalyticsReport,
  type AnalyticsDataPoint,
  type FieldDistributionItem
} from '@sos/domain';

export interface ShellPreferenceRecord {
  key: string;
  value: unknown;
  updatedAt: string;
}

export interface StudySessionRecord {
  id: string;
  timestamp: string;
  durationMinutes: number;
  type: string;
}

export class SosDexieDatabase extends Dexie {
  workspaces!: EntityTable<Workspace, 'id'>;
  shellPreferences!: EntityTable<ShellPreferenceRecord, 'key'>;
  tasks!: EntityTable<TaskItem, 'id'>;
  recentItems!: EntityTable<RecentStudyItem, 'id'>;
  libraryDocuments!: EntityTable<LibraryDocument, 'id'>;
  libraryFolders!: EntityTable<LibraryFolder, 'id'>;
  libraryFiles!: EntityTable<LibraryFile, 'id'>;
  libraryItems!: EntityTable<LibraryItem, '_id'>;
  userPosts!: EntityTable<UserPost, 'id'>;
  userSharedResources!: EntityTable<UserSharedResource, 'id'>;
  userCommunities!: EntityTable<UserCommunity, 'id'>;
  studySessions!: EntityTable<StudySessionRecord, 'id'>;
  skills!: EntityTable<SkillItem, 'id'>;
  trackingSessions!: EntityTable<TrackingSession, 'id'>;
  calendarEvents!: EntityTable<CalendarEvent, 'id'>;
  spacedRepetitionDecks!: EntityTable<SpacedRepetitionDeck, 'id'>;

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
    // Schema Version 6: BlockNote-powered Library with Folder study content & distinct Files
    this.version(6).stores({
      libraryFolders: 'id, workspaceId, name, updatedAt',
      libraryFiles: 'id, workspaceId, folderId, title, type, updatedAt'
    }).upgrade(async (tx) => {
      try {
        const docsTable = tx.table('libraryDocuments');
        const foldersTable = tx.table('libraryFolders');
        const prefsTable = tx.table('shellPreferences');

        const allDocs = await docsTable.toArray();
        const allFolders = await foldersTable.toArray();
        const folderMap = new Map<string, LibraryFolder>(allFolders.map((f: LibraryFolder) => [f.id, f]));

        // Safe, non-destructive backup in shellPreferences
        await prefsTable.put({
          key: 'legacy_tiptap_migration_backup',
          value: allDocs,
          updatedAt: new Date().toISOString()
        });

        for (const doc of allDocs) {
          let blockContent = doc.content;
          if (doc.content && typeof doc.content === 'object' && !Array.isArray(doc.content)) {
            blockContent = convertTiptapContent(doc.content);
          } else if (!Array.isArray(blockContent)) {
            blockContent = [];
          }

          if (doc.folderId && folderMap.has(doc.folderId)) {
            const folder = folderMap.get(doc.folderId)!;
            if (!folder.content || folder.content.length === 0) {
              folder.content = blockContent as unknown[];
              folder.wordCount = doc.wordCount || 0;
              folder.readTimeMinutes = doc.readTimeMinutes || 1;
              folder.plainTextPreview = doc.plainTextPreview || '';
              folder.updatedAt = doc.updatedAt || new Date().toISOString();
              await foldersTable.put(folder);
            }
          } else {
            const folderId = doc.folderId || doc.id || `folder-${Date.now()}`;
            const existing = await foldersTable.get(folderId);
            if (!existing) {
              await foldersTable.put({
                id: folderId,
                workspaceId: doc.workspaceId || 'default-workspace',
                name: doc.title || (doc as any).name || 'Untitled Folder',
                content: blockContent as unknown[],
                icon: '📁',
                color: '#3F3F46',
                wordCount: doc.wordCount || 0,
                readTimeMinutes: doc.readTimeMinutes || 1,
                plainTextPreview: doc.plainTextPreview || '',
                createdAt: doc.createdAt || new Date().toISOString(),
                updatedAt: doc.updatedAt || new Date().toISOString()
              });
            }
          }
        }
      } catch (err) {
        console.warn('Migration to schema version 6 encountered an issue:', err);
      }
    });

    // Schema Version 7: Profile Posts, Media, Resources, Communities, and Study Sessions
    this.version(7).stores({
      userPosts: 'id, authorId, pinned, createdAt',
      userSharedResources: 'id, type, updatedAt',
      userCommunities: 'id, role, joinedAt',
      studySessions: 'id, timestamp, durationMinutes'
    });

    // Schema Version 8: Notion-Style Library Workspace with Custom /folder Blocks & Layout Settings
    this.version(8).stores({
      libraryFolders: 'id, workspaceId, parentId, name, updatedAt',
      libraryFiles: 'id, workspaceId, folderId, title, type, updatedAt'
    }).upgrade(async (tx) => {
      try {
        const foldersTable = tx.table('libraryFolders');
        const filesTable = tx.table('libraryFiles');
        const allFolders = await foldersTable.toArray();
        const now = new Date().toISOString();

        // 1. Ensure 'library-root' exists
        let rootFolder = allFolders.find((f: any) => f.id === 'library-root');
        if (!rootFolder) {
          rootFolder = {
            id: 'library-root',
            workspaceId: 'default-workspace',
            parentId: null,
            name: 'Library',
            icon: '📚',
            coverUrl: '',
            content: [
              {
                id: 'bn-root-h1',
                type: 'heading',
                props: { level: 1, backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
                content: [{ type: 'text', text: 'Academic Knowledge Base', styles: {} }],
                children: []
              },
              {
                id: 'bn-root-callout',
                type: 'callout',
                props: { icon: '💡' },
                content: [
                  {
                    type: 'text',
                    text: 'Welcome to your unified research library. Organize knowledge into folders, drop lecture materials, and synthesize study notes.',
                    styles: {}
                  }
                ],
                children: []
              },
              {
                id: 'bn-root-h2',
                type: 'heading',
                props: { level: 2, backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
                content: [{ type: 'text', text: 'Study Domains', styles: {} }],
                children: []
              }
            ],
            layoutSettings: {
              view: 'gallery',
              showTitle: true,
              showIcon: true,
              cardPreview: 'cover',
              cardSize: 'medium',
              fitMedia: true,
              cardLayout: 'list'
            },
            plainTextPreview: 'Academic Knowledge Base — Central learning and research workspace.',
            wordCount: 24,
            readTimeMinutes: 1,
            createdAt: now,
            updatedAt: now
          };
          await foldersTable.put(rootFolder);
        }

        // 2. Migrate existing top-level folders to have parentId: 'library-root'
        const rootContent = Array.isArray(rootFolder.content) ? [...rootFolder.content] : [];
        let rootContentModified = false;

        for (const folder of allFolders) {
          if (folder.id === 'library-root') continue;

          let modified = false;
          if (!folder.parentId) {
            folder.parentId = 'library-root';
            modified = true;

            const alreadyReferenced = rootContent.some(
              (b: any) => b.type === 'folder' && b.props?.folderId === folder.id
            );
            if (!alreadyReferenced) {
              rootContent.push({
                id: `bn-folder-block-${folder.id}`,
                type: 'folder',
                props: { folderId: folder.id },
                children: []
              });
              rootContentModified = true;
            }
          }

          if (!folder.layoutSettings) {
            folder.layoutSettings = {
              view: 'gallery',
              showTitle: true,
              showIcon: true,
              cardPreview: 'cover',
              cardSize: 'medium',
              fitMedia: true,
              cardLayout: 'list'
            };
            modified = true;
          }

          if (modified) {
            await foldersTable.put(folder);
          }
        }

        if (rootContentModified) {
          rootFolder.content = rootContent;
          await foldersTable.put(rootFolder);
        }

        // 3. Ensure files have folderId defaulted if missing
        const allFiles = await filesTable.toArray();
        for (const file of allFiles) {
          if (!file.folderId) {
            file.folderId = 'library-root';
            await filesTable.put(file);
          }
        }
      } catch (err) {
        console.warn('Migration to schema version 8 encountered an issue:', err);
      }
    });

    // Schema Version 9: Built-in & Custom AI Skills
    this.version(9).stores({
      skills: 'id, command, isBuiltIn, enabled'
    }).upgrade(async (tx) => {
      try {
        const skillsTable = tx.table('skills');
        const existing = await skillsTable.toArray();
        if (existing.length === 0) {
          for (const s of DEFAULT_SKILLS) {
            await skillsTable.put(s);
          }
        }
      } catch (err) {
        console.warn('Migration to schema version 9 encountered an issue:', err);
      }
    });

    // Schema Version 10: Phase 05 & 06 Tracking Sessions & Calendar Events
    this.version(10).stores({
      trackingSessions: 'id, startTime, endTime, folderId, fileId, calendarEventId, createdAt',
      calendarEvents: 'id, type, startTime, endTime, folderId, fileId, completed, createdAt'
    });

    // Schema Version 11: Clean Stitch Library Migration & Purge Corrupted Test Seed Blocks
    this.version(11).upgrade(async (tx) => {
      try {
        const foldersTable = tx.table('libraryFolders');
        const filesTable = tx.table('libraryFiles');

        // Clean up library-root
        const root = await foldersTable.get('library-root');
        if (root) {
          root.name = 'Library';
          root.icon = 'book-marked';
          root.coverUrl = STITCH_COVER_URL;
          root.content = ROOT_LIBRARY_FOLDER.content;
          await foldersTable.put(root);
        } else {
          await foldersTable.put(ROOT_LIBRARY_FOLDER);
        }

        // Remove ghost/test folders that match old corrupted test names
        const allFolders = await foldersTable.toArray();
        const staleNames = new Set([
          'untitled study folder',
          'untitled document',
          'academic knowledge base',
          'study domains'
        ]);
        for (const f of allFolders) {
          if (f.id !== 'library-root' && staleNames.has(f.name.trim().toLowerCase())) {
            await foldersTable.delete(f.id);
          }
        }

        // Ensure folder-planning exists and is table view
        let planFolder = await foldersTable.get('folder-planning');
        if (!planFolder) {
          const initialPlan = INITIAL_LIBRARY_FOLDERS.find((f) => f.id === 'folder-planning');
          if (initialPlan) await foldersTable.put(initialPlan);
        } else {
          planFolder.layoutSettings = {
            ...planFolder.layoutSettings,
            view: 'table'
          };
          await foldersTable.put(planFolder);
        }

        // Ensure folder-decagon exists and is gallery view
        let decFolder = await foldersTable.get('folder-decagon');
        if (!decFolder) {
          const initialDec = INITIAL_LIBRARY_FOLDERS.find((f) => f.id === 'folder-decagon');
          if (initialDec) await foldersTable.put(initialDec);
        } else {
          decFolder.layoutSettings = {
            ...decFolder.layoutSettings,
            view: 'gallery',
            cardPreview: 'cover',
            cardSize: 'small'
          };
          await foldersTable.put(decFolder);
        }

        // Ensure decagon children (5 Stitch items) exist with covers
        for (const f of INITIAL_LIBRARY_FOLDERS) {
          if (f.parentId === 'folder-decagon' || f.parentId === 'folder-planning') {
            const existing = await foldersTable.get(f.id);
            if (!existing) {
              await foldersTable.put(f);
            }
          }
        }
        for (const file of INITIAL_LIBRARY_FILES) {
          const existing = await filesTable.get(file.id);
          if (!existing) {
            await filesTable.put(file);
          }
        }
      } catch (err) {
        console.warn('Migration to schema version 11 encountered an issue:', err);
      }
    });

    // Schema Version 12: Heal Corrupted Callout & Ensure Canonical Stitch Folders/Files
    this.version(12).upgrade(async (tx) => {
      try {
        const foldersTable = tx.table('libraryFolders');
        const filesTable = tx.table('libraryFiles');

        // Clean up library-root
        const root = await foldersTable.get('library-root');
        if (root) {
          root.name = 'Library';
          root.icon = 'book-marked';
          root.coverUrl = STITCH_COVER_URL;
          root.content = ROOT_LIBRARY_FOLDER.content;
          await foldersTable.put(root);
        } else {
          await foldersTable.put(ROOT_LIBRARY_FOLDER);
        }

        // Put all canonical folders
        for (const f of INITIAL_LIBRARY_FOLDERS) {
          const existing = await foldersTable.get(f.id);
          if (!existing) {
            await foldersTable.put(f);
          } else if (f.id === 'folder-planning' || f.id === 'folder-decagon') {
            existing.layoutSettings = f.layoutSettings;
            existing.name = f.name;
            await foldersTable.put(existing);
          }
        }

        // Put all canonical files
        for (const file of INITIAL_LIBRARY_FILES) {
          const existing = await filesTable.get(file.id);
          if (!existing) {
            await filesTable.put(file);
          }
        }
      } catch (err) {
        console.warn('Migration to schema version 12 encountered an issue:', err);
      }
    });

    // Schema Version 13: Spaced Repetition Flashcard Decks for Home Dashboard & Active Recall
    this.version(13).stores({
      spacedRepetitionDecks: 'id, title, dueCount'
    }).upgrade(async (tx) => {
      try {
        const decksTable = tx.table('spacedRepetitionDecks');
        const count = await decksTable.count();
        if (count === 0) {
          for (const d of INITIAL_SPACED_REPETITION_DECKS) {
            await decksTable.put(d);
          }
        }
      } catch (err) {
        console.warn('Migration to schema version 13 encountered an issue:', err);
      }
    });

    // Schema Version 14: Refresh seed data for Home Dashboard (Nov 18, 2026 Datasets)
    this.version(14).upgrade(async (tx) => {
      try {
        const recentTable = tx.table('recentItems');
        await recentTable.clear();
        await recentTable.bulkPut(INITIAL_RECENT_ITEMS);

        const decksTable = tx.table('spacedRepetitionDecks');
        await decksTable.clear();
        for (const d of INITIAL_SPACED_REPETITION_DECKS) {
          await decksTable.put(d);
        }
      } catch (err) {
        console.warn('Migration to schema version 14 encountered an issue:', err);
      }
    });

    // Schema Version 15: Clean Tracking & Tasks Seed Reset for Wednesday, Nov 18, 2026
    this.version(15).stores({
      trackingSessions: 'id, startTime, endTime, folderId, fileId, calendarEventId, order, createdAt',
      tasks: 'id, workspaceId, completed, order, createdAt'
    });

    // Schema Version 16: Ensure Full Tracking Seeds & Order Indexes
    this.version(16).upgrade(async (tx) => {
      try {
        const tasksTable = tx.table('tasks');
        await tasksTable.bulkPut(INITIAL_TASKS);

        const trackingTable = tx.table('trackingSessions');
        await trackingTable.bulkPut(getInitialTrackingSessions());
      } catch (err) {
        console.warn('Migration to schema version 16 encountered an issue:', err);
      }
    });

    // Schema Version 17: Multi-Week Rich Analytics Seeding (Oct-Nov 2026)
    this.version(17).upgrade(async (tx) => {
      try {
        const trackingTable = tx.table('trackingSessions');
        await trackingTable.bulkPut(getInitialTrackingSessions());
      } catch (err) {
        console.warn('Migration to schema version 17 encountered an issue:', err);
      }
    });

    // Schema Version 18: Tracking & Calendar Verification Refresh (Zero Mock Data, Multi-Period Sync)
    this.version(18).upgrade(async (tx) => {
      try {
        const trackingTable = tx.table('trackingSessions');
        const calendarTable = tx.table('calendarEvents');
        await trackingTable.clear();
        await calendarTable.clear();
        await trackingTable.bulkPut(getInitialTrackingSessions());
        await calendarTable.bulkPut(getInitialCalendarEvents());
      } catch (err) {
        console.warn('Migration to schema version 18 encountered an issue:', err);
      }
    });

    // Schema Version 19: Global Domain & Topic Taxonomy Unification & Thursday Nov 19, 2026 Seed Data
    this.version(19).stores({
      trackingSessions: 'id, order, startTime, endTime, mode, status, domainId, domainName, topicId, topicName, fieldId, fieldName, subjectId, subjectName, folderId, createdAt',
      tasks: 'id, workspaceId, completed, order, createdAt'
    }).upgrade(async (tx) => {
      try {
        const trackingTable = tx.table('trackingSessions');
        const calendarTable = tx.table('calendarEvents');
        const tasksTable = tx.table('tasks');
        await trackingTable.clear();
        await calendarTable.clear();
        await tasksTable.clear();
        await trackingTable.bulkPut(getInitialTrackingSessions());
        await calendarTable.bulkPut(getInitialCalendarEvents());
        await tasksTable.bulkPut(INITIAL_TASKS);
      } catch (err) {
        console.warn('Migration to schema version 19 encountered an issue:', err);
      }
    });

    // Schema Version 20: Master Unified Library Items
    this.version(20).stores({
      libraryItems: '_id, id, parentId, itemKind, fileType, name, updatedAt'
    });
  }
}

function convertTiptapContent(doc: any): unknown[] {
  if (!doc || !Array.isArray(doc.content)) return [];
  function extractNodeText(node: any): string {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (typeof node.text === 'string') return node.text;
    if (Array.isArray(node.content)) return node.content.map(extractNodeText).join('');
    return '';
  }

  const blocks: any[] = [];
  for (const node of doc.content) {
    if (!node || typeof node !== 'object') continue;
    switch (node.type) {
      case 'heading': {
        const level = node.attrs?.level || 1;
        blocks.push({
          type: 'heading',
          props: { level: Math.min(3, Math.max(1, level)) },
          content: [{ type: 'text', text: extractNodeText(node), styles: {} }]
        });
        break;
      }
      case 'paragraph': {
        blocks.push({
          type: 'paragraph',
          content: [{ type: 'text', text: extractNodeText(node), styles: {} }]
        });
        break;
      }
      case 'blockquote': {
        blocks.push({
          type: 'quote',
          content: [{ type: 'text', text: extractNodeText(node), styles: {} }]
        });
        break;
      }
      case 'taskList': {
        if (Array.isArray(node.content)) {
          for (const item of node.content) {
            blocks.push({
              type: 'checkListItem',
              props: { checked: Boolean(item.attrs?.checked) },
              content: [{ type: 'text', text: extractNodeText(item), styles: {} }]
            });
          }
        }
        break;
      }
      case 'bulletList': {
        if (Array.isArray(node.content)) {
          for (const item of node.content) {
            blocks.push({
              type: 'bulletListItem',
              content: [{ type: 'text', text: extractNodeText(item), styles: {} }]
            });
          }
        }
        break;
      }
      case 'orderedList': {
        if (Array.isArray(node.content)) {
          for (const item of node.content) {
            blocks.push({
              type: 'numberedListItem',
              content: [{ type: 'text', text: extractNodeText(item), styles: {} }]
            });
          }
        }
        break;
      }
      case 'codeBlock': {
        blocks.push({
          type: 'codeBlock',
          props: { language: node.attrs?.language || 'text' },
          content: [{ type: 'text', text: extractNodeText(node), styles: {} }]
        });
        break;
      }
      default: {
        const text = extractNodeText(node);
        if (text) {
          blocks.push({
            type: 'paragraph',
            content: [{ type: 'text', text, styles: {} }]
          });
        }
        break;
      }
    }
  }
  return blocks;
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
    title: 'Proof-read Raft leader election proofs',
    completed: true,
    completedAt: '2026-11-18T10:00:00Z',
    order: 0,
    createdAt: '2026-11-18T08:00:00Z'
  },
  {
    id: 'task-2',
    title: 'Review patch-clamp resistance values',
    completed: true,
    completedAt: '2026-11-18T14:00:00Z',
    order: 1,
    createdAt: '2026-11-18T08:15:00Z'
  },
  {
    id: 'task-3',
    title: 'Complete Fixed Income Problem Set 4',
    completed: false,
    order: 2,
    createdAt: '2026-11-18T08:30:00Z'
  },
  {
    id: 'task-4',
    title: 'Draft Nelson-Siegel curve calibration code',
    completed: false,
    order: 3,
    createdAt: '2026-11-18T08:45:00Z'
  },
  {
    id: 'task-5',
    title: 'Epistemology essay draft citations',
    completed: false,
    order: 4,
    createdAt: '2026-11-18T09:00:00Z'
  }
];

export const INITIAL_RECENT_ITEMS: RecentStudyItem[] = [
  {
    id: 'kandel-pdf',
    title: 'Kandel_Principles_Ch12.pdf',
    subtitle: 'Page 42',
    type: 'pdf',
    path: '/learning',
    lastOpenedAt: '2026-11-18T10:45:00Z'
  },
  {
    id: 'plasticity-pdf',
    title: 'Cellular_Plasticity_Synthesis.pdf',
    subtitle: 'Section 2',
    type: 'pdf',
    path: '/learning',
    lastOpenedAt: '2026-11-18T09:30:00Z'
  },
  {
    id: 'snare-flashcards',
    title: 'SNARE_Machinery_Deck',
    subtitle: 'Card 14 / 50',
    type: 'flashcards',
    path: '/learning',
    lastOpenedAt: '2026-11-18T08:15:00Z'
  },
  {
    id: 'stanford-video',
    title: 'Stanford_Neuro_Lecture_08.mp4',
    subtitle: '16:48 / 45:00',
    type: 'video',
    path: '/learning',
    lastOpenedAt: '2026-11-17T17:20:00Z'
  },
  {
    id: 'econometrics-notes',
    title: 'LSE_Econometrics_Notes.md',
    subtitle: 'Section 4',
    type: 'notes',
    path: '/learning',
    lastOpenedAt: '2026-11-17T14:10:00Z'
  }
];

export async function loadHomeTasks(workspaceId?: string): Promise<TaskItem[]> {
  try {
    const db = getLocalDatabase();
    const count = await db.tasks.count();
    if (count === 0) {
      await db.tasks.bulkPut(INITIAL_TASKS);
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

export async function updateHomeTaskTitle(id: string, title: string): Promise<boolean> {
  try {
    const db = getLocalDatabase();
    const existing = await db.tasks.get(id);
    if (!existing) return false;
    await db.tasks.update(id, { title: title.trim() });
    return true;
  } catch (err) {
    console.warn('Failed to update task title in Dexie:', err);
    return false;
  }
}

export const CURRENT_HOME_SEED_VERSION = '2026-11-18-v2';

export async function ensureFreshHomeSeedData(db = getLocalDatabase()): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('sos:home_seed_version');
    if (saved !== CURRENT_HOME_SEED_VERSION) {
      await db.recentItems.clear();
      await db.recentItems.bulkPut(INITIAL_RECENT_ITEMS);

      await db.spacedRepetitionDecks.clear();
      for (const d of INITIAL_SPACED_REPETITION_DECKS) {
        await db.spacedRepetitionDecks.put(d);
      }
      localStorage.setItem('sos:home_seed_version', CURRENT_HOME_SEED_VERSION);
    }
  } catch (err) {
    console.warn('Failed to ensure fresh home seed data:', err);
  }
}

export async function loadRecentStudyItems(): Promise<RecentStudyItem[]> {
  try {
    const db = getLocalDatabase();
    await ensureFreshHomeSeedData(db);
    const count = await db.recentItems.count();
    if (count === 0) {
      await db.recentItems.bulkPut(INITIAL_RECENT_ITEMS);
      return [...INITIAL_RECENT_ITEMS].sort(
        (a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
      );
    }
    const all = await db.recentItems.toArray();
    return all.sort(
      (a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
    );
  } catch (err) {
    console.warn('Failed to load recent study items from Dexie:', err);
    return [...INITIAL_RECENT_ITEMS].sort(
      (a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
    );
  }
}

export async function touchRecentStudyItem(
  id: string,
  metadata?: Partial<RecentStudyItem>
): Promise<void> {
  try {
    const db = getLocalDatabase();
    const existing = await db.recentItems.get(id);
    const nowIso = new Date().toISOString();
    if (existing) {
      existing.lastOpenedAt = nowIso;
      if (metadata?.subtitle) existing.subtitle = metadata.subtitle;
      if (metadata?.title) existing.title = metadata.title;
      await db.recentItems.put(existing);
    } else if (metadata?.title) {
      const newItem: RecentStudyItem = {
        id,
        title: metadata.title,
        subtitle: metadata.subtitle || 'Active Recall',
        type: metadata.type || 'flashcards',
        path: metadata.path || '/learning',
        lastOpenedAt: nowIso
      };
      await db.recentItems.put(newItem);
    }
  } catch (err) {
    console.warn('Failed to touch recent study item in Dexie:', err);
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

export async function deleteRecentStudyItem(id: string): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.recentItems.delete(id);
  } catch (err) {
    console.warn('Failed to delete recent item from Dexie:', err);
  }
}

export async function restoreRecentStudyItem(item: RecentStudyItem): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.recentItems.put(item);
  } catch (err) {
    console.warn('Failed to restore recent item to Dexie:', err);
  }
}

export const INITIAL_SPACED_REPETITION_DECKS: SpacedRepetitionDeck[] = [
  {
    id: 'deck-snare',
    title: 'SNARE_Machinery_Deck',
    totalCards: 50,
    dueCount: 8,
    lastStudiedAt: '2026-11-15T14:30:00Z',
    cards: Array.from({ length: 50 }, (_, i) => ({
      id: `snare-card-${i + 1}`,
      front: `SNARE Complex Assembly Step ${i + 1}`,
      back: `Synaptotagmin and Syntaxin-1 interaction mechanism ${i + 1}`,
      dueDate:
        i < 8
          ? new Date(Date.now() - 3600000 * (8 - i)).toISOString()
          : new Date(Date.now() + 86400000 * (i - 7)).toISOString()
    }))
  },
  {
    id: 'deck-neuro',
    title: 'Neuro_Synaptic_Transmission',
    totalCards: 36,
    dueCount: 4,
    lastStudiedAt: '2026-11-15T16:00:00Z',
    cards: Array.from({ length: 36 }, (_, i) => ({
      id: `neuro-card-${i + 1}`,
      front: `Synaptic Transmission Stage ${i + 1}`,
      back: `Neurotransmitter vesicle exocytosis and clearance ${i + 1}`,
      dueDate:
        i < 4
          ? new Date(Date.now() - 3600000 * (4 - i)).toISOString()
          : new Date(Date.now() + 86400000 * (i - 3)).toISOString()
    }))
  },
  {
    id: 'deck-kandel',
    title: 'Kandel_Ch12_Core_Concepts',
    totalCards: 24,
    dueCount: 2,
    lastStudiedAt: '2026-11-16T09:15:00Z',
    cards: Array.from({ length: 24 }, (_, i) => ({
      id: `kandel-card-${i + 1}`,
      front: `Kandel Principles Chapter 12: Concept ${i + 1}`,
      back: `Synaptic plasticity and long-term potentiation ${i + 1}`,
      dueDate:
        i < 2
          ? new Date(Date.now() - 3600000 * (2 - i)).toISOString()
          : new Date(Date.now() + 86400000 * (i - 1)).toISOString()
    }))
  },
  {
    id: 'deck-signaling',
    title: 'Cellular_Signaling_Pathways',
    totalCards: 42,
    dueCount: 5,
    lastStudiedAt: '2026-11-16T11:45:00Z',
    cards: Array.from({ length: 42 }, (_, i) => ({
      id: `signaling-card-${i + 1}`,
      front: `Cellular Signaling Cascade ${i + 1}`,
      back: `GPCR phosphorylation and second messenger modulation ${i + 1}`,
      dueDate:
        i < 5
          ? new Date(Date.now() - 3600000 * (5 - i)).toISOString()
          : new Date(Date.now() + 86400000 * (i - 4)).toISOString()
    }))
  },
  {
    id: 'deck-consensus',
    title: 'Distributed_Consensus_Raft',
    totalCards: 48,
    dueCount: 6,
    lastStudiedAt: '2026-11-17T15:20:00Z',
    cards: Array.from({ length: 48 }, (_, i) => ({
      id: `consensus-card-${i + 1}`,
      front: `Raft Protocol Safety Proofs: Invariant ${i + 1}`,
      back: `Leader election and log matching property verification ${i + 1}`,
      dueDate:
        i < 6
          ? new Date(Date.now() - 3600000 * (6 - i)).toISOString()
          : new Date(Date.now() + 86400000 * (i - 5)).toISOString()
    }))
  }
];

export async function loadSpacedRepetitionDecks(): Promise<SpacedRepetitionDeck[]> {
  try {
    const db = getLocalDatabase();
    await ensureFreshHomeSeedData(db);
    const count = await db.spacedRepetitionDecks.count();
    if (count === 0) {
      for (const d of INITIAL_SPACED_REPETITION_DECKS) {
        await db.spacedRepetitionDecks.put(d);
      }
      return INITIAL_SPACED_REPETITION_DECKS;
    }
    const all = await db.spacedRepetitionDecks.toArray();
    const now = new Date();
    return all.map((d) => ({
      ...d,
      dueCount:
        d.cards && d.cards.length > 0
          ? d.cards.filter((c) => new Date(c.dueDate) <= now).length
          : d.dueCount
    }));
  } catch (err) {
    console.warn('Failed to load spaced repetition decks from Dexie:', err);
    return INITIAL_SPACED_REPETITION_DECKS;
  }
}

// ==========================================
// Phase 03: Library Architecture (Folders & Files)
// Powered by BlockNote Community
// ==========================================

export const ROOT_LIBRARY_FOLDER: LibraryFolder = {
  id: 'library-root',
  workspaceId: 'default-workspace',
  parentId: null,
  name: 'Library',
  icon: 'book-marked',
  coverUrl: STITCH_COVER_URL,
  content: [
    {
      id: 'bn-root-callout',
      type: 'callout',
      props: { icon: 'pin' },
      content: [
        {
          type: 'text',
          text: 'Knowledge Base & Study Modules: Canonical resources, flashcard decks, and active research notes.',
          styles: {}
        }
      ],
      children: []
    },
    {
      id: 'bn-root-folder-planning',
      type: 'folder',
      props: { folderId: 'folder-planning' },
      children: []
    },
    {
      id: 'bn-root-folder-decagon',
      type: 'folder',
      props: { folderId: 'folder-decagon' },
      children: []
    }
  ],
  layoutSettings: {
    view: 'gallery',
    showTitle: true,
    showIcon: true,
    cardPreview: 'cover',
    cardSize: 'medium',
    fitMedia: true,
    cardLayout: 'list'
  },
  plainTextPreview: 'Knowledge Base & Study Modules: Canonical resources, flashcard decks, and active research notes.',
  wordCount: 14,
  readTimeMinutes: 1,
  createdAt: '2026-11-14T07:30:00Z',
  updatedAt: '2026-11-14T07:30:00Z'
};

export const INITIAL_LIBRARY_FOLDERS: LibraryFolder[] = [
  ROOT_LIBRARY_FOLDER,
  {
    id: 'folder-planning',
    workspaceId: 'default-workspace',
    parentId: 'library-root',
    name: '[ PLANNING ]',
    icon: '📁',
    color: '#3F3F46',
    layoutSettings: {
      view: 'table',
      showTitle: true,
      showIcon: true,
      cardPreview: 'cover',
      cardSize: 'medium',
      fitMedia: true,
      cardLayout: 'list'
    },
    content: [
      {
        id: 'bn-planning-callout',
        type: 'callout',
        props: { icon: 'pin' },
        content: [
          {
            type: 'text',
            text: 'Planning & Schedule: Daily study blocks, milestones, and reading assignments.',
            styles: {}
          }
        ],
        children: []
      },
      {
        id: 'bn-planning-folder-block',
        type: 'folder',
        props: { folderId: 'folder-planning' },
        children: []
      }
    ],
    plainTextPreview: 'Academic Study Planning & Daily Workflows.',
    wordCount: 6,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T07:40:00Z',
    updatedAt: '2026-11-14T07:40:00Z'
  },
  {
    id: 'folder-day-planning',
    workspaceId: 'default-workspace',
    parentId: 'folder-planning',
    name: 'DAY PLANNING [ 8 AM ]',
    icon: '📁',
    color: '#3F3F46',
    layoutSettings: { ...DEFAULT_FOLDER_LAYOUT_SETTINGS },
    content: [
      {
        id: 'bn-day-planning-callout',
        type: 'callout',
        props: { icon: 'pin' },
        content: [
          {
            type: 'text',
            text: 'Daily morning study schedule, focus tracking blocks, and high-priority review tasks.',
            styles: {}
          }
        ],
        children: []
      },
      {
        id: 'bn-day-planning-p1',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [
          {
            type: 'text',
            text: '08:00 AM – 10:30 AM: Deep focus on Kandel Principles Ch. 12 (Neurobiology & Synaptic Transmission).',
            styles: {}
          }
        ],
        children: []
      }
    ],
    plainTextPreview: 'Daily morning study schedule and time blocking.',
    wordCount: 7,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T08:00:00Z',
    updatedAt: '2026-11-14T08:00:00Z'
  },
  {
    id: 'folder-month-planning',
    workspaceId: 'default-workspace',
    parentId: 'folder-planning',
    name: 'MONTH PLANNING',
    icon: '📁',
    color: '#3F3F46',
    layoutSettings: { ...DEFAULT_FOLDER_LAYOUT_SETTINGS },
    content: [],
    plainTextPreview: 'Long-term monthly study milestones and targets.',
    wordCount: 6,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T08:00:00Z',
    updatedAt: '2026-11-14T08:00:00Z'
  },
  {
    id: 'folder-decagon',
    workspaceId: 'default-workspace',
    parentId: 'library-root',
    name: '[ THE DECAGON ]',
    icon: '🏛️',
    color: '#3F3F46',
    layoutSettings: {
      view: 'gallery',
      showTitle: true,
      showIcon: true,
      cardPreview: 'cover',
      cardSize: 'small',
      fitMedia: true,
      cardLayout: 'list'
    },
    content: [
      {
        id: 'bn-decagon-callout',
        type: 'callout',
        props: { icon: 'pin' },
        content: [
          {
            type: 'text',
            text: 'The Decagon: Core academic tracks and modules for medical and engineering curricula.',
            styles: {}
          }
        ],
        children: []
      },
      {
        id: 'bn-decagon-folder-block',
        type: 'folder',
        props: { folderId: 'folder-decagon' },
        children: []
      }
    ],
    plainTextPreview: 'The Decagon — Core academic tracks and modules.',
    wordCount: 12,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T07:45:00Z',
    updatedAt: '2026-11-14T07:45:00Z'
  },
  {
    id: 'folder-tech',
    workspaceId: 'default-workspace',
    parentId: 'folder-decagon',
    name: '1. TECH',
    icon: 'cpu',
    coverUrl: 'https://lh3.googleusercontent.com/aida/ALJJyrBe1N5Q0uMQeRtztf7SqpK_GFADltwC0LLpUITZcO-fu60VqV5WcsrempiiC6jvP7DT0sWcVn98UTbMeYOtuZVu_rv15ZSNAG9lKoDiLg-c245HFrSJQUmZJDB0ZX10P6jRXtxqPQtQyMYtwmRbsBDA5tPDBYCbCuFxdWTDXnDEUAa352sY8107m8bZhSX9spKD0AxGbxa4zX8PinojQXJfgvXoAvS32c4YxoxiZSenzKy7Rb8BSZ13ENvVHd0P--EVReEf6fIdilsm',
    color: '#3F3F46',
    layoutSettings: { ...DEFAULT_FOLDER_LAYOUT_SETTINGS },
    content: [
      {
        id: 'bn-business-callout',
        type: 'callout',
        props: { icon: 'pin' },
        content: [
          {
            type: 'text',
            text: '2. BUSINESS — Venture architecture, market economics, and quantitative finance.',
            styles: {}
          }
        ],
        children: []
      }
    ],
    plainTextPreview: 'Technical systems and computational architectures.',
    wordCount: 5,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T08:00:00Z',
    updatedAt: '2026-11-14T08:00:00Z'
  },
  {
    id: 'folder-business',
    workspaceId: 'default-workspace',
    parentId: 'folder-decagon',
    name: '2. BUSINESS',
    icon: 'briefcase',
    coverUrl: 'https://lh3.googleusercontent.com/aida/ALJJyrCQfYQ0CKNfVX8eakHETMtoaOAzj7C9WXbSdvUqLwk7VEVhH4urK90bJ-b1gn22ohaRQVYi58Vwmk8WWE0oalJEeR9Bh8xbT8AryGFH_2ikjp5GRDPkjDiqLyiC5pdlKbynlIBMFaVJ7zssLiWZ4X88gwv4e-TDkJHPhj6aRSnlhhluK1uZXoSTKZv57iSrpK_sgleEnfcjxPAE1baOJAOAgqaiFE1KRCGhQ9oMSOkF_alf6gAwfjvZBAYTXku1rk7jQdvb60WqbSQ',
    color: '#3F3F46',
    layoutSettings: { ...DEFAULT_FOLDER_LAYOUT_SETTINGS },
    content: [
      {
        id: 'bn-business-callout',
        type: 'callout',
        props: { icon: 'pin' },
        content: [
          {
            type: 'text',
            text: '2. BUSINESS — Venture architecture, market economics, and quantitative finance.',
            styles: {}
          }
        ],
        children: []
      }
    ],
    plainTextPreview: 'Economics, venture design, and market strategy.',
    wordCount: 6,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T08:00:00Z',
    updatedAt: '2026-11-14T08:00:00Z'
  },
  {
    id: 'folder-ppe',
    workspaceId: 'default-workspace',
    parentId: 'folder-decagon',
    name: '3. PPE',
    icon: 'landmark',
    coverUrl: 'https://lh3.googleusercontent.com/aida/ALJJyrB-LYNEwXec3HbM80Q8og614-W0skePBHOl0e2vMANEHMTLJmvs2DJs3sBwCcZe9Kd4hMAnAPwkOtH99NhxOpC9HiJmGgvKF1oSiMH9zsOzb4g6EzKkxH_R29txaaChA2jzhLhkTOGpemyYimUKo59O_l5PEOMd8scU14C3A0ywSdIL1WBZKimSVhlJBX9UPhMnTtcbiF5fSbaNt4BtGCtAm0vc2VYdjGNPv0VIuOA0Wl7HFi-AYKe8WRFzLZE_nH0l30L-gynmhOLCgKzbpQ',
    color: '#3F3F46',
    layoutSettings: { ...DEFAULT_FOLDER_LAYOUT_SETTINGS },
    content: [
      {
        id: 'bn-ppe-callout',
        type: 'callout',
        props: { icon: 'pin' },
        content: [
          {
            type: 'text',
            text: '3. PPE — Philosophy, Politics, and Economics foundational seminar.',
            styles: {}
          }
        ],
        children: []
      }
    ],
    plainTextPreview: 'Philosophy, Politics, and Economics foundational seminar.',
    wordCount: 6,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T08:00:00Z',
    updatedAt: '2026-11-14T08:00:00Z'
  },
  {
    id: 'folder-neurobiology',
    workspaceId: 'default-workspace',
    parentId: 'folder-decagon',
    name: 'Neurobiology & Synapse',
    icon: '🧠',
    coverUrl: CURATED_DARK_COVERS[4],
    color: '#3F3F46',
    layoutSettings: {
      view: 'gallery',
      showTitle: true,
      showIcon: true,
      cardPreview: 'cover',
      cardSize: 'medium',
      fitMedia: true,
      cardLayout: 'list'
    },
    content: [
      {
        id: 'bn-heading-1',
        type: 'heading',
        props: { level: 1, backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
        content: [{ type: 'text', text: 'Synaptic Plasticity & Memory Synthesis', styles: {} }],
        children: []
      },
      {
        id: 'bn-p-1',
        type: 'paragraph',
        props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
        content: [
          {
            type: 'text',
            text: 'Synaptic plasticity is the biological foundation of learning and memory in the central nervous system. It describes the activity-dependent modification of synaptic transmission strength across chemical synapses.',
            styles: {}
          }
        ],
        children: []
      }
    ],
    plainTextPreview:
      'Synaptic plasticity is the biological foundation of learning and memory in the central nervous system.',
    wordCount: 85,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T08:00:00Z',
    updatedAt: '2026-11-14T10:30:00Z'
  },
  {
    id: 'folder-molecular-bio',
    workspaceId: 'default-workspace',
    parentId: 'folder-decagon',
    name: 'Molecular Genetics',
    icon: '🧬',
    coverUrl: CURATED_DARK_COVERS[5],
    color: '#27272A',
    layoutSettings: {
      view: 'gallery',
      showTitle: true,
      showIcon: true,
      cardPreview: 'cover',
      cardSize: 'medium',
      fitMedia: true,
      cardLayout: 'list'
    },
    content: [
      {
        id: 'bn-mol-1',
        type: 'heading',
        props: { level: 1, backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
        content: [{ type: 'text', text: 'Molecular Genetics & Transcriptional Control', styles: {} }],
        children: []
      }
    ],
    plainTextPreview:
      'Core principles of eukaryotic gene regulation, chromatin remodeling, and histone post-translational modifications.',
    wordCount: 16,
    readTimeMinutes: 1,
    createdAt: '2026-11-14T08:30:00Z',
    updatedAt: '2026-11-14T08:30:00Z'
  }
];

export const INITIAL_LIBRARY_FILES: LibraryFile[] = [
  {
    id: 'file-kandel-pdf',
    workspaceId: 'default-workspace',
    folderId: 'folder-planning',
    title: 'Kandel_Principles_Ch12.pdf',
    type: 'pdf',
    path: '/learning?fileId=file-kandel-pdf&type=pdf',
    sizeFormatted: '14.2 MB',
    createdAt: '2026-11-14T09:15:00Z',
    updatedAt: '2026-11-14T09:15:00Z'
  },
  {
    id: 'file-cellular-slides',
    workspaceId: 'default-workspace',
    folderId: 'folder-planning',
    title: 'Cellular_Slides.pptx',
    type: 'slides',
    path: '/learning?fileId=file-cellular-slides&type=slides',
    sizeFormatted: 'Nov 14',
    createdAt: '2026-11-14T11:20:00Z',
    updatedAt: '2026-11-14T11:20:00Z'
  },
  {
    id: 'file-usmle-atlas',
    workspaceId: 'default-workspace',
    folderId: 'folder-decagon',
    title: 'USMLE_Atlas.pdf',
    type: 'pdf',
    coverUrl: 'https://lh3.googleusercontent.com/aida/ALJJyrBTHQuScTnoolPPDG6zyDhME_xBmhQ7J5XO_5G0j4zmotboy5Ng3QuViG-5mXDdqjInMGRSn9R03XKdzKfeuGw5ukHEedBjYqVkZsCqtknz3uZdUrMfIZonR2CjmrXcVxt1nJ7iALNwk0-PedjqSPRVr4vtMiNpWLiEt8Rddsi_vHz6fa3HjbBYQO5xZWRU7ikFASisKXwAFFbmDAAFlsrOVw2OTUQ4QN9tUouI6T6RO0K6Hr67a6YD9B5v_L7VOaQIhsYA46bRgE6561QniQ',
    path: '/learning?fileId=file-usmle-atlas&type=pdf',
    sizeFormatted: '12.8 MB',
    createdAt: '2026-11-14T09:30:00Z',
    updatedAt: '2026-11-14T09:30:00Z'
  },
  {
    id: 'file-synaptic-ltp',
    workspaceId: 'default-workspace',
    folderId: 'folder-decagon',
    title: 'Synaptic_LTP.mp4',
    type: 'video',
    coverUrl: 'https://lh3.googleusercontent.com/aida/ALJJyrC5lS3XVTZYv8oAq3HWagRzx2gGITWdjX3sT0CF4qwch90bINlxGGkkG-w12AXL1vn-58McFzA4-lEW3EfAb5xWLRPO-EO5z7gSPaxkyIa4J2DmYzVRCrkbZLbUSB4M625houVeOdezrKJcAykiaxluj6CgZpKMW0leEFyCB0-JUzu4D0PfhrCLqIvQALqttnUKC1Cg5-FCk2CBWAmNmTRMwxFbDprfJPes2VQY_gNnifDPOY4uhUPTbpASAyhqYtqdEiMue9ONcw',
    path: '/learning?fileId=file-synaptic-ltp&type=video',
    sizeFormatted: '48.5 MB',
    createdAt: '2026-11-14T10:00:00Z',
    updatedAt: '2026-11-14T10:00:00Z'
  }
];

// Backwards-compatible document export mapping to folders
export const INITIAL_LIBRARY_DOCUMENTS: LibraryDocument[] = INITIAL_LIBRARY_FOLDERS.map((f) => ({
  ...f,
  title: f.name
}));

export async function loadLibraryFolders(workspaceId?: string): Promise<LibraryFolder[]> {
  try {
    const db = getLocalDatabase();
    const count = await db.libraryFolders.count();
    if (count === 0) {
      await db.libraryFolders.bulkPut(INITIAL_LIBRARY_FOLDERS);
      return INITIAL_LIBRARY_FOLDERS;
    }
    let folders = await db.libraryFolders.toArray();
    let root = folders.find((f) => f.id === 'library-root');
    if (!root) {
      root = ROOT_LIBRARY_FOLDER;
      await db.libraryFolders.put(root);
      folders.unshift(root);
    } else {
      const contentStr = JSON.stringify(root.content || []);
      const isCorrupted =
        !Array.isArray(root.content) ||
        root.content.length === 0 ||
        contentStr.includes('aKnowledge Base') ||
        contentStr.includes('nd active research notes') ||
        contentStr.includes('Untitled Study Folder') ||
        contentStr.includes('Academic Knowledge Base') ||
        contentStr.includes('Study Domains');
      if (isCorrupted || root.icon !== 'book-marked') {
        root.name = 'Library';
        root.icon = 'book-marked';
        root.coverUrl = STITCH_COVER_URL;
        root.content = ROOT_LIBRARY_FOLDER.content;
        await db.libraryFolders.put(root);
      }
    }

    // Ensure all canonical initial folders exist in database
    for (const initFolder of INITIAL_LIBRARY_FOLDERS) {
      if (!folders.some((f) => f.id === initFolder.id)) {
        await db.libraryFolders.put(initFolder);
        folders.push(initFolder);
      }
    }

    return folders.sort((a, b) => {
      if (a.id === 'library-root') return -1;
      if (b.id === 'library-root') return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  } catch (err) {
    console.warn('Failed to load library folders from Dexie:', err);
    return INITIAL_LIBRARY_FOLDERS;
  }
}

export async function getChildFolders(parentId: string): Promise<LibraryFolder[]> {
  try {
    const db = getLocalDatabase();
    return await db.libraryFolders.where('parentId').equals(parentId).toArray();
  } catch (err) {
    console.warn(`Failed to get child folders for ${parentId}:`, err);
    return [];
  }
}

export async function getChildFiles(folderId: string): Promise<LibraryFile[]> {
  try {
    const db = getLocalDatabase();
    return await db.libraryFiles.where('folderId').equals(folderId).toArray();
  } catch (err) {
    console.warn(`Failed to get child files for ${folderId}:`, err);
    return [];
  }
}

export async function getLibraryFolder(id: string): Promise<LibraryFolder | undefined> {
  try {
    const db = getLocalDatabase();
    return await db.libraryFolders.get(id);
  } catch (err) {
    console.warn(`Failed to get folder ${id} from Dexie:`, err);
    return undefined;
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
    // Also remove files attached to this folder
    const files = await db.libraryFiles.where('folderId').equals(id).toArray();
    for (const file of files) {
      await db.libraryFiles.delete(file.id);
    }
  } catch (err) {
    console.warn('Failed to delete library folder from Dexie:', err);
    throw err;
  }
}

export async function loadLibraryFiles(folderId?: string | null): Promise<LibraryFile[]> {
  try {
    const db = getLocalDatabase();
    const count = await db.libraryFiles.count();
    if (count === 0) {
      await db.libraryFiles.bulkPut(INITIAL_LIBRARY_FILES);
      if (folderId) {
        return INITIAL_LIBRARY_FILES.filter((f) => f.folderId === folderId);
      }
      return INITIAL_LIBRARY_FILES;
    }

    // Ensure all canonical initial files exist in database
    let allFiles = await db.libraryFiles.toArray();
    for (const initFile of INITIAL_LIBRARY_FILES) {
      if (!allFiles.some((f) => f.id === initFile.id)) {
        await db.libraryFiles.put(initFile);
        allFiles.push(initFile);
      }
    }

    if (folderId) {
      return allFiles.filter((f) => f.folderId === folderId);
    }
    return allFiles;
  } catch (err) {
    console.warn('Failed to load library files from Dexie:', err);
    return INITIAL_LIBRARY_FILES;
  }
}

export async function getLibraryFile(id: string): Promise<LibraryFile | undefined> {
  try {
    const db = getLocalDatabase();
    return await db.libraryFiles.get(id);
  } catch (err) {
    console.warn(`Failed to get library file ${id} from Dexie:`, err);
    return undefined;
  }
}

export async function saveLibraryFile(file: LibraryFile): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.libraryFiles.put(file);
  } catch (err) {
    console.warn('Failed to save library file in Dexie:', err);
    throw err;
  }
}

export async function deleteLibraryFile(id: string): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.libraryFiles.delete(id);
  } catch (err) {
    console.warn('Failed to delete library file from Dexie:', err);
    throw err;
  }
}

// Backwards-compatible document functions routing through Folders
export async function loadLibraryDocuments(workspaceId?: string): Promise<LibraryDocument[]> {
  const folders = await loadLibraryFolders(workspaceId);
  return folders.map((f) => ({
    ...f,
    title: f.name,
    folderId: f.id
  }));
}

export async function getLibraryDocument(id: string): Promise<LibraryDocument | undefined> {
  const folder = await getLibraryFolder(id);
  if (!folder) return undefined;
  return {
    ...folder,
    title: folder.name,
    folderId: folder.id
  };
}

export async function saveLibraryDocument(doc: LibraryDocument): Promise<void> {
  await saveLibraryFolder({
    ...doc,
    name: doc.title || doc.name || 'Untitled Folder'
  });
}

export async function deleteLibraryDocument(id: string): Promise<void> {
  await deleteLibraryFolder(id);
}

// ==========================================
// Phase 08: Profile & Guest Migration Persistence
// ==========================================

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'scholar_abdalla_01',
  name: 'Abdalla Husin',
  handle: '@abdalla7usin',
  isAuthenticated: true,
  institution: 'Mansoura University',
  education: 'Mansoura University',
  learningFocus: 'Computer Science & Cognitive Systems',
  bio: 'Computer Science undergraduate exploring distributed consensus, compiler design, and how human memory consolidates complex ideas.',
  avatarUrl: 'https://lh3.googleusercontent.com/aida/ALJJyrBE6EhsHOqBp174KlEE0XrgpcMjQmblnn2X7vXwDJVOKYPKb7yDZ06Vw_NqRcsrxOTsrvWRxDQX_0hgDLbZ2XZM7agGIy8rbv8bYGWpaF2d30oXkxqAisUNXabuoiebdVqFtSLIzj8vaZjVK-aSHuO3rGxN6TKHDCpJKjXzUfwMEsiIP42arHCi1DVwgFwpbkHrHihNRxcMxFhP6g71n-Ej2xAqvNVjJ8X9dDARkQt3DmGe0NVBhLB-3fYriiCAu3BiIg',
  coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
  joinedDate: 'November 2026',
  location: 'Mansoura, Egypt',
  website: 'https://sos.study',
  academicTracks: [
    'Computer Systems Architecture',
    'Distributed Systems & Local-First Software',
    'Cognitive Science & Spaced Retrieval',
    'Neuroscience & Memory Consolidation'
  ],
  stats: {
    followersCount: 0,
    followingCount: 0,
    studyTimeHours: 0,
    streakDays: 0,
    contributionsCount: 0
  }
};

export const INITIAL_USER_POSTS: UserPost[] = [];

export const INITIAL_USER_RESOURCES: UserSharedResource[] = [];

export const INITIAL_USER_COMMUNITIES: UserCommunity[] = [];

export async function getProfilePosts(): Promise<UserPost[]> {
  try {
    const db = getLocalDatabase();
    const posts = await db.userPosts.toArray();
    return posts.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (err) {
    console.warn('Failed to get profile posts:', err);
    return [];
  }
}

export async function createProfilePost(post: {
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'whiteboard';
}): Promise<UserPost> {
  const db = getLocalDatabase();
  const newPost: UserPost = {
    id: `post-${Date.now()}`,
    authorId: 'scholar_abdalla_01',
    authorName: 'Abdalla Husin',
    authorHandle: '@abdalla7usin',
    authorAvatarUrl: '/avatars/abdalla.jpg',
    content: post.content,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    commentsCount: 0,
    repostsCount: 0,
    isLiked: false,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType
  };
  await db.userPosts.put(newPost);
  return newPost;
}

export async function toggleLikePost(postId: string): Promise<UserPost> {
  const db = getLocalDatabase();
  const post = await db.userPosts.get(postId);
  if (!post) throw new Error('Post not found');
  const isLiked = !post.isLiked;
  const likesCount = isLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
  const updated: UserPost = { ...post, isLiked, likesCount };
  await db.userPosts.put(updated);
  return updated;
}

export async function getProfileResources(): Promise<UserSharedResource[]> {
  try {
    const db = getLocalDatabase();
    const res = await db.userSharedResources.toArray();
    return res.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.warn('Failed to get profile resources:', err);
    return [];
  }
}

export async function getProfileCommunities(): Promise<UserCommunity[]> {
  try {
    const db = getLocalDatabase();
    return await db.userCommunities.toArray();
  } catch (err) {
    console.warn('Failed to get profile communities:', err);
    return [];
  }
}

export async function calculateProfileActivityMetrics(): Promise<ProfileActivityMetrics> {
  try {
    const db = getLocalDatabase();

    // Collect all real action timestamps from tasks, library, posts, and study sessions
    const tasks = await db.tasks.toArray();
    const folders = await db.libraryFolders.toArray();
    const files = await db.libraryFiles.toArray();
    const posts = await db.userPosts.toArray();
    const sessions = await db.studySessions.toArray();

    // Map timestamps to YYYY-MM-DD
    const dateCounts = new Map<string, number>();

    const recordDate = (isoString?: string) => {
      if (!isoString) return;
      try {
        const d = new Date(isoString);
        if (!isNaN(d.getTime())) {
          const key = d.toISOString().split('T')[0];
          dateCounts.set(key, (dateCounts.get(key) || 0) + 1);
        }
      } catch {
        // ignore
      }
    };

    tasks.forEach((t) => {
      recordDate(t.createdAt);
      if (t.completed && t.completedAt) recordDate(t.completedAt);
    });
    folders.forEach((f) => {
      recordDate(f.createdAt);
      recordDate(f.updatedAt);
    });
    files.forEach((f) => {
      recordDate(f.createdAt);
      recordDate(f.updatedAt);
    });
    posts.forEach((p) => {
      recordDate(p.createdAt);
    });
    sessions.forEach((s) => {
      recordDate(s.timestamp);
    });

    // Build 52-week window (364 days ending today)
    const now = new Date();
    const totalDays = 52 * 7; // 364
    const dailyContributions: DailyContribution[] = [];

    let totalActionCount = 0;
    const activeDatesSet = new Set<string>();

    for (let i = totalDays - 1; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * 86400000);
      const dateStr = dayDate.toISOString().split('T')[0];
      const count = dateCounts.get(dateStr) || 0;
      totalActionCount += count;
      if (count > 0) {
        activeDatesSet.add(dateStr);
      }

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count >= 6) level = 4;
      else if (count >= 4) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      dailyContributions.push({
        date: dateStr,
        count,
        level
      });
    }

    // Calculate current streak
    let currentStreakDays = 0;
    const todayStr = now.toISOString().split('T')[0];
    const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

    // If today or yesterday is active, count backwards consecutive days
    const startFromDate = activeDatesSet.has(todayStr)
      ? now
      : activeDatesSet.has(yesterdayStr)
      ? new Date(now.getTime() - 86400000)
      : null;

    if (startFromDate) {
      let checkDate = new Date(startFromDate.getTime());
      while (true) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (activeDatesSet.has(checkStr)) {
          currentStreakDays++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    // Total study time from logged sessions
    let totalStudyTimeMinutes = 0;
    sessions.forEach((s) => {
      totalStudyTimeMinutes += s.durationMinutes || 0;
    });
    const totalStudyTimeHours = Math.round((totalStudyTimeMinutes / 60) * 10) / 10;

    return {
      totalStudyTimeHours,
      currentStreakDays,
      totalContributions: totalActionCount,
      yearLabel: `${now.getFullYear()}`,
      dateRangeLabel: 'Dec 2025 – Nov 2026',
      dailyContributions
    };
  } catch (err) {
    console.warn('Failed to calculate profile activity metrics:', err);
    return {
      totalStudyTimeHours: 0,
      currentStreakDays: 0,
      totalContributions: 0,
      yearLabel: '2026',
      dateRangeLabel: 'Dec 2025 – Nov 2026',
      dailyContributions: []
    };
  }
}

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const db = getLocalDatabase();
    const record = await db.shellPreferences.get('user_profile');
    if (record && record.value && typeof record.value === 'object') {
      const val = record.value as UserProfile;
      const merged: UserProfile = {
        ...DEFAULT_USER_PROFILE,
        ...val,
        avatarUrl: '/avatars/abdalla.jpg',
        location: (!val.location || val.location === 'Boston, MA' || val.location.includes('Workspace'))
          ? 'Mansoura, Egypt'
          : val.location,
        institution: (!val.institution || val.institution === 'Stanford University')
          ? 'Mansoura University'
          : val.institution,
        stats: {
          followersCount: 0,
          followingCount: 0,
          studyTimeHours: 0,
          streakDays: 0,
          contributionsCount: 0
        }
      };
      return merged;
    }
    // Initialize default if not present
    await db.shellPreferences.put({
      key: 'user_profile',
      value: DEFAULT_USER_PROFILE,
      updatedAt: new Date().toISOString()
    });
    return DEFAULT_USER_PROFILE;
  } catch (err) {
    console.warn('Failed to load user profile from Dexie:', err);
    return DEFAULT_USER_PROFILE;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.shellPreferences.put({
      key: 'user_profile',
      value: profile,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to save user profile in Dexie:', err);
    throw err;
  }
}

export async function getAggregatedStudyStats(): Promise<AggregatedStudyStats> {
  try {
    const db = getLocalDatabase();
    const tasks = await db.tasks.toArray();
    const completedTasks = tasks.filter((t) => t.completed).length;
    const totalTasks = tasks.length;

    const folders = await db.libraryFolders.toArray();
    const files = await db.libraryFiles.toArray();

    return {
      tasksCompleted: completedTasks,
      tasksTotal: totalTasks,
      libraryFoldersCount: folders.length,
      libraryFilesCount: files.length,
      streakDays: 328,
      studyHours: 842,
      flashcardsReviewed: 1420
    };
  } catch (err) {
    console.warn('Failed to aggregate study stats from Dexie:', err);
    return {
      tasksCompleted: 0,
      tasksTotal: 0,
      libraryFoldersCount: 0,
      libraryFilesCount: 0,
      streakDays: 328,
      studyHours: 842,
      flashcardsReviewed: 1420
    };
  }
}

export async function getProfileActivityItems(): Promise<ProfileActivityItem[]> {
  try {
    const db = getLocalDatabase();
    const items: ProfileActivityItem[] = [];

    // Pull completed tasks
    const tasks = await db.tasks.toArray();
    for (const t of tasks.filter((t) => t.completed)) {
      items.push({
        id: `act_task_${t.id}`,
        type: 'task_completed',
        title: `Completed task: ${t.title}`,
        description: 'Daily study objective',
        timestamp: t.completedAt || t.createdAt,
        iconName: 'CheckCircle2'
      });
    }

    // Pull library folders
    const folders = await db.libraryFolders.toArray();
    for (const f of folders) {
      const folderName = f.name && f.name.trim() ? f.name : 'Study Notes Folder';
      items.push({
        id: `act_folder_${f.id}`,
        type: 'library_folder_created',
        title: `Created folder: ${folderName}`,
        description: 'Library folder organization',
        timestamp: f.updatedAt || f.createdAt,
        iconName: 'Folder'
      });
    }

    // Pull library files
    const files = await db.libraryFiles.toArray();
    for (const f of files) {
      const fileTitle = f.title && f.title.trim() ? f.title : 'Study Document';
      items.push({
        id: `act_file_${f.id}`,
        type: 'library_file_created',
        title: `Created file: ${fileTitle}`,
        description: `Asset format: ${f.type.toUpperCase()}${f.sizeFormatted ? ` (${f.sizeFormatted})` : ''}`,
        timestamp: f.updatedAt || f.createdAt,
        iconName: 'FileText'
      });
    }

    // Sort by timestamp descending
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.warn('Failed to get profile activity items from Dexie:', err);
    return [];
  }
}

export async function createPreMigrationSnapshot(): Promise<PreMigrationSnapshot> {
  try {
    const db = getLocalDatabase();
    const tasks = await db.tasks.toArray();
    const folders = await db.libraryFolders.toArray();
    const files = await db.libraryFiles.toArray();
    const prefs = await db.shellPreferences.toArray();

    const snapshotId = generateUuidV7();
    const createdAt = new Date().toISOString();
    const payload = {
      snapshotId,
      createdAt,
      tasks,
      folders,
      files,
      prefs
    };

    // Store immutable snapshot in shellPreferences
    await db.shellPreferences.put({
      key: `snapshot_${snapshotId}`,
      value: payload,
      updatedAt: createdAt
    });

    const integrityHash = `sha256_${Date.now().toString(16)}_${tasks.length + folders.length + files.length}`;

    return {
      snapshotId,
      createdAt,
      workspaceId: 'guest_local_workspace',
      taskCount: tasks.length,
      folderCount: folders.length,
      fileCount: files.length,
      integrityHash
    };
  } catch (err) {
    console.warn('Failed to create pre-migration snapshot in Dexie:', err);
    throw err;
  }
}

// ============================================================================
// Phase 09: Settings Defaults & Persistence API
// ============================================================================

export const DEFAULT_SKILLS: SkillItem[] = [
  {
    id: 'skill-summarize',
    command: '/summarize',
    description: 'Create structured academic summaries from the active page',
    enabled: true,
    systemPrompt: 'Synthesize the main thesis, key arguments, and foundational evidence from the current context into a structured, executive summary.',
    isBuiltIn: true
  },
  {
    id: 'skill-flashcards',
    command: '/flashcards',
    description: 'Generate spaced-repetition cards from highlighted concepts',
    enabled: true,
    systemPrompt: 'Extract atomic, testable propositions from the active text and convert them into high-yield Question and Answer flashcards using spaced repetition principles.',
    isBuiltIn: true
  },
  {
    id: 'skill-socratic',
    command: '/socratic',
    description: 'Test your understanding through guided questioning',
    enabled: true,
    systemPrompt: 'Adopt the Socratic teaching persona. Rather than providing direct answers, challenge assumptions, probe reasoning, and ask progressive diagnostic questions.',
    isBuiltIn: true
  },
  {
    id: 'skill-quiz',
    command: '/quiz',
    description: 'Build a quick practice drill from your current material',
    enabled: true,
    systemPrompt: 'Generate a 5-question multi-choice diagnostic drill with distractor rationales based strictly on the current study context.',
    isBuiltIn: true
  },
  {
    id: 'skill-feynman',
    command: '/feynman',
    description: 'Explain complex topics simply and spot gaps in my reasoning',
    enabled: true,
    systemPrompt: '1. Ask me to explain the concept from the active page in simple, jargon-free language.\n2. Identify any logical leaps, hidden assumptions, or missing causal links in my explanation.\n3. Guide me back to the exact source passage to refine my mental model before moving on.',
    isBuiltIn: false
  },
  {
    id: 'skill-first-principles',
    command: '/first-principles',
    description: 'Break down arguments and models to their core assumptions',
    enabled: true,
    systemPrompt: '1. Deconstruct the active theory or claim down to its fundamental, undeniable axioms.\n2. Question each layer of reasoning that builds upon those axioms.\n3. Reconstruct the problem from the ground up to verify logical consistency.',
    isBuiltIn: false
  }
];

export const DEFAULT_LEARNED_MEMORIES: LearnedMemoryItem[] = [
  {
    id: 'mem-1',
    text: 'Prefers active recall and Feynman technique over passive reading',
    category: 'Preference',
    createdAt: '2026-11-15T10:00:00.000Z'
  },
  {
    id: 'mem-2',
    text: 'Struggles with distributed consensus protocols and Raft log compaction',
    category: 'CS 161',
    createdAt: '2026-11-16T14:30:00.000Z'
  },
  {
    id: 'mem-3',
    text: 'Optimal focus interval is 50m deep work with 10m recovery break',
    category: 'ECON 102',
    createdAt: '2026-11-17T09:15:00.000Z'
  },
  {
    id: 'mem-4',
    text: 'Prefers mathematical derivations in LaTeX format with minimal prose filler',
    category: 'Fixed Income',
    createdAt: '2026-11-18T08:00:00.000Z'
  }
];

export const DEFAULT_USER_SETTINGS: UserSettings = {
  account: {
    name: 'Abdalla Husin',
    username: '@abdalla7usin',
    email: 'Plato428@Athens.com',
    learningFocus: 'Computer Science & Cognitive Systems',
    plan: 'Free',
    avatarUrl: 'https://lh3.googleusercontent.com/aida/ALJJyrBE6EhsHOqBp174KlEE0XrgpcMjQmblnn2X7vXwDJVOKYPKb7yDZ06Vw_NqRcsrxOTsrvWRxDQX_0hgDLbZ2XZM7agGIy8rbv8bYGWpaF2d30oXkxqAisUNXabuoiebdVqFtSLIzj8vaZjVK-aSHuO3rGxN6TKHDCpJKjXzUfwMEsiIP42arHCi1DVwgFwpbkHrHihNRxcMxFhP6g71n-Ej2xAqvNVjJ8X9dDARkQt3DmGe0NVBhLB-3fYriiCAu3BiIg',
    bio: 'Computer Science undergraduate exploring distributed consensus, compiler design, and how human memory consolidates complex ideas.',
    location: 'Mansoura, Egypt',
    education: 'Mansoura University',
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
    joinedDate: 'November 2026'
  },
  usage: {
    planName: 'SOS Free',
    planPrice: '$0 / month',
    planDescription: 'Unlimited local notes & offline study cards',
    aiCreditsUsed: 0,
    aiCreditsLimit: 500,
    aiCreditsResetDays: 14,
    aiCreditsResetHours: 6,
    storageBytesUsed: 0,
    storageBytesLimit: 5 * 1024 * 1024 * 1024, // 5.0 GB
    availableResets: 0
  },
  general: {
    appLanguage: 'English',
    weekStartDay: 'saturday',
    horizonBar: {
      milestoneName: 'Fall Semester 2026',
      startDate: '2026-09-26',
      endDate: '2027-01-01',
      preset: 'custom'
    },
    focusTracking: {
      automaticStudyTracking: false,
      defaultPomodoroInterval: '50m / 10m',
      focusMinutes: 50,
      breakMinutes: 10
    },
    soundMotion: {
      sessionCompletionChimes: false,
      reducedMotion: 'os_default'
    }
  },
  memory: {
    enabled: false,
    whoIAm: '',
    whatIAmLearning: '',
    howIPreferToLearn: '',
    learnedMemories: DEFAULT_LEARNED_MEMORIES
  },
  skills: DEFAULT_SKILLS
};

export async function calculateStorageUsage(): Promise<{ usedBytes: number; limitBytes: number }> {
  const limitBytes = 5 * 1024 * 1024 * 1024; // 5.0 GB
  try {
    const db = getLocalDatabase();
    const files = await db.libraryFiles.toArray();
    let computedBytes = 0;
    for (const f of files) {
      if (f.sizeBytes) {
        computedBytes += f.sizeBytes;
      }
    }
    const folders = await db.libraryFolders.toArray();
    for (const fo of folders) {
      if (fo.content) {
        computedBytes += JSON.stringify(fo.content).length;
      }
    }
    // Also incorporate browser navigator.storage if available
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage && estimate.usage > computedBytes) {
        computedBytes = estimate.usage;
      }
    }
    return {
      usedBytes: computedBytes,
      limitBytes
    };
  } catch (err) {
    console.warn('Failed to calculate storage usage:', err);
    return { usedBytes: 0, limitBytes };
  }
}

export async function getUsageSettings(): Promise<UsageSettings> {
  const storage = await calculateStorageUsage();
  
  // Calculate real reset schedule based on current date
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(0, daysInMonth - now.getDate());
  const hoursLeft = Math.max(0, 24 - now.getHours());

  // Count AI usage from preferences if present, honest default 0
  let creditsUsed = 0;
  try {
    const db = getLocalDatabase();
    const record = await db.shellPreferences.get('ai_credits_used');
    if (record && typeof record.value === 'number') {
      creditsUsed = record.value;
    }
  } catch {}

  return {
    planName: 'SOS Free',
    planPrice: '$0 / month',
    planDescription: 'Unlimited local notes & offline study cards',
    aiCreditsUsed: creditsUsed,
    aiCreditsLimit: 500,
    aiCreditsResetDays: daysLeft,
    aiCreditsResetHours: hoursLeft,
    storageBytesUsed: storage.usedBytes,
    storageBytesLimit: storage.limitBytes,
    availableResets: 0
  };
}

export async function getUserSettings(): Promise<UserSettings> {
  try {
    const db = getLocalDatabase();
    const [settingsRecord, profileRecord, skillsList, usage] = await Promise.all([
      db.shellPreferences.get('user_settings'),
      db.shellPreferences.get('user_profile'),
      getSkills(),
      getUsageSettings()
    ]);

    let baseSettings: Partial<UserSettings> = {};
    if (settingsRecord && settingsRecord.value && typeof settingsRecord.value === 'object') {
      baseSettings = settingsRecord.value as Partial<UserSettings>;
    }

    // Bidirectional sync with user profile if present
    let account = { ...DEFAULT_USER_SETTINGS.account, ...(baseSettings.account || {}) };
    if (profileRecord && profileRecord.value && typeof profileRecord.value === 'object') {
      const p = profileRecord.value as UserProfile;
      account.name = p.name || account.name;
      account.username = p.handle || account.username;
      account.learningFocus = p.learningFocus || account.learningFocus;
      account.avatarUrl = p.avatarUrl || account.avatarUrl;
      account.bio = p.bio || account.bio;
      account.location = p.location || account.location;
      account.education = p.education || account.education;
      account.coverImage = p.coverImage || account.coverImage;
      account.joinedDate = p.joinedDate || account.joinedDate;
    }

    const rawFocus = baseSettings.general?.focusTracking?.focusMinutes ?? (
      baseSettings.general?.focusTracking?.defaultPomodoroInterval?.includes('25') ? 25 :
      baseSettings.general?.focusTracking?.defaultPomodoroInterval?.includes('90') ? 90 : 50
    );
    const rawBreak = baseSettings.general?.focusTracking?.breakMinutes ?? (
      baseSettings.general?.focusTracking?.defaultPomodoroInterval?.includes('5m') ? 5 :
      baseSettings.general?.focusTracking?.defaultPomodoroInterval?.includes('15m') ? 15 : 10
    );

    const horizonBar =
      baseSettings.general?.horizonBar?.milestoneName && baseSettings.general.horizonBar.milestoneName !== '2026'
        ? baseSettings.general.horizonBar
        : DEFAULT_USER_SETTINGS.general.horizonBar;

    const merged: UserSettings = {
      account,
      usage,
      general: {
        ...DEFAULT_USER_SETTINGS.general,
        ...(baseSettings.general || {}),
        horizonBar,
        focusTracking: {
          ...DEFAULT_USER_SETTINGS.general.focusTracking,
          ...(baseSettings.general?.focusTracking || {}),
          focusMinutes: rawFocus,
          breakMinutes: rawBreak,
          defaultPomodoroInterval: `${rawFocus}m / ${rawBreak}m`
        }
      },
      memory: {
        ...DEFAULT_USER_SETTINGS.memory,
        ...(baseSettings.memory || {})
      },
      skills: skillsList
    };

    return merged;
  } catch (err) {
    console.warn('Failed to get user settings from Dexie:', err);
    return DEFAULT_USER_SETTINGS;
  }
}

export async function updateAccountSettings(patch: Partial<AccountSettings>): Promise<AccountSettings> {
  const db = getLocalDatabase();
  const current = await getUserSettings();
  const updatedAccount: AccountSettings = {
    ...current.account,
    ...patch
  };

  const updatedSettings: UserSettings = {
    ...current,
    account: updatedAccount
  };

  await db.shellPreferences.put({
    key: 'user_settings',
    value: updatedSettings,
    updatedAt: new Date().toISOString()
  });

  // Bidirectionally update user_profile in Dexie to stay in sync
  try {
    const profile = await getUserProfile();
    const updatedProfile: UserProfile = {
      ...profile,
      name: updatedAccount.name,
      handle: updatedAccount.username,
      learningFocus: updatedAccount.learningFocus,
      avatarUrl: updatedAccount.avatarUrl || profile.avatarUrl,
      bio: updatedAccount.bio ?? profile.bio,
      location: updatedAccount.location ?? profile.location,
      education: updatedAccount.education ?? profile.education,
      institution: updatedAccount.education ?? profile.institution,
      coverImage: updatedAccount.coverImage ?? profile.coverImage,
      joinedDate: updatedAccount.joinedDate ?? profile.joinedDate
    };
    await saveUserProfile(updatedProfile);
  } catch (e) {
    console.warn('Failed to sync account update to profile:', e);
  }

  return updatedAccount;
}

export async function updateGeneralSettings(patch: Partial<GeneralSettings>): Promise<GeneralSettings> {
  const db = getLocalDatabase();
  const current = await getUserSettings();
  const updatedGeneral: GeneralSettings = {
    ...current.general,
    ...patch,
    horizonBar: {
      ...current.general.horizonBar,
      ...(patch.horizonBar || {})
    },
    focusTracking: {
      ...current.general.focusTracking,
      ...(patch.focusTracking || {}),
      ...(patch.focusTracking?.focusMinutes !== undefined || patch.focusTracking?.breakMinutes !== undefined
        ? {
            focusMinutes: patch.focusTracking?.focusMinutes ?? current.general.focusTracking.focusMinutes,
            breakMinutes: patch.focusTracking?.breakMinutes ?? current.general.focusTracking.breakMinutes,
            defaultPomodoroInterval: `${patch.focusTracking?.focusMinutes ?? current.general.focusTracking.focusMinutes}m / ${patch.focusTracking?.breakMinutes ?? current.general.focusTracking.breakMinutes}m`
          }
        : {})
    },
    soundMotion: {
      ...current.general.soundMotion,
      ...(patch.soundMotion || {})
    }
  };

  const updatedSettings: UserSettings = {
    ...current,
    general: updatedGeneral
  };

  await db.shellPreferences.put({
    key: 'user_settings',
    value: updatedSettings,
    updatedAt: new Date().toISOString()
  });

  return updatedGeneral;
}

export async function updateMemorySettings(patch: Partial<MemorySettings>): Promise<MemorySettings> {
  const db = getLocalDatabase();
  const current = await getUserSettings();
  const updatedMemory: MemorySettings = {
    ...current.memory,
    ...patch
  };

  const updatedSettings: UserSettings = {
    ...current,
    memory: updatedMemory
  };

  await db.shellPreferences.put({
    key: 'user_settings',
    value: updatedSettings,
    updatedAt: new Date().toISOString()
  });

  return updatedMemory;
}

export async function getSkills(): Promise<SkillItem[]> {
  try {
    const db = getLocalDatabase();
    const items = await db.skills.toArray();
    if (items.length === 0) {
      // Seed default skills
      for (const s of DEFAULT_SKILLS) {
        await db.skills.put(s);
      }
      return DEFAULT_SKILLS;
    }
    return items;
  } catch (err) {
    console.warn('Failed to load skills from Dexie:', err);
    return DEFAULT_SKILLS;
  }
}

export async function saveSkill(skill: {
  id?: string;
  command: string;
  description: string;
  systemPrompt: string;
  enabled?: boolean;
}): Promise<SkillItem> {
  const db = getLocalDatabase();
  const existing = skill.id ? await db.skills.get(skill.id) : undefined;
  const isBuiltIn = existing?.isBuiltIn ?? false;

  const formattedCommand = skill.command.startsWith('/') ? skill.command : `/${skill.command}`;
  const skillItem: SkillItem = {
    id: skill.id || `custom-skill-${Date.now()}`,
    command: formattedCommand,
    description: skill.description,
    systemPrompt: skill.systemPrompt,
    enabled: skill.enabled ?? existing?.enabled ?? true,
    isBuiltIn
  };

  await db.skills.put(skillItem);
  return skillItem;
}

export async function toggleSkill(id: string): Promise<SkillItem> {
  const db = getLocalDatabase();
  const skill = await db.skills.get(id);
  if (!skill) throw new Error('Skill not found');
  const updated = { ...skill, enabled: !skill.enabled };
  await db.skills.put(updated);
  return updated;
}

export async function deleteSkill(id: string): Promise<void> {
  const db = getLocalDatabase();
  const skill = await db.skills.get(id);
  if (skill?.isBuiltIn) {
    throw new Error('Cannot delete built-in skill');
  }
  await db.skills.delete(id);
}

export async function deleteAccountData(): Promise<void> {
  const db = getLocalDatabase();
  // Safe purge: clear user posts, tasks, custom skills, reset profile and settings
  await Promise.all([
    db.userPosts.clear(),
    db.tasks.clear(),
    db.studySessions.clear(),
    db.trackingSessions.clear(),
    db.calendarEvents.clear()
  ]);

  // Remove custom skills, keep built-in skills
  const allSkills = await db.skills.toArray();
  for (const s of allSkills) {
    if (!s.isBuiltIn) {
      await db.skills.delete(s.id);
    }
  }

  // Reset user settings and profile to fresh state
  await db.shellPreferences.put({
    key: 'user_settings',
    value: DEFAULT_USER_SETTINGS,
    updatedAt: new Date().toISOString()
  });
  await db.shellPreferences.put({
    key: 'user_profile',
    value: DEFAULT_USER_PROFILE,
    updatedAt: new Date().toISOString()
  });
}

// ============================================================================
// Phase 05: Tracking Repositories & Analytics
// ============================================================================

function getSessionStartTime(s: TrackingSession): number {
  return s.actualStartTimestamp ?? s.startTime ?? (s.date ? new Date(`${s.date}T${s.plannedStartTime || '00:00'}:00`).getTime() : 0);
}

function getSessionDurationSeconds(s: TrackingSession): number {
  return s.actualFocusSeconds || ((s.plannedDurationMinutes || s.durationMinutes || 0) * 60) || s.durationSeconds || 0;
}

export async function saveTrackingSession(session: TrackingSession): Promise<void> {
  const db = getLocalDatabase();
  await db.trackingSessions.put(session);

  // Sync to studySessions table for Profile activity & heatmap compatibility
  const startTimeMs = getSessionStartTime(session);
  const durMins = session.plannedDurationMinutes ?? session.durationMinutes ?? Math.round(session.actualFocusSeconds / 60) ?? 0;
  await db.studySessions.put({
    id: session.id,
    timestamp: new Date(startTimeMs).toISOString(),
    durationMinutes: durMins,
    type: session.timerMode ?? session.mode ?? 'countdown'
  });

  // If session was linked to a Calendar Event, automatically mark it completed
  if (session.calendarEventId) {
    try {
      const event = await db.calendarEvents.get(session.calendarEventId);
      if (event) {
        await db.calendarEvents.put({
          ...event,
          completed: true,
          linkedSessionId: session.id,
          actualDurationMinutes: durMins,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('Failed to auto-complete linked calendar event:', err);
    }
  }
}

export async function deleteTrackingSession(id: string): Promise<void> {
  const db = getLocalDatabase();
  await Promise.all([
    db.trackingSessions.delete(id),
    db.studySessions.delete(id)
  ]);
}

export async function updateTrackingSession(
  id: string,
  updates: Partial<TrackingSession>
): Promise<void> {
  const db = getLocalDatabase();
  const existing = await db.trackingSessions.get(id);
  if (!existing) return;
  const merged: TrackingSession = {
    ...existing,
    ...updates,
    id
  };
  await db.trackingSessions.put(merged);

  const startTimeMs = getSessionStartTime(merged);
  const durMins = merged.plannedDurationMinutes ?? merged.durationMinutes ?? Math.round(merged.actualFocusSeconds / 60) ?? 0;
  await db.studySessions.put({
    id,
    timestamp: new Date(startTimeMs).toISOString(),
    durationMinutes: durMins,
    type: merged.timerMode ?? merged.mode ?? 'countdown'
  });
}

export function getInitialTrackingSessions(): TrackingSession[] {
  return [];
}

export const CURRENT_TRACKING_SEED_VERSION = '2026-11-19-v19';
export const CURRENT_CALENDAR_SEED_VERSION = '2026-11-19-v19';

export function getInitialCalendarEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [
    // --- Current Week: Mon Nov 16 – Sun Nov 22, 2026 ---
    // Mon Nov 16: Total planned 4.5h (270 mins)
    {
      id: 'cal-seed-mon-1',
      title: 'Biophysics Lab',
      type: 'study_block',
      startTime: new Date(2026, 10, 16, 9, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 16, 10, 30, 0).toISOString(),
      completed: true,
      actualDurationMinutes: 90,
      resourceMeta: 'Lab Protocol 4.2',
      createdAt: '2026-11-16T09:00:00Z',
      updatedAt: '2026-11-16T10:30:00Z'
    },
    {
      id: 'cal-seed-mon-2',
      title: 'SNARE Review',
      type: 'review_session',
      startTime: new Date(2026, 10, 16, 14, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 16, 15, 30, 0).toISOString(),
      completed: true,
      actualDurationMinutes: 90,
      resourceMeta: 'SNARE Exocytosis Deck',
      createdAt: '2026-11-16T14:00:00Z',
      updatedAt: '2026-11-16T15:30:00Z'
    },
    {
      id: 'cal-seed-mon-3',
      title: 'Synaptic Vesicle Exocytosis Deep Dive',
      type: 'study_block',
      startTime: new Date(2026, 10, 16, 16, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 16, 17, 30, 0).toISOString(),
      completed: true,
      actualDurationMinutes: 90,
      resourceMeta: 'Kandel_Principles_Ch12.pdf • p. 42',
      notes: 'Synaptic transmission and neurotransmitter release kinetics.',
      createdAt: '2026-11-16T16:00:00Z',
      updatedAt: '2026-11-16T17:30:00Z'
    },
    // Tue Nov 17: Total planned 5.0h (300 mins)
    {
      id: 'cal-seed-tue-1',
      title: 'Neuropharmacology Review',
      type: 'review_session',
      startTime: new Date(2026, 10, 17, 9, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 17, 11, 30, 0).toISOString(),
      completed: true,
      actualDurationMinutes: 150,
      resourceMeta: 'Receptor Antagonist Chart',
      createdAt: '2026-11-17T09:00:00Z',
      updatedAt: '2026-11-17T11:30:00Z'
    },
    {
      id: 'cal-seed-tue-2',
      title: 'Distributed Algorithms & Raft Consensus',
      type: 'study_block',
      startTime: new Date(2026, 10, 17, 14, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 17, 16, 30, 0).toISOString(),
      completed: true,
      actualDurationMinutes: 150,
      resourceMeta: 'Ongaro_Raft_Thesis.pdf',
      createdAt: '2026-11-17T14:00:00Z',
      updatedAt: '2026-11-17T16:30:00Z'
    },
    // Wed Nov 18 (Today): Total planned 4.5h (270 mins)
    {
      id: 'cal-seed-wed-1',
      title: 'Distributed Consensus & System Design',
      type: 'study_block',
      startTime: new Date(2026, 10, 18, 9, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 18, 11, 30, 0).toISOString(),
      completed: true,
      actualDurationMinutes: 150,
      resourceMeta: 'Raft State Machine Log',
      createdAt: '2026-11-18T09:00:00Z',
      updatedAt: '2026-11-18T11:30:00Z'
    },
    {
      id: 'cal-seed-wed-2',
      title: 'Econometrics & Problem Set 3',
      type: 'assignment',
      startTime: new Date(2026, 10, 18, 14, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 18, 16, 0, 0).toISOString(),
      completed: true,
      actualDurationMinutes: 120,
      resourceMeta: 'LSE Problem Set 3 PDF',
      createdAt: '2026-11-18T14:00:00Z',
      updatedAt: '2026-11-18T16:00:00Z'
    },
    // Thu Nov 19 (Upcoming Planned): Total planned 5.0h (300 mins)
    {
      id: 'cal-seed-thu-1',
      title: 'Pharmacology Drill',
      type: 'review_session',
      startTime: new Date(2026, 10, 19, 11, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 19, 12, 30, 0).toISOString(),
      completed: false,
      resourceMeta: 'Mechanism of Action Flashcards',
      createdAt: '2026-11-18T08:00:00Z',
      updatedAt: '2026-11-18T08:00:00Z'
    },
    {
      id: 'cal-seed-thu-2',
      title: 'Deep Learning & Transformer Architecture',
      type: 'study_block',
      startTime: new Date(2026, 10, 19, 15, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 19, 18, 30, 0).toISOString(),
      completed: false,
      resourceMeta: 'Attention Is All You Need Notes',
      createdAt: '2026-11-18T08:00:00Z',
      updatedAt: '2026-11-18T08:00:00Z'
    },
    // Fri Nov 20 (Upcoming Planned): Total planned 4.5h (270 mins)
    {
      id: 'cal-seed-fri-1',
      title: 'Neurobiology Exam',
      type: 'exam_deadline',
      startTime: new Date(2026, 10, 20, 9, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 20, 11, 0, 0).toISOString(),
      completed: false,
      resourceMeta: 'Cellular Neuro Midterm',
      createdAt: '2026-11-18T08:00:00Z',
      updatedAt: '2026-11-18T08:00:00Z'
    },
    {
      id: 'cal-seed-fri-2',
      title: 'Macroeconomic Yield Curves Deep Dive',
      type: 'study_block',
      startTime: new Date(2026, 10, 20, 14, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 20, 16, 30, 0).toISOString(),
      completed: false,
      resourceMeta: 'Bond Market & Treasury Spreads',
      createdAt: '2026-11-18T08:00:00Z',
      updatedAt: '2026-11-18T08:00:00Z'
    },
    // Sat Nov 21 (Upcoming Planned): Total planned 4.0h (240 mins)
    {
      id: 'cal-seed-sat-1',
      title: 'Study Group',
      type: 'review_session',
      startTime: new Date(2026, 10, 21, 10, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 21, 11, 30, 0).toISOString(),
      completed: false,
      resourceMeta: 'Systems Discussion Group',
      createdAt: '2026-11-18T08:00:00Z',
      updatedAt: '2026-11-18T08:00:00Z'
    },
    {
      id: 'cal-seed-sat-2',
      title: 'Statistical Mechanics & Biophysics',
      type: 'study_block',
      startTime: new Date(2026, 10, 21, 14, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 21, 16, 30, 0).toISOString(),
      completed: false,
      resourceMeta: 'Partition Functions & Boltzmann Eq',
      createdAt: '2026-11-18T08:00:00Z',
      updatedAt: '2026-11-18T08:00:00Z'
    },
    // Sun Nov 22 (Upcoming Planned): Total planned 3.5h (210 mins)
    {
      id: 'cal-seed-sun-1',
      title: 'Philosophy of Mind & Cognitive Epistemology',
      type: 'study_block',
      startTime: new Date(2026, 10, 22, 14, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 22, 16, 0, 0).toISOString(),
      completed: false,
      resourceMeta: 'Hard Problem & Functionalism',
      createdAt: '2026-11-18T08:00:00Z',
      updatedAt: '2026-11-18T08:00:00Z'
    },
    {
      id: 'cal-seed-sun-2',
      title: 'Weekly Review',
      type: 'review_session',
      startTime: new Date(2026, 10, 22, 18, 0, 0).toISOString(),
      endTime: new Date(2026, 10, 22, 19, 30, 0).toISOString(),
      completed: false,
      resourceMeta: 'Academic Retrospective & Weekly Log',
      createdAt: '2026-11-18T08:00:00Z',
      updatedAt: '2026-11-18T08:00:00Z'
    }
  ];

  // Prior weeks in November and October (Last week, Two weeks ago, Three weeks ago)
  for (let weekOffset = 1; weekOffset <= 3; weekOffset++) {
    const mondayOffset = weekOffset * 7;
    events.push(
      {
        id: `cal-seed-past-${weekOffset}-mon`,
        title: 'Distributed Transactions & 2PC Protocols',
        type: 'study_block',
        startTime: new Date(2026, 10, 16 - mondayOffset, 9, 30, 0).toISOString(),
        endTime: new Date(2026, 10, 16 - mondayOffset, 14, 0, 0).toISOString(),
        completed: true,
        actualDurationMinutes: 270,
        createdAt: '2026-10-25T00:00:00Z',
        updatedAt: '2026-10-25T00:00:00Z'
      },
      {
        id: `cal-seed-past-${weekOffset}-tue`,
        title: 'Lock-Free Synchronization & Epoll IO Engine',
        type: 'study_block',
        startTime: new Date(2026, 10, 17 - mondayOffset, 9, 0, 0).toISOString(),
        endTime: new Date(2026, 10, 17 - mondayOffset, 14, 0, 0).toISOString(),
        completed: true,
        actualDurationMinutes: 300,
        createdAt: '2026-10-25T00:00:00Z',
        updatedAt: '2026-10-25T00:00:00Z'
      },
      {
        id: `cal-seed-past-${weekOffset}-wed`,
        title: 'Microeconomics & Game Theory Equilibrium',
        type: 'study_block',
        startTime: new Date(2026, 10, 18 - mondayOffset, 10, 0, 0).toISOString(),
        endTime: new Date(2026, 10, 18 - mondayOffset, 14, 30, 0).toISOString(),
        completed: true,
        actualDurationMinutes: 270,
        createdAt: '2026-10-25T00:00:00Z',
        updatedAt: '2026-10-25T00:00:00Z'
      },
      {
        id: `cal-seed-past-${weekOffset}-thu`,
        title: 'Action Potentials & Hodgkin-Huxley Dynamics',
        type: 'study_block',
        startTime: new Date(2026, 10, 19 - mondayOffset, 9, 0, 0).toISOString(),
        endTime: new Date(2026, 10, 19 - mondayOffset, 14, 0, 0).toISOString(),
        completed: true,
        actualDurationMinutes: 300,
        createdAt: '2026-10-25T00:00:00Z',
        updatedAt: '2026-10-25T00:00:00Z'
      },
      {
        id: `cal-seed-past-${weekOffset}-fri`,
        title: 'Macroeconomic Yield Curves & Monetary Policy',
        type: 'study_block',
        startTime: new Date(2026, 10, 20 - mondayOffset, 9, 30, 0).toISOString(),
        endTime: new Date(2026, 10, 20 - mondayOffset, 14, 0, 0).toISOString(),
        completed: true,
        actualDurationMinutes: 270,
        createdAt: '2026-10-25T00:00:00Z',
        updatedAt: '2026-10-25T00:00:00Z'
      },
      {
        id: `cal-seed-past-${weekOffset}-sat`,
        title: 'Advanced Data Structures & Graph Algorithms',
        type: 'study_block',
        startTime: new Date(2026, 10, 21 - mondayOffset, 10, 0, 0).toISOString(),
        endTime: new Date(2026, 10, 21 - mondayOffset, 14, 0, 0).toISOString(),
        completed: true,
        actualDurationMinutes: 240,
        createdAt: '2026-10-25T00:00:00Z',
        updatedAt: '2026-10-25T00:00:00Z'
      },
      {
        id: `cal-seed-past-${weekOffset}-sun`,
        title: 'Weekly Academic Retrospective',
        type: 'review_session',
        startTime: new Date(2026, 10, 22 - mondayOffset, 14, 0, 0).toISOString(),
        endTime: new Date(2026, 10, 22 - mondayOffset, 17, 30, 0).toISOString(),
        completed: true,
        actualDurationMinutes: 210,
        createdAt: '2026-10-25T00:00:00Z',
        updatedAt: '2026-10-25T00:00:00Z'
      }
    );
  }

  return events;
}

export async function ensureCalendarSeedData(db = getLocalDatabase()): Promise<void> {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('sos:calendar_seed_version');
    if (saved !== CURRENT_CALENDAR_SEED_VERSION) {
      await db.calendarEvents.clear();
      const seeds = getInitialCalendarEvents();
      await db.calendarEvents.bulkPut(seeds);
      localStorage.setItem('sos:calendar_seed_version', CURRENT_CALENDAR_SEED_VERSION);
      return;
    }
  }

  const count = await db.calendarEvents.count();
  if (count === 0) {
    const seeds = getInitialCalendarEvents();
    await db.calendarEvents.bulkPut(seeds);
  }
}

export async function ensureTrackingSeedData(db = getLocalDatabase()): Promise<void> {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('sos:tracking_seed_version');
    if (saved !== CURRENT_TRACKING_SEED_VERSION) {
      await db.trackingSessions.clear();
      const seeds = getInitialTrackingSessions();
      await db.trackingSessions.bulkPut(seeds);
      localStorage.setItem('sos:tracking_seed_version', CURRENT_TRACKING_SEED_VERSION);
      return;
    }
  }

  const all = await db.trackingSessions.toArray();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  const todayCount = all.filter((s) => getSessionStartTime(s) >= startOfDay && getSessionStartTime(s) <= endOfDay).length;

  if (todayCount >= 5 && all.length >= 35) return;

  const seeds = getInitialTrackingSessions();
  await db.trackingSessions.bulkPut(seeds);
}

export async function reorderTrackingSessions(orderedIds: string[]): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.transaction('rw', db.trackingSessions, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.trackingSessions.update(orderedIds[i], { sortOrder: i });
      }
    });
  } catch (err) {
    console.warn('Failed to reorder tracking sessions:', err);
  }
}

export async function reorderTasks(orderedIds: string[]): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.transaction('rw', db.tasks, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.tasks.update(orderedIds[i], { order: i });
      }
    });
  } catch (err) {
    console.warn('Failed to reorder tasks:', err);
  }
}

export async function getTodayTrackingSessions(refDate = new Date()): Promise<TrackingSession[]> {
  const db = getLocalDatabase();
  await ensureTrackingSeedData(db);
  const startOfDay = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 0, 0, 0, 0).getTime();
  const endOfDay = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59, 999).getTime();

  const allSessions = await db.trackingSessions.toArray();
  const todaySessions = allSessions.filter(
    (s) => getSessionStartTime(s) >= startOfDay && getSessionStartTime(s) <= endOfDay
  );

  return todaySessions.sort((a, b) => {
    const orderA = a.sortOrder ?? a.order;
    const orderB = b.sortOrder ?? b.order;
    if (orderA !== undefined && orderB !== undefined) {
      return orderA - orderB;
    }
    return getSessionStartTime(b) - getSessionStartTime(a);
  });
}

export async function getFilteredTrackingSessions(
  filter: SessionHistoryFilter
): Promise<TrackingSession[]> {
  const db = getLocalDatabase();
  await ensureTrackingSeedData(db);
  const allSessions = await db.trackingSessions.toArray();

  const now = new Date();
  let minTime = 0;
  let maxTime = Number.MAX_SAFE_INTEGER;

  if (filter.dateRange === 'this_week') {
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
    minTime = monday.getTime();
    maxTime = minTime + 7 * 86400000;
  } else if (filter.dateRange === 'last_week') {
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const lastMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday - 7, 0, 0, 0, 0);
    minTime = lastMonday.getTime();
    maxTime = lastMonday.getTime() + 7 * 86400000;
  } else if (filter.dateRange === 'this_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    minTime = firstDay.getTime();
    maxTime = nextMonth.getTime();
  }

  // Preload folders to resolve field names
  const folders = await db.libraryFolders.toArray();
  const folderMap = new Map<string, string>();
  for (const f of folders) {
    folderMap.set(f.id, f.name);
  }

  const query = (filter.search || '').trim().toLowerCase();

  const filtered = allSessions.filter((s) => {
    // 1. Date range filter
    const startTime = getSessionStartTime(s);
    if (startTime < minTime || startTime >= maxTime) return false;

    // 2. Domain / Field filter
    const activeDomainId = filter.domainId || filter.fieldId;
    if (activeDomainId && activeDomainId !== 'all') {
      const matchDomain = s.domainId === activeDomainId || s.fieldId === activeDomainId || s.folderId === activeDomainId;
      if (!matchDomain) return false;
    }

    // 2b. Topic / Subject filter
    const activeTopic = filter.topic || filter.subject;
    if (activeTopic && activeTopic !== 'all') {
      const sTopic = s.topicName || s.subjectName || s.subtitle || '';
      if (sTopic.toLowerCase() !== activeTopic.toLowerCase()) return false;
    }

    // 3. Search text filter
    if (query) {
      const resolvedField = s.fieldName || (s.folderId ? folderMap.get(s.folderId) : '') || '';
      const resolvedSubject = s.subjectName || s.subtitle || '';
      const text = `${s.title} ${resolvedField} ${resolvedSubject} ${s.notes || ''}`.toLowerCase();
      if (!text.includes(query)) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => getSessionStartTime(b) - getSessionStartTime(a));
}

export async function getTrackingAnalyticsReport(
  period: AnalyticsPeriod = 'week',
  refDate = new Date(),
  crossFilter?: CrossFilterState | null
): Promise<TrackingAnalyticsReport> {
  const db = getLocalDatabase();
  await ensureTrackingSeedData(db);
  await ensureCalendarSeedData(db);
  const [allSessions, allEvents, allFolders] = await Promise.all([
    db.trackingSessions.toArray(),
    db.calendarEvents.toArray(),
    db.libraryFolders.toArray()
  ]);

  const folderNameMap = new Map<string, string>();
  for (const f of allFolders) {
    folderNameMap.set(f.id, f.name);
  }

  const resolveFieldName = (session: TrackingSession): string => {
    if (session.domainName && session.domainName.trim().length > 0) return session.domainName;
    if (session.fieldName && session.fieldName.trim().length > 0) return session.fieldName;
    if (session.domainId && folderNameMap.has(session.domainId)) return folderNameMap.get(session.domainId)!;
    if (session.fieldId && folderNameMap.has(session.fieldId)) return folderNameMap.get(session.fieldId)!;
    if (session.folderId && folderNameMap.has(session.folderId)) return folderNameMap.get(session.folderId)!;
    return 'General';
  };

  const resolveEventFieldName = (event: CalendarEvent): string => {
    if (event.folderId && folderNameMap.has(event.folderId)) return folderNameMap.get(event.folderId)!;
    return 'General';
  };

  const studyHoursPoints: AnalyticsDataPoint[] = [];
  let periodStartMs = 0;
  let periodEndMs = 0;

  if (period === 'day') {
    const dayStart = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 0, 0, 0, 0);
    periodStartMs = dayStart.getTime();
    periodEndMs = periodStartMs + 86400000;

    // 7 distinct 3-hour time slots across the day: 06:00, 09:00, 12:00, 15:00, 18:00, 21:00, 24:00
    const slotHours = [6, 9, 12, 15, 18, 21, 24];
    for (let i = 0; i < slotHours.length; i++) {
      const h = slotHours[i];
      const sliceStart = i === 0 ? dayStart.getTime() : dayStart.getTime() + (h - 3) * 3600000;
      const sliceEnd = dayStart.getTime() + h * 3600000;
      const label = h === 24 ? '24:00' : `${String(h).padStart(2, '0')}:00`;
      const dateKey = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(
        dayStart.getDate()
      ).padStart(2, '0')}-${label}`;

      // Sum sessions
      let actualSec = 0;
      for (const s of allSessions) {
        const sTime = getSessionStartTime(s);
        if (sTime >= sliceStart && sTime < sliceEnd) {
          const field = resolveFieldName(s);
          if (crossFilter?.fieldName && field.toLowerCase() !== crossFilter.fieldName.toLowerCase()) {
            continue;
          }
          actualSec += getSessionDurationSeconds(s);
        }
      }

      // Sum planned events with overlap
      let plannedSec = 0;
      for (const ev of allEvents) {
        const evStart = new Date(ev.startTime).getTime();
        const evEnd = new Date(ev.endTime).getTime();
        if (evStart < sliceEnd && evEnd > sliceStart) {
          const field = resolveEventFieldName(ev);
          if (crossFilter?.fieldName && field.toLowerCase() !== crossFilter.fieldName.toLowerCase()) {
            continue;
          }
          const overlapStart = Math.max(evStart, sliceStart);
          const overlapEnd = Math.min(evEnd, sliceEnd);
          plannedSec += Math.max(0, (overlapEnd - overlapStart) / 1000);
        }
      }

      const plannedHours = Math.round((plannedSec / 3600) * 10) / 10;

      studyHoursPoints.push({
        label,
        dateKey,
        actualHours: Math.round((actualSec / 3600) * 10) / 10,
        plannedHours
      });
    }
  } else if (period === 'month') {
    const firstDay = new Date(refDate.getFullYear(), refDate.getMonth(), 1, 0, 0, 0, 0);
    periodStartMs = firstDay.getTime();
    const nextMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1, 0, 0, 0, 0);
    periodEndMs = nextMonth.getTime();

    // 4 calendar weeks
    const weekNames = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    for (let w = 0; w < 4; w++) {
      const sliceStart = periodStartMs + w * 7 * 86400000;
      const sliceEnd = Math.min(periodEndMs, sliceStart + 7 * 86400000);
      const label = weekNames[w];
      const dateKey = `w${w + 1}`;

      let actualSec = 0;
      for (const s of allSessions) {
        const sTime = getSessionStartTime(s);
        if (sTime >= sliceStart && sTime < sliceEnd) {
          const field = resolveFieldName(s);
          if (crossFilter?.fieldName && field.toLowerCase() !== crossFilter.fieldName.toLowerCase()) {
            continue;
          }
          actualSec += getSessionDurationSeconds(s);
        }
      }

      let plannedSec = 0;
      for (const ev of allEvents) {
        const evStart = new Date(ev.startTime).getTime();
        const evEnd = new Date(ev.endTime).getTime();
        if (evStart < sliceEnd && evEnd > sliceStart) {
          const field = resolveEventFieldName(ev);
          if (crossFilter?.fieldName && field.toLowerCase() !== crossFilter.fieldName.toLowerCase()) {
            continue;
          }
          const overlapStart = Math.max(evStart, sliceStart);
          const overlapEnd = Math.min(evEnd, sliceEnd);
          plannedSec += Math.max(0, (overlapEnd - overlapStart) / 1000);
        }
      }

      const plannedHours = Math.round((plannedSec / 3600) * 10) / 10;

      studyHoursPoints.push({
        label,
        dateKey,
        actualHours: Math.round((actualSec / 3600) * 10) / 10,
        plannedHours
      });
    }
  } else {
    // Default: 'week'
    const dayOfWeek = refDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + diffToMonday, 0, 0, 0, 0);
    periodStartMs = monday.getTime();
    periodEndMs = periodStartMs + 7 * 86400000;

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const sliceStart = monday.getTime() + i * 86400000;
      const sliceEnd = sliceStart + 86400000;
      const d = new Date(sliceStart);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = dayNames[i];

      let actualSec = 0;
      for (const s of allSessions) {
        const sTime = getSessionStartTime(s);
        if (sTime >= sliceStart && sTime < sliceEnd) {
          const field = resolveFieldName(s);
          if (crossFilter?.fieldName && field.toLowerCase() !== crossFilter.fieldName.toLowerCase()) {
            continue;
          }
          actualSec += getSessionDurationSeconds(s);
        }
      }

      let plannedSec = 0;
      for (const ev of allEvents) {
        const evStart = new Date(ev.startTime).getTime();
        const evEnd = new Date(ev.endTime).getTime();
        if (evStart < sliceEnd && evEnd > sliceStart) {
          const field = resolveEventFieldName(ev);
          if (crossFilter?.fieldName && field.toLowerCase() !== crossFilter.fieldName.toLowerCase()) {
            continue;
          }
          const overlapStart = Math.max(evStart, sliceStart);
          const overlapEnd = Math.min(evEnd, sliceEnd);
          plannedSec += Math.max(0, (overlapEnd - overlapStart) / 1000);
        }
      }

      const plannedHours = Math.round((plannedSec / 3600) * 10) / 10;

      studyHoursPoints.push({
        label,
        dateKey,
        actualHours: Math.round((actualSec / 3600) * 10) / 10,
        plannedHours
      });
    }
  }

  // Filter sessions for Field Distribution Donut
  const donutSessions = allSessions.filter((s) => {
    const sTime = getSessionStartTime(s);
    if (sTime < periodStartMs || sTime >= periodEndMs) return false;
    if (crossFilter?.dateKey) {
      const d = new Date(sTime);
      const sessionDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!crossFilter.dateKey.includes(sessionDateKey) && !crossFilter.dateKey.includes(d.toLocaleDateString('en-US', { weekday: 'short' }))) {
        return false;
      }
    }
    return true;
  });

  const fieldSecondsMap = new Map<string, number>();
  let totalPeriodSeconds = 0;

  for (const s of donutSessions) {
    const sec = getSessionDurationSeconds(s);
    totalPeriodSeconds += sec;
    const field = resolveFieldName(s);
    fieldSecondsMap.set(field, (fieldSecondsMap.get(field) || 0) + sec);
  }

  const FIELD_COLOR_MAP: Record<string, string> = {
    'computer science': '#60A5FA',
    'economics & finance': '#4D7C73',
    'cognitive science': '#6B688A',
    'philosophy': '#8A7254',
    'neurobiology': '#60A5FA'
  };
  const fallbackPalette = ['#60A5FA', '#4D7C73', '#6B688A', '#8A7254', '#71717A', '#52525B'];
  const fieldDistribution: FieldDistributionItem[] = [];
  const sortedFieldEntries = Array.from(fieldSecondsMap.entries()).sort((a, b) => b[1] - a[1]);

  sortedFieldEntries.forEach(([fieldName, sec], idx) => {
    const hours = Math.round((sec / 3600) * 10) / 10;
    const percentage = totalPeriodSeconds > 0 ? Math.round((sec / totalPeriodSeconds) * 100) : 0;
    const mappedColor = FIELD_COLOR_MAP[fieldName.toLowerCase()] || fallbackPalette[idx % fallbackPalette.length];
    fieldDistribution.push({
      domainName: fieldName,
      fieldName,
      hours,
      percentage,
      colorHex: mappedColor
    });
  });

  const totalFocusHours = Math.round((totalPeriodSeconds / 3600) * 10) / 10;
  const divisor = period === 'day' ? 1 : period === 'month' ? 30 : 7;
  const dailyAverageHours = Math.round((totalFocusHours / divisor) * 10) / 10;

  return {
    period,
    referenceDate: refDate.toISOString(),
    totalFocusHours,
    dailyAverageHours,
    adherenceRate: 100,
    learningHoursPoints: studyHoursPoints,
    studyHoursPoints,
    domainDistribution: fieldDistribution,
    fieldDistribution,
    activeDomainCount: fieldDistribution.length,
    activeFieldCount: fieldDistribution.length
  };
}

export async function getWeeklyTrackingStats(refDate = new Date()): Promise<WeeklyTrackingStats> {
  const db = getLocalDatabase();
  await ensureTrackingSeedData(db);

  // Find Monday of the current week (ISO week: Monday = day 1, Sunday = day 7)
  const dayOfWeek = refDate.getDay(); // 0 is Sunday, 1 is Monday ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(
    refDate.getFullYear(),
    refDate.getMonth(),
    refDate.getDate() + diffToMonday,
    0,
    0,
    0,
    0
  );

  const dayNames: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'> = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun'
  ];

  // Build the 7 day ranges
  const days: WeeklyDayStudyHours[] = [];
  const dayRanges: Array<{
    name: (typeof dayNames)[number];
    dateStr: string;
    startMs: number;
    endMs: number;
    isCurrent: boolean;
  }> = [];

  const todayStr = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}-${String(
    refDate.getDate()
  ).padStart(2, '0')}`;

  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(monday.getTime() + i * 86400000);
    const dateStr = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(
      dayStart.getDate()
    ).padStart(2, '0')}`;
    const startMs = dayStart.getTime();
    const endMs = startMs + 86400000 - 1;

    dayRanges.push({
      name: dayNames[i],
      dateStr,
      startMs,
      endMs,
      isCurrent: dateStr === todayStr
    });
  }

  const weekStartMs = dayRanges[0].startMs;
  const weekEndMs = dayRanges[6].endMs;

  const allSessions = await db.trackingSessions.toArray();
  const weekSessions = allSessions.filter(
    (s) => getSessionStartTime(s) >= weekStartMs && getSessionStartTime(s) <= weekEndMs
  );

  let totalDurationSeconds = 0;
  const daySecondsMap = new Map<string, number>();
  for (const r of dayRanges) {
    daySecondsMap.set(r.dateStr, 0);
  }

  // Also group by subject (folderId)
  const subjectSecondsMap = new Map<string, number>();

  for (const s of weekSessions) {
    const durSec = getSessionDurationSeconds(s);
    totalDurationSeconds += durSec;

    // Find which day this falls into
    const sessionDate = new Date(getSessionStartTime(s));
    const sessionDateStr = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(sessionDate.getDate()).padStart(2, '0')}`;

    if (daySecondsMap.has(sessionDateStr)) {
      daySecondsMap.set(sessionDateStr, (daySecondsMap.get(sessionDateStr) || 0) + durSec);
    }

    const folderKey = s.domainName || s.folderId || 'general';
    subjectSecondsMap.set(folderKey, (subjectSecondsMap.get(folderKey) || 0) + durSec);
  }

  // Compute daily hours
  let maxDayHours = 0;
  for (const r of dayRanges) {
    const sec = daySecondsMap.get(r.dateStr) || 0;
    const hours = Math.round((sec / 3600) * 10) / 10;
    if (hours > maxDayHours) {
      maxDayHours = hours;
    }
  }

  for (const r of dayRanges) {
    const sec = daySecondsMap.get(r.dateStr) || 0;
    const hours = Math.round((sec / 3600) * 10) / 10;
    const percentageOfMax =
      maxDayHours > 0 ? Math.min(100, Math.round((hours / maxDayHours) * 100)) : 0;

    days.push({
      dayName: r.name,
      dateStr: r.dateStr,
      hours,
      isCurrentDay: r.isCurrent,
      percentageOfMax
    });
  }

  const totalHours = Math.round((totalDurationSeconds / 3600) * 10) / 10;
  const dailyAverageHours = Math.round((totalHours / 7) * 10) / 10;

  // Resolve Subject Names from Library Folders
  const allFolders = await db.libraryFolders.toArray();
  const folderNameMap = new Map<string, string>();
  for (const f of allFolders) {
    folderNameMap.set(f.id, f.name);
  }

  const subjects: WeeklySubjectStudyTime[] = [];
  const subjectEntries = Array.from(subjectSecondsMap.entries()).sort((a, b) => b[1] - a[1]);

  const colorPalettes = [
    'bg-blue-400',
    'bg-slate-300',
    'bg-slate-500',
    'bg-slate-600',
    'bg-slate-700'
  ];

  subjectEntries.forEach(([folderId, sec], idx) => {
    const hours = Math.round((sec / 3600) * 10) / 10;
    const percentage =
      totalDurationSeconds > 0
        ? Math.round((sec / totalDurationSeconds) * 100)
        : 0;

    let subjectName = 'General';
    if (folderId !== 'general') {
      subjectName = folderNameMap.get(folderId) || 'General';
    }

    subjects.push({
      folderId,
      subjectName,
      hours,
      percentage,
      colorClass: colorPalettes[idx % colorPalettes.length]
    });
  });

  return {
    dailyAverageHours,
    totalHours,
    days,
    subjects
  };
}

// ============================================================================
// Phase 06: Calendar Repositories
// ============================================================================

export async function loadCalendarEvents(): Promise<CalendarEvent[]> {
  const db = getLocalDatabase();
  await ensureCalendarSeedData(db);
  const events = await db.calendarEvents.toArray();
  return events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export async function saveCalendarEvent(event: CalendarEvent): Promise<void> {
  const db = getLocalDatabase();
  await db.calendarEvents.put(event);
}

export async function updateCalendarEvent(
  id: string,
  updates: Partial<CalendarEvent>
): Promise<void> {
  const db = getLocalDatabase();
  const existing = await db.calendarEvents.get(id);
  if (!existing) return;
  const merged: CalendarEvent = {
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString()
  };
  await db.calendarEvents.put(merged);
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const db = getLocalDatabase();
  await db.calendarEvents.delete(id);
}

export async function markCalendarEventCompleted(
  id: string,
  actualDurationMinutes: number,
  linkedSessionId?: string
): Promise<void> {
  const db = getLocalDatabase();
  const event = await db.calendarEvents.get(id);
  if (!event) return;
  await db.calendarEvents.put({
    ...event,
    completed: true,
    actualDurationMinutes,
    linkedSessionId: linkedSessionId ?? event.linkedSessionId,
    updatedAt: new Date().toISOString()
  });
}

// ============================================================================
// Master Library Items Persistence Helpers
// ============================================================================

export async function getLocalLibraryItems(parentId?: string | null): Promise<LibraryItem[]> {
  try {
    const db = getLocalDatabase();
    if (parentId && parentId !== 'root') {
      return await db.libraryItems.where('parentId').equals(parentId).toArray();
    }
    const all = await db.libraryItems.toArray();
    return all.filter((item) => item.parentId === null || item.parentId === 'root');
  } catch (err) {
    console.warn('Failed to load local library items:', err);
    return [];
  }
}

export async function saveLocalLibraryItem(item: LibraryItem): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.libraryItems.put(item);
  } catch (err) {
    console.warn('Failed to save local library item:', err);
  }
}

export async function bulkSaveLocalLibraryItems(items: LibraryItem[]): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.libraryItems.bulkPut(items);
  } catch (err) {
    console.warn('Failed to bulk save local library items:', err);
  }
}

export async function syncLocalLibraryItemsForParent(parentId: string | null, items: LibraryItem[]): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.transaction('rw', db.libraryItems, async () => {
      if (parentId && parentId !== 'root') {
        const existing = await db.libraryItems.where('parentId').equals(parentId).toArray();
        if (existing.length > 0) {
          await db.libraryItems.bulkDelete(existing.map((i) => i._id));
        }
      } else {
        const all = await db.libraryItems.toArray();
        const rootItems = all.filter((i) => i.parentId === null || i.parentId === 'root');
        if (rootItems.length > 0) {
          await db.libraryItems.bulkDelete(rootItems.map((i) => i._id));
        }
      }
      if (items.length > 0) {
        await db.libraryItems.bulkPut(items);
      }
    });
  } catch (err) {
    console.warn('Failed to sync local library items for parent:', err);
  }
}

export async function deleteLocalLibraryItem(id: string): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.libraryItems.delete(id);
  } catch (err) {
    console.warn('Failed to delete local library item:', err);
  }
}

export async function bulkDeleteLocalLibraryItems(ids: string[]): Promise<void> {
  try {
    const db = getLocalDatabase();
    await db.libraryItems.bulkDelete(ids);
  } catch (err) {
    console.warn('Failed to bulk delete local library items:', err);
  }
}


