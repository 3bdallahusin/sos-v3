import type { FastifyPluginAsync } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { getSqlClient } from '../db.js';
import type {
  LibraryItem,
  LibraryAncestor,
  LibraryStorageMetadata,
  LibraryArtifactData,
  SOSFileType,
  LibraryItemKind
} from '@sos/domain';

// Determine uploads directory
const ROOT_DIR = process.cwd().includes('apps') ? path.resolve(process.cwd(), '../..') : process.cwd();
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads', 'library');
const FILES_DIR = path.join(UPLOADS_DIR, 'files');
const COVERS_DIR = path.join(UPLOADS_DIR, 'covers');

// Ensure directories exist
fs.mkdirSync(FILES_DIR, { recursive: true });
fs.mkdirSync(COVERS_DIR, { recursive: true });

const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'php', 'js', 'html', 'htm', 'svg', 'jar', 'msi', 'vbs', 'ps1', 'scr'
]);

function mapMimeToFileType(mime: string, filename: string): SOSFileType | null {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return null;
  }
  if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
  if (['docx', 'doc'].includes(ext) || mime.includes('word') || mime.includes('document')) return 'docx';
  if (['pptx', 'ppt', 'key'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) return 'slides';
  if (['xlsx', 'xls', 'csv'].includes(ext) || mime.includes('sheet') || mime.includes('excel')) return 'spreadsheet';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) || (mime.startsWith('image/') && !mime.includes('svg'))) return 'image';
  if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext) || mime.startsWith('video/')) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext) || mime.startsWith('audio/')) return 'audio';
  if (['note', 'md', 'txt'].includes(ext) || mime === 'text/plain' || mime === 'text/markdown') return 'note';
  if (['cards', 'flashcards'].includes(ext)) return 'flashcards';
  if (['quiz'].includes(ext)) return 'quiz';
  if (['exam'].includes(ext)) return 'exam';
  if (['board'].includes(ext)) return 'board';
  return null;
}

export function getUserId(req: any): string {
  const custom = req.headers?.['x-user-id'];
  if (typeof custom === 'string' && custom.trim()) {
    return custom.trim();
  }
  return req.user?.id || 'default-user';
}

// In-Memory store fallback for environments where postgres connection is mocked or offline
let memoryStore: Map<string, LibraryItem> = new Map();
let isDbInitialized = false;

async function initLibraryDatabase() {
  if (isDbInitialized) return;
  try {
    const sql = getSqlClient();
    await sql`
      CREATE TABLE IF NOT EXISTS library_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default-user',
        name TEXT NOT NULL,
        item_kind TEXT NOT NULL,
        file_type TEXT NOT NULL,
        parent_id TEXT REFERENCES library_items(id) ON DELETE CASCADE,
        ancestors JSONB NOT NULL DEFAULT '[]'::jsonb,
        icon TEXT,
        cover_image TEXT,
        storage JSONB DEFAULT '{}'::jsonb,
        artifact_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE library_items ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'default-user';`;
    await sql`ALTER TABLE library_items ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lib_user_id ON library_items(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lib_position ON library_items(position);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lib_parent_id ON library_items(parent_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lib_name ON library_items(name);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lib_item_kind ON library_items(item_kind);`;
    isDbInitialized = true;
  } catch (err) {
    console.warn('[Library DB] PostgreSQL table init notice (using memory fallback if offline):', err);
  }
}

export interface SyncArtifactPayload {
  action: 'upsert' | 'delete';
  artifactId: string;
  name?: string;
  fileType: SOSFileType;
  parentId?: string | null;
  userId?: string;
  icon?: string | null;
  coverImage?: string | null;
  externalUrl?: string;
  metrics?: Record<string, any>;
}

export async function syncArtifactToLibrary(sql: any, payload: SyncArtifactPayload): Promise<void> {
  await initLibraryDatabase();
  const {
    action,
    artifactId,
    name = 'Untitled Artifact',
    fileType,
    parentId = null,
    userId = 'default-user',
    icon = null,
    coverImage = null,
    externalUrl,
    metrics = {}
  } = payload;

  const now = new Date().toISOString();

  if (action === 'delete') {
    try {
      if (sql) {
        await sql`
          DELETE FROM library_items 
          WHERE user_id = ${userId}
            AND (artifact_data->>'linkedArtifactId' = ${artifactId} 
                 OR id = ${artifactId}
                 OR id = ${`artifact-${artifactId}`})
        `;
      }
    } catch (err) {
      console.warn('[Library Sync] Delete error in SQL:', err);
    }
    for (const [id, item] of memoryStore.entries()) {
      if (item.artifactData?.linkedArtifactId === artifactId || id === artifactId || id === `artifact-${artifactId}`) {
        memoryStore.delete(id);
      }
    }
    return;
  }

  // Upsert
  const itemId = artifactId.startsWith('artifact-') || artifactId.startsWith('file-') 
    ? artifactId 
    : `artifact-${artifactId}`;

  let ancestors: LibraryAncestor[] = [];
  if (parentId) {
    try {
      if (sql) {
        const pRows = await sql`SELECT * FROM library_items WHERE id = ${parentId} AND user_id = ${userId}`;
        if (pRows.length > 0) {
          const p = rowToItem(pRows[0]);
          ancestors = [...p.ancestors, { _id: p._id, name: p.name }];
        }
      }
    } catch {
      const p = memoryStore.get(parentId);
      if (p) ancestors = [...p.ancestors, { _id: p._id, name: p.name }];
    }
  }

  const artifactData: LibraryArtifactData = {
    linkedArtifactId: artifactId,
    externalUrl,
    metrics
  };

  try {
    if (sql) {
      await sql`
        INSERT INTO library_items (
          id, user_id, name, item_kind, file_type, parent_id, ancestors, icon, cover_image, artifact_data, created_at, updated_at
        ) VALUES (
          ${itemId}, ${userId}, ${name}, 'file', ${fileType}, ${parentId}, 
          ${JSON.stringify(ancestors)}::jsonb, ${icon}, ${coverImage}, 
          ${JSON.stringify(artifactData)}::jsonb, ${now}, ${now}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          file_type = EXCLUDED.file_type,
          parent_id = EXCLUDED.parent_id,
          ancestors = EXCLUDED.ancestors,
          icon = COALESCE(EXCLUDED.icon, library_items.icon),
          cover_image = COALESCE(EXCLUDED.cover_image, library_items.cover_image),
          artifact_data = EXCLUDED.artifact_data,
          updated_at = EXCLUDED.updated_at
      `;
    }
  } catch (err) {
    console.warn('[Library Sync] Upsert error in SQL:', err);
  }

  const memoryItem: LibraryItem = {
    _id: itemId,
    id: itemId,
    name,
    itemKind: 'file',
    fileType,
    parentId,
    ancestors,
    icon,
    coverImage,
    artifactData,
    createdAt: now,
    updatedAt: now
  };
  (memoryItem as any).userId = userId;
  memoryStore.set(itemId, memoryItem);
}

