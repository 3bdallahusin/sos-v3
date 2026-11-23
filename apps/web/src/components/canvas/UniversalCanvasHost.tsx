import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import {
  DockedAnnotationToolbar,
  CanvasTool,
  ShapeType,
  StrokeStyle,
  FillStyle,
  Sloppiness,
  Roundness,
  FontFamily,
  PageNavProps
} from './DockedAnnotationToolbar.js';
import { StickyNote, Tag, Move } from 'lucide-react';
import { LearningWorkspaceGuideModal } from '../learning/LearningWorkspaceGuideModal.js';

export type ViewMode = 'blended' | 'doc' | 'canvas';

export interface SpatialElement {
  id: string;
  type: 'stickyCard' | 'calloutNode' | 'shape' | 'text';
  category?: string;
  subCategory?: string;
  title?: string;
  icon?: string;
  accentColor?: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  width?: number;
  text?: string;
  snapZone?: 'left-margin' | 'right-margin' | 'in-bounds';
  linkedBlockId?: string;
}

export interface UniversalCanvasHostProps {
  resourceId: string;
  resourceType: 'note' | 'pdf' | 'slides' | 'docx' | 'board' | 'spreadsheet' | 'image';
  boardTheme?: 'dark' | 'light';
  baseLayer?: React.ReactNode;
  elements?: SpatialElement[];
  initialElements?: any[];
  initialAppState?: any;
  viewMode?: ViewMode;
  onChangeViewMode?: (mode: ViewMode) => void;
  onUpdateElements?: (elements: SpatialElement[]) => void;
  onUpdateCanvasScene?: (elementsJson: any[], appStateJson: any) => Promise<void>;
  onExcalidrawApiReady?: (api: any) => void;
  highlightedElementId?: string | null;
  className?: string;
  hideToolbar?: boolean;
  pageNav?: PageNavProps;
  onContextMenu?: (e: React.MouseEvent) => void;
  pageDimensions?: { width: number; height: number };
  zoomScale?: number;
  onZoomChange?: React.Dispatch<React.SetStateAction<number>> | ((updater: (prev: number) => number) => void);
}

const DEFAULT_EMPTY_ELEMENTS: SpatialElement[] = [];
const DEFAULT_EMPTY_INITIAL: any[] = [];

