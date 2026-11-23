import type { Block, PartialBlock } from '@blocknote/core';

/**
 * Recursively extracts clean plain text from BlockNote blocks or inline content items.
 */
export function extractPlainTextFromBlocks(blocks: any[]): string {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];

  for (const block of blocks) {
    if (typeof block.content === 'string') {
      parts.push(block.content);
    } else if (Array.isArray(block.content)) {
      for (const item of block.content) {
        if (typeof item === 'string') {
          parts.push(item);
        } else if (item && typeof item === 'object') {
          if ('text' in item && typeof (item as { text?: unknown }).text === 'string') {
            parts.push((item as { text: string }).text);
          } else if ('content' in item && typeof (item as { content?: unknown }).content === 'string') {
            parts.push((item as { content: string }).content);
          }
        }
      }
    } else if (block.content && typeof block.content === 'object' && 'rows' in block.content) {
      // Table block handling
      const rows = (block.content as { rows?: { cells?: unknown[][] }[] }).rows;
      if (Array.isArray(rows)) {
        for (const row of rows) {
          if (Array.isArray(row.cells)) {
            for (const cell of row.cells) {
              if (Array.isArray(cell)) {
                for (const cellItem of cell) {
                  if (typeof cellItem === 'string') {
                    parts.push(cellItem);
                  } else if (cellItem && typeof cellItem === 'object' && 'text' in cellItem) {
                    parts.push(String((cellItem as { text?: unknown }).text || ''));
                  }
                }
              }
            }
          }
        }
      }
    }

    if (Array.isArray(block.children) && block.children.length > 0) {
      parts.push(extractPlainTextFromBlocks(block.children));
    }
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Counts whitespace-separated words in a text string.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Calculates estimated reading time in minutes (based on 180 words/min average academic reading speed).
 */
export function calculateReadTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 180));
}

/**
 * Robustly converts legacy Tiptap JSON document trees into BlockNote-compatible PartialBlock array.
 */
export function convertTiptapJsonToBlockNote(doc: unknown): PartialBlock[] {
  if (!doc || typeof doc !== 'object') return [];
  const tiptapDoc = doc as { type?: string; content?: unknown[] };
  if (!Array.isArray(tiptapDoc.content)) return [];

  function extractTiptapNodeText(node: unknown): string {
    if (!node) return '';
    if (typeof node === 'string') return node;
    const n = node as { text?: string; content?: unknown[] };
    if (typeof n.text === 'string') return n.text;
    if (Array.isArray(n.content)) {
      return n.content.map(extractTiptapNodeText).join('');
    }
    return '';
  }

  const blocks: PartialBlock[] = [];

  for (const rawNode of tiptapDoc.content) {
    if (!rawNode || typeof rawNode !== 'object') continue;
    const node = rawNode as {
      type?: string;
      attrs?: Record<string, unknown>;
      content?: unknown[];
    };

    switch (node.type) {
      case 'heading': {
        const level = (node.attrs?.level as 1 | 2 | 3) || 1;
        blocks.push({
          type: 'heading',
          props: { level: Math.min(3, Math.max(1, level)) as 1 | 2 | 3 },
          content: extractTiptapNodeText(node)
        });
        break;
      }
      case 'paragraph': {
        blocks.push({
          type: 'paragraph',
          content: extractTiptapNodeText(node)
        });
        break;
      }
      case 'blockquote': {
        blocks.push({
          type: 'quote',
          content: extractTiptapNodeText(node)
        });
        break;
      }
      case 'taskList': {
        if (Array.isArray(node.content)) {
          for (const rawItem of node.content) {
            const item = rawItem as { attrs?: { checked?: boolean }; content?: unknown[] };
            blocks.push({
              type: 'checkListItem',
              props: { checked: Boolean(item.attrs?.checked) },
              content: extractTiptapNodeText(item)
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
              content: extractTiptapNodeText(item)
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
              content: extractTiptapNodeText(item)
            });
          }
        }
        break;
      }
      case 'codeBlock': {
        blocks.push({
          type: 'codeBlock',
          props: { language: (node.attrs?.language as string) || 'text' },
          content: extractTiptapNodeText(node)
        });
        break;
      }
      default: {
        const text = extractTiptapNodeText(node);
        if (text) {
          blocks.push({
            type: 'paragraph',
            content: text
          });
        }
        break;
      }
    }
  }

  return blocks;
}
