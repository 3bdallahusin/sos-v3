import React from 'react';
import type { Editor } from '@tiptap/core';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  SquareCode,
  Undo2,
  Redo2
} from 'lucide-react';

export interface EditorToolbarProps {
  editor: Editor | null;
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, className = '' }) => {
  if (!editor) return null;

  const btnClass = (isActive: boolean, disabled: boolean = false) =>
    `h-[28px] w-[28px] flex items-center justify-center rounded-[6px] transition-colors select-none ${
      disabled
        ? 'opacity-30 cursor-not-allowed text-[#52525B]'
        : isActive
        ? 'bg-[#27272A] text-white border border-[#3F3F46]'
        : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
    }`;

  return (
    <div
      className={`flex items-center flex-wrap gap-1 px-3 py-1.5 bg-[#09090B] border-b border-[#1F1F23] select-none ${className}`}
      data-testid="editor-toolbar"
    >
      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-[#1F1F23]">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={btnClass(false, !editor.can().undo())}
          title="Undo (Ctrl+Z)"
          data-testid="toolbar-undo"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={btnClass(false, !editor.can().redo())}
          title="Redo (Ctrl+Y)"
          data-testid="toolbar-redo"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-[#1F1F23]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btnClass(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
          data-testid="toolbar-h1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
          data-testid="toolbar-h2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btnClass(editor.isActive('heading', { level: 3 }))}
          title="Heading 3"
          data-testid="toolbar-h3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Inline Formatting */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-[#1F1F23]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="Bold (Ctrl+B)"
          data-testid="toolbar-bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive('italic'))}
          title="Italic (Ctrl+I)"
          data-testid="toolbar-italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(editor.isActive('strike'))}
          title="Strikethrough"
          data-testid="toolbar-strike"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={btnClass(editor.isActive('code'))}
          title="Inline Code"
          data-testid="toolbar-code"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-[#1F1F23]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive('bulletList'))}
          title="Bullet List"
          data-testid="toolbar-bullet-list"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive('orderedList'))}
          title="Numbered List"
          data-testid="toolbar-ordered-list"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={btnClass(editor.isActive('taskList'))}
          title="Task Checklist"
          data-testid="toolbar-task-list"
        >
          <ListTodo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Blocks: Quote & Code Block */}
      <div className="flex items-center gap-0.5 pl-1.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive('blockquote'))}
          title="Blockquote"
          data-testid="toolbar-blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={btnClass(editor.isActive('codeBlock'))}
          title="Code Block"
          data-testid="toolbar-codeblock"
        >
          <SquareCode className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