export const UniversalCanvasHost: React.FC<UniversalCanvasHostProps> = ({
  resourceId,
  resourceType,
  boardTheme = 'dark',
  baseLayer,
  elements = DEFAULT_EMPTY_ELEMENTS,
  initialElements = DEFAULT_EMPTY_INITIAL,
  initialAppState,
  viewMode: controlledViewMode,
  onChangeViewMode,
  onUpdateElements,
  onUpdateCanvasScene,
  onExcalidrawApiReady,
  highlightedElementId,
  className = '',
  hideToolbar = false,
  pageNav,
  onContextMenu,
  pageDimensions,
  zoomScale,
  onZoomChange
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>(resourceType === 'board' ? 'canvas' : 'blended');
  const activeViewMode = controlledViewMode ?? internalViewMode;

  const setViewMode = (mode: ViewMode) => {
    if (onChangeViewMode) {
      onChangeViewMode(mode);
    } else {
      setInternalViewMode(mode);
    }
  };

  // Excalidraw API Ref
  const [excalidrawApi, setExcalidrawApi] = useState<any>(null);

  // Canvas tool state (Calibrated Excalidraw Defaults: Medium 2px, 16px Font)
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [strokeColor, setStrokeColor] = useState<string>('#F4F4F5');
  const [fillColor, setFillColor] = useState<string>('transparent');
  const [strokeStyle, setStrokeStyle] = useState<StrokeStyle>('solid');
  const [opacity, setOpacity] = useState<number>(100);
  const [fontSize, setFontSize] = useState<number>(16);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [isToolLocked, setIsToolLocked] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [fillStyle, setFillStyle] = useState<FillStyle>('solid');
  const [sloppiness, setSloppiness] = useState<Sloppiness>(0);
  const [roundness, setRoundness] = useState<Roundness>('round');
  const [fontFamily, setFontFamily] = useState<FontFamily>(1);
  const [isDockHidden, setIsDockHidden] = useState<boolean>(false);
  const [selectedElementTypes, setSelectedElementTypes] = useState<string[]>([]);
  const [hasSelection, setHasSelection] = useState<boolean>(false);
  const lastSelectedKeysRef = useRef<string>('');

  const handleToggleToolLock = () => {
    setIsToolLocked((prev) => {
      const next = !prev;
      if (excalidrawApi) {
        const currentTool = excalidrawApi.getAppState()?.activeTool || { type: 'selection' };
        excalidrawApi.updateScene({
          appState: {
            activeTool: {
              ...currentTool,
              locked: next
            }
          }
        });
      }
      return next;
    });
  };

  const handleToggleLibrary = () => {
    setIsLibraryOpen((prev) => !prev);
  };

  const handleInsertLibraryItem = (itemType: string) => {
    if (!excalidrawApi) return;
    const currentElements = excalidrawApi.getSceneElements();
    const id = `stamp-${Date.now()}`;
    const scrollY = excalidrawApi.getAppState()?.scrollY || 0;
    const scrollX = excalidrawApi.getAppState()?.scrollX || 0;
    const centerX = -scrollX + 350;
    const centerY = -scrollY + 250;
    let newEl: any = null;

    if (itemType === 'synapse') {
      newEl = {
        id,
        type: 'ellipse',
        x: centerX,
        y: centerY,
        width: 120,
        height: 80,
        strokeColor: strokeColor || '#60A5FA',
        backgroundColor: 'transparent',
        fillStyle: 'hachure',
        strokeWidth: 2,
        roughness: 1,
        opacity: 100
      };
    } else if (itemType === 'vesicle') {
      newEl = {
        id,
        type: 'ellipse',
        x: centerX,
        y: centerY,
        width: 32,
        height: 32,
        strokeColor: '#34D399',
        backgroundColor: '#10B98120',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 0,
        opacity: 100
      };
    } else if (itemType === 'receptor') {
      newEl = {
        id,
        type: 'rectangle',
        x: centerX,
        y: centerY,
        width: 48,
        height: 24,
        strokeColor: '#F59E0B',
        backgroundColor: '#F59E0B20',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 0,
        opacity: 100
      };
    } else {
      newEl = {
        id,
        type: 'rectangle',
        x: centerX,
        y: centerY,
        width: 140,
        height: 60,
        strokeColor: '#F4F4F5',
        backgroundColor: '#18181B',
        fillStyle: 'solid',
        strokeWidth: 1.5,
        roughness: 0,
        opacity: 100
      };
    }
    if (newEl) {
      excalidrawApi.updateScene({
        elements: [...currentElements, newEl]
      });
    }
    setIsLibraryOpen(false);
  };

  // Spatial elements state
  const [spatialItems, setSpatialItems] = useState<SpatialElement[]>(elements);
  useEffect(() => {
    setSpatialItems(elements);
  }, [elements]);

  // Mutable references for zero-lag 60fps drawing & deterministic history
  const latestElementsRef = useRef<readonly any[]>([]);
  const latestAppStateRef = useRef<any>(null);
  const latestFilesRef = useRef<any>(null);
  const isInteractingRef = useRef<boolean>(false);
  const undoStackRef = useRef<any[][]>([
    JSON.parse(JSON.stringify((initialElements || []).filter((el: any) => !el?.isDeleted)))
  ]);
  const redoStackRef = useRef<any[][]>([]);
  const isPerformingUndoRedoRef = useRef<boolean>(false);

  // Synchronize initialElements into Excalidraw when resourceId changes
  const lastLoadedResourceIdRef = useRef<string>('');
  useEffect(() => {
    if (excalidrawApi && initialElements && resourceId !== lastLoadedResourceIdRef.current) {
      lastLoadedResourceIdRef.current = resourceId;
      excalidrawApi.updateScene({ elements: initialElements });
      const nonDeleted = initialElements.filter((el: any) => !el.isDeleted);
      undoStackRef.current = [JSON.parse(JSON.stringify(nonDeleted))];
      redoStackRef.current = [];
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [excalidrawApi, initialElements, resourceId]);

  // Synchronize board background color and theme on ready and theme change
  useEffect(() => {
    if (excalidrawApi) {
      if (resourceType === 'board') {
        excalidrawApi.updateScene({
          appState: {
            viewBackgroundColor: boardTheme === 'light' ? '#FAFAFA' : '#0A0A0A',
            theme: 'light'
          }
        });
      } else {
        excalidrawApi.updateScene({
          appState: {
            viewBackgroundColor: 'transparent',
            theme: 'light'
          }
        });
      }
    }
  }, [excalidrawApi, boardTheme, resourceType]);

  // Dragging state for margin cards
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startLeft: number; startTop: number } | null>(null);
  const [activeSnapZone, setActiveSnapZone] = useState<'left-margin' | 'right-margin' | 'in-bounds' | null>(null);

  // Unified Scroll Container Ref & Save Timeout Ref
  const docScrollRef = useRef<HTMLDivElement>(null);
  const docStageInnerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  // 1:1 SCROLL SYNCHRONIZATION: Sync docScrollRef.scrollTop directly into Excalidraw appState.scrollY
  const syncScrollToExcalidraw = useCallback(() => {
    if (!docScrollRef.current || !excalidrawApi) return;
    const scrollTop = docScrollRef.current.scrollTop;
    const scrollLeft = docScrollRef.current.scrollLeft;

    excalidrawApi.updateScene({
      appState: {
        scrollY: -scrollTop,
        scrollX: -scrollLeft
      }
    });
  }, [excalidrawApi]);

  const handleDocScroll = () => {
    syncScrollToExcalidraw();
  };

  // Intercept wheel events on the Excalidraw overlay so normal mouse-wheel scrolling scrolls the document naturally
  const handleCanvasWheel = (e: React.WheelEvent) => {
    // If Ctrl or Cmd is held, allow Excalidraw to zoom
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    // Forward normal vertical & horizontal wheel scrolling directly to the document scroll container
    if (docScrollRef.current) {
      docScrollRef.current.scrollTop += e.deltaY;
      docScrollRef.current.scrollLeft += e.deltaX;
      syncScrollToExcalidraw();
    }
  };

  const pageStageRef = useRef<HTMLDivElement>(null);

  // Wheel forwarding for page-locked mode (PDF, DOCX, Slides)
  const handlePageCanvasWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) return;
    if (docScrollRef.current) {
      docScrollRef.current.scrollTop += e.deltaY;
      docScrollRef.current.scrollLeft += e.deltaX;
    }
  }, []);

  // Trackpad two-finger pinch-to-zoom non-passive listener
  useEffect(() => {
    const el = docScrollRef.current;
    if (!el) return;

    const handlePinchWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        if (onZoomChange) {
          onZoomChange((prev: number) => {
            const factor = Math.exp(-e.deltaY * 0.004);
            const next = Number((prev * factor).toFixed(3));
            return Math.min(3.0, Math.max(0.5, next));
          });
        }
      }
    };

    el.addEventListener('wheel', handlePinchWheel, { passive: false, capture: true });
    return () => {
      el.removeEventListener('wheel', handlePinchWheel, { capture: true });
    };
  }, [onZoomChange]);

  // ResizeObserver on pageStageRef to refresh Excalidraw API and lock camera permanently to 1.0 in document mode
  useEffect(() => {
    if (!pageDimensions || !pageStageRef.current || !excalidrawApi) return;
    const ro = new ResizeObserver(() => {
      try {
        excalidrawApi.refresh();
        excalidrawApi.updateScene({
          appState: {
            scrollX: 0,
            scrollY: 0,
            zoom: { value: 1.0 as any }
          }
        });
      } catch {}
    });
    ro.observe(pageStageRef.current);
    return () => ro.disconnect();
  }, [pageDimensions, excalidrawApi]);

  // Sync tools with Excalidraw API
  const handleSelectTool = useCallback(
    (tool: CanvasTool) => {
      setActiveTool(tool);
      if (!excalidrawApi) return;

      switch (tool) {
        case 'select':
          excalidrawApi.setActiveTool({ type: 'selection' });
          break;
        case 'pan':
          excalidrawApi.setActiveTool({ type: 'hand' });
          break;
        case 'pen':
          excalidrawApi.setActiveTool({ type: 'freedraw' });
          excalidrawApi.updateScene({
            appState: {
              currentItemStrokeColor: strokeColor,
              currentItemStrokeWidth: strokeWidth,
              currentItemOpacity: opacity
            }
          });
          break;
        case 'highlighter':
          excalidrawApi.setActiveTool({ type: 'freedraw' });
          excalidrawApi.updateScene({
            appState: {
              currentItemStrokeColor: strokeColor,
              currentItemStrokeWidth: Math.max(strokeWidth * 3, 6),
              currentItemOpacity: 35
            }
          });
          break;
        case 'line':
          excalidrawApi.setActiveTool({ type: 'line' });
          excalidrawApi.updateScene({
            appState: {
              currentItemStrokeColor: strokeColor,
              currentItemStrokeWidth: strokeWidth,
              currentItemStrokeStyle: strokeStyle,
              currentItemOpacity: opacity
            }
          });
          break;
        case 'arrow':
          excalidrawApi.setActiveTool({ type: 'arrow' });
          excalidrawApi.updateScene({
            appState: {
              currentItemStrokeColor: strokeColor,
              currentItemStrokeWidth: strokeWidth,
              currentItemStrokeStyle: strokeStyle,
              currentItemOpacity: opacity
            }
          });
          break;
        case 'rectangle':
          setSelectedShape('rectangle');
          excalidrawApi.setActiveTool({ type: 'rectangle' });
          excalidrawApi.updateScene({
            appState: {
              currentItemStrokeColor: strokeColor,
              currentItemBackgroundColor: fillColor,
              currentItemFillStyle: fillStyle,
              currentItemStrokeWidth: strokeWidth,
              currentItemStrokeStyle: strokeStyle,
              currentItemRoughness: sloppiness,
              currentItemRoundness: roundness === 'round' ? 'round' : 'sharp',
              currentItemOpacity: opacity
            }
          });
          break;
        case 'diamond':
          setSelectedShape('diamond');
          excalidrawApi.setActiveTool({ type: 'diamond' });
          excalidrawApi.updateScene({
            appState: {
              currentItemStrokeColor: strokeColor,
              currentItemBackgroundColor: fillColor,
              currentItemFillStyle: fillStyle,
              currentItemStrokeWidth: strokeWidth,
              currentItemStrokeStyle: strokeStyle,
              currentItemRoughness: sloppiness,
              currentItemRoundness: roundness === 'round' ? 'round' : 'sharp',
              currentItemOpacity: opacity
            }
          });
          break;
        case 'ellipse':
          setSelectedShape('circle');
          excalidrawApi.setActiveTool({ type: 'ellipse' });
          excalidrawApi.updateScene({
            appState: {
              currentItemStrokeColor: strokeColor,
              currentItemBackgroundColor: fillColor,
              currentItemFillStyle: fillStyle,
              currentItemStrokeWidth: strokeWidth,
              currentItemStrokeStyle: strokeStyle,
              currentItemRoughness: sloppiness,
              currentItemRoundness: roundness === 'round' ? 'round' : 'sharp',
              currentItemOpacity: opacity
            }
          });
          break;
        case 'shape': {
          const type =
            selectedShape === 'rectangle'
              ? 'rectangle'
              : selectedShape === 'circle'
              ? 'ellipse'
              : 'diamond';
          excalidrawApi.setActiveTool({ type });
          excalidrawApi.updateScene({
            appState: {
              currentItemStrokeColor: strokeColor,
              currentItemBackgroundColor: fillColor,
              currentItemFillStyle: fillColor === 'transparent' ? 'hachure' : 'solid',
              currentItemStrokeWidth: strokeWidth,
              currentItemStrokeStyle: strokeStyle,
              currentItemOpacity: opacity
            }
          });
          break;
        }
        case 'text':
          excalidrawApi.setActiveTool({ type: 'text' });
          excalidrawApi.updateScene({
            appState: {
              currentItemStrokeColor: strokeColor,
              currentItemFontSize: fontSize,
              currentItemFontFamily: 1,
              currentItemTextAlign: textAlign
            }
          });
          break;
        case 'drawToShape':
          excalidrawApi.setActiveTool({ type: 'freedraw' });
          excalidrawApi.updateScene({
            appState: {
              currentItemStrokeColor: strokeColor,
              currentItemStrokeWidth: strokeWidth,
              currentItemOpacity: opacity
            }
          });
          break;
        case 'bucketFill':
          excalidrawApi.setActiveTool({ type: 'selection' });
          break;
        case 'sticky': {
          if (excalidrawApi) {
            const scrollY = excalidrawApi.getAppState()?.scrollY || 0;
            const scrollX = excalidrawApi.getAppState()?.scrollX || 0;
            const zoom = excalidrawApi.getAppState()?.zoom?.value || 1;
            const centerX = -scrollX + (window.innerWidth / 2 - 100) / zoom;
            const centerY = -scrollY + (window.innerHeight / 2 - 100) / zoom;

            const cardId = 'sticky-bg-' + Date.now();
            const textId = 'sticky-text-' + Date.now();

            const cardEl = {
              id: cardId,
              type: 'rectangle',
              x: centerX,
              y: centerY,
              width: 200,
              height: 180,
              angle: 0,
              strokeColor: '#000000',
              backgroundColor: fillColor === 'transparent' ? '#FEF08A' : fillColor,
              fillStyle: 'solid',
              strokeWidth: 1,
              strokeStyle: 'solid',
              roughness: 0,
              opacity: 100,
              groupIds: ['sticky-group-' + Date.now()],
              frameId: null,
              roundness: { type: 3 },
              seed: Math.floor(Math.random() * 100000),
              version: 1,
              versionNonce: Math.floor(Math.random() * 100000),
              isDeleted: false,
              boundElements: [{ type: 'text', id: textId }],
              updated: Date.now(),
              link: null,
              locked: false,
              customData: { isStickyNote: true }
            };

            const textEl = {
              id: textId,
              type: 'text',
              x: centerX + 16,
              y: centerY + 16,
              width: 168,
              height: 148,
              angle: 0,
              strokeColor: '#18181B',
              backgroundColor: 'transparent',
              fillStyle: 'solid',
              strokeWidth: 1,
              strokeStyle: 'solid',
              roughness: 0,
              opacity: 100,
              groupIds: cardEl.groupIds,
              frameId: null,
              roundness: null,
              seed: Math.floor(Math.random() * 100000),
              version: 1,
              versionNonce: Math.floor(Math.random() * 100000),
              isDeleted: false,
              boundElements: null,
              updated: Date.now(),
              link: null,
              locked: false,
              text: 'Note:\n• Add key insights here...',
              fontSize: 16,
              fontFamily: 1,
              textAlign: 'left',
              verticalAlign: 'top',
              containerId: cardId,
              originalText: 'Note:\n• Add key insights here...',
              lineHeight: 1.25,
              autoResize: false,
              customData: { isStickyNote: true }
            };

            const elements = excalidrawApi.getSceneElements();
            const updated = [...elements, cardEl, textEl];
            excalidrawApi.updateScene({
              elements: updated,
              appState: {
                selectedElementIds: { [cardId]: true, [textId]: true }
              }
            });
            onUpdateCanvasScene?.(updated, excalidrawApi.getAppState());
            setActiveTool('select');
          }
          break;
        }
        case 'eraser':
          excalidrawApi.setActiveTool({ type: 'eraser' });
          break;
        case 'laser':
          excalidrawApi.setActiveTool({ type: 'laser' });
          break;
      }
    },
    [excalidrawApi, strokeColor, strokeWidth, selectedShape, fillColor, strokeStyle, opacity, fontSize, textAlign]
  );

  const handleChangeStrokeWidth = useCallback(
    (width: number) => {
      setStrokeWidth(width);
      if (excalidrawApi) {
        excalidrawApi.updateScene({
          appState: { currentItemStrokeWidth: width }
        });
      }
    },
    [excalidrawApi]
  );

  const handleChangeStrokeColor = useCallback(
    (color: string) => {
      setStrokeColor(color);
      if (excalidrawApi) {
        excalidrawApi.updateScene({
          appState: { currentItemStrokeColor: color }
        });
      }
    },
    [excalidrawApi]
  );

  const handleChangeFillColor = useCallback(
    (color: string) => {
      setFillColor(color);
      if (excalidrawApi) {
        excalidrawApi.updateScene({
          appState: {
            currentItemBackgroundColor: color,
            currentItemFillStyle: color === 'transparent' ? 'hachure' : 'solid'
          }
        });
      }
    },
    [excalidrawApi]
  );

  const handleChangeStrokeStyle = useCallback(
    (style: StrokeStyle) => {
      setStrokeStyle(style);
      if (excalidrawApi) {
        excalidrawApi.updateScene({
          appState: { currentItemStrokeStyle: style }
        });
      }
    },
    [excalidrawApi]
  );

  const handleChangeOpacity = useCallback(
    (op: number) => {
      setOpacity(op);
      if (excalidrawApi) {
        excalidrawApi.updateScene({
          appState: { currentItemOpacity: op }
        });
      }
    },
    [excalidrawApi]
  );

  const handleChangeFontSize = useCallback(
    (size: number) => {
      setFontSize(size);
      if (excalidrawApi) {
        excalidrawApi.updateScene({
          appState: { currentItemFontSize: size }
        });
      }
    },
    [excalidrawApi]
  );

  const handleChangeTextAlign = useCallback(
    (align: 'left' | 'center' | 'right') => {
      setTextAlign(align);
      if (excalidrawApi) {
        excalidrawApi.updateScene({
          appState: { currentItemTextAlign: align }
        });
      }
    },
    [excalidrawApi]
  );


  const handleChangeFillStyle = useCallback(
    (style: FillStyle) => {
      setFillStyle(style);
      if (excalidrawApi) {
        excalidrawApi.updateScene({
          appState: { currentItemFillStyle: style }
        });
        const selected = excalidrawApi.getAppState()?.selectedElementIds || {};
        if (Object.keys(selected).length > 0) {
          const elements = excalidrawApi.getSceneElements().map((el: any) => {
            if (selected[el.id]) {
              return { ...el, fillStyle: style, version: el.version + 1 };
            }
            return el;
          });
          excalidrawApi.updateScene({ elements });
        }
      }
    },
    [excalidrawApi]
  );

  const handleChangeSloppiness = useCallback(
    (roughness: Sloppiness) => {
      setSloppiness(roughness);
      if (excalidrawApi) {
        excalidrawApi.updateScene({
          appState: { currentItemRoughness: roughness }
        });
        const selected = excalidrawApi.getAppState()?.selectedElementIds || {};
        if (Object.keys(selected).length > 0) {
          const elements = excalidrawApi.getSceneElements().map((el: any) => {
            if (selected[el.id]) {
              return { ...el, roughness, version: el.version + 1 };
            }
            return el;
          });
          excalidrawApi.updateScene({ elements });
        }
      }
    },
    [excalidrawApi]
  );

  const handleChangeRoundness = useCallback(
    (rnd: Roundness) => {
      setRoundness(rnd);
      if (excalidrawApi) {
        const roundnessVal = rnd === 'round' ? { type: 3 } : null;
        excalidrawApi.updateScene({
          appState: { currentItemRoundness: rnd }
        });
        const selected = excalidrawApi.getAppState()?.selectedElementIds || {};
        if (Object.keys(selected).length > 0) {
          const elements = excalidrawApi.getSceneElements().map((el: any) => {
            if (selected[el.id]) {
              return { ...el, roundness: roundnessVal, version: el.version + 1 };
            }
            return el;
          });
          excalidrawApi.updateScene({ elements });
        }
      }
    },
    [excalidrawApi]
  );

  const handleChangeFontFamily = useCallback(
    (font: FontFamily) => {
      setFontFamily(font);
      if (excalidrawApi) {
        excalidrawApi.updateScene({
          appState: { currentItemFontFamily: font }
        });
        const selected = excalidrawApi.getAppState()?.selectedElementIds || {};
        if (Object.keys(selected).length > 0) {
          const elements = excalidrawApi.getSceneElements().map((el: any) => {
            if (selected[el.id] && el.type === 'text') {
              return { ...el, fontFamily: font, version: el.version + 1 };
            }
            return el;
          });
          excalidrawApi.updateScene({ elements });
        }
      }
    },
    [excalidrawApi]
  );

  // Layering helpers
  const handleBringToFront = useCallback(() => {
    if (!excalidrawApi) return;
    const selected = excalidrawApi.getAppState()?.selectedElementIds || {};
    if (!Object.keys(selected).length) return;
    const elements = excalidrawApi.getSceneElements();
    const unselected = elements.filter((el: any) => !selected[el.id]);
    const selElements = elements.filter((el: any) => selected[el.id]);
    excalidrawApi.updateScene({ elements: [...unselected, ...selElements] });
  }, [excalidrawApi]);

  const handleSendToBack = useCallback(() => {
    if (!excalidrawApi) return;
    const selected = excalidrawApi.getAppState()?.selectedElementIds || {};
    if (!Object.keys(selected).length) return;
    const elements = excalidrawApi.getSceneElements();
    const unselected = elements.filter((el: any) => !selected[el.id]);
    const selElements = elements.filter((el: any) => selected[el.id]);
    excalidrawApi.updateScene({ elements: [...selElements, ...unselected] });
  }, [excalidrawApi]);

  const handleSelectShape = useCallback(
    (shape: ShapeType) => {
      setSelectedShape(shape);
      const tool: CanvasTool = shape === 'rectangle' ? 'rectangle' : shape === 'circle' ? 'ellipse' : 'diamond';
      handleSelectTool(tool);
    },
    [handleSelectTool]
  );


  // Global Workspace & Canvas Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('.excalidraw__wysiwyg'))
      ) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // 1. Tool selection shortcuts (no modifiers)
      if (!isMod && !e.altKey && !e.shiftKey) {
        const key = e.key.toLowerCase();
        if (key === 'v' || key === '1') {
          e.preventDefault();
          handleSelectTool('select');
        } else if (key === 'r' || key === '2') {
          e.preventDefault();
          handleSelectTool('rectangle');
        } else if (key === 'd' || key === '3') {
          e.preventDefault();
          handleSelectTool('diamond');
        } else if (key === 'o' || key === '4') {
          e.preventDefault();
          handleSelectTool('ellipse');
        } else if (key === 'a' || key === '5') {
          e.preventDefault();
          handleSelectTool('arrow');
        } else if (key === 'l' || key === '6') {
          e.preventDefault();
          handleSelectTool('line');
        } else if (key === 'p' || key === '7') {
          e.preventDefault();
          handleSelectTool('pen');
        } else if (key === 't' || key === '8') {
          e.preventDefault();
          handleSelectTool('text');
        } else if (key === 's' || key === '9') {
          e.preventDefault();
          handleSelectTool('sticky');
        } else if (key === 'e' || key === '0') {
          e.preventDefault();
          handleSelectTool('eraser');
        } else if (key === 'h') {
          e.preventDefault();
          handleSelectTool('pan');
        } else if (key === 'k') {
          e.preventDefault();
          handleSelectTool('laser');
        } else if (key === 'i') {
          e.preventDefault();
          handleSelectTool('image');
          const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
          fileInput?.click();
        } else if (key === 'q') {
          e.preventDefault();
          handleToggleToolLock();
        } else if (key === '?') {
          e.preventDefault();
          setIsGuideOpen(true);
        } else if (key === 'escape') {
          e.preventDefault();
          handleSelectTool('select');
          if (excalidrawApi) {
            excalidrawApi.updateScene({ appState: { selectedElementIds: {} } });
          }
        }
      }

      // Page Navigation with ArrowLeft / ArrowRight when no canvas element is selected
      if (!isMod && !e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const hasActiveSelection = Boolean(
          excalidrawApi && Object.keys(excalidrawApi.getAppState()?.selectedElementIds || {}).length > 0
        );
        if (!hasActiveSelection && pageNav) {
          if (e.key === 'ArrowLeft' && pageNav.currentPage > 1) {
            e.preventDefault();
            pageNav.onPrevPage();
          } else if (e.key === 'ArrowRight' && pageNav.currentPage < pageNav.totalPages) {
            e.preventDefault();
            pageNav.onNextPage();
          }
        }
      }

      // 2. Zoom, History & Layering shortcuts with Mod
      if (isMod) {
        if (e.shiftKey) {
          if (e.key === ']' || e.key === '}') {
            e.preventDefault();
            handleBringToFront();
          } else if (e.key === '[' || e.key === '{') {
            e.preventDefault();
            handleSendToBack();
          } else if (e.key === 'z' || e.key === 'Z') {
            e.preventDefault();
            handleRedo();
          }
        } else if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 'd') {
          e.preventDefault();
          // Duplicate element
          if (excalidrawApi) {
            const selected = excalidrawApi.getAppState()?.selectedElementIds || {};
            const elements = excalidrawApi.getSceneElements();
            const duplicated: any[] = [];
            const newSelected: Record<string, boolean> = {};
            elements.forEach((el: any) => {
              if (selected[el.id]) {
                const newId = 'dup-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
                duplicated.push({
                  ...el,
                  id: newId,
                  x: el.x + 20,
                  y: el.y + 20,
                  version: el.version + 1,
                  seed: Math.floor(Math.random() * 100000)
                });
                newSelected[newId] = true;
              }
            });
            if (duplicated.length > 0) {
              excalidrawApi.updateScene({
                elements: [...elements, ...duplicated],
                appState: { selectedElementIds: newSelected }
              });
            }
          }
        } else if (e.key === 'a') {
          // Select All handled natively or triggered
          if (excalidrawApi) {
            const elements = excalidrawApi.getSceneElements().filter((el: any) => !el.isDeleted);
            const allSelected: Record<string, boolean> = {};
            elements.forEach((el: any) => { allSelected[el.id] = true; });
            excalidrawApi.updateScene({ appState: { selectedElementIds: allSelected } });
          }
        } else if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          if (excalidrawApi) {
            const currentZoom = excalidrawApi.getAppState()?.zoom?.value || 1;
            excalidrawApi.updateScene({
              appState: { zoom: { value: Math.min(3, currentZoom + 0.15) } }
            });
          }
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          if (excalidrawApi) {
            const currentZoom = excalidrawApi.getAppState()?.zoom?.value || 1;
            excalidrawApi.updateScene({
              appState: { zoom: { value: Math.max(0.3, currentZoom - 0.15) } }
            });
          }
        } else if (e.key === '0') {
          e.preventDefault();
          if (excalidrawApi) {
            excalidrawApi.updateScene({
              appState: { zoom: { value: 1 } }
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [excalidrawApi, handleSelectTool, handleSelectShape, handleToggleToolLock]);

  // Deterministic Undo / Redo handlers backed by undoStackRef and redoStackRef
  const handleUndo = useCallback(() => {
    console.log('[handleUndo called]', { stackLen: undoStackRef.current.length, redoLen: redoStackRef.current.length });
    if (!excalidrawApi) return;
    if (undoStackRef.current.length <= 1) return;

    // Pop the current state from undo stack and push to redo stack
    const currentSnapshot = undoStackRef.current.pop()!;
    redoStackRef.current.push(currentSnapshot);

    // The previous state is now at the top of the undo stack
    const prevSnapshot = undoStackRef.current[undoStackRef.current.length - 1] || [];
    const prevIds = new Set(prevSnapshot.map((el: any) => el.id));
    const currentElements = excalidrawApi.getSceneElements();

    // In Excalidraw, omitted elements must be explicitly tombstoned with isDeleted: true
    const updatedSceneElements = [
      ...prevSnapshot.map((el: any) => ({ ...el, isDeleted: false })),
      ...currentElements
        .filter((el: any) => !prevIds.has(el.id))
        .map((el: any) => ({ ...el, isDeleted: true }))
    ];

    isPerformingUndoRedoRef.current = true;
    excalidrawApi.updateScene({ elements: updatedSceneElements });
    setCanUndo(undoStackRef.current.length > 1);
    setCanRedo(true);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onUpdateCanvasScene?.(spatialItems, {
        ...excalidrawApi.getAppState(),
        excalidrawElements: prevSnapshot
      });
    }, 500);
  }, [excalidrawApi, onUpdateCanvasScene, spatialItems]);

  const handleRedo = useCallback(() => {
    if (!excalidrawApi) return;
    if (redoStackRef.current.length === 0) return;

    const nextSnapshot = redoStackRef.current.pop()!;
    undoStackRef.current.push(nextSnapshot);

    const nextIds = new Set(nextSnapshot.map((el: any) => el.id));
    const currentElements = excalidrawApi.getSceneElements();

    const updatedSceneElements = [
      ...nextSnapshot.map((el: any) => ({ ...el, isDeleted: false })),
      ...currentElements
        .filter((el: any) => !nextIds.has(el.id))
        .map((el: any) => ({ ...el, isDeleted: true }))
    ];

    isPerformingUndoRedoRef.current = true;
    excalidrawApi.updateScene({ elements: updatedSceneElements });
    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onUpdateCanvasScene?.(spatialItems, {
        ...excalidrawApi.getAppState(),
        excalidrawElements: nextSnapshot
      });
    }, 500);
  }, [excalidrawApi, onUpdateCanvasScene, spatialItems]);

  const handleClearCanvas = useCallback(() => {
    if (excalidrawApi) {
      excalidrawApi.resetScene();
      undoStackRef.current = [[]];
      redoStackRef.current = [];
      setCanUndo(false);
      setCanRedo(false);
      if (onUpdateCanvasScene) {
        onUpdateCanvasScene(spatialItems, {
          excalidrawElements: []
        });
      }
    }
  }, [excalidrawApi, onUpdateCanvasScene, spatialItems]);

  const handleInsertImage = useCallback(
    (file: File) => {
      if (!excalidrawApi) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const fileId = `file-${Date.now()}`;
        excalidrawApi.addFiles([
          {
            id: fileId,
            dataURL: dataUrl,
            mimeType: file.type as any,
            created: Date.now()
          }
        ]);
      };
      reader.readAsDataURL(file);
    },
    [excalidrawApi]
  );

  // Handle scene change from Excalidraw with zero lag during active drawing/dragging
  const handleExcalidrawChange = useCallback((elements: readonly any[], appState: any, files?: any) => {
    latestElementsRef.current = elements;
    latestAppStateRef.current = appState;
    if (files) latestFilesRef.current = files;

    // 0. If this change was triggered by our own handleUndo or handleRedo, ignore it to prevent wiping redoStack
    if (isPerformingUndoRedoRef.current) {
      isPerformingUndoRedoRef.current = false;
      return;
    }

    const isActivelyDrawingOrDragging = Boolean(
      appState?.cursorButton === 'down' ||
      appState?.editingElement ||
      appState?.draggingElement ||
      appState?.resizingElement ||
      appState?.editingLinearElement
    );

    // 1. PERFORMANCE: If currently dragging or drawing, RETURN IMMEDIATELY.
    // Zero React setState, zero filtering, zero serialization on 60-120Hz pointermove!
    if (isActivelyDrawingOrDragging) {
      isInteractingRef.current = true;
      return;
    }

    // 2. Interaction ended or idle change
    const nonDeleted = elements.filter((el) => !el.isDeleted);

    // Track undo/redo snapshot deterministically by element identity & geometry
    const currentTop = undoStackRef.current[undoStackRef.current.length - 1];
    const hasChangedFromTop = !currentTop ||
      currentTop.length !== nonDeleted.length ||
      currentTop.some((el, i) => {
        const other = nonDeleted[i];
        return !other ||
          other.id !== el.id ||
          other.x !== el.x ||
          other.y !== el.y ||
          other.width !== el.width ||
          other.height !== el.height ||
          other.backgroundColor !== el.backgroundColor ||
          other.strokeColor !== el.strokeColor ||
          other.text !== el.text ||
          (other.points?.length || 0) !== (el.points?.length || 0);
      });

    console.log('[handleExcalidrawChange]', { nonDeleted: nonDeleted.length, topLen: currentTop?.length, hasChanged: hasChangedFromTop });

    if (hasChangedFromTop) {
      undoStackRef.current.push(JSON.parse(JSON.stringify(nonDeleted)));
      if (undoStackRef.current.length > 50) {
        undoStackRef.current.shift();
      }
      redoStackRef.current = [];
      setCanUndo(undoStackRef.current.length > 1);
      setCanRedo(false);
    }

    // 3. Selection change detection with shallow key comparison
    const selectedIds = appState?.selectedElementIds || {};
    const selectedKeys = Object.keys(selectedIds).filter((k) => selectedIds[k]).sort();
    const serializedSelection = selectedKeys.join(',');

    if (serializedSelection !== lastSelectedKeysRef.current) {
      lastSelectedKeysRef.current = serializedSelection;
      const isSelected = selectedKeys.length > 0;
      setHasSelection(isSelected);

      if (isSelected) {
        const selectedTypes = nonDeleted
          .filter((el) => selectedIds[el.id])
          .map((el) => el.type);
        setSelectedElementTypes(selectedTypes);

        // If bucket fill is active and an element is clicked/selected, flood fill it once
        if (activeTool === 'bucketFill') {
          setTimeout(() => {
            const currentElements = excalidrawApi?.getSceneElements?.() || [];
            const updated = currentElements.map((el: any) => {
              if (selectedIds[el.id]) {
                return {
                  ...el,
                  backgroundColor: fillColor,
                  fillStyle: fillStyle,
                  opacity: opacity,
                  version: el.version + 1
                };
              }
              return el;
            });
            excalidrawApi?.updateScene?.({ elements: updated });
          }, 0);
        }
      } else {
        setSelectedElementTypes([]);
      }
    }

    // 4. Debounced persistence (1000ms after pointerup completes)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (onUpdateCanvasScene) {
          await onUpdateCanvasScene(spatialItems, {
            ...appState,
            excalidrawElements: nonDeleted
          });
        }
      } catch (err) {
        console.error('Failed to auto-save excalidraw canvas:', err);
      }
    }, 1000);
  }, [activeTool, excalidrawApi, fillColor, fillStyle, onUpdateCanvasScene, opacity, spatialItems]);


  // Smart Draw-to-Shape Recognition on Pointer Up
  useEffect(() => {
    if (activeTool !== 'drawToShape' || !excalidrawApi) return;

    const handlePointerUp = () => {
      setTimeout(() => {
        const elements = excalidrawApi.getSceneElements();
        if (!elements.length) return;
        const lastEl = elements[elements.length - 1];

        // Only convert recently created freedraw strokes
        if (lastEl && lastEl.type === 'freedraw' && !lastEl.isDeleted) {
          const pts = lastEl.points || [];
          if (pts.length < 5) return;

          const w = lastEl.width;
          const h = lastEl.height;
          const x = lastEl.x;
          const y = lastEl.y;

          const startPt = pts[0];
          const endPt = pts[pts.length - 1];
          const distStartEnd = Math.hypot(endPt[0] - startPt[0], endPt[1] - startPt[1]);
          const perimeter = w * 2 + h * 2;
          const isClosed = distStartEnd < Math.max(30, perimeter * 0.15);

          let replacementType: 'rectangle' | 'ellipse' | 'line' | 'arrow' = 'rectangle';
          const aspectRatio = Math.max(w, h) / Math.min(Math.max(w, h, 1), Math.max(w, 1));

          if (isClosed) {
            // Check if aspect ratio is close to square -> circle/ellipse vs rectangle
            if (aspectRatio < 1.4) {
              replacementType = 'ellipse';
            } else {
              replacementType = 'rectangle';
            }
          } else {
            // Open stroke: if long and straight -> arrow or line
            replacementType = 'arrow';
          }

          const newId = 'shape-converted-' + Date.now();
          const cleanShape = {
            id: newId,
            type: replacementType,
            x,
            y,
            width: Math.max(w, 20),
            height: Math.max(h, 20),
            angle: 0,
            strokeColor: lastEl.strokeColor || strokeColor,
            backgroundColor: fillColor,
            fillStyle: fillStyle,
            strokeWidth: lastEl.strokeWidth || strokeWidth,
            strokeStyle: 'solid',
            roughness: 0,
            opacity: lastEl.opacity || opacity,
            groupIds: [],
            frameId: null,
            roundness: { type: 3 },
            seed: Math.floor(Math.random() * 100000),
            version: 1,
            versionNonce: Math.floor(Math.random() * 100000),
            isDeleted: false,
            boundElements: null,
            updated: Date.now(),
            link: null,
            locked: false,
            ...(replacementType === 'arrow'
              ? {
                  points: [
                    [0, 0],
                    [w, h]
                  ],
                  endArrowhead: 'arrow'
                }
              : {})
          };

          const filtered = elements.slice(0, -1);
          excalidrawApi.updateScene({
            elements: [...filtered, cleanShape],
            appState: {
              selectedElementIds: { [newId]: true }
            }
          });
        }
      }, 80);
    };

    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [activeTool, excalidrawApi, strokeColor, fillColor, fillStyle, strokeWidth, opacity]);

  // Card Dragging with Magnetic Snap (Relative to Document Coordinates)
  const handleCardPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    elem: SpatialElement
  ) => {
    if (activeTool !== 'select' && activeTool !== 'pan') return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    const stageInner = docStageInnerRef.current;
    if (!stageInner) return;

    const currentLeft =
      elem.left ??
      (elem.right !== undefined ? stageInner.clientWidth - elem.right - (elem.width || 208) : 20);
    const currentTop = elem.top ?? 180;

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startLeft: currentLeft,
      startTop: currentTop
    };
    setDraggingId(elem.id);
  };

  const handleCardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingId || !dragStartRef.current || !docStageInnerRef.current) return;
    const stageWidth = docStageInnerRef.current.clientWidth;
    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    const newLeft = dragStartRef.current.startLeft + deltaX;
    const newTop = Math.max(20, dragStartRef.current.startTop + deltaY);

    // Magnetic snap calculation
    let snap: 'left-margin' | 'right-margin' | 'in-bounds' = 'in-bounds';
    if (newLeft < 190) {
      snap = 'left-margin';
    } else if (newLeft > stageWidth - 280) {
      snap = 'right-margin';
    }

    setActiveSnapZone(snap);

    setSpatialItems((prev) =>
      prev.map((item) => {
        if (item.id === draggingId) {
          return {
            ...item,
            left: newLeft,
            top: newTop,
            right: undefined,
            bottom: undefined,
            snapZone: snap
          };
        }
        return item;
      })
    );
  };

  const handleCardPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingId || !docStageInnerRef.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);

    const stageWidth = docStageInnerRef.current.clientWidth;
    const activeItem = spatialItems.find((i) => i.id === draggingId);

    if (activeItem) {
      let finalLeft = activeItem.left ?? 20;
      let finalRight: number | undefined = undefined;
      const width = activeItem.width || 208;

      // Magnetic snap lock to margin
      if (activeItem.snapZone === 'left-margin') {
        finalLeft = 16;
      } else if (activeItem.snapZone === 'right-margin') {
        finalRight = 20;
        finalLeft = stageWidth - finalRight - width;
      }

      const updated = spatialItems.map((item) => {
        if (item.id === draggingId) {
          return {
            ...item,
            left: finalRight !== undefined ? undefined : finalLeft,
            right: finalRight,
            top: activeItem.top
          };
        }
        return item;
      });

      setSpatialItems(updated);
      onUpdateElements?.(updated);
      onUpdateCanvasScene?.(updated, {
        viewMode: activeViewMode,
        activeTool,
        strokeWidth,
        strokeColor
      });
    }

    setDraggingId(null);
    dragStartRef.current = null;
    setActiveSnapZone(null);
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'bucketFill' && excalidrawApi) {
      const container = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX - container.left;
      const clientY = e.clientY - container.top;
      const appState = excalidrawApi.getAppState() || {};
      const scrollX = appState.scrollX || 0;
      const scrollY = appState.scrollY || 0;
      const zoom = appState.zoom?.value || 1;
      const sceneX = (clientX - scrollX) / zoom;
      const sceneY = (clientY - scrollY) / zoom;

      const elements = excalidrawApi.getSceneElements() || [];
      let targetIndex = -1;
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.isDeleted) continue;
        if (
          sceneX >= el.x &&
          sceneX <= el.x + el.width &&
          sceneY >= el.y &&
          sceneY <= el.y + el.height
        ) {
          targetIndex = i;
          break;
        }
      }

      if (targetIndex !== -1) {
        const updated = elements.map((el: any, idx: number) => {
          if (idx === targetIndex) {
            return {
              ...el,
              backgroundColor: fillColor === 'transparent' ? '#18181B' : fillColor,
              fillStyle: fillStyle || 'solid',
              opacity: opacity ?? 100,
              version: (el.version || 0) + 1
            };
          }
          return el;
        });
        excalidrawApi.updateScene({ elements: updated });
        onUpdateCanvasScene?.(updated, appState);
      }
    }
  };

  const isDrawingActive =
    activeTool === 'pen' ||
    activeTool === 'highlighter' ||
    activeTool === 'drawToShape' ||
    activeTool === 'bucketFill' ||
    activeTool === 'rectangle' ||
    activeTool === 'diamond' ||
    activeTool === 'ellipse' ||
    activeTool === 'shape' ||
    activeTool === 'line' ||
    activeTool === 'arrow' ||
    activeTool === 'text' ||
    activeTool === 'sticky' ||
    activeTool === 'eraser' ||
    activeTool === 'laser' ||
    activeTool === 'pan';

  return (
    <div
      data-testid="universal-canvas-host"
      onContextMenuCapture={(e) => {
        e.preventDefault();
        onContextMenu?.(e);
      }}
      className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0A0A0A] relative select-none ${className}`}
    >
      <style>{`
        /* 1. HIDE 100% OF EXCALIDRAW NATIVE UI OVERLAYS (TOOLBARS, SIDEBAR BUTTONS, LIBRARY) */
        .sos-excalidraw-container .App-menu,
        .sos-excalidraw-container .App-toolbar,
        .sos-excalidraw-container .App-top-bar,
        .sos-excalidraw-container .App-bottom-bar,
        .sos-excalidraw-container .FixedSideContainer,
        .sos-excalidraw-container .FixedSideContainer_side_top,
        .sos-excalidraw-container .FixedSideContainer_side_bottom,
        .sos-excalidraw-container .mobile-misc-tools-container,
        .sos-excalidraw-container .sidebar-trigger,
        .sos-excalidraw-container .sidebar-trigger__label-element,
        .sos-excalidraw-container .default-sidebar-trigger,
        .sos-excalidraw-container .layer-ui__wrapper,
        .sos-excalidraw-container .layer-ui__wrapper .dropdown-menu,
        .sos-excalidraw-container .layer-ui__wrapper .footer-center,
        .sos-excalidraw-container .layer-ui__wrapper .zen-mode-transition,
        .sos-excalidraw-container .layer-ui__wrapper .mobile-misc-tools-container,
        .sos-excalidraw-container .layer-ui__wrapper .stack,
        .sos-excalidraw-container .Stack,
        .sos-excalidraw-container .Island,
        .sos-excalidraw-container .context-menu,
        .sos-excalidraw-container .excalidraw-context-menu,
        .excalidraw .context-menu,
        .excalidraw-context-menu {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
        }

        /* 2. DOCUMENT OVERLAY MODE (PDF, DOCS, SLIDES): STRICT 100% TRANSPARENCY */
        ${resourceType !== 'board' ? `
        .sos-excalidraw-container,
        .sos-excalidraw-container .excalidraw,
        .sos-excalidraw-container .excalidraw-container,
        .sos-excalidraw-container .excalidraw-wrapper,
        .sos-excalidraw-container .excalidraw canvas,
        .sos-excalidraw-container .excalidraw__canvas,
        .sos-excalidraw-container .excalidraw__canvas-wrapper,
        .sos-excalidraw-container .SVGLayer {
          background: transparent !important;
          background-color: transparent !important;
          --default-bg-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }
        ` : `
        /* 3. STANDALONE BOARD MODE: SOLID OBSIDIAN DARK SURFACE */
        .sos-excalidraw-container .excalidraw {
          --default-bg-color: ${boardTheme === 'light' ? '#FAFAFA' : '#0A0A0A'} !important;
          background-color: ${boardTheme === 'light' ? '#FAFAFA' : '#0A0A0A'} !important;
          --color-surface-low: ${boardTheme === 'light' ? '#F4F4F5' : '#0A0A0A'} !important;
          --color-surface-mid: ${boardTheme === 'light' ? '#E4E4E7' : '#121214'} !important;
          --color-surface-high: ${boardTheme === 'light' ? '#D4D4D8' : '#18181B'} !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .sos-excalidraw-container .excalidraw canvas {
          background-color: transparent !important;
        }
        `}

        #doc-scroll-viewport {
          scrollbar-width: none !important;
          scrollbar-color: transparent transparent !important;
        }
        #doc-scroll-viewport::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>

      {/* Background Dot Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 z-0"
        style={{
          backgroundImage: 'radial-gradient(#1A1A1E 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* WORKSPACE STAGE: PAGE-LOCKED (FOR PDF / SLIDES / DOCX) OR FULL-VIEWPORT (FOR BOARD / NOTES) */}
      {pageDimensions ? (
        <div
          id="notes-stage"
          data-testid="notes-stage"
          className="flex-1 relative overflow-hidden bg-[#080808] flex flex-col z-10"
        >
          {/* Scrollable document viewport */}
          <div
            id="doc-scroll-viewport"
            ref={docScrollRef}
            data-testid="doc-scroll-viewport"
            className="flex-1 overflow-auto custom-scrollbar flex flex-col items-center pt-6 px-4 pb-28 relative z-10 w-full h-full"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {/* Outer Layout Box (Sized to zoomed dimensions so scrollbars match zoomed page) */}
            <div
              className="relative shrink-0 flex items-center justify-center transition-all duration-150"
              style={{
                width: `${Math.round(pageDimensions.width * (zoomScale || 1.0))}px`,
                height: `${Math.round(pageDimensions.height * (zoomScale || 1.0))}px`
              }}
            >
              {/* Strict 1:1 Unified Page-Locked Stage (Unscaled base dimensions, scaled with CSS transform) */}
              <div
                ref={pageStageRef}
                id="unified-page-stage"
                data-testid="unified-page-stage"
                className={`relative shadow-2xl shrink-0 overflow-hidden ${
                  resourceType === 'slides'
                    ? 'aspect-video rounded-xl border border-[#1F1F23] bg-[#0A0A0C]'
                    : 'rounded-lg border border-[#1F1F23] bg-[#121214]'
                }`}
                style={{
                  width: `${pageDimensions.width}px`,
                  height: `${pageDimensions.height}px`,
                  transform: `scale(${zoomScale || 1.0})`,
                  transformOrigin: 'top left',
                  willChange: 'transform'
                }}
              >
                {/* LAYER 1: BASE DOCUMENT (CANVAS + TEXTLAYER) */}
                <div
                  id="layer-doc"
                  data-testid="layer-doc"
                  className={`absolute inset-0 w-full h-full z-10 transition-opacity duration-300 ${
                    activeViewMode === 'canvas' ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                  }`}
                >
                  {baseLayer}
                </div>

                {/* LAYER 2: OVERLAY CANVAS (1:1 EXCALIDRAW EXACTLY OVER PAGE) */}
                <div
                  id="layer-canvas"
                  data-testid="layer-canvas"
                  onWheel={handlePageCanvasWheel}
                  className={`absolute inset-0 w-full h-full z-20 transition-opacity duration-300 ${
                    activeViewMode === 'doc'
                      ? 'opacity-0 pointer-events-none'
                      : isDrawingActive || activeViewMode === 'canvas'
                      ? 'opacity-100 pointer-events-auto'
                      : 'opacity-100 pointer-events-none'
                  }`}
                >
                  <div
                    data-testid="drawing-canvas"
                    className={`w-full h-full sos-excalidraw-container ${
                      isDrawingActive || activeViewMode === 'canvas'
                        ? 'pointer-events-auto'
                        : 'pointer-events-none'
                    }`}
                  >
                    <Excalidraw
                      excalidrawAPI={(api) => {
                        setExcalidrawApi(api);
                        if (typeof window !== 'undefined') {
                          (window as any).__excalidrawApi = api;
                        }
                        if (onExcalidrawApiReady) {
                          onExcalidrawApiReady(api);
                        }
                        if (initialElements && initialElements.length > 0) {
                          api.updateScene({ elements: initialElements });
                        }
                        // Lock Excalidraw camera permanently to 1.0 in document overlay mode
                        api.updateScene({
                          appState: {
                            scrollX: 0,
                            scrollY: 0,
                            zoom: { value: 1.0 as any },
                            viewBackgroundColor: 'transparent',
                            theme: 'light'
                          }
                        });
                      }}
                      onChange={handleExcalidrawChange}
                      theme="light"
                      viewModeEnabled={false}
                      zenModeEnabled={true}
                      gridModeEnabled={false}
                      initialData={{
                        elements: initialElements,
                        appState: {
                          theme: 'light',
                          gridModeEnabled: false,
                          scrollX: 0,
                          scrollY: 0,
                          zoom: { value: 1.0 as any },
                          currentItemStrokeColor: strokeColor,
                          currentItemStrokeWidth: strokeWidth,
                          currentItemFontSize: fontSize,
                          currentItemFontFamily: 1,
                          zenModeEnabled: true,
                          ...(initialAppState || {}),
                          viewBackgroundColor: 'transparent'
                        }
                      }}
                      UIOptions={{
                        canvasActions: {
                          changeViewBackgroundColor: false,
                          clearCanvas: false,
                          export: false,
                          loadScene: false,
                          saveToActiveFile: false,
                          toggleTheme: false,
                          saveAsImage: false
                        },
                        tools: {
                          image: true
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          id="notes-stage"
          data-testid="notes-stage"
          className="flex-1 relative overflow-hidden bg-[#0A0A0A] flex flex-col z-10"
        >
          {/* LAYER 1: UNIFIED SCROLLABLE STAGE (DOCUMENT + SPATIAL MARGIN CARDS) */}
          <div
            id="layer-doc"
            ref={docScrollRef}
            data-testid="layer-doc"
            onScroll={handleDocScroll}
            className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col relative z-10 transition-opacity duration-300 ${
              activeViewMode === 'canvas'
                ? 'opacity-0 pointer-events-none'
                : 'opacity-100 pointer-events-auto'
            }`}
          >
            {/* Inner Relative Stage: Both the Document and Spatial Margin Cards Live Here in 1:1 Scroll Lockstep */}
            <div
              ref={docStageInnerRef}
              className="relative w-full min-h-full flex flex-col"
            >
              {/* Base Document Editorial Flow */}
              {baseLayer}

              {/* Spatial Margin Cards (Rendered INSIDE Document Flow so they naturally scroll in 1:1 lockstep) */}
              {spatialItems.map((item) => {
                const isHighlighted = highlightedElementId === item.id;
                const isCardDragging = draggingId === item.id;

                const style: React.CSSProperties = {
                  width: item.width || 208,
                  top: item.top !== undefined ? item.top : (item.bottom === undefined ? 180 : undefined),
                  left: item.left !== undefined ? item.left : undefined,
                  right: item.right !== undefined ? item.right : undefined,
                  bottom: item.top === undefined && item.bottom !== undefined ? item.bottom : undefined
                };

                if (item.type === 'calloutNode') {
                  return (
                    <div
                      key={item.id}
                      id={item.id}
                      data-testid={`spatial-card-${item.id}`}
                      style={style}
                      onPointerDown={(e) => handleCardPointerDown(e, item)}
                      onPointerMove={handleCardPointerMove}
                      onPointerUp={handleCardPointerUp}
                      className={`absolute p-3 rounded-2xl bg-[#141417]/95 backdrop-blur-md border border-[#27272A] shadow-xl pointer-events-auto cursor-move transition-transform duration-100 z-20 ${
                        isCardDragging ? 'scale-105 shadow-2xl z-35 ring-2 ring-[#60A5FA]' : ''
                      } ${isHighlighted ? 'ring-2 ring-[#34D399] animate-pulse' : ''}`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#FAFAFA] mb-1">
                        <span className="flex items-center gap-1.5">
                          <Move className="w-3 h-3 text-[#71717A] opacity-60" />
                          {item.title || 'Retrograde Loop'}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <p className="text-[11px] text-[#A1A1AA] leading-snug">{item.text}</p>
                    </div>
                  );
                }

                // Default Sticky Note / Sticky Card
                return (
                  <div
                    key={item.id}
                    id={item.id}
                    data-testid={`spatial-card-${item.id}`}
                    style={style}
                    onPointerDown={(e) => handleCardPointerDown(e, item)}
                    onPointerMove={handleCardPointerMove}
                    onPointerUp={handleCardPointerUp}
                    className={`absolute p-3.5 rounded-2xl bg-[#18181B]/95 backdrop-blur-md border border-[#27272A] text-[#FAFAFA] shadow-xl pointer-events-auto cursor-move transition-transform duration-100 z-20 ${
                      isCardDragging ? 'scale-105 shadow-2xl z-35 ring-2 ring-[#60A5FA]' : ''
                    } ${isHighlighted ? 'ring-2 ring-[#FBBF24] animate-pulse' : ''}`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      <span className="flex items-center gap-1">
                        {item.icon === 'tag' ? (
                          <Tag className="w-3 h-3 text-white" />
                        ) : (
                          <StickyNote className="w-3 h-3 text-amber-400" />
                        )}
                        {item.category || 'Note'}
                      </span>
                      <span className="text-[9px] text-[#71717A]">{item.subCategory}</span>
                    </div>
                    <div className="text-xs text-[#D4D4D8] leading-relaxed whitespace-pre-line">
                      {item.text}
                    </div>
                  </div>
                );
              })}

              {/* Magnetic Snap Visual Alignment Guides (Displayed during dragging) */}
              {activeSnapZone && (
                <div className="absolute inset-0 pointer-events-none z-30">
                  {activeSnapZone === 'left-margin' && (
                    <div className="absolute left-[180px] top-0 bottom-0 w-px border-l-2 border-dashed border-[#60A5FA]/70 flex items-center">
                      <span className="ml-2 px-2 py-0.5 rounded bg-[#1E293B] border border-[#60A5FA] text-[10px] font-mono text-[#93C5FD] shadow-md">
                        Magnetic Snap: Left Margin (16px)
                      </span>
                    </div>
                  )}
                  {activeSnapZone === 'right-margin' && (
                    <div className="absolute right-[250px] top-0 bottom-0 w-px border-r-2 border-dashed border-[#60A5FA]/70 flex items-center justify-end">
                      <span className="mr-2 px-2 py-0.5 rounded bg-[#1E293B] border border-[#60A5FA] text-[10px] font-mono text-[#93C5FD] shadow-md">
                        Magnetic Snap: Right Margin (20px)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LAYER 2: OVERLAY SPATIAL CANVAS (REAL EXCALIDRAW ENGINE WITH 1:1 SCROLL POSITIONING) */}
          <div
            id="layer-canvas"
            data-testid="layer-canvas"
            onPointerDown={handleCanvasPointerDown}
            onWheel={handleCanvasWheel}
            className={`absolute inset-0 z-20 transition-opacity duration-300 ${
              activeViewMode === 'doc'
                ? 'opacity-0 pointer-events-none'
                : activeViewMode === 'canvas'
                ? 'opacity-100 pointer-events-auto'
                : isDrawingActive
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-100 pointer-events-none'
            }`}
          >
            {/* Real Excalidraw Component */}
            <div
              data-testid="drawing-canvas"
              className={`sos-excalidraw-container ${
                isDrawingActive || activeViewMode === 'canvas'
                  ? 'pointer-events-auto'
                  : 'pointer-events-none'
              }`}
            >
              <Excalidraw
                excalidrawAPI={(api) => {
                  setExcalidrawApi(api);
                  if (typeof window !== 'undefined') {
                    (window as any).__excalidrawApi = api;
                  }
                  if (onExcalidrawApiReady) {
                    onExcalidrawApiReady(api);
                  }
                  if (initialElements && initialElements.length > 0) {
                    api.updateScene({ elements: initialElements });
                  }
                  const nonDeleted = (initialElements || []).filter((el: any) => !el?.isDeleted);
                  undoStackRef.current = [JSON.parse(JSON.stringify(nonDeleted))];
                  redoStackRef.current = [];
                  setCanUndo(false);
                  setCanRedo(false);
                  // Synchronize scroll position on API ready
                  if (docScrollRef.current && resourceType !== 'board') {
                    api.updateScene({
                      appState: {
                        scrollY: -docScrollRef.current.scrollTop,
                        scrollX: -docScrollRef.current.scrollLeft
                      }
                    });
                  }
                }}
                onChange={handleExcalidrawChange}
                theme="light"
                viewModeEnabled={false}
                zenModeEnabled={resourceType !== 'board'}
                gridModeEnabled={false}
                initialData={{
                  elements: initialElements,
                  appState: {
                    viewBackgroundColor: resourceType === 'board' ? (boardTheme === 'light' ? '#FAFAFA' : '#0A0A0A') : 'transparent',
                    theme: 'light',
                    gridModeEnabled: false,
                    currentItemStrokeColor: strokeColor,
                    currentItemStrokeWidth: strokeWidth,
                    currentItemFontSize: fontSize,
                    currentItemFontFamily: 1,
                    zenModeEnabled: resourceType !== 'board',
                    ...(initialAppState || {}),
                    ...(resourceType === 'board'
                      ? { viewBackgroundColor: boardTheme === 'light' ? '#FAFAFA' : '#0A0A0A', gridModeEnabled: false }
                      : {})
                  }
                }}
                UIOptions={{
                  canvasActions: {
                    changeViewBackgroundColor: false,
                    clearCanvas: false,
                    export: false,
                    loadScene: false,
                    saveToActiveFile: false,
                    toggleTheme: false,
                    saveAsImage: false
                  },
                  tools: {
                    image: true
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* FLOATING VIEWPORT-CENTERED ANNOTATION DOCK */}
      {!hideToolbar && (
        <>
          <DockedAnnotationToolbar
            activeTool={activeTool}
            onSelectTool={handleSelectTool}
            selectedShape={selectedShape}
            onSelectShape={handleSelectShape}
            selectedElementTypes={selectedElementTypes}
            hasSelection={hasSelection}
            strokeColor={strokeColor}
            onChangeStrokeColor={handleChangeStrokeColor}
            strokeWidth={strokeWidth}
            onChangeStrokeWidth={handleChangeStrokeWidth}
            strokeStyle={strokeStyle}
            onChangeStrokeStyle={handleChangeStrokeStyle}
            sloppiness={sloppiness}
            onChangeSloppiness={handleChangeSloppiness}
            roundness={roundness}
            onChangeRoundness={handleChangeRoundness}
            fillColor={fillColor}
            onChangeFillColor={handleChangeFillColor}
            fillStyle={fillStyle}
            onChangeFillStyle={handleChangeFillStyle}
            fontFamily={fontFamily}
            onChangeFontFamily={handleChangeFontFamily}
            fontSize={fontSize}
            onChangeFontSize={handleChangeFontSize}
            textAlign={textAlign}
            onChangeTextAlign={handleChangeTextAlign}
            opacity={opacity}
            onChangeOpacity={handleChangeOpacity}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClearCanvas={handleClearCanvas}
            onInsertImage={handleInsertImage}
            isToolLocked={isToolLocked}
            onToggleToolLock={handleToggleToolLock}
            isLibraryOpen={isLibraryOpen}
            onToggleLibrary={handleToggleLibrary}
            onInsertLibraryItem={handleInsertLibraryItem}
            pageNav={pageNav}
            isDockHidden={isDockHidden}
            onToggleHideDock={() => setIsDockHidden((prev) => !prev)}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
          <LearningWorkspaceGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
        </>
      )}
    </div>
  );
};
