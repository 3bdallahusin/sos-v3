import { describe, it, expect } from 'vitest';
import {
  HealthResponseSchema,
  ReadinessResponseSchema,
  NavigationDestinationSchema,
  WorkspaceSchema,
  TaskItemSchema,
  RecentStudyItemSchema,
  DailyStudyGoalSchema,
  LibraryFolderSchema,
  LibraryItemSchema,
  LibraryViewSettingsSchema,
  LibraryBackupManifestSchema
} from '../src/index.js';

describe('Shared Contracts (Phase 01 & Phase 02)', () => {
  it('validates health response schema', () => {
    const valid = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      uptime: 12.34
    };
    expect(HealthResponseSchema.safeParse(valid).success).toBe(true);

    const invalid = { status: 'bad' };
    expect(HealthResponseSchema.safeParse(invalid).success).toBe(false);
  });

  it('validates readiness response schema', () => {
    const ready = {
      status: 'ready',
      database: 'connected',
      databaseName: 'sos_v3_dev',
      databaseUser: 'sos_v3_app',
      timestamp: new Date().toISOString()
    };
    expect(ReadinessResponseSchema.safeParse(ready).success).toBe(true);

    const notReady = {
      status: 'not_ready',
      database: 'disconnected',
      error: 'Connection timed out',
      timestamp: new Date().toISOString()
    };
    expect(ReadinessResponseSchema.safeParse(notReady).success).toBe(true);
  });

  it('validates navigation destinations', () => {
    expect(NavigationDestinationSchema.safeParse('home').success).toBe(true);
    expect(NavigationDestinationSchema.safeParse('settings').success).toBe(true);
    expect(NavigationDestinationSchema.safeParse('unknown').success).toBe(false);
  });

  it('validates workspace contracts', () => {
    const ws = {
      id: '018f6c35-7140-7bc0-a19e-e0921471d87f',
      name: 'Guest Workspace',
      isGuest: true,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      settings: {
        railExpanded: false,
        aiPanelOpen: true
      }
    };
    expect(WorkspaceSchema.safeParse(ws).success).toBe(true);
  });

  it('validates Phase 02 TaskItemSchema', () => {
    const task = {
      id: 'task-1',
      title: 'Neurobiology Lecture 04',
      completed: false,
      order: 0,
      createdAt: new Date().toISOString()
    };
    expect(TaskItemSchema.safeParse(task).success).toBe(true);

    const invalidTask = { id: '', title: '' };
    expect(TaskItemSchema.safeParse(invalidTask).success).toBe(false);
  });

  it('validates Phase 02 RecentStudyItemSchema', () => {
    const item = {
      id: 'item-1',
      title: 'Kandel_Principles_Ch12.pdf',
      subtitle: 'Page 42',
      type: 'pdf',
      path: '/learning',
      lastOpenedAt: new Date().toISOString()
    };
    expect(RecentStudyItemSchema.safeParse(item).success).toBe(true);
  });

  it('validates Phase 03 Library contracts', () => {
    const folder = {
      id: 'folder-1',
      workspaceId: 'ws-1',
      parentId: null,
      name: 'Synaptic Transmission & Plasticity',
      icon: '🧠',
      coverUrl: '/covers/synapse.png',
      description: 'Folder workspace containing lecture notes and canonical learning assets',
      summaryBlocks: [
        {
          id: 'b-1',
          type: 'callout' as const,
          title: 'Exam Key Point',
          text: 'Long-term potentiation requires NMDA receptor activation.',
          icon: '📌'
        }
      ],
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    expect(LibraryFolderSchema.safeParse(folder).success).toBe(true);

    const item = {
      id: 'item-1',
      workspaceId: 'ws-1',
      folderId: 'folder-1',
      title: 'Kandel_Principles_Ch12.pdf',
      type: 'pdf' as const,
      subtitle: 'Primary reading on synaptic mechanisms',
      sizeBytes: 12450000,
      readTimeMinutes: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    expect(LibraryItemSchema.safeParse(item).success).toBe(true);

    const viewSettings = {
      viewMode: 'gallery' as const,
      cardSize: 'normal' as const,
      sortBy: 'updatedAt' as const,
      sortOrder: 'desc' as const
    };
    expect(LibraryViewSettingsSchema.safeParse(viewSettings).success).toBe(true);

    const backupManifest = {
      version: 1,
      appName: 'SOS' as const,
      schemaVersion: 4,
      exportedAt: new Date().toISOString(),
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      foldersCount: 1,
      itemsCount: 4
    };
    expect(LibraryBackupManifestSchema.safeParse(backupManifest).success).toBe(true);
  });
});
