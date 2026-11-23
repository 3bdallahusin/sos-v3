import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  FolderPlus,
  FilePlus,
  LayoutGrid,
  Image,
  ArrowUpDown,
  Filter,
  Clipboard,
  RotateCw,
  ChevronRight,
  Check,
  FileText,
  Presentation,
  PlayCircle,
  Headphones,
  Globe,
  Zap,
  Brain,
  HelpCircle,
  GraduationCap,
  PenTool
} from 'lucide-react';
import type { LibraryItem, LearningToolType } from '@sos/domain';
import {
  useLibraryStore,
  type LibraryViewMode,
  type LibrarySizeMode,
  type LibrarySortBy,
  type LibraryFilterMode
} from '../../stores/library-store.js';
import { useLearningStore } from '../../stores/learning-store.js';

export const CanvasContextMenu: React.FC = () => {
  const navigate = useNavigate();
  const {
    canvasContextMenu,
    closeCanvasContextMenu,
    openNewFolderModal,
    uploadFiles,
    copiedItem,
    clipboardItem,
    pasteItem,
    loadItems,
    activeFolderId,
    view,
    setView,
    size,
    setSize,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  } = useLibraryStore();

  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<'newFile' | 'view' | 'size' | 'sort' | 'filter' | null>(null);
  const [submenuTopOffset, setSubmenuTopOffset] = useState<number>(0);

  // Reset active cascading submenu immediately on new right-click / reposition
  const isOpen = canvasContextMenu !== null;
  const posX = canvasContextMenu?.x;
  const posY = canvasContextMenu?.y;

  useEffect(() => {
    setActiveSubmenu(null);
  }, [isOpen, posX, posY]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeCanvasContextMenu();
        setActiveSubmenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeCanvasContextMenu]);

  useLayoutEffect(() => {
    if (!activeSubmenu || !submenuRef.current) return;
    const submenuEl = submenuRef.current;
    const parentTrigger = submenuEl.parentElement;
    if (!parentTrigger) return;

    const parentRect = parentTrigger.getBoundingClientRect();
    const submenuHeight = submenuEl.getBoundingClientRect().height;

    // Ideal top is aligned with the trigger item
    let globalTop = parentRect.top;

    // Clamp so that submenu NEVER exceeds window.innerHeight - submenuHeight - 12
    const maxGlobalTop = window.innerHeight - submenuHeight - 12;
    const minGlobalTop = 12;

    if (globalTop > maxGlobalTop) {
      globalTop = Math.max(minGlobalTop, maxGlobalTop);
    }
    if (globalTop < minGlobalTop) {
      globalTop = minGlobalTop;
    }

    const relativeTop = globalTop - parentRect.top;
    setSubmenuTopOffset(relativeTop);
  }, [activeSubmenu]);

  if (!canvasContextMenu) return null;

  const { x, y } = canvasContextMenu;
  const menuWidth = 200;
  const menuHeight = 300;
  const safeX = Math.min(x, window.innerWidth - menuWidth - 16);
  const safeY = Math.min(y, window.innerHeight - menuHeight - 16);
  const flipSubmenuLeft = safeX + menuWidth + 210 > window.innerWidth;

  const triggerFilePicker = (accept: string) => {
    closeCanvasContextMenu();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        await uploadFiles(target.files);
      }
    };
    input.click();
  };

  const handleCreateStudyArtifact = async (
    type: 'note' | 'board' | 'flashcards' | 'quiz' | 'exam' | 'browser',
    title: string,
    extra?: { externalUrl?: string }
  ) => {
    closeCanvasContextMenu();
    try {
      let createdItem: LibraryItem | null = null;
      let toolType: LearningToolType = 'new_tab';
      let targetResourceId = '';

      if (type === 'note') {
        toolType = 'notes';
        const res = await fetch('/api/learning/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content: '',
            sourceContext: 'library',
            parentId: activeFolderId
          })
        });
        if (res.ok) {
          const data = await res.json();
          targetResourceId = data.id || data.documentId;
        }
      } else if (type === 'board') {
        toolType = 'board';
        const res = await fetch('/api/learning/boards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, parentId: activeFolderId })
        });
        if (res.ok) {
          const data = await res.json();
          targetResourceId = data.id;
        }
      } else if (type === 'flashcards') {
        toolType = 'flashcards';
        const res = await fetch('/api/learning/flashcards/decks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, parentId: activeFolderId })
        });
        if (res.ok) {
          const data = await res.json();
          targetResourceId = data.id;
        }
      } else if (type === 'quiz') {
        toolType = 'quizzes';
        const res = await fetch('/api/library/artifacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: title,
            fileType: 'quiz',
            parentId: activeFolderId
          })
        });
        if (res.ok) {
          createdItem = await res.json();
          targetResourceId = createdItem?._id || '';
        }
      } else if (type === 'exam') {
        toolType = 'exam';
        const res = await fetch('/api/library/artifacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: title,
            fileType: 'exam',
            parentId: activeFolderId
          })
        });
        if (res.ok) {
          createdItem = await res.json();
          targetResourceId = createdItem?._id || '';
        }
      } else if (type === 'browser') {
        const res = await fetch('/api/library/artifacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: title,
            fileType: 'browser',
            parentId: activeFolderId,
            externalUrl: extra?.externalUrl || 'https://'
          })
        });
        if (res.ok) {
          createdItem = await res.json();
        }
      }

      await loadItems(activeFolderId);

      if (toolType !== 'new_tab' && targetResourceId) {
        const learningStore = useLearningStore.getState();
        await learningStore.openTab(toolType, title, targetResourceId);
        navigate({
          to: '/learning',
          search: {
            type,
            fileId: targetResourceId
          } as any
        });
      }
    } catch (err) {
      console.error('Failed to create artifact:', err);
    }
  };

  const handleCreateWebLink = () => {
    closeCanvasContextMenu();
    const url = prompt('Enter Web Link URL:', 'https://');
    if (!url || !url.trim()) return;
    const title = prompt('Enter title for Web Link:', 'Web Resource') || 'Web Resource';
    handleCreateStudyArtifact('browser', title.trim(), { externalUrl: url.trim() });
  };

  const hasClipboard = Boolean(clipboardItem || copiedItem);

  return (
    <div
      ref={menuRef}
      style={{ top: `${safeY}px`, left: `${safeX}px` }}
      className="fixed w-[200px] bg-[#111113] border border-[#27272A] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 select-none text-xs text-[#FAFAFA]"
      data-testid="canvas-context-menu"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. New Folder */}
      <button
        type="button"
        onClick={() => {
          closeCanvasContextMenu();
          openNewFolderModal();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center justify-between transition-colors"
        data-testid="canvas-menu-new-folder"
      >
        <div className="flex items-center gap-2">
          <FolderPlus className="w-3.5 h-3.5 text-[#A1A1AA]" />
          <span>New Folder</span>
        </div>
      </button>

      {/* 2. New File (Cascading Submenu with exact 11 items) */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('newFile')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <button
          type="button"
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center justify-between transition-colors"
          data-testid="canvas-menu-new-file"
        >
          <div className="flex items-center gap-2">
            <FilePlus className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>New File</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
        </button>

        {activeSubmenu === 'newFile' && (
          <div
            ref={submenuRef}
            style={{ [flipSubmenuLeft ? 'right' : 'left']: '100%', top: `${submenuTopOffset}px` }}
            className="absolute w-[180px] bg-[#111113] border border-[#27272A] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 max-h-[calc(100vh-24px)] overflow-y-auto custom-scrollbar"
          >
            {/* 1. PDF */}
            <button
              type="button"
              onClick={() => triggerFilePicker('.pdf')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center gap-2 transition-colors"
              data-testid="canvas-new-pdf"
            >
              <FileText className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>PDF</span>
            </button>

            {/* 2. DOCS */}
            <button
              type="button"
              onClick={() => triggerFilePicker('.doc,.docx,.txt,.md')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center gap-2 transition-colors"
              data-testid="canvas-new-docs"
            >
              <FileText className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>DOCS</span>
            </button>

            {/* 3. Slides */}
            <button
              type="button"
              onClick={() => triggerFilePicker('.ppt,.pptx')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center gap-2 transition-colors"
              data-testid="canvas-new-slides"
            >
              <Presentation className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Slides</span>
            </button>

            {/* 4. Notes */}
            <button
              type="button"
              onClick={() => handleCreateStudyArtifact('note', 'Untitled Note')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center gap-2 transition-colors"
              data-testid="canvas-new-notes"
            >
              <Zap className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Notes</span>
            </button>

            {/* 5. Board */}
            <button
              type="button"
              onClick={() => handleCreateStudyArtifact('board', 'Untitled Board')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center gap-2 transition-colors"
              data-testid="canvas-new-board"
            >
              <PenTool className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Board</span>
            </button>

            {/* 6. Video */}
            <button
              type="button"
              onClick={() => triggerFilePicker('.mp4,.webm,.mov,.mkv')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center gap-2 transition-colors"
              data-testid="canvas-new-video"
            >
              <PlayCircle className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Video</span>
            </button>

            {/* 7. Audio */}
            <button
              type="button"
              onClick={() => triggerFilePicker('.mp3,.wav,.ogg,.m4a')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center gap-2 transition-colors"
              data-testid="canvas-new-audio"
            >
              <Headphones className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Audio</span>
            </button>

            {/* 8. Web Link */}
            <button
              type="button"
              onClick={handleCreateWebLink}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center gap-2 transition-colors"
              data-testid="canvas-new-weblink"
            >
              <Globe className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Web Link</span>
            </button>

            {/* 9. Flashcards */}
            <button
              type="button"
              onClick={() => handleCreateStudyArtifact('flashcards', 'Untitled Deck')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center gap-2 transition-colors"
              data-testid="canvas-new-flashcards"
            >
              <Brain className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Flashcards</span>
            </button>

            {/* 10. Quiz */}
            <button
              type="button"
              onClick={() => handleCreateStudyArtifact('quiz', 'Untitled Quiz')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center gap-2 transition-colors"
              data-testid="canvas-new-quiz"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Quiz</span>
            </button>

            {/* 11. Exam */}
            <button
              type="button"
              onClick={() => handleCreateStudyArtifact('exam', 'Untitled Exam')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center gap-2 transition-colors"
              data-testid="canvas-new-exam"
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Exam</span>
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-[#27272A] my-1" />

      {/* 3. View (Cascading Submenu) */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('view')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <button
          type="button"
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center justify-between transition-colors"
          data-testid="canvas-menu-view"
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>View</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
        </button>

        {activeSubmenu === 'view' && (
          <div
            ref={submenuRef}
            style={{ [flipSubmenuLeft ? 'right' : 'left']: '100%', top: `${submenuTopOffset}px` }}
            className="absolute w-[160px] bg-[#111113] border border-[#27272A] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 max-h-[calc(100vh-24px)] overflow-y-auto custom-scrollbar"
          >
            {(['grid', 'gallery', 'list'] as LibraryViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                data-testid={`view-opt-${v}`}
                onClick={() => {
                  setView(v);
                  closeCanvasContextMenu();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center justify-between capitalize transition-colors"
              >
                <span>{v}</span>
                {view === v && <Check className="w-3.5 h-3.5 text-[#FAFAFA]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Size (Cascading Submenu) */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('size')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <button
          type="button"
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center justify-between transition-colors"
          data-testid="canvas-menu-size"
        >
          <div className="flex items-center gap-2">
            <Image className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Size</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
        </button>

        {activeSubmenu === 'size' && (
          <div
            ref={submenuRef}
            style={{ [flipSubmenuLeft ? 'right' : 'left']: '100%', top: `${submenuTopOffset}px` }}
            className="absolute w-[150px] bg-[#111113] border border-[#27272A] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 max-h-[calc(100vh-24px)] overflow-y-auto custom-scrollbar"
          >
            {(['S', 'M', 'L'] as LibrarySizeMode[]).map((s) => (
              <button
                key={s}
                type="button"
                data-testid={`size-opt-${s}`}
                onClick={() => {
                  setSize(s);
                  closeCanvasContextMenu();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center justify-between transition-colors"
              >
                <span>{s === 'S' ? 'Small (S)' : s === 'M' ? 'Medium (M)' : 'Large (L)'}</span>
                {size === s && <Check className="w-3.5 h-3.5 text-[#FAFAFA]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. Sort By (Cascading Submenu) */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('sort')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <button
          type="button"
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center justify-between transition-colors"
          data-testid="canvas-menu-sort"
        >
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Sort By</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
        </button>

        {activeSubmenu === 'sort' && (
          <div
            ref={submenuRef}
            style={{ [flipSubmenuLeft ? 'right' : 'left']: '100%', top: `${submenuTopOffset}px` }}
            className="absolute w-[180px] bg-[#111113] border border-[#27272A] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 max-h-[calc(100vh-24px)] overflow-y-auto custom-scrollbar"
          >
            {[
              { id: 'position', label: 'Custom Order' },
              { id: 'name', label: 'Name' },
              { id: 'updatedAt', label: 'Date Modified' },
              { id: 'size', label: 'Size' },
              { id: 'type', label: 'Type' }
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSortBy(s.id as LibrarySortBy);
                  closeCanvasContextMenu();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center justify-between transition-colors"
              >
                <span>{s.label}</span>
                {sortBy === s.id && <Check className="w-3.5 h-3.5 text-[#FAFAFA]" />}
              </button>
            ))}
            <div className="border-t border-[#27272A] my-1" />
            <button
              type="button"
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                closeCanvasContextMenu();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center justify-between transition-colors"
            >
              <span>{sortOrder === 'asc' ? 'Ascending (A-Z)' : 'Descending (Z-A)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. Filter (Exact 14 categories) */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('filter')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <button
          type="button"
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center justify-between transition-colors"
          data-testid="canvas-menu-filter"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Filter</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
        </button>

        {activeSubmenu === 'filter' && (
          <div
            ref={submenuRef}
            style={{ [flipSubmenuLeft ? 'right' : 'left']: '100%', top: `${submenuTopOffset}px` }}
            className="absolute w-[180px] bg-[#111113] border border-[#27272A] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 max-h-[calc(100vh-24px)] overflow-y-auto custom-scrollbar"
          >
            {[
              { id: 'all', label: 'All Items' },
              { id: 'folders', label: 'Folders' },
              { id: 'files', label: 'Files' },
              { id: 'pdf', label: 'PDF' },
              { id: 'docx', label: 'DOCS' },
              { id: 'slides', label: 'Slides' },
              { id: 'note', label: 'Notes' },
              { id: 'board', label: 'Board' },
              { id: 'video', label: 'Video' },
              { id: 'audio', label: 'Audio' },
              { id: 'browser', label: 'Web Links' },
              { id: 'flashcards', label: 'Flashcards' },
              { id: 'quiz', label: 'Quiz' },
              { id: 'exam', label: 'Exam' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilter(f.id as LibraryFilterMode);
                  closeCanvasContextMenu();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium flex items-center justify-between transition-colors"
              >
                <span>{f.label}</span>
                {filter === f.id && <Check className="w-3.5 h-3.5 text-[#FAFAFA]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#27272A] my-1" />

      {/* 7. Paste */}
      <button
        type="button"
        disabled={!hasClipboard}
        onClick={async () => {
          closeCanvasContextMenu();
          await pasteItem();
        }}
        className={`w-full px-2.5 py-1.5 rounded-lg text-left font-medium flex items-center gap-2 transition-colors ${
          hasClipboard
            ? 'text-[#FAFAFA] hover:bg-white/[0.06] cursor-pointer'
            : 'text-[#52525B] cursor-not-allowed'
        }`}
        data-testid="canvas-menu-paste"
      >
        <Clipboard className="w-3.5 h-3.5 text-[#A1A1AA]" />
        <span>Paste</span>
      </button>

      {/* 8. Refresh */}
      <button
        type="button"
        onClick={() => {
          closeCanvasContextMenu();
          loadItems(activeFolderId);
        }}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left font-medium text-[#FAFAFA] flex items-center gap-2 transition-colors"
        data-testid="canvas-menu-refresh"
      >
        <RotateCw className="w-3.5 h-3.5 text-[#A1A1AA]" />
        <span>Refresh</span>
      </button>
    </div>
  );
};
