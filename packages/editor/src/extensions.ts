import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import type { AnyExtension } from '@tiptap/core';

export interface EditorExtensionsConfig {
  placeholder?: string;
}

export function getDefaultExtensions(config?: EditorExtensionsConfig): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      },
      codeBlock: {
        HTMLAttributes: {
          class: 'bg-[#141417] text-[#E4E4E7] p-3.5 rounded-[8px] font-mono text-xs border border-[#27272A] my-3 overflow-x-auto'
        }
      },
      blockquote: {
        HTMLAttributes: {
          class: 'border-l-2 border-[#52525B] pl-4 italic text-[#A1A1AA] my-3'
        }
      },
      bulletList: {
        HTMLAttributes: {
          class: 'list-disc pl-5 my-2 space-y-1'
        }
      },
      orderedList: {
        HTMLAttributes: {
          class: 'list-decimal pl-5 my-2 space-y-1'
        }
      }
    }),
    Placeholder.configure({
      placeholder: config?.placeholder || 'Write lecture notes, outline synthesis, or type markdown...'
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-[#60A5FA] underline underline-offset-2 hover:text-[#93C5FD] transition-colors'
      }
    }),
    TaskList.configure({
      HTMLAttributes: {
        class: 'not-prose list-none p-0 my-2 space-y-1'
      }
    }),
    TaskItem.configure({
      nested: true,
      HTMLAttributes: {
        class: 'flex items-start gap-2.5 my-1 text-sm'
      }
    })
  ];
}
