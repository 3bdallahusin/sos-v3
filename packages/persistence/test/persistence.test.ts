import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import {
  computeSha256,
  validateAndRestoreSosBackup,
  INITIAL_LIBRARY_FOLDERS,
  INITIAL_LIBRARY_ITEMS
} from '../src/index.js';

describe('Phase 03 Persistence & Backup Integrity', () => {
  it('computes accurate SHA-256 digests', async () => {
    const hash = await computeSha256('SOS v3 Studying Operating System');
    expect(hash).toHaveLength(64);
    expect(typeof hash).toBe('string');

    // Deterministic check
    const hash2 = await computeSha256('SOS v3 Studying Operating System');
    expect(hash).toBe(hash2);
  });

  it('rejects tampered or corrupt SOS backup archives', async () => {
    const zip = new JSZip();
    const dataPayload = JSON.stringify({
      version: 1,
      appName: 'SOS',
      schemaVersion: 4,
      folders: INITIAL_LIBRARY_FOLDERS,
      items: INITIAL_LIBRARY_ITEMS
    });

    const legitimateHash = await computeSha256(dataPayload);

    // Tampered checksum in manifest
    const manifest = {
      version: 1,
      appName: 'SOS',
      schemaVersion: 4,
      exportedAt: new Date().toISOString(),
      checksum: 'bad-tampered-checksum-000000000000000000000000000000000000000000',
      foldersCount: INITIAL_LIBRARY_FOLDERS.length,
      itemsCount: INITIAL_LIBRARY_ITEMS.length
    };

    zip.file('manifest.json', JSON.stringify(manifest));
    zip.file('data.json', dataPayload);

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    const result = await validateAndRestoreSosBackup(buffer);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Integrity check failed: checksum mismatch');
  });

  it('rejects non-SOS archives missing manifest or data', async () => {
    const zip = new JSZip();
    zip.file('random.txt', 'not an sos backup');

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    const result = await validateAndRestoreSosBackup(buffer);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid SOS archive: missing manifest.json or data.json');
  });
});
