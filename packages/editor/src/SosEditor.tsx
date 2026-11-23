import React, { useEffect, useMemo } from 'react';
import { filterSuggestionItems } from '@blocknote/core';
import {
  useCreateBlockNote,
  SuggestionMenuController,
  SideMenuController,
  getDefaultReactSlashMenuItems
} from '@blocknote/react';
import { offset } from '@floating-ui/react';
import { BlockNoteView, darkDefaultTheme, type Theme } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/core/style.css';
import '@blocknote/mantine/style.css';
import type { SOSEditorProps } from './types.js';
import { extractPlainTextFromBlocks, countWords } from './utils.js';
import { sosSchema, getSosCustomSlashMenuItems } from './schema.js';
import { FolderEditorProvider } from './FolderContext.js';
import { useMarqueeSelection } from './useMarqueeSelection.js';

// Official BlockNote Mantine dark theme cleanly mapped to SOS Obsidian palette
export const sosDarkTheme: Theme = {
  ...darkDefaultTheme,
  colors: {
    ...darkDefaultTheme.colors,
    editor: {
      text: '#E4E4E7',
      background: '#09090B'
    },
    menu: {
      text: '#FAFAFA',
      background: '#141417'
    },
    tooltip: {
      text: '#FAFAFA',
      background: '#18181B'
    },
    hovered: {
      text: '#FFFFFF',
      background: '#1F1F23'
    },
    selected: {
      text: '#FFFFFF',
      background: '#27272A'
    },
    disabled: {
      text: '#52525B',
      background: '#141417'
    },
    shadow: 'rgba(0, 0, 0, 0.65)',
    border: '#27272A',
    sideMenu: '#71717A',
    highlights: darkDefaultTheme.colors?.highlights || {}
  },
  borderRadius: 8,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

export const SOSEditor: React.FC<SOSEditorProps> = ({
  initialContent,
  onUpdate,
  onChange,
  readOnly = false,
  className = '',
  layout = 'centered',
  onEditorReady,
  onScroll,
  dir = 'auto',
  folderContext,
  onCreateFolder
}) => {
  // Initialize the BlockNote Community editor instance with custom sosSchema
  const editor = useCreateBlockNote({
    schema: sosSchema,
    initialContent: initialContent && initialContent.length > 0 ? (initialContent as any) : undefined
  });

  // Notion-Style 2D Marquee Selection Hook (#60A5FA)
  const {
    containerRef,
    handlePointerDown,
    renderMarqueeOverlay,
    selectedBlockIds,
    setSelectedBlockIds
  } = useMarqueeSelection({
    editor: editor as any,
    readOnly,
    folderContext
  });

  // Signal editor readiness to parent callers
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor as any);
    }
  }, [editor, onEditorReady]);

  // Click anywhere on empty page canvas to focus or create line at that exact vertical position (Notion-grade)
  const handleEmptyCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      readOnly ||
      target.closest(
        'button, input, textarea, a, [role="button"], [data-drag-handle], .bn-block, .bn-side-menu, [data-testid*="popover"]'
      )
    ) {
      return;
    }

    if (!editor || !containerRef.current) return;

    try {
      const allBlockOuters = Array.from(
        containerRef.current.querySelectorAll('.bn-block-outer')
      ) as HTMLElement[];

      const clickY = e.clientY;

      // 1. Horizontal Margin Click: If clicked horizontally aligned with an existing block row
      for (const blockOuter of allBlockOuters) {
        const rect = blockOuter.getBoundingClientRect();
        if (clickY >= rect.top && clickY <= rect.bottom) {
          const blockEl = blockOuter.querySelector('[data-id]') || blockOuter;
          const blockId = blockEl.getAttribute('data-id');
          if (blockId) {
            editor.setTextCursorPosition(blockId, 'end');
            editor.focus();
            return;
          }
        }
      }

      // 2. Click Below Existing Content: Calculate line offset in ~28px increments
      const doc = editor.document;
      const lastBlock = doc[doc.length - 1];
      const lastBlockEl = allBlockOuters[allBlockOuters.length - 1];
      const lastRect = lastBlockEl?.getBoundingClientRect();

      if (lastRect && clickY > lastRect.bottom) {
        const lineDiff = Math.max(1, Math.min(8, Math.floor((clickY - lastRect.bottom) / 28)));
        const blocksToInsert = Array.from({ length: lineDiff }, () => ({
          type: 'paragraph',
          content: ''
        }));

        if (lastBlock?.id) {
          editor.insertBlocks(blocksToInsert as any, lastBlock.id, 'after');
        } else {
          editor.insertBlocks(blocksToInsert as any, (editor.document[0]?.id || '') as any, 'after');
        }

        const updatedDoc = editor.document;
        const newTarget = updatedDoc[updatedDoc.length - 1];
        if (newTarget) {
          editor.setTextCursorPosition(newTarget.id, 'start');
          editor.focus();
        }
        return;
      }

      // 3. Fallback: focus last block or append one
      if (
        lastBlock &&
        lastBlock.type === 'paragraph' &&
        (!lastBlock.content || lastBlock.content.length === 0)
      ) {
        editor.setTextCursorPosition(lastBlock.id, 'end');
        editor.focus();
        return;
      }

      if (lastBlock?.id) {
        editor.insertBlocks([{ type: 'paragraph', content: '' }] as any, lastBlock.id, 'after');
      } else {
        editor.insertBlocks([{ type: 'paragraph', content: '' }] as any, (editor.document[0]?.id || '') as any, 'after');
      }

      const updatedDoc = editor.document;
      const newLast = updatedDoc[updatedDoc.length - 1];
      if (newLast) {
        editor.setTextCursorPosition(newLast.id, 'start');
        editor.focus();
      }
    } catch (err) {
      console.debug('Failed to handle empty canvas click:', err);
    }
  };

  // Layout presentation options (max-w-[1440px] matching wide center panel)
  const layoutClass =
    layout === 'centered'
      ? 'w-full max-w-[1440px] mx-auto px-6 md:px-8'
      : 'w-full py-8 px-6 md:px-8';

  const isUnifiedScroll = className.includes('overflow-visible') || className.includes('h-auto');
  const containerClasses = isUnifiedScroll
    ? `w-full bg-[#09090B] ${className}`
    : `w-full h-full overflow-y-auto bg-[#09090B] custom-scrollbar ${className}`;

  const editorContent = (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onClick={handleEmptyCanvasClick}
      className={containerClasses}
      onScroll={onScroll}
      data-testid="sos-editor-container"
      dir={dir}
    >
      <div className={layoutClass} data-testid="blocknote-content-editable">
        <BlockNoteView
          editor={editor}
          editable={!readOnly}
          theme={sosDarkTheme}
          slashMenu={false}
          sideMenu={false}
          onChange={() => {
            const doc = editor.document;
            const plainText = extractPlainTextFromBlocks(doc);
            const words = countWords(plainText);
            onChange?.(doc as any);
            onUpdate?.(doc as any, plainText, words);
          }}
        >
          <SideMenuController />
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) =>
              filterSuggestionItems(
                [
                  ...getDefaultReactSlashMenuItems(editor),
                  ...getSosCustomSlashMenuItems(editor, onCreateFolder)
                ],
                query
              )
            }
          />
        </BlockNoteView>
        {/* Generous empty bottom canvas zone to click and type anywhere */}
        <div
          className="w-full cursor-text"
          style={{ minHeight: 160, width: '100%', display: 'block' }}
          onClick={handleEmptyCanvasClick}
          data-testid="empty-canvas-bottom-area"
        />
      </div>
      {renderMarqueeOverlay()}
    </div>
  );

  const enrichedFolderContext = useMemo(() => {
    if (!folderContext) return null;
    return {
      ...folderContext,
      selectedIds: selectedBlockIds,
      onSelectIds: setSelectedBlockIds
    };
  }, [folderContext, selectedBlockIds, setSelectedBlockIds]);

  if (enrichedFolderContext) {
    return <FolderEditorProvider value={enrichedFolderContext}>{editorContent}</FolderEditorProvider>;
  }

  return editorContent;
};

// Canonical export and backward compatibility alias
export const SosEditor = SOSEditor;
