import { describe, it, expect } from 'vitest';
import {
  HealthResponseSchema,
  ReadinessResponseSchema,
  NavigationDestinationSchema,
  WorkspaceSchema,
  TaskItemSchema,
  RecentStudyItemSchema,
  DailyStudyGoalSchema,
  LibraryDocumentSchema,
  LibraryFolderSchema,
  UserProfileSchema,
  AggregatedStudyStatsSchema,
  PreMigrationSnapshotSchema
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

  it('validates Phase 03 LibraryDocumentSchema and LibraryFolderSchema', () => {
    const validDoc = {
      id: 'doc-1',
      workspaceId: 'ws-1',
      title: 'Synaptic Plasticity & Memory Synthesis',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Synaptic Plasticity' }]
          }
        ]
      },
      plainTextPreview: 'Synaptic Plasticity',
      wordCount: 2,
      readTimeMinutes: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    expect(LibraryDocumentSchema.safeParse(validDoc).success).toBe(true);

    const validFolder = {
      id: 'folder-1',
      workspaceId: 'ws-1',
      name: 'Neurobiology',
      icon: '🧠',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    expect(LibraryFolderSchema.safeParse(validFolder).success).toBe(true);
  });

  it('validates Phase 08 UserProfileSchema, AggregatedStudyStatsSchema, and PreMigrationSnapshotSchema', () => {
    const validProfile = {
      id: 'scholar-1',
      name: 'Abdalla Husin',
      handle: '@abdalla7usin',
      isAuthenticated: true,
      institution: 'Stanford Online',
      learningFocus: 'Computer Science',
      joinedDate: 'November 2026'
    };
    expect(UserProfileSchema.safeParse(validProfile).success).toBe(true);

    const validStats = {
      tasksCompleted: 4,
      tasksTotal: 6,
      libraryFoldersCount: 3,
      libraryFilesCount: 2,
      streakDays: 7,
      studyHours: null,
      flashcardsReviewed: null
    };
    expect(AggregatedStudyStatsSchema.safeParse(validStats).success).toBe(true);

    const validSnapshot = {
      snapshotId: 'snap-123',
      createdAt: new Date().toISOString(),
      workspaceId: 'guest-ws',
      taskCount: 6,
      folderCount: 3,
      fileCount: 2,
      integrityHash: 'sha256_mock_hash'
    };
    expect(PreMigrationSnapshotSchema.safeParse(validSnapshot).success).toBe(true);
  });

  it('validates Phase 05 TrackingSessionSchema', async () => {
    const { TrackingSessionSchema } = await import('../src/index.js');
    const validSession = {
      id: 'session-1',
      title: 'Distributed Consensus & Raft Protocol',
      mode: 'countdown',
      status: 'completed',
      startTime: 1700000000000,
      endTime: 1700003000000,
      pauseIntervals: [{ pausedAt: 1700001000000, resumedAt: 1700001200000 }],
      durationSeconds: 2800,
      durationMinutes: 47,
      plannedDurationMinutes: 50,
      folderId: 'folder-cs',
      fileId: 'file-raft-paper',
      subtitle: 'Computer Science • Research Paper Analysis',
      createdAt: new Date().toISOString()
    };
    expect(TrackingSessionSchema.safeParse(validSession).success).toBe(true);

    const invalid = { id: '', title: '', mode: 'unknown' };
    expect(TrackingSessionSchema.safeParse(invalid).success).toBe(false);
  });

  it('validates Phase 06 CalendarEventSchema', async () => {
    const { CalendarEventSchema } = await import('../src/index.js');
    const validEvent = {
      id: 'event-1',
      title: 'Synaptic Vesicle Exocytosis Deep Dive',
      type: 'study_block',
      startTime: '2026-11-12T16:00:00.000Z',
      endTime: '2026-11-12T17:30:00.000Z',
      folderId: 'folder-neurobiology',
      fileId: 'file-kandel-pdf',
      resourceMeta: 'p. 42',
      notes: 'Focus on SNARE complex mechanism',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    expect(CalendarEventSchema.safeParse(validEvent).success).toBe(true);

    const invalid = { id: '', type: 'bad_type' };
    expect(CalendarEventSchema.safeParse(invalid).success).toBe(false);
  });
});
