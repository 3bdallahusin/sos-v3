import { describe, it, expect } from 'vitest';
import { sosSchema, getSosCustomSlashMenuItems } from '../src/schema.js';

describe('SOSEditor Custom Blocks and Slash Menu', () => {
  it('registers custom folder and callout block specs in sosSchema', () => {
    expect(sosSchema.blockSpecs.folder).toBeDefined();
    expect(sosSchema.blockSpecs.callout).toBeDefined();
    expect(sosSchema.blockSpecs.heading).toBeDefined();
    expect(sosSchema.blockSpecs.paragraph).toBeDefined();
  });

  it('provides slash menu items for /folder and /callout', () => {
    const mockEditor = {
      getTextCursorPosition: () => ({ block: { content: [] } }),
      updateBlock: () => ({}),
      setTextCursorPosition: () => {}
    };
    const items = getSosCustomSlashMenuItems(mockEditor);
    expect(items.length).toBe(2);

    const folderItem = items.find((i) => i.title === 'Folder')!;
    expect(folderItem).toBeDefined();
    expect(folderItem.aliases).toContain('folder');
    expect(folderItem.subtext).toContain('Gallery & Table views');

    const calloutItem = items.find((i) => i.title === 'Callout')!;
    expect(calloutItem).toBeDefined();
    expect(calloutItem.aliases).toContain('callout');
  });
});
