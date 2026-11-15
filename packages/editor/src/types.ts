import type { Editor, JSONContent } from '@tiptap/core';

export type { JSONContent, Editor };

export interface SosEditorProps {
  initialContent?: JSONContent;
  onUpdate?: (content: JSONContent, plainText: string, wordCount: number) => void;
  readOnly?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  showToolbar?: boolean;
  onEditorReady?: (editor: Editor) => void;
}

export interface ToolbarAction {
  id: string;
  label: string;
  iconName: string;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
  shortcut?: string;
}