// Map database row to LibraryItem domain model
function rowToItem(row: any): LibraryItem {
  return {
    _id: String(row.id),
    id: String(row.id),
    name: String(row.name),
    itemKind: row.item_kind as LibraryItemKind,
    fileType: row.file_type as SOSFileType,
    parentId: row.parent_id ? String(row.parent_id) : null,
    ancestors: Array.isArray(row.ancestors)
      ? row.ancestors
      : (typeof row.ancestors === 'string' ? JSON.parse(row.ancestors) : []),
    icon: row.icon || null,
    coverImage: row.cover_image || null,
    storage: typeof row.storage === 'string' ? JSON.parse(row.storage) : (row.storage || {}),
    artifactData: typeof row.artifact_data === 'string' ? JSON.parse(row.artifact_data) : (row.artifact_data || {}),
    position: Number(row.position ?? 0),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || new Date().toISOString()),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at || new Date().toISOString())
  };
}

// Seeder logic for Abdallah's academic workspace
export async function seedLibraryIfEmpty() {
  await initLibraryDatabase();
  try {
    const sql = getSqlClient();
    const rows = await sql`SELECT count(*)::int as count FROM library_items WHERE id = 'folder-cs'`;
    if (rows && rows[0]?.count > 0) {
      return; // Already seeded
    }
  } catch {
    if (memoryStore.has('folder-cs')) return;
  }

  // Create physical seed dummy assets on disk if missing
  const dummyRaftPdf = path.join(FILES_DIR, 'Distributed_Consensus_Raft.pdf');
  if (!fs.existsSync(dummyRaftPdf)) {
    fs.writeFileSync(dummyRaftPdf, '%PDF-1.4\n%SOS Academic Research Paper: Distributed Consensus via Raft\n%%EOF');
  }
  const dummyVideo = path.join(FILES_DIR, 'Raft_Consensus_Lecture_04.mp4');
  if (!fs.existsSync(dummyVideo)) {
    fs.writeFileSync(dummyVideo, 'DUMMY_MP4_VIDEO_STREAM_DATA_FOR_SOS_LIBRARY');
  }
  const dummyDiagram = path.join(FILES_DIR, 'Paxos_Quorum_Topology.png');
  if (!fs.existsSync(dummyDiagram)) {
    // 1x1 png placeholder
    fs.writeFileSync(dummyDiagram, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
  }

  const now = new Date().toISOString();

  // 1. Root Folders
  const rootFolders: Array<Omit<LibraryItem, 'childCount'>> = [
    {
      _id: 'folder-cs',
      id: 'folder-cs',
      name: 'Computer Science',
      itemKind: 'folder',
      fileType: 'folder',
      parentId: null,
      ancestors: [],
      icon: '💻',
      coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'folder-econ',
      id: 'folder-econ',
      name: 'Economics & Finance',
      itemKind: 'folder',
      fileType: 'folder',
      parentId: null,
      ancestors: [],
      icon: '📈',
      coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'folder-phil',
      id: 'folder-phil',
      name: 'Philosophy',
      itemKind: 'folder',
      fileType: 'folder',
      parentId: null,
      ancestors: [],
      icon: '🏛️',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80',
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'folder-research',
      id: 'folder-research',
      name: 'Research Papers',
      itemKind: 'folder',
      fileType: 'folder',
      parentId: null,
      ancestors: [],
      icon: '🔬',
      coverImage: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80',
      createdAt: now,
      updatedAt: now
    }
  ];

  // 2. Subfolder: Distributed Systems inside Computer Science
  const distSystemsFolder: Omit<LibraryItem, 'childCount'> = {
    _id: 'folder-dist-sys',
    id: 'folder-dist-sys',
    name: 'Distributed Systems',
    itemKind: 'folder',
    fileType: 'folder',
    parentId: 'folder-cs',
    ancestors: [{ _id: 'folder-cs', name: 'Computer Science' }],
    icon: '💻',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
    createdAt: now,
    updatedAt: now
  };

  // 3. Subfolders inside Distributed Systems
  const distSubfolders: Array<Omit<LibraryItem, 'childCount'>> = [
    {
      _id: 'folder-lectures',
      id: 'folder-lectures',
      name: 'Lecture Slides',
      itemKind: 'folder',
      fileType: 'folder',
      parentId: 'folder-dist-sys',
      ancestors: [
        { _id: 'folder-cs', name: 'Computer Science' },
        { _id: 'folder-dist-sys', name: 'Distributed Systems' }
      ],
      icon: '💻',
      coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'folder-psets',
      id: 'folder-psets',
      name: 'Problem Sets',
      itemKind: 'folder',
      fileType: 'folder',
      parentId: 'folder-dist-sys',
      ancestors: [
        { _id: 'folder-cs', name: 'Computer Science' },
        { _id: 'folder-dist-sys', name: 'Distributed Systems' }
      ],
      icon: '📝',
      coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&auto=format&fit=crop&q=80',
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'folder-paxos-notes',
      id: 'folder-paxos-notes',
      name: 'Paxos Notes',
      itemKind: 'folder',
      fileType: 'folder',
      parentId: 'folder-dist-sys',
      ancestors: [
        { _id: 'folder-cs', name: 'Computer Science' },
        { _id: 'folder-dist-sys', name: 'Distributed Systems' }
      ],
      icon: '📁',
      coverImage: null, // Empty folder with no cover to test empty state
      createdAt: now,
      updatedAt: now
    }
  ];

  // 4. All 12 SOS File Types inside Distributed Systems
  const distAncestors: LibraryAncestor[] = [
    { _id: 'folder-cs', name: 'Computer Science' },
    { _id: 'folder-dist-sys', name: 'Distributed Systems' }
  ];

  const distFiles: Array<Omit<LibraryItem, 'childCount'>> = [
    {
      _id: 'file-raft-pdf',
      id: 'file-raft-pdf',
      name: 'Distributed_Consensus_Raft.pdf',
      itemKind: 'file',
      fileType: 'pdf',
      parentId: 'folder-dist-sys',
      ancestors: distAncestors,
      icon: null,
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80',
      storage: {
        storagePath: dummyRaftPdf,
        mimeType: 'application/pdf',
        sizeBytes: 4404019, // 4.2 MB
        url: '/uploads/library/files/Distributed_Consensus_Raft.pdf'
      },
      artifactData: {
        metrics: { pageCount: 32, currentPage: 1 }
      },
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'file-raft-video',
      id: 'file-raft-video',
      name: 'Raft Consensus Lecture 04.mp4',
      itemKind: 'file',
      fileType: 'video',
      parentId: 'folder-dist-sys',
      ancestors: distAncestors,
      icon: null,
      coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
      storage: {
        storagePath: dummyVideo,
        mimeType: 'video/mp4',
        sizeBytes: 387973120, // 370 MB
        url: '/uploads/library/files/Raft_Consensus_Lecture_04.mp4'
      },
      artifactData: {
        metrics: { durationSeconds: 4500 } // 1h 15m
      },
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'file-byzantine-note',
      id: 'file-byzantine-note',
      name: 'Byzantine Generals Notes.note',
      itemKind: 'file',
      fileType: 'note',
      parentId: 'folder-dist-sys',
      ancestors: distAncestors,
      icon: '⚡',
      coverImage: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&auto=format&fit=crop&q=80',
      artifactData: {
        metrics: { wordCount: 1840 }
      },
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'file-consensus-cards',
      id: 'file-consensus-cards',
      name: 'Consensus Protocols Deck.cards',
      itemKind: 'file',
      fileType: 'flashcards',
      parentId: 'folder-dist-sys',
      ancestors: distAncestors,
      icon: '🧠',
      coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80',
      artifactData: {
        metrics: { cardCount: 45, dueCount: 9 }
      },
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'file-paxos-quiz',
      id: 'file-paxos-quiz',
      name: 'Paxos Safety & Liveness Quiz.quiz',
      itemKind: 'file',
      fileType: 'quiz',
      parentId: 'folder-dist-sys',
      ancestors: distAncestors,
      icon: null,
      coverImage: null, // Tests "+ Add Cover" fallback
      artifactData: {
        metrics: { questionCount: 20 }
      },
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'file-paxos-png',
      id: 'file-paxos-png',
      name: 'Paxos_Quorum_Topology.png',
      itemKind: 'file',
      fileType: 'image',
      parentId: 'folder-dist-sys',
      ancestors: distAncestors,
      icon: null,
      coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
      storage: {
        storagePath: dummyDiagram,
        mimeType: 'image/png',
        sizeBytes: 2936012, // 2.8 MB
        url: '/uploads/library/files/Paxos_Quorum_Topology.png'
      },
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'file-benchmarks-xlsx',
      id: 'file-benchmarks-xlsx',
      name: 'Latency_Benchmarks_2026.xlsx',
      itemKind: 'file',
      fileType: 'spreadsheet',
      parentId: 'folder-dist-sys',
      ancestors: distAncestors,
      icon: null,
      coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
      storage: {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        sizeBytes: 655360 // 640 KB
      },
      artifactData: {
        metrics: { sheetCount: 4, rowCount: 1250 }
      },
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'file-seminar-mp3',
      id: 'file-seminar-mp3',
      name: 'MIT_6.824_Seminar_Recap.mp3',
      itemKind: 'file',
      fileType: 'audio',
      parentId: 'folder-dist-sys',
      ancestors: distAncestors,
      icon: null,
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
      storage: {
        mimeType: 'audio/mpeg',
        sizeBytes: 36700160 // 35 MB
      },
      artifactData: {
        metrics: { durationSeconds: 2292 } // 38m 12s
      },
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'file-raft-browser',
      id: 'file-raft-browser',
      name: 'Raft Paper Interactive Viz',
      itemKind: 'file',
      fileType: 'browser',
      parentId: 'folder-dist-sys',
      ancestors: distAncestors,
      icon: '🌐',
      coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      artifactData: {
        externalUrl: 'https://raft.github.io'
      },
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'file-midterm-exam',
      id: 'file-midterm-exam',
      name: 'Midterm Practice Exam 2026',
      itemKind: 'file',
      fileType: 'exam',
      parentId: 'folder-dist-sys',
      ancestors: distAncestors,
      icon: '🎓',
      coverImage: null, // Tests no-cover fallback
      artifactData: {
        metrics: { totalPoints: 100 }
      },
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'file-keyvalue-docx',
      id: 'file-keyvalue-docx',
      name: 'Lab_02_Key_Value_Spec.docx',
      itemKind: 'file',
      fileType: 'docx',
      parentId: 'folder-dist-sys',
      ancestors: distAncestors,
      icon: null,
      coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop&q=80',
      storage: {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: 1468006 // 1.4 MB
      },
      artifactData: {
        metrics: { pageCount: 14, currentPage: 1 }
      },
      createdAt: now,
      updatedAt: now
    },
    {
      _id: 'file-replication-pptx',
      id: 'file-replication-pptx',
      name: '05_Replication_Logs_Deck.pptx',
      itemKind: 'file',
      fileType: 'slides',
      parentId: 'folder-dist-sys',
      ancestors: distAncestors,
      icon: null,
      coverImage: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1200&auto=format&fit=crop&q=80',
      storage: {
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        sizeBytes: 8388608 // 8 MB
      },
      artifactData: {
        metrics: { slideCount: 34 }
      },
      createdAt: now,
      updatedAt: now
    }
  ];

  const allSeedItems = [
    ...rootFolders,
    distSystemsFolder,
    ...distSubfolders,
    ...distFiles
  ];

  // Insert into memory store
  for (const item of allSeedItems) {
    memoryStore.set(item._id, { ...item, id: item._id });
  }

  // Insert into PostgreSQL
  try {
    const sql = getSqlClient();
    // Clean up any test leftovers
    await sql`DELETE FROM library_items WHERE name LIKE 'E2E Test Folder%' OR name LIKE 'New Test Folder%' OR name LIKE 'Parent Folder A%'`;

    for (const item of allSeedItems) {
      await sql`
        INSERT INTO library_items (
          id, user_id, name, item_kind, file_type, parent_id, ancestors, icon, cover_image, storage, artifact_data, created_at, updated_at
        ) VALUES (
          ${item._id},
          'default-user',
          ${item.name},
          ${item.itemKind},
          ${item.fileType},
          ${item.parentId},
          ${JSON.stringify(item.ancestors)}::jsonb,
          ${item.icon || null},
          ${item.coverImage || null},
          ${JSON.stringify(item.storage || {})}::jsonb,
          ${JSON.stringify(item.artifactData || {})}::jsonb,
          ${item.createdAt},
          ${item.updatedAt}
        ) ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          name = EXCLUDED.name,
          parent_id = EXCLUDED.parent_id,
          ancestors = EXCLUDED.ancestors,
          icon = EXCLUDED.icon,
          cover_image = EXCLUDED.cover_image,
          storage = EXCLUDED.storage,
          artifact_data = EXCLUDED.artifact_data,
          updated_at = EXCLUDED.updated_at
      `;
    }
    console.info(`[Library DB] Successfully seeded ${allSeedItems.length} items into library_items.`);
  } catch (err) {
    console.warn('[Library DB] Seed notice (memory store active):', err);
  }
}

export const libraryRoutes: FastifyPluginAsync = async (server) => {
  // Register multipart plugin for uploads if not already registered
  if (!server.hasContentTypeParser('multipart/form-data')) {
    try {
      await server.register(fastifyMultipart, {
        limits: {
          fileSize: 100 * 1024 * 1024 // 100 MB max
        }
      });
    } catch {
      // Already registered
    }
  }

  // Register static file serving for /uploads/library/ with security headers
  try {
    await server.register(fastifyStatic, {
      root: path.resolve(ROOT_DIR, 'uploads'),
      prefix: '/uploads/',
      decorateReply: false,
      setHeaders: (res: any) => {
        if (typeof res.setHeader === 'function') {
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Content-Disposition', 'inline');
        } else if (typeof res.header === 'function') {
          res.header('X-Content-Type-Options', 'nosniff');
          res.header('Content-Disposition', 'inline');
        }
      }
    });
  } catch {
    // Already registered or fallback
  }

  // Initialize DB and Seed
  await seedLibraryIfEmpty();

  // ----------------------------------------------------
  // 1. GET /api/library/items
  // ----------------------------------------------------
  server.get('/api/library/items', async (req, reply) => {
    await initLibraryDatabase();
    await seedLibraryIfEmpty();
    const userId = getUserId(req);
    const query = req.query as {
      parentId?: string;
      search?: string;
      filter?: string;
      sortBy?: string;
      sortOrder?: string;
    };

    const parentId = query.parentId === 'root' || !query.parentId ? null : query.parentId;
    const search = query.search?.trim().toLowerCase() || '';
    const filter = query.filter || 'all';
    const sortBy = query.sortBy || 'position';
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    let rawItems: LibraryItem[] = [];
    let breadcrumbs: LibraryAncestor[] = [];

    try {
      const sql = getSqlClient();

      // Compute breadcrumbs if inside a folder
      if (parentId) {
        const folderRows = await sql`SELECT * FROM library_items WHERE id = ${parentId} AND user_id = ${userId}`;
        if (folderRows.length > 0) {
          const folder = rowToItem(folderRows[0]);
          breadcrumbs = [...folder.ancestors, { _id: folder._id, name: folder.name }];
        }
      }

      // Fetch items ordered by position
      let rows: any[] = [];
      if (search) {
        // Global or folder search
        rows = await sql`
          SELECT * FROM library_items 
          WHERE user_id = ${userId} AND LOWER(name) LIKE ${'%' + search + '%'}
          ORDER BY position ASC, name ASC
        `;
      } else if (parentId) {
        rows = await sql`
          SELECT * FROM library_items 
          WHERE user_id = ${userId} AND parent_id = ${parentId}
          ORDER BY position ASC, name ASC
        `;
      } else {
        rows = await sql`
          SELECT * FROM library_items 
          WHERE user_id = ${userId} AND parent_id IS NULL
          ORDER BY position ASC, name ASC
        `;
      }

      // Calculate childCount for each folder via aggregation
      const countRows = await sql`
        SELECT parent_id, count(*)::int as count 
        FROM library_items 
        WHERE user_id = ${userId} AND parent_id IS NOT NULL 
        GROUP BY parent_id
      `;
      const countMap = new Map<string, number>();
      for (const r of countRows) {
        if (r.parent_id) countMap.set(String(r.parent_id), r.count);
      }

      rawItems = rows.map((r) => {
        const item = rowToItem(r);
        if (item.itemKind === 'folder') {
          item.childCount = countMap.get(item._id) ?? 0;
        }
        return item;
      });
    } catch {
      // Memory store fallback
      if (parentId) {
        const currentFolder = memoryStore.get(parentId);
        if (currentFolder) {
          breadcrumbs = [...currentFolder.ancestors, { _id: currentFolder._id, name: currentFolder.name }];
        }
      }

      const all = Array.from(memoryStore.values());
      const filtered = all.filter((item) => {
        if (search) {
          return item.name.toLowerCase().includes(search);
        }
        return parentId ? item.parentId === parentId : item.parentId === null;
      });

      rawItems = filtered.map((item) => {
        if (item.itemKind === 'folder') {
          const childCount = all.filter((x) => x.parentId === item._id).length;
          return { ...item, childCount };
        }
        return item;
      });
    }

    // Apply Filter (Item 4)
    let filteredItems = rawItems.filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'folders') return item.itemKind === 'folder';
      if (filter === 'files') return item.itemKind === 'file';
      if (filter === 'pdf') return item.fileType === 'pdf';
      if (filter === 'docx') return ['docx', 'doc', 'txt', 'md'].includes(item.fileType);
      if (filter === 'slides') return ['slides', 'pptx', 'ppt'].includes(item.fileType);
      if (filter === 'note') return item.fileType === 'note';
      if (filter === 'board') return item.fileType === 'board';
      if (filter === 'video') return item.fileType === 'video';
      if (filter === 'audio') return item.fileType === 'audio';
      if (filter === 'browser') return item.fileType === 'browser';
      if (filter === 'flashcards') return item.fileType === 'flashcards';
      if (filter === 'quiz') return item.fileType === 'quiz';
      if (filter === 'exam') return item.fileType === 'exam';
      return true;
    });

    // Apply Sorting: Folders always first when filter === 'all'
    filteredItems.sort((a, b) => {
      if (filter === 'all' && a.itemKind !== b.itemKind) {
        return a.itemKind === 'folder' ? -1 : 1;
      }
      let cmp = 0;
      if (sortBy === 'position') {
        const posA = a.position ?? 0;
        const posB = b.position ?? 0;
        if (posA !== posB) {
          cmp = posA - posB;
        } else {
          cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        }
      } else if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortBy === 'updatedAt') {
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortBy === 'size') {
        const sizeA = a.storage?.sizeBytes ?? (a.childCount ? a.childCount * 1024 : 0);
        const sizeB = b.storage?.sizeBytes ?? (b.childCount ? b.childCount * 1024 : 0);
        cmp = sizeA - sizeB;
      } else if (sortBy === 'type') {
        cmp = a.fileType.localeCompare(b.fileType);
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    return reply.status(200).send({
      breadcrumbs,
      items: filteredItems
    });
  });

  // ----------------------------------------------------
  // 1b. GET /api/library/items/:id (Item 10)
  // ----------------------------------------------------
  server.get('/api/library/items/:id', async (req, reply) => {
    await initLibraryDatabase();
    const userId = getUserId(req);
    const { id } = req.params as { id: string };

    try {
      const sql = getSqlClient();
      const rows = await sql`SELECT * FROM library_items WHERE id = ${id} AND user_id = ${userId}`;
      if (rows.length > 0) {
        return reply.status(200).send(rowToItem(rows[0]));
      }
    } catch {
      // Memory store fallback
    }

    const mem = memoryStore.get(id);
    if (mem) {
      return reply.status(200).send(mem);
    }

    return reply.status(404).send({ error: 'Item not found' });
  });

  // ----------------------------------------------------
  // 1c. PATCH /api/library/items/reorder (Item 2)
  // ----------------------------------------------------
  server.patch('/api/library/items/reorder', async (req, reply) => {
    await initLibraryDatabase();
    const userId = getUserId(req);
    const body = (req.body || {}) as { parentId?: string | null; orderedIds?: string[] };
    const orderedIds = body.orderedIds || [];

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return reply.status(400).send({ error: 'orderedIds must be a non-empty array' });
    }

    const now = new Date().toISOString();

    try {
      const sql = getSqlClient();
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        await sql`
          UPDATE library_items 
          SET position = ${i}, updated_at = ${now} 
          WHERE id = ${id} AND user_id = ${userId}
        `;
        const mem = memoryStore.get(id);
        if (mem) {
          mem.position = i;
          mem.updatedAt = now;
          memoryStore.set(id, mem);
        }
      }
    } catch {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        const mem = memoryStore.get(id);
        if (mem) {
          mem.position = i;
          mem.updatedAt = now;
          memoryStore.set(id, mem);
        }
      }
    }

    return reply.status(200).send({ success: true, count: orderedIds.length });
  });

  // ----------------------------------------------------
  // 2. POST /api/library/folders
  // ----------------------------------------------------
  server.post('/api/library/folders', async (req, reply) => {
    await initLibraryDatabase();
    const userId = getUserId(req);
    const body = req.body as {
      name?: string;
      parentId?: string | null;
      icon?: string | null;
    };

    let name = (body.name || 'Untitled Folder').trim();
    const parentId = body.parentId === 'root' || !body.parentId ? null : body.parentId;
    const icon = body.icon || '📁';
    const id = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    let ancestors: LibraryAncestor[] = [];

    try {
      const sql = getSqlClient();
      if (parentId) {
        const parentRows = await sql`SELECT * FROM library_items WHERE id = ${parentId} AND user_id = ${userId}`;
        if (parentRows.length > 0) {
          const parent = rowToItem(parentRows[0]);
          ancestors = [...parent.ancestors, { _id: parent._id, name: parent.name }];
        }
      }

      // Check duplicate sibling names for this user
      const siblings = parentId
        ? await sql`SELECT name FROM library_items WHERE parent_id = ${parentId} AND user_id = ${userId}`
        : await sql`SELECT name FROM library_items WHERE parent_id IS NULL AND user_id = ${userId}`;

      const existingNames = new Set(siblings.map((s) => s.name));
      let uniqueName = name;
      let counter = 1;
      while (existingNames.has(uniqueName)) {
        uniqueName = `${name} (${counter++})`;
      }
      name = uniqueName;

      await sql`
        INSERT INTO library_items (
          id, user_id, name, item_kind, file_type, parent_id, ancestors, icon, cover_image, created_at, updated_at
        ) VALUES (
          ${id}, ${userId}, ${name}, 'folder', 'folder', ${parentId}, ${JSON.stringify(ancestors)}::jsonb, ${icon}, null, ${now}, ${now}
        )
      `;
    } catch {
      if (parentId) {
        const parent = memoryStore.get(parentId);
        if (parent) {
          ancestors = [...parent.ancestors, { _id: parent._id, name: parent.name }];
        }
      }
      let uniqueName = name;
      let counter = 1;
      const siblings = Array.from(memoryStore.values()).filter((x) => x.parentId === parentId);
      while (siblings.some((s) => s.name === uniqueName)) {
        uniqueName = `${name} (${counter++})`;
      }
      name = uniqueName;
    }

    const newItem: LibraryItem = {
      _id: id,
      id,
      name,
      itemKind: 'folder',
      fileType: 'folder',
      parentId,
      ancestors,
      icon,
      coverImage: null,
      childCount: 0,
      createdAt: now,
      updatedAt: now
    };

    memoryStore.set(id, newItem);
    return reply.status(201).send(newItem);
  });

  // ----------------------------------------------------
  // 3. POST /api/library/upload (multipart/form-data)
  // ----------------------------------------------------
  server.post('/api/library/upload', async (req, reply) => {
    await initLibraryDatabase();
    const userId = getUserId(req);

    if (!req.isMultipart()) {
      return reply.status(400).send({ error: 'Expected multipart/form-data request' });
    }

    try {
      const parts = req.parts();
      const createdItems: LibraryItem[] = [];
      let parentId: string | null = null;

      // First pass or cache existing sibling names once parentId is discovered
      let existingNames: Set<string> | null = null;

      for await (const part of parts) {
        if (part.type === 'field' && part.fieldname === 'parentId') {
          parentId = (part.value as string) === 'root' || !part.value ? null : (part.value as string);
        } else if (part.type === 'file') {
          const rawFilename = part.filename || 'uploaded-file';
          const fileExt = path.extname(rawFilename).toLowerCase();
          const mimeType = part.mimetype || 'application/octet-stream';

          // Security check 1: Reject dangerous extensions immediately
          if (DANGEROUS_EXTENSIONS.has(fileExt)) {
            return reply.status(415).send({
              error: `Security violation: Files with extension '${fileExt}' are strictly prohibited.`
            });
          }

          // Security check 2: Strict allowlist mapping
          const fileType = mapMimeToFileType(mimeType, rawFilename);
          if (!fileType) {
            return reply.status(415).send({
              error: `Unsupported Media Type: Files with MIME '${mimeType}' or extension '${fileExt}' are not allowed.`
            });
          }

          // Fetch sibling names if not yet fetched
          if (!existingNames) {
            try {
              const sql = getSqlClient();
              const siblings = parentId
                ? await sql`SELECT name FROM library_items WHERE parent_id = ${parentId} AND user_id = ${userId}`
                : await sql`SELECT name FROM library_items WHERE parent_id IS NULL AND user_id = ${userId}`;
              existingNames = new Set(siblings.map((s) => s.name));
            } catch {
              existingNames = new Set(
                Array.from(memoryStore.values())
                  .filter((x) => x.parentId === parentId)
                  .map((x) => x.name)
              );
            }
          }

          // Resolve duplicate sibling file names: "Document.pdf" -> "Document (1).pdf"
          const originalExt = path.extname(rawFilename);
          const stem = path.basename(rawFilename, originalExt);
          let uniqueFilename = rawFilename;
          let counter = 1;
          while (existingNames.has(uniqueFilename)) {
            uniqueFilename = `${stem} (${counter++})${originalExt}`;
          }
          existingNames.add(uniqueFilename);

          const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const diskFilename = `${fileId}${originalExt}`;
          const diskPath = path.join(FILES_DIR, diskFilename);

          try {
            await pipeline(part.file, fs.createWriteStream(diskPath));
          } catch (streamErr: any) {
            if (fs.existsSync(diskPath)) {
              try { fs.unlinkSync(diskPath); } catch {}
            }
            if (part.file.truncated || streamErr?.code === 'FST_REQ_FILE_TOO_LARGE') {
              return reply.status(413).send({ error: 'File size exceeds maximum allowed limit of 100MB.' });
            }
            return reply.status(400).send({ error: `File upload failed: ${streamErr?.message || 'Stream error'}` });
          }

          if (part.file.truncated) {
            if (fs.existsSync(diskPath)) {
              try { fs.unlinkSync(diskPath); } catch {}
            }
            return reply.status(413).send({ error: 'File size exceeds maximum allowed limit of 100MB.' });
          }

          const stats = fs.statSync(diskPath);
          const now = new Date().toISOString();

          let ancestors: LibraryAncestor[] = [];
          try {
            const sql = getSqlClient();
            if (parentId) {
              const parentRows = await sql`SELECT * FROM library_items WHERE id = ${parentId} AND user_id = ${userId}`;
              if (parentRows.length > 0) {
                const parent = rowToItem(parentRows[0]);
                ancestors = [...parent.ancestors, { _id: parent._id, name: parent.name }];
              }
            }
            await sql`
              INSERT INTO library_items (
                id, user_id, name, item_kind, file_type, parent_id, ancestors, icon, cover_image, storage, created_at, updated_at
              ) VALUES (
                ${fileId}, ${userId}, ${uniqueFilename}, 'file', ${fileType}, ${parentId}, ${JSON.stringify(ancestors)}::jsonb, null, null,
                ${JSON.stringify({
                  storagePath: diskPath,
                  mimeType,
                  sizeBytes: stats.size,
                  url: `/uploads/library/files/${diskFilename}`
                })}::jsonb,
                ${now}, ${now}
              )
            `;
          } catch {
            if (parentId) {
              const parent = memoryStore.get(parentId);
              if (parent) {
                ancestors = [...parent.ancestors, { _id: parent._id, name: parent.name }];
              }
            }
          }

          const newItem: LibraryItem = {
            _id: fileId,
            id: fileId,
            name: uniqueFilename,
            itemKind: 'file',
            fileType,
            parentId,
            ancestors,
            icon: null,
            coverImage: null,
            storage: {
              storagePath: diskPath,
              mimeType,
              sizeBytes: stats.size,
              url: `/uploads/library/files/${diskFilename}`
            },
            createdAt: now,
            updatedAt: now
          };

          memoryStore.set(fileId, newItem);
          createdItems.push(newItem);
        }
      }

      return reply.status(201).send({
        success: true,
        count: createdItems.length,
        items: createdItems
      });
    } catch (err: any) {
      if (err?.code === 'FST_REQ_FILE_TOO_LARGE') {
        return reply.status(413).send({ error: 'File size exceeds maximum allowed limit of 100MB.' });
      }
      return reply.status(500).send({ error: `Upload processing error: ${err?.message || 'Unknown error'}` });
    }
  });

  // ----------------------------------------------------
  // 4. POST /api/library/artifacts
  // ----------------------------------------------------
  server.post('/api/library/artifacts', async (req, reply) => {
    await initLibraryDatabase();
    const userId = getUserId(req);
    const body = req.body as {
      name: string;
      fileType: SOSFileType;
      parentId?: string | null;
      icon?: string | null;
      coverImage?: string | null;
      externalUrl?: string;
      linkedArtifactId?: string;
      metrics?: Record<string, any>;
    };

    const id = `artifact-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const parentId = body.parentId === 'root' || !body.parentId ? null : body.parentId;
    const now = new Date().toISOString();

    let ancestors: LibraryAncestor[] = [];
    try {
      const sql = getSqlClient();
      if (parentId) {
        const parentRows = await sql`SELECT * FROM library_items WHERE id = ${parentId} AND user_id = ${userId}`;
        if (parentRows.length > 0) {
          const parent = rowToItem(parentRows[0]);
          ancestors = [...parent.ancestors, { _id: parent._id, name: parent.name }];
        }
      }
      await sql`
        INSERT INTO library_items (
          id, user_id, name, item_kind, file_type, parent_id, ancestors, icon, cover_image, artifact_data, created_at, updated_at
        ) VALUES (
          ${id}, ${userId}, ${body.name}, 'file', ${body.fileType}, ${parentId}, ${JSON.stringify(ancestors)}::jsonb,
          ${body.icon || null}, ${body.coverImage || null},
          ${JSON.stringify({
            linkedArtifactId: body.linkedArtifactId,
            externalUrl: body.externalUrl,
            metrics: body.metrics || {}
          })}::jsonb,
          ${now}, ${now}
        )
      `;
    } catch {
      if (parentId) {
        const parent = memoryStore.get(parentId);
        if (parent) {
          ancestors = [...parent.ancestors, { _id: parent._id, name: parent.name }];
        }
      }
    }

    const newItem: LibraryItem = {
      _id: id,
      id,
      name: body.name,
      itemKind: 'file',
      fileType: body.fileType,
      parentId,
      ancestors,
      icon: body.icon || null,
      coverImage: body.coverImage || null,
      artifactData: {
        linkedArtifactId: body.linkedArtifactId,
        externalUrl: body.externalUrl,
        metrics: body.metrics
      },
      createdAt: now,
      updatedAt: now
    };

    memoryStore.set(id, newItem);
    return reply.status(201).send(newItem);
  });

  // ----------------------------------------------------
  // 5. PATCH /api/library/items/:id
  // ----------------------------------------------------
  server.patch('/api/library/items/:id', async (req, reply) => {
    await initLibraryDatabase();
    const userId = getUserId(req);
    const { id } = req.params as { id: string };
    const body = req.body as {
      name?: string;
      icon?: string | null;
      parentId?: string | null;
    };

    const now = new Date().toISOString();

    try {
      const sql = getSqlClient();
      const currentRows = await sql`SELECT * FROM library_items WHERE id = ${id} AND user_id = ${userId}`;
      if (currentRows.length === 0 && !memoryStore.has(id)) {
        return reply.status(404).send({ error: 'Item not found' });
      }

      // Handle Move with circular check
      if (body.parentId !== undefined) {
        const targetParentId = body.parentId === 'root' ? null : body.parentId;
        if (targetParentId === id) {
          return reply.status(400).send({ error: 'Cannot move item inside itself' });
        }

        // Circular check: verify target is not a descendant of id
        if (targetParentId) {
          const targetRows = await sql`SELECT * FROM library_items WHERE id = ${targetParentId} AND user_id = ${userId}`;
          if (targetRows.length > 0) {
            const targetAncestors: LibraryAncestor[] = Array.isArray(targetRows[0].ancestors)
              ? targetRows[0].ancestors
              : JSON.parse(targetRows[0].ancestors || '[]');
            if (targetAncestors.some((a) => a._id === id)) {
              return reply.status(400).send({ error: 'Circular move detected: target is a descendant of this item' });
            }
          }
        }

        // Rebuild ancestors for this item
        let newAncestors: LibraryAncestor[] = [];
        if (targetParentId) {
          const pRows = await sql`SELECT * FROM library_items WHERE id = ${targetParentId} AND user_id = ${userId}`;
          if (pRows.length > 0) {
            const p = rowToItem(pRows[0]);
            newAncestors = [...p.ancestors, { _id: p._id, name: p.name }];
          }
        }

        await sql`
          UPDATE library_items 
          SET parent_id = ${targetParentId}, ancestors = ${JSON.stringify(newAncestors)}::jsonb, updated_at = ${now}
          WHERE id = ${id} AND user_id = ${userId}
        `;
      }

      // Handle Rename & propagate to descendant ancestors
      if (body.name !== undefined) {
        const newName = body.name.trim();
        await sql`
          UPDATE library_items 
          SET name = ${newName}, updated_at = ${now}
          WHERE id = ${id} AND user_id = ${userId}
        `;

        // Update ancestors chain in all descendant documents
        const allItems = await sql`SELECT * FROM library_items WHERE user_id = ${userId}`;
        for (const itemRow of allItems) {
          const itemAncestors: LibraryAncestor[] = Array.isArray(itemRow.ancestors)
            ? itemRow.ancestors
            : JSON.parse(itemRow.ancestors || '[]');
          const idx = itemAncestors.findIndex((a) => a._id === id);
          if (idx !== -1) {
            itemAncestors[idx].name = newName;
            await sql`
              UPDATE library_items 
              SET ancestors = ${JSON.stringify(itemAncestors)}::jsonb
              WHERE id = ${itemRow.id} AND user_id = ${userId}
            `;
          }
        }
      }

      // Handle Icon
      if (body.icon !== undefined) {
        await sql`
          UPDATE library_items 
          SET icon = ${body.icon}, updated_at = ${now}
          WHERE id = ${id} AND user_id = ${userId}
        `;
      }

      const updatedRow = await sql`SELECT * FROM library_items WHERE id = ${id} AND user_id = ${userId}`;
      if (updatedRow.length > 0) {
        const updatedItem = rowToItem(updatedRow[0]);
        memoryStore.set(id, updatedItem);
        return reply.status(200).send(updatedItem);
      }
    } catch {
      // Memory store fallback
      const item = memoryStore.get(id);
      if (!item) return reply.status(404).send({ error: 'Item not found' });
      if (body.name !== undefined) item.name = body.name.trim();
      if (body.icon !== undefined) item.icon = body.icon;
      if (body.parentId !== undefined) {
        item.parentId = body.parentId === 'root' ? null : body.parentId;
        if (item.parentId) {
          const p = memoryStore.get(item.parentId);
          item.ancestors = p ? [...p.ancestors, { _id: p._id, name: p.name }] : [];
        } else {
          item.ancestors = [];
        }
      }
      item.updatedAt = now;
      memoryStore.set(id, item);
      return reply.status(200).send(item);
    }

    return reply.status(200).send(memoryStore.get(id));
  });

  // ----------------------------------------------------
  // 6. POST /api/library/items/:id/cover
  // ----------------------------------------------------
  server.post('/api/library/items/:id/cover', async (req, reply) => {
    await initLibraryDatabase();
    const userId = getUserId(req);
    const { id } = req.params as { id: string };
    const now = new Date().toISOString();
    let coverUrl: string | null = null;

    if (req.isMultipart()) {
      const part = await req.file();
      if (part) {
        const coverExt = path.extname(part.filename) || '.jpg';
        const coverFilename = `cover-${id}-${Date.now()}${coverExt}`;
        const diskPath = path.join(COVERS_DIR, coverFilename);
        await pipeline(part.file, fs.createWriteStream(diskPath));
        coverUrl = `/uploads/library/covers/${coverFilename}`;
      }
    } else {
      const body = req.body as { coverUrl?: string };
      coverUrl = body.coverUrl || null;
    }

    try {
      const sql = getSqlClient();
      await sql`
        UPDATE library_items 
        SET cover_image = ${coverUrl}, updated_at = ${now}
        WHERE id = ${id} AND user_id = ${userId}
      `;
      const rows = await sql`SELECT * FROM library_items WHERE id = ${id} AND user_id = ${userId}`;
      if (rows.length > 0) {
        const item = rowToItem(rows[0]);
        memoryStore.set(id, item);
        return reply.status(200).send(item);
      }
    } catch {
      const item = memoryStore.get(id);
      if (item) {
        item.coverImage = coverUrl;
        item.updatedAt = now;
        memoryStore.set(id, item);
        return reply.status(200).send(item);
      }
    }

    return reply.status(200).send({ id, coverImage: coverUrl });
  });

  // ----------------------------------------------------
  // 7. DELETE /api/library/items/:id/cover
  // ----------------------------------------------------
  server.delete('/api/library/items/:id/cover', async (req, reply) => {
    await initLibraryDatabase();
    const userId = getUserId(req);
    const { id } = req.params as { id: string };
    const now = new Date().toISOString();

    try {
      const sql = getSqlClient();
      await sql`
        UPDATE library_items 
        SET cover_image = NULL, updated_at = ${now}
        WHERE id = ${id} AND user_id = ${userId}
      `;
      const rows = await sql`SELECT * FROM library_items WHERE id = ${id} AND user_id = ${userId}`;
      if (rows.length > 0) {
        const item = rowToItem(rows[0]);
        memoryStore.set(id, item);
        return reply.status(200).send(item);
      }
    } catch {
      const item = memoryStore.get(id);
      if (item) {
        item.coverImage = null;
        item.updatedAt = now;
        memoryStore.set(id, item);
        return reply.status(200).send(item);
      }
    }

    return reply.status(200).send({ id, coverImage: null });
  });

  // ----------------------------------------------------
  // 8. POST /api/library/items/:id/duplicate
  // ----------------------------------------------------
  server.post('/api/library/items/:id/duplicate', async (req, reply) => {
    await initLibraryDatabase();
    const userId = getUserId(req);
    const { id } = req.params as { id: string };
    const body = (req.body || {}) as { parentId?: string | null };
    const now = new Date().toISOString();

    let original: LibraryItem | null = null;
    try {
      const sql = getSqlClient();
      const rows = await sql`SELECT * FROM library_items WHERE id = ${id} AND user_id = ${userId}`;
      if (rows.length > 0) original = rowToItem(rows[0]);
    } catch {
      original = memoryStore.get(id) || null;
    }

    if (!original) {
      return reply.status(404).send({ error: 'Item not found' });
    }

    const copyId = `${original.itemKind}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const copyName = `${original.name} (Copy)`;
    const targetParentId = body.parentId !== undefined 
      ? (body.parentId === 'root' || !body.parentId ? null : body.parentId) 
      : original.parentId;

    let targetAncestors: LibraryAncestor[] = original.ancestors;
    if (targetParentId !== original.parentId) {
      targetAncestors = [];
      if (targetParentId) {
        try {
          const sql = getSqlClient();
          const pRows = await sql`SELECT * FROM library_items WHERE id = ${targetParentId} AND user_id = ${userId}`;
          if (pRows.length > 0) {
            const p = rowToItem(pRows[0]);
            targetAncestors = [...p.ancestors, { _id: p._id, name: p.name }];
          }
        } catch {
          const p = memoryStore.get(targetParentId);
          if (p) {
            targetAncestors = [...p.ancestors, { _id: p._id, name: p.name }];
          }
        }
      }
    }

    // If file, duplicate physical file if exists
    let storageCopy = { ...original.storage };
    if (original.storage?.storagePath && fs.existsSync(original.storage.storagePath)) {
      const ext = path.extname(original.storage.storagePath);
      const newDiskFilename = `${copyId}${ext}`;
      const newDiskPath = path.join(FILES_DIR, newDiskFilename);
      fs.copyFileSync(original.storage.storagePath, newDiskPath);
      storageCopy.storagePath = newDiskPath;
      storageCopy.url = `/uploads/library/files/${newDiskFilename}`;
    }

    const copyItem: LibraryItem = {
      ...original,
      _id: copyId,
      id: copyId,
      name: copyName,
      parentId: targetParentId,
      ancestors: targetAncestors,
      storage: storageCopy,
      createdAt: now,
      updatedAt: now
    };

    try {
      const sql = getSqlClient();
      await sql`
        INSERT INTO library_items (
          id, user_id, name, item_kind, file_type, parent_id, ancestors, icon, cover_image, storage, artifact_data, created_at, updated_at
        ) VALUES (
          ${copyItem._id}, ${userId}, ${copyItem.name}, ${copyItem.itemKind}, ${copyItem.fileType}, ${copyItem.parentId},
          ${JSON.stringify(copyItem.ancestors)}::jsonb, ${copyItem.icon || null}, ${copyItem.coverImage || null},
          ${JSON.stringify(copyItem.storage || {})}::jsonb, ${JSON.stringify(copyItem.artifactData || {})}::jsonb,
          ${now}, ${now}
        )
      `;
    } catch {
      // Memory store fallback
    }

    memoryStore.set(copyId, copyItem);
    return reply.status(201).send(copyItem);
  });

  // ----------------------------------------------------
  // 9. DELETE /api/library/items/:id (Cascading delete)
  // ----------------------------------------------------
  server.delete('/api/library/items/:id', async (req, reply) => {
    await initLibraryDatabase();
    const userId = getUserId(req);
    const { id } = req.params as { id: string };

    try {
      const sql = getSqlClient();

      // Find all descendant items recursively for this user
      const allRows = await sql`SELECT * FROM library_items WHERE user_id = ${userId}`;
      const allItems = allRows.map(rowToItem);

      const itemsToDelete = new Set<string>([id]);
      let added = true;
      while (added) {
        added = false;
        for (const item of allItems) {
          if (item.parentId && itemsToDelete.has(item.parentId) && !itemsToDelete.has(item._id)) {
            itemsToDelete.add(item._id);
            added = true;
          }
        }
      }

      // Delete files from disk
      for (const item of allItems) {
        if (itemsToDelete.has(item._id)) {
          if (item.storage?.storagePath && fs.existsSync(item.storage.storagePath)) {
            try { fs.unlinkSync(item.storage.storagePath); } catch {}
          }
          memoryStore.delete(item._id);
        }
      }

      // Delete from DB in cascade
      const idsArray = Array.from(itemsToDelete);
      await sql`DELETE FROM library_items WHERE id = ANY(${idsArray}) AND user_id = ${userId}`;

      return reply.status(200).send({
        success: true,
        deletedCount: itemsToDelete.size,
        deletedIds: idsArray
      });
    } catch {
      // Memory store fallback cascading delete
      const itemsToDelete = new Set<string>([id]);
      let added = true;
      while (added) {
        added = false;
        for (const [itemId, item] of memoryStore.entries()) {
          if (item.parentId && itemsToDelete.has(item.parentId) && !itemsToDelete.has(itemId)) {
            itemsToDelete.add(itemId);
            added = true;
          }
        }
      }
      for (const itemId of itemsToDelete) {
        memoryStore.delete(itemId);
      }
      return reply.status(200).send({
        success: true,
        deletedCount: itemsToDelete.size,
        deletedIds: Array.from(itemsToDelete)
      });
    }
  });
};
