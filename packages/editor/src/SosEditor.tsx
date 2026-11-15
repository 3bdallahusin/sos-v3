import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getDefaultExtensions } from './extensions.js';
import { EditorToolbar } from './EditorToolbar.js';
import type { SosEditorProps } from './types.js';

export const SosEditor: React.FC<SosEditorProps> = ({
  initialContent,
  onUpdate,
  readOnly = false,
  placeholder,
  autoFocus = true,
  className = '',
  showToolbar = true,
  onEditorReady
}) => {
  const isUpdatingFromProps = useRef(false);

  const editor = useEditor({
    extensions: getDefaultExtensions({ placeholder }),
    content: initialContent || '',
    editable: !readOnly,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class:
          'w-full min-h-[480px] p-6 text-sm text-[#E4E4E7] leading-relaxed outline-none font-normal selection:bg-[#27272A] selection:text-white',
        'data-testid': 'tiptap-content-editable'
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      if (isUpdatingFromProps.current) return;
      const json = currentEditor.getJSON();
      const plainText = currentEditor.getText();
      const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
      onUpdate?.(json, plainText, wordCount);
    }
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Synchronize when initialContent is swapped externally (e.g., switching documents)
  useEffect(() => {
    if (!editor || !initialContent) return;
    const currentJSON = editor.getJSON();
    // Compare basic structure or skip if active user typing
    if (JSON.stringify(currentJSON) !== JSON.stringify(initialContent)) {
      isUpdatingFromProps.current = true;
      editor.commands.setContent(initialContent);
      isUpdatingFromProps.current = false;
    }
  }, [editor, initialContent]);

  return (
    <div
      className={`w-full h-full flex flex-col bg-[#09090B] overflow-hidden select-text ${className}`}
      data-testid="sos-editor-container"
    >
      {showToolbar && <EditorToolbar editor={editor} />}
      <div className="flex-1 overflow-y-auto min-h-0 bg-[#09090B]">
        <div className="max-w-[760px] mx-auto py-4">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
