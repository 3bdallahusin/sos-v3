import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { FolderOpen, Plus, UploadCloud, X, Filter } from 'lucide-react';
import type { LibraryItem, LearningToolType } from '@sos/domain';
import { useLibraryStore, filterAndSortLibraryItems } from '../stores/library-store.js';
import { useLearningStore } from '../stores/learning-store.js';
import { useMarqueeSelection } from '../hooks/useMarqueeSelection.js';
import { LibraryGridView } from '../components/library/LibraryGridView.js';
import { LibraryGalleryView } from '../components/library/LibraryGalleryView.js';
import { LibraryListView } from '../components/library/LibraryListView.js';
import { LibrarySkeletonView } from '../components/library/LibrarySkeletonView.js';
import { ItemContextMenu } from '../components/library/ItemContextMenu.js';
import { CanvasContextMenu } from '../components/library/CanvasContextMenu.js';
import { NewFolderModal } from '../components/library/NewFolderModal.js';
import { UploadFileModal } from '../components/library/UploadFileModal.js';
import { SetCoverModal } from '../components/library/SetCoverModal.js';

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    items,
    activeFolderId,
    view,
    size,
    filter,
    setFilter,
    sortBy,
    sortOrder,
    searchQuery,
    isLoading,
    isHydrated,
    error,
    selectedIds,
    selectedId,
    setSelectedIds,
    selectAll,
    clearSelection,
    setRenamingItemId,
    loadItems,
    navigateUp,
    deleteItem,
    deleteItems,
    cutItem,
    cutItems,
    copyItem,
    copyItems,
    pasteItem,
    pasteItems,
    clearClipboard,
    openNewFolderModal,
    openUploadModal,
    openCanvasContextMenu,
    closeCanvasContextMenu,
    closeItemContextMenu,
    uploadFiles
  } = useLibraryStore();

  const {
    marqueeRect,
    isMarqueeActive,
    justFinishedMarqueeRef,
    handleMouseDown: handleMarqueeMouseDown
  } = useMarqueeSelection(canvasRef);

  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

  useEffect(() => {
    loadItems(activeFolderId);
  }, [activeFolderId, loadItems]);

  const displayItems = useMemo(() => {
    if (isLoading && !isHydrated) return [];
    return filterAndSortLibraryItems(items, activeFolderId, filter, searchQuery, sortBy, sortOrder);
  }, [items, activeFolderId, filter, searchQuery, sortBy, sortOrder, isLoading, isHydrated]);

  const handleOpenFile = useCallback(
    async (file: LibraryItem) => {
      if (file.fileType === 'browser' && file.artifactData?.externalUrl) {
        window.open(file.artifactData.externalUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      // Map SOSFileType to LearningToolType
      const toolTypeMap: Record<string, LearningToolType> = {
        pdf: 'pdf',
        docx: 'docx',
        slides: 'slides',
        spreadsheet: 'spreadsheet',
        image: 'images',
        video: 'videos',
        audio: 'audios',
        browser: 'browser',
        note: 'notes',
        flashcards: 'flashcards',
        quiz: 'quizzes',
        exam: 'exam',
        board: 'board'
      };

      const toolType: LearningToolType = toolTypeMap[file.fileType] || ('new_tab' as LearningToolType);
      const resourceId = file.artifactData?.linkedArtifactId || file._id;

      const learningStore = useLearningStore.getState();
      const existingTab = learningStore.tabs.find(
        (t) => (t.resourceId && t.resourceId === resourceId) || t.id === `tab-${file._id}`
      );

      if (existingTab) {
        await learningStore.switchTab(existingTab.id);
      } else {
        await learningStore.openTab(toolType, file.name, resourceId);
      }

      navigate({
        to: '/learning',
        search: {
          type: file.fileType,
          fileId: resourceId
        } as any
      });
    },
    [navigate]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeElement = document.activeElement;
      const isInput =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable);
      if (isInput) return;

      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // 1. Select All (Ctrl/Cmd + A)
      if (cmdOrCtrl && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        selectAll();
        return;
      }

      // 2. Escape: clear selection, clear cut clipboard, close menus
      if (e.key === 'Escape') {
        clearSelection();
        clearClipboard();
        closeCanvasContextMenu();
        closeItemContextMenu();
        return;
      }

      // 3. F2: Rename single selected item
      if (e.key === 'F2' && selectedIds.length === 1) {
        e.preventDefault();
        setRenamingItemId(selectedIds[0]);
        return;
      }

      // 4. Delete / Backspace:
      // Deletes all selectedIds if selectedIds.length > 0 (only navigates back when selectedIds.length === 0)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteItems(selectedIds);
          return;
        }
        if (e.key === 'Backspace' && activeFolderId) {
          e.preventDefault();
          navigateUp();
          return;
        }
      }

      // 5. Back navigation on Alt+ArrowLeft
      if (e.altKey && e.key === 'ArrowLeft' && activeFolderId) {
        e.preventDefault();
        navigateUp();
        return;
      }

      // 6. Copy (Ctrl/Cmd + C)
      if (cmdOrCtrl && (e.key === 'c' || e.key === 'C') && selectedIds.length > 0) {
        e.preventDefault();
        copyItems();
        return;
      }

      // 7. Cut (Ctrl/Cmd + X)
      if (cmdOrCtrl && (e.key === 'x' || e.key === 'X') && selectedIds.length > 0) {
        e.preventDefault();
        cutItems();
        return;
      }

      // 8. Paste (Ctrl/Cmd + V)
      if (cmdOrCtrl && (e.key === 'v' || e.key === 'V')) {
        const { clipboardItems, clipboardItem } = useLibraryStore.getState();
        if (clipboardItems || clipboardItem) {
          e.preventDefault();
          pasteItems(activeFolderId);
        }
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectAll,
    clearSelection,
    clearClipboard,
    closeCanvasContextMenu,
    closeItemContextMenu,
    selectedIds,
    setRenamingItemId,
    deleteItems,
    navigateUp,
    activeFolderId,
    copyItems,
    cutItems,
    pasteItems
  ]);

  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      setIsDragOverCanvas(true);
    }
  };

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOverCanvas(false);
  };

  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="flex-1 min-w-0 bg-[#080808] flex flex-col overflow-hidden relative select-none h-full"
      data-testid="library-page"
      onContextMenu={(e) => {
        const target = e.target as HTMLElement;
        const isItem = target.closest('[data-testid^="library-item-"]') ||
                       target.closest('[data-testid^="library-gallery-item-"]') ||
                       target.closest('[data-testid^="library-list-row-"]');
        if (!isItem) {
          e.preventDefault();
          openCanvasContextMenu(e.clientX, e.clientY);
        }
      }}
      onClick={() => {
        closeCanvasContextMenu();
        closeItemContextMenu();
      }}
      onDragOver={handleCanvasDragOver}
      onDragLeave={handleCanvasDragLeave}
      onDrop={handleCanvasDrop}
    >
      {/* Outer Non-Scrolling Container for Canvas & Marquee Overlay */}
      <div className="relative overflow-hidden flex-1 flex flex-col">
        {/* Main Workspace Area (Clean Minimal Canvas) */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#080808]"
          data-testid="library-canvas-area"
          onMouseDown={handleMarqueeMouseDown}
          onClickCapture={(e) => {
            if (justFinishedMarqueeRef.current) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
        >
          {/* Dismissible Active Filter Pill */}
        {filter !== 'all' && (
          <div className="mb-4 flex items-center gap-2" data-testid="library-active-filter-indicator">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141417] border border-[#27272A] text-xs text-[#FAFAFA] shadow-sm">
              <Filter className="w-3 h-3 text-[#A1A1AA]" />
              <span className="text-[#A1A1AA]">Showing:</span>
              <span className="capitalize font-medium text-[#FAFAFA]">{filter}</span>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="ml-1 text-[#71717A] hover:text-[#FAFAFA] transition-colors p-0.5 rounded-full hover:bg-white/10"
                title="Clear filter"
                data-testid="clear-filter-btn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div
            className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center justify-between"
            data-testid="library-error-banner"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => useLibraryStore.setState({ error: null })}
              className="text-red-400 hover:text-red-100 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {(isLoading && !isHydrated) || (isLoading && displayItems.length === 0) ? (
          <LibrarySkeletonView view={view} size={size} />
        ) : displayItems.length === 0 ? (
          <div
            className="h-full min-h-[360px] flex flex-col items-center justify-center gap-3 text-center"
            data-testid="library-empty-state"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#111113] border border-[#1E1E22] flex items-center justify-center text-[#71717A] mb-1">
              <FolderOpen className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#FAFAFA]">This folder is empty</h3>
              <p className="text-xs text-[#71717A] mt-1 max-w-xs">
                Create a new folder or upload files to organize your study materials.
              </p>
            </div>
            <div className="flex items-center gap-2.5 mt-2">
              <button
                type="button"
                onClick={openNewFolderModal}
                className="h-8 px-3 rounded-lg bg-[#161619] hover:bg-[#1E1E22] border border-[#222226] text-[#EDEDED] font-medium text-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-[#A1A1AA]" />
                <span>New Folder</span>
              </button>
              <button
                type="button"
                onClick={openUploadModal}
                className="h-8 px-3 rounded-lg bg-[#EDEDED] hover:bg-white text-[#0A0A0A] font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <UploadCloud className="w-3.5 h-3.5 stroke-[2.25]" />
                <span>Upload File</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={isMarqueeActive ? 'pointer-events-none select-none' : ''}>
            {view === 'grid' && <LibraryGridView items={displayItems} onOpenFile={handleOpenFile} />}
            {view === 'gallery' && <LibraryGalleryView items={displayItems} onOpenFile={handleOpenFile} />}
            {view === 'list' && <LibraryListView items={displayItems} onOpenFile={handleOpenFile} />}
          </div>
        )}

        {/* OS Drag Over Canvas Overlay */}
        {isDragOverCanvas && (
          <div className="absolute inset-4 border-2 border-dashed border-[#60A5FA] bg-[#60A5FA]/5 rounded-2xl backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 pointer-events-none z-40">
            <UploadCloud className="w-10 h-10 text-[#60A5FA] animate-bounce" />
            <p className="text-sm font-medium text-white">Drop files to upload into this folder</p>
          </div>
        )}
      </div>

      {/* Real-time Marquee Selection Box Overlay (Rendered with position: fixed in viewport coordinates) */}
      {isMarqueeActive && marqueeRect && (
        <div
          style={{
            position: 'fixed',
            left: `${marqueeRect.left}px`,
            top: `${marqueeRect.top}px`,
            width: `${Math.max(0, marqueeRect.right - marqueeRect.left)}px`,
            height: `${Math.max(0, marqueeRect.bottom - marqueeRect.top)}px`
          }}
          className="pointer-events-none z-50 border border-[#60A5FA] bg-[#60A5FA]/15 rounded-[2px]"
          data-testid="library-marquee-box"
        />
      )}
    </div>

      {/* Context Menus */}
      <ItemContextMenu onOpenFile={handleOpenFile} />
      <CanvasContextMenu />

      {/* Modals */}
      <NewFolderModal />
      <UploadFileModal />
      <SetCoverModal />
    </div>
  );
};
