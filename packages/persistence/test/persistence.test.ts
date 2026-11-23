import { describe, it, expect } from 'vitest';
import {
  INITIAL_LIBRARY_FOLDERS,
  INITIAL_LIBRARY_FILES,
  INITIAL_LIBRARY_DOCUMENTS,
  DEFAULT_USER_PROFILE
} from '../src/index.js';

describe('Library Persistence Models (BlockNote Community)', () => {
  it('provides initial organization folders with BlockNote block arrays including library-root', () => {
    expect(INITIAL_LIBRARY_FOLDERS.length).toBeGreaterThan(0);
    const root = INITIAL_LIBRARY_FOLDERS[0];
    expect(root.id).toBe('library-root');
    expect(root.name).toBe('Library');
    expect(root.parentId).toBeNull();
    expect(root.layoutSettings).toBeDefined();

    const neuroFolder = INITIAL_LIBRARY_FOLDERS.find(f => f.id === 'folder-neurobiology')!;
    expect(neuroFolder).toBeDefined();
    expect(neuroFolder.name).toBe('Neurobiology & Synapse');
    expect(neuroFolder.parentId).toBe('folder-decagon');
    expect(Array.isArray(neuroFolder.content)).toBe(true);
    expect(neuroFolder.content.length).toBeGreaterThan(0);
    expect((neuroFolder.content[0] as any).type).toBe('heading');
    expect(neuroFolder.wordCount).toBeGreaterThan(0);
  });

  it('provides initial library study files distinct from folders', () => {
    expect(INITIAL_LIBRARY_FILES.length).toBeGreaterThan(0);
    const file = INITIAL_LIBRARY_FILES[0];
    expect(file.id).toBe('file-kandel-pdf');
    expect(file.title).toBe('Kandel_Principles_Ch12.pdf');
    expect(file.type).toBe('pdf');
    expect(file.path).toContain('/learning');
  });

  it('maintains backwards-compatible document mapping', () => {
    expect(INITIAL_LIBRARY_DOCUMENTS.length).toBe(INITIAL_LIBRARY_FOLDERS.length);
    expect(INITIAL_LIBRARY_DOCUMENTS[0].title).toBe('Library');
    expect(Array.isArray(INITIAL_LIBRARY_DOCUMENTS[0].content)).toBe(true);
  });

  it('provides default authenticated user profile', () => {
    expect(DEFAULT_USER_PROFILE.isAuthenticated).toBe(true);
    expect(DEFAULT_USER_PROFILE.name).toBe('Abdalla Husin');
    expect(DEFAULT_USER_PROFILE.handle).toBe('@abdalla7usin');
    expect(DEFAULT_USER_PROFILE.academicTracks?.length).toBeGreaterThan(0);
  });
});
