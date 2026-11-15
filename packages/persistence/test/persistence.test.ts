import { describe, it, expect } from 'vitest';
import {
  INITIAL_LIBRARY_DOCUMENTS,
  INITIAL_LIBRARY_FOLDERS
} from '../src/index.js';

describe('Phase 03 Tiptap Document Persistence Models', () => {
  it('provides structured canonical initial documents in Tiptap JSON format', () => {
    expect(INITIAL_LIBRARY_DOCUMENTS).toHaveLength(1);
    const doc = INITIAL_LIBRARY_DOCUMENTS[0];
    expect(doc.id).toBe('doc-synaptic-plasticity');
    expect(doc.title).toBe('Synaptic Plasticity & Memory Synthesis');
    expect(doc.content).toBeDefined();
    expect(doc.content.type).toBe('doc');
    expect(Array.isArray(doc.content.content)).toBe(true);
    expect(doc.wordCount).toBeGreaterThan(0);
  });

  it('provides initial organization folders', () => {
    expect(INITIAL_LIBRARY_FOLDERS.length).toBeGreaterThan(0);
    expect(INITIAL_LIBRARY_FOLDERS[0].name).toBe('Neurobiology & Synapse');
  });
});
