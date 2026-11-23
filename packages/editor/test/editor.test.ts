import { describe, it, expect } from 'vitest';
import {
  extractPlainTextFromBlocks,
  countWords,
  calculateReadTimeMinutes,
  convertTiptapJsonToBlockNote
} from '../src/utils.js';

describe('SOSEditor Utilities', () => {
  it('extracts plain text and counts words from BlockNote blocks', () => {
    const blocks = [
      {
        id: '1',
        type: 'heading',
        props: { level: 1 },
        content: [{ type: 'text', text: 'Synaptic Plasticity', styles: {} }],
        children: []
      },
      {
        id: '2',
        type: 'paragraph',
        props: {},
        content: [{ type: 'text', text: 'Activity-dependent modification of synapses.', styles: {} }],
        children: []
      }
    ] as any;

    const plainText = extractPlainTextFromBlocks(blocks);
    expect(plainText).toBe('Synaptic Plasticity Activity-dependent modification of synapses.');
    expect(countWords(plainText)).toBe(6);
    expect(calculateReadTimeMinutes(6)).toBe(1);
    expect(calculateReadTimeMinutes(360)).toBe(2);
  });

  it('safely converts legacy Tiptap JSON to BlockNote blocks', () => {
    const tiptapJson = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Lecture Title' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Intro paragraph' }]
        },
        {
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Important quote' }] }]
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Review notes' }] }]
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Do exercises' }] }]
            }
          ]
        },
        {
          type: 'codeBlock',
          attrs: { language: 'typescript' },
          content: [{ type: 'text', text: 'const x = 1;' }]
        }
      ]
    };

    const converted = convertTiptapJsonToBlockNote(tiptapJson);
    expect(converted).toHaveLength(6);
    expect(converted[0]).toMatchObject({
      type: 'heading',
      props: { level: 1 },
      content: 'Lecture Title'
    });
    expect(converted[1]).toMatchObject({
      type: 'paragraph',
      content: 'Intro paragraph'
    });
    expect(converted[2]).toMatchObject({
      type: 'quote',
      content: 'Important quote'
    });
    expect(converted[3]).toMatchObject({
      type: 'checkListItem',
      props: { checked: true },
      content: 'Review notes'
    });
    expect(converted[4]).toMatchObject({
      type: 'checkListItem',
      props: { checked: false },
      content: 'Do exercises'
    });
    expect(converted[5]).toMatchObject({
      type: 'codeBlock',
      props: { language: 'typescript' },
      content: 'const x = 1;'
    });
  });

  it('handles empty or invalid content gracefully', () => {
    expect(extractPlainTextFromBlocks([])).toBe('');
    expect(extractPlainTextFromBlocks(null as any)).toBe('');
    expect(convertTiptapJsonToBlockNote(null)).toEqual([]);
    expect(convertTiptapJsonToBlockNote({})).toEqual([]);
    expect(countWords('')).toBe(0);
  });
});
