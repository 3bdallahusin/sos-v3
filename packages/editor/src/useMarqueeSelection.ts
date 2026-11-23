import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { BlockNoteEditor } from '@blocknote/core';
import type { FolderContextValue } from './FolderContext.js';
import { extractPlainTextFromBlocks } from './utils.js';

interface Position {
  x: number;
  y: number;
}

interface UseMarqueeSelectionProps {
  editor?: BlockNoteEditor<any, any, any>;
  readOnly?: boolean;
  folderContext?: FolderContextValue | null;
}

export function useMarqueeSelection({ editor, readOnly, folderContext }: UseMarqueeSelectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<Position | null>(null);
  const [currentPos, setCurrentPos] = useState<Position | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());

  const candidateRef = useRef<Position | null>(null);
  const isMouseDownRef = useRef(false);
  const selectedIdsRef = useRef<Set<string>>(selectedBlockIds);
  selectedIdsRef.current = selectedBlockIds;

  const clearVisualSelection = useCallback(() => {
    setSelectedBlockIds(new Set());
    if (containerRef.current) {
      const elements = containerRef.current.querySelectorAll('.sos-row-selected, .sos-card-selected');
      elements.forEach((el) => {
        el.classList.remove('sos-row-selected');
        el.classList.remove('sos-card-selected');
      });
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (readOnly || e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore interactive controls, buttons, inputs, links, popovers, drag handles
      if (
        target.closest(
          'button, input, textarea, select, a, [role="button"], [data-drag-handle], .bn-side-menu, [data-testid*="popover"], [data-testid*="-btn"], [data-testid*="toggle-"]'
        )
      ) {
        return;
      }

      // If clicked inside an existing selected block without dragging, don't immediately clear
      const clickedBlock = target.closest('[data-id]');
      const clickedBlockId = clickedBlock?.getAttribute('data-id');

      if (
        selectedIdsRef.current.size > 0 &&
        (!clickedBlockId || !selectedIdsRef.current.has(clickedBlockId))
      ) {
        clearVisualSelection();
      }

      isMouseDownRef.current = true;
      candidateRef.current = { x: e.clientX, y: e.clientY };
    },
    [readOnly, clearVisualSelection]
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isMouseDownRef.current || !candidateRef.current) return;

      const dx = e.clientX - candidateRef.current.x;
      const dy = e.clientY - candidateRef.current.y;
      const distance = Math.hypot(dx, dy);

      if (!isDragging) {
        if (distance > 5) {
          setIsDragging(true);
          setStartPos(candidateRef.current);
          setCurrentPos({ x: e.clientX, y: e.clientY });

          // Suppress native text selection and side-menu pop-ins during marquee drag
          window.getSelection()?.removeAllRanges();
          document.body.style.userSelect = 'none';
          document.body.classList.add('sos-marquee-dragging');
        }
        return;
      }

      // We are actively dragging the marquee rectangle
      setCurrentPos({ x: e.clientX, y: e.clientY });
      window.getSelection()?.removeAllRanges();

      if (!candidateRef.current || !containerRef.current) return;

      const box = {
        left: Math.min(candidateRef.current.x, e.clientX),
        top: Math.min(candidateRef.current.y, e.clientY),
        right: Math.max(candidateRef.current.x, e.clientX),
        bottom: Math.max(candidateRef.current.y, e.clientY)
      };

      // Query non-folder top-level blocks AND individual Gallery cards / Table rows
      const targetEls = Array.from(
        containerRef.current.querySelectorAll(
          '.bn-block-outer:not(:has([data-content-type="folder"])), [data-selectable-id]'
        )
      ) as HTMLElement[];

      const nextSelected = new Set<string>();

      targetEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const intersects =
          box.left < rect.right &&
          box.right > rect.left &&
          box.top < rect.bottom &&
          box.bottom > rect.top;

        const selectableId = el.getAttribute('data-selectable-id');
        const blockId = !selectableId
          ? (el.querySelector('[data-id]')?.getAttribute('data-id') || el.getAttribute('data-id'))
          : null;
        const itemId = selectableId || blockId;

        if (intersects && itemId) {
          nextSelected.add(itemId);
          if (!selectableId) {
            el.classList.add('sos-row-selected');
          }
        } else {
          if (!selectableId) {
            el.classList.remove('sos-row-selected');
          }
        }
      });

      setSelectedBlockIds(nextSelected);
    };

    const handlePointerUp = () => {
      if (!isMouseDownRef.current) return;
      isMouseDownRef.current = false;
      candidateRef.current = null;
      document.body.style.userSelect = '';
      document.body.classList.remove('sos-marquee-dragging');

      if (isDragging) {
        setIsDragging(false);

        // Commit selection to BlockNote if blocks were selected
        const currentSelected = selectedIdsRef.current;
        if (currentSelected.size > 0 && editor) {
          const doc = editor.document || [];
          const orderedIds = doc
            .filter((b: any) => currentSelected.has(b.id))
            .map((b: any) => b.id);

          if (orderedIds.length > 0) {
            const firstId = orderedIds[0];
            const lastId = orderedIds[orderedIds.length - 1];
            try {
              if (typeof editor.setSelection === 'function') {
                editor.setSelection(firstId, lastId);
              }
            } catch (err) {
              console.debug('Failed to set selection in editor:', err);
            }
          }
        }

        setStartPos(null);
        setCurrentPos(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, editor]);

  // Keyboard navigation & deletion support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIdsRef.current.size === 0) return;

      // 1. Escape: Clear Selection
      if (e.key === 'Escape') {
        e.preventDefault();
        clearVisualSelection();
        return;
      }

      // 2. Delete / Backspace: Remove selected blocks
      if (e.key === 'Backspace' || e.key === 'Delete') {
        // Do not intercept if actively typing inside an input or textarea
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            (activeEl as HTMLElement).isContentEditable)
        ) {
          // If contentEditable is focused, but user has multiple blocks selected via marquee, delete the blocks
          if (selectedIdsRef.current.size <= 1 && (activeEl as HTMLElement).isContentEditable) {
            return;
          }
        }

        e.preventDefault();
        e.stopPropagation();

        const toRemove = Array.from(selectedIdsRef.current);
        if (toRemove.length > 0) {
          // 1. Remove top-level blocks from BlockNote editor
          if (editor) {
            const doc = editor.document || [];
            const blockIdsToRemove = toRemove.filter((id) => doc.some((b: any) => b.id === id));
            if (blockIdsToRemove.length > 0) {
              try {
                editor.removeBlocks(blockIdsToRemove);
              } catch (err) {
                console.debug('Error removing blocks:', err);
              }
            }
          }

          // 2. Remove selected folders and files via real persistence
          if (folderContext) {
            toRemove.forEach((id) => {
              if (folderContext.folders.some((f) => f.id === id)) {
                folderContext.onDeleteFolder?.(id);
              } else if (folderContext.files.some((f) => f.id === id)) {
                folderContext.onDeleteFile?.(id);
              }
            });
          }

          clearVisualSelection();
        }
        return;
      }

      // 3. Ctrl/Cmd + C: Copy selected blocks text
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        if (editor) {
          const doc = editor.document || [];
          const selectedBlocks = doc.filter((b: any) => selectedIdsRef.current.has(b.id));
          if (selectedBlocks.length > 0) {
            const text = extractPlainTextFromBlocks(selectedBlocks);
            navigator.clipboard?.writeText(text).catch(() => {});
          }
        }
        return;
      }

      // 4. Ctrl/Cmd + X: Cut selected blocks
      if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X')) {
        if (editor) {
          const doc = editor.document || [];
          const selectedBlocks = doc.filter((b: any) => selectedIdsRef.current.has(b.id));
          if (selectedBlocks.length > 0) {
            const text = extractPlainTextFromBlocks(selectedBlocks);
            navigator.clipboard?.writeText(text).catch(() => {});
            try {
              editor.removeBlocks(Array.from(selectedIdsRef.current));
            } catch (err) {
              console.debug('Error cutting blocks:', err);
            }
            clearVisualSelection();
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, folderContext, clearVisualSelection]);

  // Render floating marquee overlay portal
  const renderMarqueeOverlay = () => {
    if (!isDragging || !startPos || !currentPos) return null;

    const left = Math.min(startPos.x, currentPos.x);
    const top = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (typeof document === 'undefined') return null;

    return createPortal(
      React.createElement('div', {
        'data-testid': 'marquee-selection-box',
        style: {
          position: 'fixed',
          left,
          top,
          width,
          height,
          backgroundColor: 'rgba(96, 165, 250, 0.10)',
          border: '1px solid rgba(96, 165, 250, 0.30)',
          borderRadius: '3px',
          pointerEvents: 'none',
          zIndex: 9999,
          boxSizing: 'border-box'
        }
      }),
      document.body
    );
  };

  return {
    containerRef,
    handlePointerDown,
    isDragging,
    selectedBlockIds,
    setSelectedBlockIds,
    clearVisualSelection,
    renderMarqueeOverlay
  };
}
