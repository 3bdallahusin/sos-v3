import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { type FastifyInstance } from 'fastify';
import { buildServer } from '../src/server.js';
import { closeDatabaseConnection } from '../src/db.js';

describe('Library REST API & Persistence Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeDatabaseConnection();
  });

  it('GET /api/library/items returns root folders with childCount and breadcrumbs', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/library/items'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.breadcrumbs).toBeDefined();
    expect(body.breadcrumbs).toEqual([]);
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);

    // Root folders exist
    const names = body.items.map((i: any) => i.name);
    expect(names).toContain('Computer Science');
    expect(names).toContain('Economics & Finance');

    const csFolder = body.items.find((i: any) => i.name === 'Computer Science');
    expect(csFolder.itemKind).toBe('folder');
    expect(csFolder.icon).toBe('💻');
    expect(csFolder.childCount).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/library/items?parentId=folder-dist-sys returns subfolder items and breadcrumbs', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/library/items?parentId=folder-dist-sys'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.breadcrumbs.length).toBe(2);
    expect(body.breadcrumbs[0].name).toBe('Computer Science');
    expect(body.breadcrumbs[1].name).toBe('Distributed Systems');

    // Contains all 12 SOS types
    const fileTypes = new Set(body.items.map((i: any) => i.fileType));
    expect(fileTypes.has('pdf')).toBe(true);
    expect(fileTypes.has('video')).toBe(true);
    expect(fileTypes.has('note')).toBe(true);
    expect(fileTypes.has('flashcards')).toBe(true);
    expect(fileTypes.has('quiz')).toBe(true);
    expect(fileTypes.has('image')).toBe(true);
    expect(fileTypes.has('spreadsheet')).toBe(true);
    expect(fileTypes.has('audio')).toBe(true);
    expect(fileTypes.has('browser')).toBe(true);
    expect(fileTypes.has('exam')).toBe(true);
    expect(fileTypes.has('docx')).toBe(true);
    expect(fileTypes.has('slides')).toBe(true);
  });

  it('POST /api/library/folders creates a new folder with emoji and prevents duplicate names', async () => {
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/library/folders',
      payload: {
        name: 'New Test Folder',
        parentId: 'folder-dist-sys',
        icon: '🔬'
      }
    });

    expect(res1.statusCode).toBe(201);
    const folder1 = JSON.parse(res1.payload);
    expect(folder1.name).toBe('New Test Folder');
    expect(folder1.icon).toBe('🔬');
    expect(folder1.parentId).toBe('folder-dist-sys');
    expect(folder1.ancestors.length).toBe(2);

    // Create duplicate sibling -> should append (1)
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/library/folders',
      payload: {
        name: 'New Test Folder',
        parentId: 'folder-dist-sys'
      }
    });

    expect(res2.statusCode).toBe(201);
    const folder2 = JSON.parse(res2.payload);
    expect(folder2.name).toBe('New Test Folder (1)');

    // Cleanup
    await app.inject({ method: 'DELETE', url: `/api/library/items/${folder1._id}` });
    await app.inject({ method: 'DELETE', url: `/api/library/items/${folder2._id}` });
  });

  it('PATCH /api/library/items/:id prevents circular moves and propagates rename', async () => {
    // 1. Create Folder A and Subfolder B
    const resA = await app.inject({
      method: 'POST',
      url: '/api/library/folders',
      payload: { name: 'Parent Folder A' }
    });
    const folderA = JSON.parse(resA.payload);

    const resB = await app.inject({
      method: 'POST',
      url: '/api/library/folders',
      payload: { name: 'Child Folder B', parentId: folderA._id }
    });
    const folderB = JSON.parse(resB.payload);

    // 2. Try to move Parent A inside Child B -> should fail with 400
    const circularRes = await app.inject({
      method: 'PATCH',
      url: `/api/library/items/${folderA._id}`,
      payload: { parentId: folderB._id }
    });
    expect(circularRes.statusCode).toBe(400);

    // 3. Rename Folder A -> verify
    const renameRes = await app.inject({
      method: 'PATCH',
      url: `/api/library/items/${folderA._id}`,
      payload: { name: 'Renamed Folder A', icon: '⚡' }
    });
    expect(renameRes.statusCode).toBe(200);
    const renamedA = JSON.parse(renameRes.payload);
    expect(renamedA.name).toBe('Renamed Folder A');
    expect(renamedA.icon).toBe('⚡');

    // 4. Cleanup
    await app.inject({ method: 'DELETE', url: `/api/library/items/${folderA._id}` });
  });

  it('POST /api/library/items/:id/duplicate duplicates an item', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/library/items/file-raft-pdf/duplicate'
    });

    expect(res.statusCode).toBe(201);
    const copy = JSON.parse(res.payload);
    expect(copy.name).toBe('Distributed_Consensus_Raft.pdf (Copy)');
    expect(copy._id).not.toBe('file-raft-pdf');

    // Cleanup
    await app.inject({ method: 'DELETE', url: `/api/library/items/${copy._id}` });
  });

  it('POST /api/library/upload rejects non-multipart requests with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/library/upload',
      payload: { notMultipart: true }
    });
    expect(res.statusCode).toBe(400);
  });

  it('syncs learning artifacts (boards & flashcards) into library', async () => {
    // 1. Create a board
    const boardRes = await app.inject({
      method: 'POST',
      url: '/api/learning/boards',
      headers: { 'x-user-id': 'test-sync-user' },
      payload: { title: 'Synapse Architecture Mindmap' }
    });
    expect(boardRes.statusCode).toBe(201);
    const board = JSON.parse(boardRes.payload);

    // 2. Verify it appears in library items for this user
    const libRes = await app.inject({
      method: 'GET',
      url: '/api/library/items?filter=all',
      headers: { 'x-user-id': 'test-sync-user' }
    });
    expect(libRes.statusCode).toBe(200);
    const libData = JSON.parse(libRes.payload);
    const syncedBoard = libData.items.find((i: any) => i.name === 'Synapse Architecture Mindmap.board');
    expect(syncedBoard).toBeDefined();
    expect(syncedBoard.fileType).toBe('board');

    // 3. Delete board and verify it is removed from library
    const delRes = await app.inject({
      method: 'DELETE',
      url: `/api/learning/boards/${board.id}`,
      headers: { 'x-user-id': 'test-sync-user' }
    });
    expect(delRes.statusCode).toBe(200);

    const libAfter = await app.inject({
      method: 'GET',
      url: '/api/library/items?filter=all',
      headers: { 'x-user-id': 'test-sync-user' }
    });
    const libAfterData = JSON.parse(libAfter.payload);
    expect(libAfterData.items.some((i: any) => i.name === 'Synapse Architecture Mindmap.board')).toBe(false);
  });
});
