import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Scissors,
  HelpCircle,
  Copy,
  Clipboard,
  CopyPlus,
  Trash2,
  CheckSquare,
  BringToFront,
  SendToBack,
  Lock,
  Eraser,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  MessageSquare,
  List,
  Edit2,
  FileDown,
  FileImage,
  FileCode,
  FileText,
  Download,
  ChevronRight
} from 'lucide-react';

export interface LearningContextMenuActions {
  // Canvas / Excalidraw actions
  hasCanvasSelection?: boolean;
  hasCanvasElements?: boolean;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onToggleLock?: () => void;
  onClearCanvas?: () => void;

  // Workspace / Document actions
  onSearch?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  zoomPercent?: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onToggleSpeakerNotes?: () => void;
  isSpeakerNotesOpen?: boolean;
  sections?: string[];
  activeSectionIndex?: number;
  onSelectSection?: (index: number) => void;
  onRename?: () => void;
  onExportPdf?: () => void;
  onExportPng?: () => void;
  onExportSvg?: () => void;
  onExportJson?: () => void;
  onDownloadOriginal?: () => void;
  fileType?: string;
  onOpenShortcutsGuide?: () => void;
}

interface LearningContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  actions: LearningContextMenuActions;
}

export const LearningContextMenu: React.FC<LearningContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  actions
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isSectionsSubmenuOpen, setIsSectionsSubmenuOpen] = useState(false);
  const [isExportSubmenuOpen, setIsExportSubmenuOpen] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: position.x, y: position.y });

  // Reposition & clamp within viewport before paint
  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const menuWidth = rect.width || 240;
    const menuHeight = rect.height || 420;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let targetX = position.x;
    let targetY = position.y;

    // Auto-flip upward if not enough room below
    if (position.y + menuHeight > viewportH - 16) {
      targetY = Math.max(16, position.y - menuHeight);
    }
    // Auto-flip leftward if not enough room to the right
    if (position.x + menuWidth > viewportW - 16) {
      targetX = Math.max(16, position.x - menuWidth);
    }

    setCoords({ x: targetX, y: targetY });
  }, [position.x, position.y, isOpen]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl+';

  const hasCanvasActions = Boolean(
    actions.onCut ||
    actions.onCopy ||
    actions.onPaste ||
    actions.onDuplicate ||
    actions.onDelete ||
    actions.onSelectAll ||
    actions.onBringToFront ||
    actions.onSendToBack ||
    actions.onToggleLock ||
    actions.onClearCanvas
  );

  return (
    <div
      ref={menuRef}
      data-testid="learning-context-menu"
      style={{ top: `${coords.y}px`, left: `${coords.x}px` }}
      className="fixed z-50 w-60 rounded-xl bg-[#121214]/98 backdrop-blur-md border border-[#27272A] shadow-2xl py-1.5 px-1 flex flex-col gap-0.5 text-xs text-[#D4D4D8] select-none animate-in fade-in zoom-in-95 duration-100 max-h-[calc(100vh-32px)] overflow-y-auto custom-scrollbar"
    >
      {/* ========================================================= */}
      {/* CANVAS OBJECT ACTIONS (CUT, COPY, PASTE, DUPLICATE, DELETE) */}
      {/* ========================================================= */}
      {hasCanvasActions && (
        <>
          {actions.onCut && (
            <button
              type="button"
              disabled={actions.hasCanvasSelection === false}
              onClick={() => {
                actions.onCut?.();
                onClose();
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#D4D4D8] transition-colors cursor-pointer group"
              data-testid="ctx-menu-cut"
            >
              <div className="flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
                <span>Cut</span>
              </div>
              <span className="font-mono text-[10px] text-[#71717A]">{modKey}X</span>
            </button>
          )}

          {actions.onCopy && (
            <button
              type="button"
              disabled={actions.hasCanvasSelection === false}
              onClick={() => {
                actions.onCopy?.();
                onClose();
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#D4D4D8] transition-colors cursor-pointer group"
              data-testid="ctx-menu-copy"
            >
              <div className="flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
                <span>Copy</span>
              </div>
              <span className="font-mono text-[10px] text-[#71717A]">{modKey}C</span>
            </button>
          )}

          {actions.onPaste && (
            <button
              type="button"
              onClick={() => {
                actions.onPaste?.();
                onClose();
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors cursor-pointer group"
              data-testid="ctx-menu-paste"
            >
              <div className="flex items-center gap-2">
                <Clipboard className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
                <span>Paste</span>
              </div>
              <span className="font-mono text-[10px] text-[#71717A]">{modKey}V</span>
            </button>
          )}

          {actions.onDuplicate && (
            <button
              type="button"
              disabled={actions.hasCanvasSelection === false}
              onClick={() => {
                actions.onDuplicate?.();
                onClose();
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#D4D4D8] transition-colors cursor-pointer group"
              data-testid="ctx-menu-duplicate"
            >
              <div className="flex items-center gap-2">
                <CopyPlus className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
                <span>Duplicate</span>
              </div>
              <span className="font-mono text-[10px] text-[#71717A]">{modKey}D</span>
            </button>
          )}

          {actions.onDelete && (
            <button
              type="button"
              disabled={actions.hasCanvasSelection === false}
              onClick={() => {
                actions.onDelete?.();
                onClose();
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#EF4444] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#D4D4D8] transition-colors cursor-pointer group"
              data-testid="ctx-menu-delete"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                <span>Delete</span>
              </div>
              <span className="font-mono text-[10px] text-[#71717A]">⌫</span>
            </button>
          )}

          {/* CANVAS LAYERING & LOCKING */}
          {(actions.onBringToFront || actions.onSendToBack || actions.onToggleLock) && (
            <div className="h-px bg-[#1F1F24] my-1" />
          )}

          {actions.onBringToFront && (
            <button
              type="button"
              disabled={actions.hasCanvasSelection === false}
              onClick={() => {
                actions.onBringToFront?.();
                onClose();
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#D4D4D8] transition-colors cursor-pointer group"
              data-testid="ctx-menu-bring-to-front"
            >
              <div className="flex items-center gap-2">
                <BringToFront className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
                <span>Bring to Front</span>
              </div>
              <span className="font-mono text-[10px] text-[#71717A]">⌘⇧]</span>
            </button>
          )}

          {actions.onSendToBack && (
            <button
              type="button"
              disabled={actions.hasCanvasSelection === false}
              onClick={() => {
                actions.onSendToBack?.();
                onClose();
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#D4D4D8] transition-colors cursor-pointer group"
              data-testid="ctx-menu-send-to-back"
            >
              <div className="flex items-center gap-2">
                <SendToBack className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
                <span>Send to Back</span>
              </div>
              <span className="font-mono text-[10px] text-[#71717A]">⌘⇧[</span>
            </button>
          )}

          {actions.onToggleLock && (
            <button
              type="button"
              disabled={actions.hasCanvasSelection === false}
              onClick={() => {
                actions.onToggleLock?.();
                onClose();
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#D4D4D8] transition-colors cursor-pointer group"
              data-testid="ctx-menu-toggle-lock"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
                <span>Lock / Unlock</span>
              </div>
              <span className="font-mono text-[10px] text-[#71717A]">{modKey}L</span>
            </button>
          )}

          {/* CANVAS GLOBAL: SELECT ALL & CLEAR */}
          {(actions.onSelectAll || actions.onClearCanvas) && (
            <div className="h-px bg-[#1F1F24] my-1" />
          )}

          {actions.onSelectAll && (
            <button
              type="button"
              onClick={() => {
                actions.onSelectAll?.();
                onClose();
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors cursor-pointer group"
              data-testid="ctx-menu-select-all"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
                <span>Select All</span>
              </div>
              <span className="font-mono text-[10px] text-[#71717A]">{modKey}A</span>
            </button>
          )}

          {actions.onClearCanvas && (
            <button
              type="button"
              disabled={actions.hasCanvasElements === false}
              onClick={() => {
                actions.onClearCanvas?.();
                onClose();
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#EF4444] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#D4D4D8] transition-colors cursor-pointer group"
              data-testid="ctx-menu-clear-canvas"
            >
              <div className="flex items-center gap-2">
                <Eraser className="w-3.5 h-3.5 text-[#EF4444]" />
                <span>Clear Canvas</span>
              </div>
            </button>
          )}

          <div className="h-px bg-[#1F1F24] my-1" />
        </>
      )}

      {/* ========================================================= */}
      {/* 1. IN-DOCUMENT SEARCH */}
      {/* ========================================================= */}
      {actions.onSearch && (
        <button
          type="button"
          onClick={() => {
            actions.onSearch?.();
            onClose();
          }}
          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors cursor-pointer group"
          data-testid="ctx-menu-search"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
            <span>Search in Document</span>
          </div>
          <span className="font-mono text-[10px] text-[#71717A]">{modKey}F</span>
        </button>
      )}

      {/* ========================================================= */}
      {/* 2. ZOOM CONTROLS */}
      {/* ========================================================= */}
      {actions.onZoomIn && (
        <>
          <div className="h-px bg-[#1F1F24] my-1" />
          <button
            type="button"
            onClick={() => {
              actions.onZoomIn?.();
              onClose();
            }}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors cursor-pointer group"
            data-testid="ctx-menu-zoom-in"
          >
            <div className="flex items-center gap-2">
              <ZoomIn className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
              <span>Zoom In</span>
            </div>
            <span className="font-mono text-[10px] text-[#71717A]">{modKey}+</span>
          </button>

          <button
            type="button"
            onClick={() => {
              actions.onZoomOut?.();
              onClose();
            }}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors cursor-pointer group"
            data-testid="ctx-menu-zoom-out"
          >
            <div className="flex items-center gap-2">
              <ZoomOut className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
              <span>Zoom Out</span>
            </div>
            <span className="font-mono text-[10px] text-[#71717A]">{modKey}-</span>
          </button>

          {actions.onResetZoom && (
            <button
              type="button"
              onClick={() => {
                actions.onResetZoom?.();
                onClose();
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors cursor-pointer group"
              data-testid="ctx-menu-reset-zoom"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
                <span>Reset Zoom (100%)</span>
              </div>
              <span className="font-mono text-[10px] text-[#71717A]">
                {actions.zoomPercent ? `${actions.zoomPercent}%` : '⌘0'}
              </span>
            </button>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* 3. THEME TOGGLE */}
      {/* ========================================================= */}
      {actions.onToggleTheme && (
        <>
          <div className="h-px bg-[#1F1F24] my-1" />
          <button
            type="button"
            onClick={() => {
              actions.onToggleTheme?.();
              onClose();
            }}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors cursor-pointer group"
            data-testid="ctx-menu-theme-toggle"
          >
            <div className="flex items-center gap-2">
              {actions.theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#60A5FA]" />
              )}
              <span>{actions.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </div>
          </button>
        </>
      )}

      {/* ========================================================= */}
      {/* 4. SPEAKER NOTES (FOR SLIDES) */}
      {/* ========================================================= */}
      {actions.onToggleSpeakerNotes && (
        <button
          type="button"
          onClick={() => {
            actions.onToggleSpeakerNotes?.();
            onClose();
          }}
          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors cursor-pointer group"
          data-testid="ctx-menu-speaker-notes"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
            <span>{actions.isSpeakerNotesOpen ? 'Hide Speaker Notes' : 'Show Speaker Notes'}</span>
          </div>
          <span className="font-mono text-[10px] text-[#71717A]">{modKey}N</span>
        </button>
      )}

      {/* ========================================================= */}
      {/* 5. JUMP TO SECTION (FOR DOCS WITH HEADINGS) */}
      {/* ========================================================= */}
      {actions.sections && actions.sections.length > 0 && (
        <div
          className="relative"
          onMouseEnter={() => setIsSectionsSubmenuOpen(true)}
          onMouseLeave={() => setIsSectionsSubmenuOpen(false)}
        >
          <button
            type="button"
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors cursor-pointer group"
            data-testid="ctx-menu-sections"
          >
            <div className="flex items-center gap-2">
              <List className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
              <span>Jump to Section</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
          </button>

          {isSectionsSubmenuOpen && (
            <div className="absolute left-full top-0 ml-1 w-56 rounded-xl bg-[#121214]/98 backdrop-blur-md border border-[#27272A] shadow-2xl py-1.5 px-1 flex flex-col gap-0.5 z-50">
              {actions.sections.map((sec, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    actions.onSelectSection?.(idx);
                    setIsSectionsSubmenuOpen(false);
                    onClose();
                  }}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${
                    actions.activeSectionIndex === idx
                      ? 'bg-[#27272A] text-[#60A5FA] font-medium'
                      : 'hover:bg-[#1C1C21] hover:text-[#FAFAFA]'
                  }`}
                >
                  <span className="truncate">{sec}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. RENAME FILE / BOARD */}
      {/* ========================================================= */}
      {actions.onRename && (
        <>
          <div className="h-px bg-[#1F1F24] my-1" />
          <button
            type="button"
            onClick={() => {
              actions.onRename?.();
              onClose();
            }}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors cursor-pointer group"
            data-testid="ctx-menu-rename"
          >
            <div className="flex items-center gap-2">
              <Edit2 className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
              <span>Rename</span>
            </div>
          </button>
        </>
      )}

      {/* ========================================================= */}
      {/* 7. EXPORT OPTIONS SUBMENU */}
      {/* ========================================================= */}
      {(actions.onExportPdf || actions.onExportPng || actions.onExportSvg || actions.onExportJson || actions.onDownloadOriginal) && (
        <div
          className="relative"
          onMouseEnter={() => setIsExportSubmenuOpen(true)}
          onMouseLeave={() => setIsExportSubmenuOpen(false)}
        >
          <div className="h-px bg-[#1F1F24] my-1" />
          <button
            type="button"
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors cursor-pointer group"
            data-testid="ctx-menu-export"
          >
            <div className="flex items-center gap-2">
              <FileDown className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
              <span>Export Document</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
          </button>

          {isExportSubmenuOpen && (
            <div className="absolute left-full top-0 ml-1 w-52 rounded-xl bg-[#121214]/98 backdrop-blur-md border border-[#27272A] shadow-2xl py-1.5 px-1 flex flex-col gap-0.5 z-50">
              {actions.onExportPdf && (
                <button
                  type="button"
                  onClick={() => {
                    actions.onExportPdf?.();
                    setIsExportSubmenuOpen(false);
                    onClose();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors text-xs text-left"
                  data-testid="ctx-export-pdf"
                >
                  <FileText className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>Export Annotated PDF</span>
                </button>
              )}

              {actions.onExportPng && (
                <button
                  type="button"
                  onClick={() => {
                    actions.onExportPng?.();
                    setIsExportSubmenuOpen(false);
                    onClose();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors text-xs text-left"
                  data-testid="ctx-export-png"
                >
                  <FileImage className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Export PNG Image</span>
                </button>
              )}

              {actions.onExportSvg && (
                <button
                  type="button"
                  onClick={() => {
                    actions.onExportSvg?.();
                    setIsExportSubmenuOpen(false);
                    onClose();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors text-xs text-left"
                  data-testid="ctx-export-svg"
                >
                  <FileCode className="w-3.5 h-3.5 text-[#A855F7]" />
                  <span>Export SVG Vector</span>
                </button>
              )}

              {actions.onExportJson && (
                <button
                  type="button"
                  onClick={() => {
                    actions.onExportJson?.();
                    setIsExportSubmenuOpen(false);
                    onClose();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors text-xs text-left"
                  data-testid="ctx-export-json"
                >
                  <FileCode className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Export Excalidraw JSON</span>
                </button>
              )}

              {actions.onDownloadOriginal && (
                <button
                  type="button"
                  onClick={() => {
                    actions.onDownloadOriginal?.();
                    setIsExportSubmenuOpen(false);
                    onClose();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors text-xs text-left border-t border-[#1F1F24] mt-0.5 pt-1.5"
                  data-testid="ctx-download-original"
                >
                  <Download className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>Download Original File</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* WORKSPACE GUIDE & KEYBOARD SHORTCUTS */}
      {/* ========================================================= */}
      {actions.onOpenShortcutsGuide && (
        <>
          <div className="h-[1px] bg-[#27272A] my-1" />
          <button
            type="button"
            onClick={() => {
              actions.onOpenShortcutsGuide?.();
              onClose();
            }}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1C1C21] hover:text-[#FAFAFA] transition-colors cursor-pointer group text-left"
            data-testid="ctx-shortcuts-guide"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-[#38BDF8] group-hover:text-white" />
              <span className="font-medium text-[#38BDF8] group-hover:text-white">Workspace Guide & Shortcuts</span>
            </div>
            <span className="font-mono text-[10px] text-[#71717A]">?</span>
          </button>
        </>
      )}
    </div>
  );
};
