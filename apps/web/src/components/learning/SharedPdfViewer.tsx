import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'pdfjs-dist/web/pdf_viewer.css';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Layers,
  Sparkles,
  MessageSquare,
  Search,
  Eye,
  FileText,
  X,
  FileDown,
  Moon,
  Sun
} from 'lucide-react';
import { UniversalCanvasHost, SpatialElement, ViewMode } from '../canvas/UniversalCanvasHost.js';
import { useLearningStore } from '../../stores/learning-store.js';
import { LearningContextMenu } from './LearningContextMenu.js';
import { LearningWorkspaceGuideModal } from './LearningWorkspaceGuideModal.js';

// Configure pdfjs worker in Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface SharedPdfViewerProps {
  fileId: string;
  pdfUrl: string;
  originalFileName: string;
  fileType: 'pdf' | 'docx' | 'slides';
  initialPage?: number;
  aspectRatio?: 'a4' | '16:9';
  showFilmstrip?: boolean;
  speakerNotes?: Record<number, string>;
  subTabs?: string[];
  activeSubTabIndex?: number;
  onSubTabClick?: (index: number) => void;
  onTextSelected?: (text: string) => void;
  onPageChange?: (page: number, total: number) => void;
}

export const SharedPdfViewer: React.FC<SharedPdfViewerProps> = ({
  fileId,
  pdfUrl,
  originalFileName,
  fileType,
  initialPage = 1,
  aspectRatio = fileType === 'slides' ? '16:9' : 'a4',
  showFilmstrip = true,
  speakerNotes,
  subTabs,
  activeSubTabIndex = 0,
  onSubTabClick,
  onTextSelected,
  onPageChange
}) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<ViewMode>('blended');
  const [documentTheme, setDocumentTheme] = useState<'dark' | 'light'>('dark');
  const [isNativelyDark, setIsNativelyDark] = useState<boolean>(false);
  const [hasRenderedContent, setHasRenderedContent] = useState<boolean>(false);
  const [isSectionsMenuOpen, setIsSectionsMenuOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Deck annotations state for the current page
  const [pageElements, setPageElements] = useState<any[]>([]);
  const [pageSpatialCards, setPageSpatialCards] = useState<SpatialElement[]>([]);
  const [excalidrawApi, setExcalidrawApi] = useState<any>(null);

  // Speaker notes drawer toggle for slides
  const [isSpeakerNotesOpen, setIsSpeakerNotesOpen] = useState<boolean>(false);

  // Canvas & Text Layer state
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: aspectRatio === '16:9' ? 840 : 760,
    height: aspectRatio === '16:9' ? 472 : 1075
  });

  // In-Document Search state
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ page: number; snippet: string }>>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Text selection highlight state
  const [selectedExcerpt, setSelectedExcerpt] = useState<string | null>(null);

  // Right-click context menu state
  const [isContextMenuOpen, setIsContextMenuOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const pendingAnnotationsRef = useRef<{ elementsJson: any[]; appStateJson: any } | null>(null);

  // 1. Load PDF Document from Backend with local offline CMaps and Fonts
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setLoadError(null);

    const loadTask = pdfjsLib.getDocument({
      url: pdfUrl,
      withCredentials: false,
      cMapUrl: '/pdfjs/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/pdfjs/standard_fonts/',
      wasmUrl: '/pdfjs/wasm/',
      useSystemFonts: true
    });

    loadTask.promise
      .then((loadedPdf) => {
        if (!isCancelled) {
          setPdfDoc(loadedPdf);
          setTotalPages(loadedPdf.numPages);
          setIsLoading(false);
          if (onPageChange) {
            onPageChange(currentPage, loadedPdf.numPages);
          }
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('[SharedPdfViewer] PDF.js load error:', err);
          const errorMsg = err?.message || 'Failed to load PDF preview from backend';
          setLoadError(errorMsg);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [pdfUrl]);

  // Flush pending debounced annotations before switching pages or unmounting
  const flushPendingAnnotations = useCallback(async () => {
    if (pendingAnnotationsRef.current) {
      try {
        await fetch(`/api/learning/files/${fileId}/annotations/${currentPage}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingAnnotationsRef.current)
        });
        pendingAnnotationsRef.current = null;
      } catch (err) {
        console.warn('[SharedPdfViewer] Failed to flush annotations on page switch:', err);
      }
    }
  }, [fileId, currentPage]);

  // 2. Fetch Annotations for Current Page from Backend
  const loadPageAnnotations = useCallback(
    async (pageNum: number) => {
      try {
        const res = await fetch(`/api/learning/files/${fileId}/annotations/${pageNum}`);
        if (res.ok) {
          const data = await res.json();
          const elements = Array.isArray(data.elementsJson) ? data.elementsJson : [];
          const spatial = elements.filter((e: any) => e.type === 'stickyCard' || e.type === 'calloutNode');
          const excalidraw = elements.filter((e: any) => e.type !== 'stickyCard' && e.type !== 'calloutNode');
          setPageSpatialCards(spatial);
          setPageElements(excalidraw);
        }
      } catch (err) {
        console.warn('[SharedPdfViewer] Failed to load page annotations:', err);
      }
    },
    [fileId]
  );

  useEffect(() => {
    loadPageAnnotations(currentPage);
  }, [currentPage, loadPageAnnotations]);

  // 3. Save Annotations when user edits on canvas
  const handleUpdateCanvasScene = useCallback(
    async (elementsJson: any[], appStateJson: any) => {
      try {
        const mergedElements = [...elementsJson, ...pageSpatialCards];
        const payload = {
          elementsJson: mergedElements,
          appStateJson
        };
        pendingAnnotationsRef.current = payload;
        await fetch(`/api/learning/files/${fileId}/annotations/${currentPage}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        pendingAnnotationsRef.current = null;
      } catch (err) {
        console.warn('[SharedPdfViewer] Failed to autosave annotations:', err);
      }
    },
    [fileId, currentPage, pageSpatialCards]
  );

  // 4. Excalidraw camera is permanently locked to 1.0 in document overlay mode.
  // Both the base layer and Excalidraw live inside #unified-page-stage scaled via CSS transform: scale(zoomScale)
  useEffect(() => {
    if (excalidrawApi) {
      try {
        excalidrawApi.updateScene({
          appState: {
            scrollX: 0,
            scrollY: 0,
            zoom: { value: 1.0 }
          }
        });
      } catch (e) {}
    }
  }, [excalidrawApi]);

  // 5. Render Current PDF Page onto Main Canvas & Mount TextLayer
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let isCancelled = false;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {}
      renderTaskRef.current = null;
    }

    pdfDoc.getPage(currentPage).then(async (page: any) => {
      if (isCancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const baseWidth = aspectRatio === '16:9' ? 840 : 760;
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const baseHeight = Math.floor(baseWidth * (unscaledViewport.height / unscaledViewport.width));

      // Constant unscaled base dimensions for the 1:1 stage
      setCanvasDimensions({ width: baseWidth, height: baseHeight });

      // Render at high-DPI matching the current zoomScale for razor-sharp text
      const scale = (baseWidth * zoomScale) / unscaledViewport.width;
      const viewport = page.getViewport({ scale });

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      ctx.save();
      ctx.scale(dpr, dpr);

      // Cancel previous task if still running
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
        renderTaskRef.current = null;
      }

      const renderTask = page.render({
        canvasContext: ctx,
        viewport
      });
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
        renderTaskRef.current = null;
        if (isCancelled) return;

        // Fast pixel-luminance check to detect natively dark documents/slides
        try {
          const checkW = Math.min(canvas.width, 160);
          const checkH = Math.min(canvas.height, 160);
          const imgData = ctx.getImageData(0, 0, checkW, checkH);
          const pixels = imgData.data;
          let sumLum = 0;
          let count = 0;
          let hasVisiblePixels = false;
          for (let i = 0; i < pixels.length; i += 16) {
            const alpha = pixels[i + 3];
            if (alpha > 0) hasVisiblePixels = true;
            const r = pixels[i] / 255;
            const g = pixels[i + 1] / 255;
            const b = pixels[i + 2] / 255;
            sumLum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
            count++;
          }
          const avgLum = count > 0 ? sumLum / count : 1;
          setIsNativelyDark(avgLum < 0.35);
          if (hasVisiblePixels) {
            setHasRenderedContent(true);
          }
        } catch (lumErr) {
          console.warn('[SharedPdfViewer] Luminance check failed:', lumErr);
          setHasRenderedContent(true);
        }

        // Mount genuine DOM text layer over the rendered PDF canvas
        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = '';
          try {
            const textContent = await page.getTextContent();
            if (isCancelled) return;
            const baseViewport = page.getViewport({ scale: baseWidth / unscaledViewport.width });
            const textLayer = new pdfjsLib.TextLayer({
              textContentSource: textContent,
              container: textLayerRef.current,
              viewport: baseViewport
            });
            await textLayer.render();
          } catch (tErr) {
            console.warn('[SharedPdfViewer] TextLayer render error:', tErr);
          }
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('[SharedPdfViewer] Render exception:', err);
        }
      } finally {
        ctx.restore();
      }
    });

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, currentPage, zoomScale, aspectRatio]);

  // Adaptive Ink Color Contrast on Excalidraw overlay
  useEffect(() => {
    if (excalidrawApi) {
      const isVisuallyDark = isNativelyDark ? documentTheme === 'dark' : documentTheme === 'dark';
      const targetNeutral = isVisuallyDark ? '#F4F4F5' : '#18181B';
      const current = excalidrawApi.getAppState()?.currentItemStrokeColor;
      if (current === '#F4F4F5' || current === '#18181B') {
        excalidrawApi.updateScene({
          appState: { currentItemStrokeColor: targetNeutral }
        });
      }
    }
  }, [documentTheme, isNativelyDark, excalidrawApi]);

  const computeDocumentFilter = useCallback(() => {
    if (!hasRenderedContent) {
      return 'none';
    }
    if (isNativelyDark) {
      // If natively dark: dark theme needs NO inversion (authentic dark); light theme inverts to light
      return documentTheme === 'dark' ? 'none' : 'invert(0.92) hue-rotate(180deg)';
    } else {
      // If natively light: dark theme inverts to dark; light theme needs NO inversion
      return documentTheme === 'dark' ? 'invert(0.92) hue-rotate(180deg) contrast(0.95)' : 'none';
    }
  }, [hasRenderedContent, isNativelyDark, documentTheme]);

  // Navigation handlers with auto-flush
  const handlePrevPage = async () => {
    if (currentPage > 1) {
      await flushPendingAnnotations();
      const next = currentPage - 1;
      setCurrentPage(next);
      if (onPageChange) onPageChange(next, totalPages);
    }
  };

  const handleNextPage = async () => {
    if (currentPage < totalPages) {
      await flushPendingAnnotations();
      const next = currentPage + 1;
      setCurrentPage(next);
      if (onPageChange) onPageChange(next, totalPages);
    }
  };

  const handleJumpToPage = async (p: number) => {
    if (p !== currentPage) {
      await flushPendingAnnotations();
      setCurrentPage(p);
      if (onPageChange) onPageChange(p, totalPages);
    }
  };

  // 7. In-Document Multi-Page Text Search
  const performSearch = useCallback(
    async (query: string) => {
      if (!pdfDoc || !query.trim()) {
        setSearchResults([]);
        setCurrentSearchIndex(0);
        return;
      }
      setIsSearching(true);
      const results: Array<{ page: number; snippet: string }> = [];
      const qLower = query.toLowerCase();

      for (let p = 1; p <= totalPages; p++) {
        try {
          const page = await pdfDoc.getPage(p);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((it: any) => it.str).join(' ');
          let idx = 0;
          while ((idx = pageText.toLowerCase().indexOf(qLower, idx)) !== -1) {
            const start = Math.max(0, idx - 24);
            const end = Math.min(pageText.length, idx + query.length + 32);
            results.push({
              page: p,
              snippet: `...${pageText.substring(start, end).trim()}...`
            });
            idx += query.length;
          }
        } catch (e) {
          console.warn('[performSearch] Page scan error:', e);
        }
      }

      setSearchResults(results);
      setCurrentSearchIndex(0);
      setIsSearching(false);
      if (results.length > 0) {
        handleJumpToPage(results[0].page);
      }
    },
    [pdfDoc, totalPages]
  );

  const handleNextSearchResult = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIdx);
    handleJumpToPage(searchResults[nextIdx].page);
  };

  const handlePrevSearchResult = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIdx);
    handleJumpToPage(searchResults[prevIdx].page);
  };

  // Keyboard shortcut listeners (Cmd/Ctrl + F for search, Cmd/Ctrl + N for notes)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n' && fileType === 'slides') {
        e.preventDefault();
        setIsSpeakerNotesOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileType]);

  // Text selection handler
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const excerpt = selection.toString().trim();
      setSelectedExcerpt(excerpt);
      useLearningStore.getState().setSelectedExcerpt({
        text: excerpt,
        pageNumber: currentPage,
        fileId,
        fileName: originalFileName,
        toolType: fileType
      });
      if (onTextSelected) {
        onTextSelected(excerpt);
      }
    }
  };

  // Canvas actions for annotation overlay
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

  return (
    <div
      data-testid="shared-pdf-viewer"
      onContextMenu={handleContextMenu}
      className="flex-1 flex flex-col h-full w-full bg-[#080808] text-[#F4F4F5] overflow-hidden select-none relative"
    >
      {/* 1. FLOATING IN-DOCUMENT SEARCH PILL */}
      {isSearchOpen && (
        <div
          data-testid="in-document-search-bar"
          className="absolute top-4 right-6 z-40 bg-[#121214]/95 backdrop-blur-md border border-[#27272A] shadow-2xl rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs animate-in slide-in-from-top-2 duration-150"
        >
          <Search className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
          <input
            type="text"
            data-testid="input-pdf-search"
            placeholder="Search across all pages..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              performSearch(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNextSearchResult();
              if (e.key === 'Escape') setIsSearchOpen(false);
            }}
            autoFocus
            className="bg-transparent text-xs text-[#F4F4F5] placeholder-[#71717A] focus:outline-none w-48"
          />
          <span data-testid="search-results-counter" className="font-mono text-[11px] text-[#A1A1AA] whitespace-nowrap">
            {isSearching
              ? 'Scanning...'
              : searchResults.length > 0
              ? `${currentSearchIndex + 1} of ${searchResults.length}`
              : searchQuery
              ? '0 matches'
              : ''}
          </span>
          <button
            type="button"
            data-testid="btn-search-prev"
            onClick={handlePrevSearchResult}
            disabled={searchResults.length <= 1}
            className="p-1 rounded text-[#A1A1AA] hover:text-[#F4F4F5] disabled:opacity-30 hover:bg-[#18181B]"
            title="Previous match"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            data-testid="btn-search-next"
            onClick={handleNextSearchResult}
            disabled={searchResults.length <= 1}
            className="p-1 rounded text-[#A1A1AA] hover:text-[#F4F4F5] disabled:opacity-30 hover:bg-[#18181B]"
            title="Next match"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded text-[#71717A] hover:text-[#F4F4F5]"
            title="Close search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. MAIN CENTER STAGE */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#080808]/80 z-40 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#121214] border border-[#1F1F23]">
              <span className="w-4 h-4 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[#A1A1AA]">Rendering High-Fidelity Preview...</span>
            </div>
          </div>
        )}

        {loadError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto px-4">
            <FileText className="w-12 h-12 text-[#EF4444] mb-3 opacity-80" />
            <p className="text-sm font-medium text-[#F4F4F5] mb-1">{loadError}</p>
            {fileType !== 'pdf' ? (
              <p className="text-xs text-[#A1A1AA] mb-4 leading-relaxed">
                Unable to convert document to PDF preview. You can still download and inspect the original file below.
              </p>
            ) : (
              <p className="text-xs text-[#A1A1AA] mb-4 leading-relaxed">
                Unable to render PDF stream. Please verify the document format or download the original file below.
              </p>
            )}
            <a
              href={`/api/learning/files/${fileId}/original`}
              download={originalFileName}
              className="px-3.5 py-2 rounded-lg bg-[#18181B] border border-[#27272A] text-xs font-medium text-[#E4E4E7] hover:bg-[#27272A] flex items-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Download Original Document ({originalFileName})</span>
            </a>
          </div>
        ) : (
          <div
            className="flex-1 flex min-h-0 relative overflow-hidden w-full h-full"
            onMouseUp={handleMouseUp}
          >
            <UniversalCanvasHost
              resourceId={`${fileId}-p${currentPage}`}
              resourceType={fileType}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              pageDimensions={canvasDimensions}
              zoomScale={zoomScale}
              onZoomChange={setZoomScale}
              elements={pageSpatialCards}
              initialElements={pageElements}
              onUpdateCanvasScene={handleUpdateCanvasScene}
              onExcalidrawApiReady={setExcalidrawApi}
              pageNav={{
                currentPage,
                totalPages,
                onPrevPage: handlePrevPage,
                onNextPage: handleNextPage,
                onGoToPage: (page: number) => setCurrentPage(page)
              }}
              onContextMenu={handleContextMenu}
              baseLayer={
                <div className="relative w-full h-full">
                  <canvas
                    ref={canvasRef}
                    data-testid="pdf-render-canvas"
                    className="block w-full h-full pointer-events-auto transition-all duration-200"
                    style={{
                      filter: computeDocumentFilter()
                    }}
                  />
                  <div
                    ref={textLayerRef}
                    data-testid="pdf-text-layer"
                    className="textLayer absolute inset-0 overflow-hidden pointer-events-auto select-text z-10"
                  />
                </div>
              }
            />
          </div>
        )}

        {/* 3. OPTIONAL SPEAKER NOTES DRAWER (SLIDES MODE) */}
        {fileType === 'slides' && isSpeakerNotesOpen && (
          <div
            data-testid="speaker-notes-drawer"
            className="w-80 h-full bg-[#0E0E10] border-l border-[#1F1F23] flex flex-col shrink-0 z-40 animate-in slide-in-from-right duration-200"
          >
            <div className="h-10 px-4 border-b border-[#1F1F23] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F4F4F5] flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#3B82F6]" />
                Speaker Notes — Slide {currentPage}
              </span>
              <button
                type="button"
                onClick={() => setIsSpeakerNotesOpen(false)}
                className="text-xs text-[#A1A1AA] hover:text-[#F4F4F5]"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto text-xs leading-relaxed text-[#D4D4D8]">
              {speakerNotes && speakerNotes[currentPage] ? (
                <p className="whitespace-pre-wrap">{speakerNotes[currentPage]}</p>
              ) : (
                <p className="text-[#71717A] italic">No speaker notes provided for this slide.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. CONTEXT MENU */}
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
          onSearch: () => setIsSearchOpen(true),
          onZoomIn: () => setZoomScale((z) => Math.min(2.0, Math.round((z + 0.1) * 10) / 10)),
          onZoomOut: () => setZoomScale((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10)),
          onResetZoom: () => setZoomScale(1.0),
          zoomPercent: Math.round(zoomScale * 100),
          theme: documentTheme,
          onToggleTheme: () => setDocumentTheme((t) => (t === 'dark' ? 'light' : 'dark')),
          onToggleSpeakerNotes: fileType === 'slides' ? () => setIsSpeakerNotesOpen((prev) => !prev) : undefined,
          isSpeakerNotesOpen,
          sections: subTabs && subTabs.length > 0 ? subTabs : undefined,
          activeSectionIndex: activeSubTabIndex,
          onSelectSection: (idx) => {
            if (onSubTabClick) onSubTabClick(idx);
            handleJumpToPage(idx + 1);
          },
          onExportPdf: () => {
            window.location.href = `/api/learning/files/${fileId}/export-annotated`;
          },
          onDownloadOriginal: () => {
            window.location.href = `/api/learning/files/${fileId}/original`;
          },
          fileType
        }}
      />
      <LearningWorkspaceGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};
