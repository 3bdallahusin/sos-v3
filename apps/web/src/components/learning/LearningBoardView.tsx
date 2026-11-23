import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UniversalCanvasHost } from '../canvas/UniversalCanvasHost.js';
import { LearningContextMenu } from './LearningContextMenu.js';
import { LearningWorkspaceGuideModal } from './LearningWorkspaceGuideModal.js';
import {
  exportToBlob,
  exportToSvg,
  serializeAsJSON
} from '@excalidraw/excalidraw';
import { PDFDocument } from 'pdf-lib';
import {
  Download,
  Share2,
  Plus,
  FolderOpen,
  ChevronDown,
  LayoutGrid,
  Sparkles,
  FileImage,
  FileCode,
  FileText,
  Moon,
  Sun
} from 'lucide-react';

interface LearningBoardViewProps {
  boardId?: string;
}

export const LearningBoardView: React.FC<LearningBoardViewProps> = ({
  boardId: initialBoardId = 'board-neuro-mindmap'
}) => {
  const [boardId, setBoardId] = useState<string>(initialBoardId);
  const [boardTitle, setBoardTitle] = useState<string>('Neuroscience Architecture & Synaptic Transmission');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [boardsList, setBoardsList] = useState<Array<{ id: string; title: string }>>([]);
  const [excalidrawApi, setExcalidrawApi] = useState<any>(null);
  const excalidrawApiRef = useRef<any>(null);
  const [initialElements, setInitialElements] = useState<any[]>([]);
  const [initialAppState, setInitialAppState] = useState<any>({});
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isBoardSelectorOpen, setIsBoardSelectorOpen] = useState<boolean>(false);
  const [boardTheme, setBoardTheme] = useState<'dark' | 'light'>('dark');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const saveTimeoutRef = useRef<any>(null);

  // 1. Fetch Board Scene & Boards List
  const fetchBoardData = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/learning/boards/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBoardTitle(data.title);
        const elements = Array.isArray(data.elementsJson) ? data.elementsJson : [];
        setInitialElements(elements);
        const appState = {
          ...(data.appStateJson || {}),
          theme: 'light',
          viewBackgroundColor: boardTheme === 'dark' ? '#0A0A0A' : '#FAFAFA',
          gridModeEnabled: false
        };
        setInitialAppState(appState);
        if (data.filesJson && typeof data.filesJson === 'object' && Object.keys(data.filesJson).length > 0) {
          if (excalidrawApiRef.current && typeof excalidrawApiRef.current.addFiles === 'function') {
            excalidrawApiRef.current.addFiles(Object.values(data.filesJson));
          }
        }
        if (excalidrawApiRef.current) {
          excalidrawApiRef.current.updateScene({
            elements,
            appState
          });
        }
      }
    } catch (err) {
      console.warn('[LearningBoardView] Failed to fetch board:', err);
    }
  }, [boardTheme]);

  const handleApiReady = useCallback((api: any) => {
    excalidrawApiRef.current = api;
    setExcalidrawApi(api);
    api.updateScene({
      appState: {
        theme: 'light',
        viewBackgroundColor: boardTheme === 'dark' ? '#0A0A0A' : '#FAFAFA',
        gridModeEnabled: false
      }
    });
  }, [boardTheme]);

  const fetchBoardsList = useCallback(async () => {
    try {
      const res = await fetch('/api/learning/boards');
      if (res.ok) {
        const data = await res.json();
        setBoardsList(data);
      }
    } catch (err) {
      console.warn('[LearningBoardView] Failed to fetch boards list:', err);
    }
  }, []);

  useEffect(() => {
    fetchBoardsList();
    fetchBoardData(boardId);
  }, [boardId, fetchBoardsList, fetchBoardData]);

  // 2. Debounced Autosave for Elements & AppState
  const handleUpdateCanvasScene = useCallback(
    async (elementsJson: any[], appStateJson: any) => {
      setIsSaving(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const sanitizedAppState = {
            ...(appStateJson || {}),
            viewBackgroundColor: boardTheme === 'dark' ? '#0A0A0A' : '#FAFAFA',
            theme: 'light'
          };
          const files = excalidrawApiRef.current?.getFiles?.() || {};
          await fetch(`/api/learning/boards/${boardId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              elementsJson,
              appStateJson: sanitizedAppState,
              filesJson: files
            })
          });
        } catch (err) {
          console.warn('[LearningBoardView] Failed to autosave board:', err);
        } finally {
          setIsSaving(false);
        }
      }, 800);
    },
    [boardId, boardTheme]
  );

  // 3. Save Board Title Change
  const handleSaveTitle = async (newTitle: string) => {
    setBoardTitle(newTitle);
    setIsEditingTitle(false);
    try {
      await fetch(`/api/learning/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      fetchBoardsList();
    } catch (err) {
      console.warn('[LearningBoardView] Failed to update board title:', err);
    }
  };

  // 4. Create New Board
  const handleCreateBoard = async () => {
    try {
      const res = await fetch('/api/learning/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Untitled Board ${boardsList.length + 1}`,
          elementsJson: []
        })
      });
      if (res.ok) {
        const newBoard = await res.json();
        setBoardId(newBoard.id);
        fetchBoardsList();
      }
    } catch (err) {
      console.warn('[LearningBoardView] Failed to create board:', err);
    }
  };

  // 5. Export Handlers (PNG, SVG, JSON, PDF)
  const handleExportPng = async () => {
    setIsExportMenuOpen(false);
    if (!excalidrawApi) return;
    try {
      const elements = excalidrawApi.getSceneElements();
      const appState = excalidrawApi.getAppState();
      const blob = await exportToBlob({
        elements,
        appState: {
          ...appState,
          exportBackground: true,
          viewBackgroundColor: '#0A0A0A'
        },
        files: excalidrawApi.getFiles(),
        mimeType: 'image/png'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${boardTitle.replace(/\s+/g, '_')}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('[LearningBoardView] Export PNG failed:', err);
    }
  };

  const handleExportSvg = async () => {
    setIsExportMenuOpen(false);
    if (!excalidrawApi) return;
    try {
      const elements = excalidrawApi.getSceneElements();
      const appState = excalidrawApi.getAppState();
      const svg = await exportToSvg({
        elements,
        appState: {
          ...appState,
          exportBackground: true,
          viewBackgroundColor: '#0A0A0A'
        },
        files: excalidrawApi.getFiles()
      });
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const blob = new Blob([svgStr], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${boardTitle.replace(/\s+/g, '_')}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('[LearningBoardView] Export SVG failed:', err);
    }
  };

  const handleExportJson = () => {
    setIsExportMenuOpen(false);
    if (!excalidrawApi) return;
    try {
      const elements = excalidrawApi.getSceneElements();
      const appState = excalidrawApi.getAppState();
      const json = serializeAsJSON(elements, appState, excalidrawApi.getFiles(), 'local');
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${boardTitle.replace(/\s+/g, '_')}.excalidraw`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('[LearningBoardView] Export JSON failed:', err);
    }
  };

  const handleExportPdf = async () => {
    setIsExportMenuOpen(false);
    if (!excalidrawApi) return;
    try {
      const elements = excalidrawApi.getSceneElements();
      const appState = excalidrawApi.getAppState();
      const pngBlob = await exportToBlob({
        elements,
        appState: {
          ...appState,
          exportBackground: true,
          viewBackgroundColor: '#0A0A0A'
        },
        files: excalidrawApi.getFiles(),
        mimeType: 'image/png'
      });

      const pngArrayBuffer = await pngBlob.arrayBuffer();
      const pdfDoc = await PDFDocument.create();
      const image = await pdfDoc.embedPng(pngArrayBuffer);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${boardTitle.replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('[LearningBoardView] Export PDF failed:', err);
    }
  };

  // Canvas actions
  const handleCut = useCallback(() => {
    if (!excalidrawApi) return;
    const appState = excalidrawApi.getAppState();
    const selectedIds = appState?.selectedElementIds || {};
    const elements = excalidrawApi.getSceneElements();
    const selected = elements.filter((el: any) => selectedIds[el.id] && !el.isDeleted);
    if (selected.length > 0) {
      try {
        navigator.clipboard?.writeText(JSON.stringify(selected));
      } catch {}
      const updated = elements.map((el: any) => selectedIds[el.id] ? { ...el, isDeleted: true } : el);
      excalidrawApi.updateScene({ elements: updated, appState: { selectedElementIds: {} } });
    }
  }, [excalidrawApi]);

  const handleCopy = useCallback(() => {
    if (!excalidrawApi) return;
    const appState = excalidrawApi.getAppState();
    const selectedIds = appState?.selectedElementIds || {};
    const elements = excalidrawApi.getSceneElements();
    const selected = elements.filter((el: any) => selectedIds[el.id] && !el.isDeleted);
    if (selected.length > 0) {
      try {
        navigator.clipboard?.writeText(JSON.stringify(selected));
      } catch {}
    }
  }, [excalidrawApi]);

  const handlePaste = useCallback(async () => {
    if (!excalidrawApi) return;
    try {
      const clipText = await navigator.clipboard?.readText();
      if (clipText) {
        const parsed = JSON.parse(clipText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const current = excalidrawApi.getSceneElements();
          const newSelected: Record<string, boolean> = {};
          const pasted = parsed.map((el: any) => {
            const newId = `${el.id}-paste-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
            newSelected[newId] = true;
            return {
              ...el,
              id: newId,
              x: (el.x || 0) + 24,
              y: (el.y || 0) + 24,
              isDeleted: false
            };
          });
          excalidrawApi.updateScene({
            elements: [...current, ...pasted],
            appState: { selectedElementIds: newSelected }
          });
        }
      }
    } catch {}
  }, [excalidrawApi]);

  const handleDuplicate = useCallback(() => {
    if (!excalidrawApi) return;
    const appState = excalidrawApi.getAppState();
    const selectedIds = appState?.selectedElementIds || {};
    const elements = excalidrawApi.getSceneElements();
    const newElements: any[] = [];
    const newSelected: Record<string, boolean> = {};
    elements.forEach((el: any) => {
      if (selectedIds[el.id] && !el.isDeleted) {
        const cloned = {
          ...el,
          id: `${el.id}-dup-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          x: (el.x || 0) + 20,
          y: (el.y || 0) + 20
        };
        newElements.push(cloned);
        newSelected[cloned.id] = true;
      }
    });
    if (newElements.length > 0) {
      excalidrawApi.updateScene({
        elements: [...elements, ...newElements],
        appState: { selectedElementIds: newSelected }
      });
    }
  }, [excalidrawApi]);

  const handleDelete = useCallback(() => {
    if (!excalidrawApi) return;
    const appState = excalidrawApi.getAppState();
    const selectedIds = appState?.selectedElementIds || {};
    const elements = excalidrawApi.getSceneElements();
    const updated = elements.map((el: any) => selectedIds[el.id] ? { ...el, isDeleted: true } : el);
    excalidrawApi.updateScene({
      elements: updated,
      appState: { selectedElementIds: {} }
    });
  }, [excalidrawApi]);

  const handleSelectAll = useCallback(() => {
    if (!excalidrawApi) return;
    const elements = excalidrawApi.getSceneElements();
    const selectedElementIds: Record<string, boolean> = {};
    elements.forEach((el: any) => {
      if (!el.isDeleted) selectedElementIds[el.id] = true;
    });
    excalidrawApi.updateScene({
      appState: { selectedElementIds }
    });
  }, [excalidrawApi]);

  const handleBringToFront = useCallback(() => {
    if (!excalidrawApi) return;
    const appState = excalidrawApi.getAppState();
    const selectedIds = appState?.selectedElementIds || {};
    const elements = excalidrawApi.getSceneElements();
    const unselected = elements.filter((el: any) => !selectedIds[el.id]);
    const selected = elements.filter((el: any) => selectedIds[el.id]);
    if (selected.length > 0) {
      excalidrawApi.updateScene({ elements: [...unselected, ...selected] });
    }
  }, [excalidrawApi]);

  const handleSendToBack = useCallback(() => {
    if (!excalidrawApi) return;
    const appState = excalidrawApi.getAppState();
    const selectedIds = appState?.selectedElementIds || {};
    const elements = excalidrawApi.getSceneElements();
    const unselected = elements.filter((el: any) => !selectedIds[el.id]);
    const selected = elements.filter((el: any) => selectedIds[el.id]);
    if (selected.length > 0) {
      excalidrawApi.updateScene({ elements: [...selected, ...unselected] });
    }
  }, [excalidrawApi]);

  const handleToggleLock = useCallback(() => {
    if (!excalidrawApi) return;
    const appState = excalidrawApi.getAppState();
    const selectedIds = appState?.selectedElementIds || {};
    const elements = excalidrawApi.getSceneElements();
    const updated = elements.map((el: any) => {
      if (selectedIds[el.id]) {
        return { ...el, locked: !el.locked };
      }
      return el;
    });
    excalidrawApi.updateScene({ elements: updated });
  }, [excalidrawApi]);

  const handleClearCanvas = useCallback(() => {
    if (!excalidrawApi) return;
    excalidrawApi.resetScene();
    handleUpdateCanvasScene([], { excalidrawElements: [] });
  }, [excalidrawApi, handleUpdateCanvasScene]);

  const hasCanvasSelection = Boolean(
    excalidrawApi &&
    Object.keys(excalidrawApi.getAppState()?.selectedElementIds || {}).some(
      (id) => excalidrawApi.getAppState()?.selectedElementIds[id]
    )
  );
  const hasCanvasElements = Boolean(
    excalidrawApi &&
    excalidrawApi.getSceneElements()?.some((el: any) => !el.isDeleted)
  );

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setIsContextMenuOpen(true);
  };

  const handleToggleTheme = () => {
    const next = boardTheme === 'dark' ? 'light' : 'dark';
    setBoardTheme(next);
    if (excalidrawApiRef.current) {
      excalidrawApiRef.current.updateScene({
        appState: {
          theme: 'light',
          viewBackgroundColor: next === 'dark' ? '#0A0A0A' : '#FAFAFA',
          gridModeEnabled: false
        }
      });
    }
  };

  return (
    <div
      data-testid="learning-board-view"
      onContextMenu={handleContextMenu}
      className="flex-1 flex flex-col h-full w-full bg-[#080808] overflow-hidden select-none relative"
    >
      {/* 1. STANDALONE INFINITE CANVAS HOST */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden w-full h-full">
        <UniversalCanvasHost
          resourceId={boardId}
          resourceType="board"
          viewMode="canvas"
          boardTheme={boardTheme}
          initialElements={initialElements}
          initialAppState={initialAppState}
          onUpdateCanvasScene={handleUpdateCanvasScene}
          onExcalidrawApiReady={handleApiReady}
          onContextMenu={handleContextMenu}
        />
      </div>

      {/* 2. CONTEXT MENU (TRIGGERED VIA RIGHT-CLICK OR CANVAS WORKSPACE) */}
      <LearningContextMenu
        isOpen={isContextMenuOpen}
        position={contextMenuPos}
        onClose={() => setIsContextMenuOpen(false)}
        actions={{
          hasCanvasSelection,
          hasCanvasElements,
          onCut: handleCut,
          onCopy: handleCopy,
          onPaste: handlePaste,
          onDuplicate: handleDuplicate,
          onDelete: handleDelete,
          onSelectAll: handleSelectAll,
          onBringToFront: handleBringToFront,
          onSendToBack: handleSendToBack,
          onToggleLock: handleToggleLock,
          onClearCanvas: handleClearCanvas,
          theme: boardTheme,
          onToggleTheme: handleToggleTheme,
          onExportPdf: handleExportPdf,
          onExportPng: handleExportPng,
          onExportSvg: handleExportSvg,
          onExportJson: handleExportJson,
          onRename: () => setIsEditingTitle(true),
          fileType: 'board',
          onOpenShortcutsGuide: () => setIsGuideOpen(true)
        }}
      />
      <LearningWorkspaceGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* 3. INLINE RENAME BOARD MODAL */}
      {isEditingTitle && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 w-80 shadow-2xl flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-[#F4F4F5]">Rename Board</h3>
            <input
              type="text"
              defaultValue={boardTitle}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle((e.target as HTMLInputElement).value);
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none focus:border-[#60A5FA]"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsEditingTitle(false)}
                className="px-2.5 py-1 rounded-lg text-[#A1A1AA] hover:text-[#F4F4F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                  if (input) handleSaveTitle(input.value);
                }}
                className="px-3 py-1 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
