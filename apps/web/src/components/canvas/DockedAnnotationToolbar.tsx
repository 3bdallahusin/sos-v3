import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointer,
  Hand,
  PenTool,
  Highlighter,
  Minus,
  ArrowUpRight,
  Square,
  Circle,
  Diamond,
  Type,
  StickyNote as StickyNoteIcon,
  PaintBucket,
  Wand2,
  ImagePlus,
  Eraser,
  Laser,
  Undo2,
  Redo2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  BookOpen,
  HelpCircle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  ArrowDown,
  ArrowUp,
  SunDim,
  Activity,
  Plus
} from 'lucide-react';

export type CanvasTool =
  | 'select'
  | 'pan'
  | 'pen'
  | 'highlighter'
  | 'drawToShape'
  | 'bucketFill'
  | 'rectangle'
  | 'diamond'
  | 'ellipse'
  | 'shape'
  | 'line'
  | 'arrow'
  | 'text'
  | 'sticky'
  | 'image'
  | 'eraser'
  | 'laser';

export type ShapeType = 'rectangle' | 'circle' | 'diamond';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type FillStyle = 'solid' | 'hachure' | 'cross-hatch';
export type Sloppiness = 0 | 1 | 2;
export type Roundness = 'sharp' | 'round';
export type FontFamily = 1 | 2 | 3 | 4;

export interface PageNavProps {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage?: (page: number) => void;
}

export interface DockedAnnotationToolbarProps {
  activeTool: CanvasTool;
  onSelectTool: (tool: CanvasTool) => void;
  selectedShape: ShapeType;
  onSelectShape: (shape: ShapeType) => void;
  selectedElementTypes?: string[];
  hasSelection?: boolean;
  strokeColor: string;
  onChangeStrokeColor: (color: string) => void;
  strokeWidth: number;
  onChangeStrokeWidth: (width: number) => void;
  strokeStyle: StrokeStyle;
  onChangeStrokeStyle: (style: StrokeStyle) => void;
  sloppiness: Sloppiness;
  onChangeSloppiness: (sloppiness: Sloppiness) => void;
  roundness: Roundness;
  onChangeRoundness: (roundness: Roundness) => void;
  fillColor: string;
  onChangeFillColor: (color: string) => void;
  fillStyle: FillStyle;
  onChangeFillStyle: (style: FillStyle) => void;
  fontFamily: FontFamily;
  onChangeFontFamily: (font: FontFamily) => void;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  textAlign: 'left' | 'center' | 'right';
  onChangeTextAlign: (align: 'left' | 'center' | 'right') => void;
  opacity: number;
  onChangeOpacity: (opacity: number) => void;
  onBringToFront?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onSendToBack?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onClearCanvas?: () => void;
  onSelectAll?: () => void;
  onPaste?: () => void;
  onInsertImage?: (file: File) => void;
  isToolLocked?: boolean;
  onToggleToolLock?: () => void;
  isLibraryOpen?: boolean;
  onToggleLibrary?: () => void;
  onInsertLibraryItem?: (itemType: string) => void;
  onOpenGuide?: () => void;
  pageNav?: PageNavProps;
  isDockHidden?: boolean;
  onToggleHideDock?: () => void;
}

export const STROKE_COLORS = [
  { name: 'White', value: '#F4F4F5' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Rose', value: '#EF4444' },
  { name: 'Sky', value: '#3B82F6' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Violet', value: '#A855F7' }
];

export const FILL_COLORS = [
  { name: 'Transparent', value: 'transparent' },
  { name: 'Slate Dark', value: '#18181B' },
  { name: 'Amber Soft', value: '#FEF08A' },
  { name: 'Rose Soft', value: '#FECDD3' },
  { name: 'Sky Soft', value: '#BAE6FD' },
  { name: 'Emerald Soft', value: '#A7F3D0' },
  { name: 'Violet Soft', value: '#DDD6FE' }
];

export const STICKY_COLORS = [
  { name: 'Warm Amber', value: '#FEF08A' },
  { name: 'Pastel Rose', value: '#FECDD3' },
  { name: 'Mint Emerald', value: '#A7F3D0' },
  { name: 'Sky Whisper', value: '#BAE6FD' },
  { name: 'Lilac Violet', value: '#DDD6FE' },
  { name: 'Obsidian Night', value: '#1E1E24' }
];

const DockedAnnotationToolbarComponent: React.FC<DockedAnnotationToolbarProps> = ({
  activeTool,
  onSelectTool,
  selectedShape,
  onSelectShape,
  selectedElementTypes = [],
  hasSelection = false,
  strokeColor,
  onChangeStrokeColor,
  strokeWidth,
  onChangeStrokeWidth,
  strokeStyle,
  onChangeStrokeStyle,
  sloppiness,
  onChangeSloppiness,
  roundness,
  onChangeRoundness,
  fillColor,
  onChangeFillColor,
  fillStyle,
  onChangeFillStyle,
  fontFamily,
  onChangeFontFamily,
  fontSize,
  onChangeFontSize,
  textAlign,
  onChangeTextAlign,
  opacity,
  onChangeOpacity,
  onBringToFront,
  onSendToBack,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onClearCanvas,
  onSelectAll,
  onInsertImage,
  isToolLocked = false,
  onToggleToolLock,
  isLibraryOpen = false,
  onToggleLibrary,
  onInsertLibraryItem,
  onOpenGuide,
  pageNav,
  isDockHidden = false,
  onToggleHideDock
}) => {
  const [isHoveringSensor, setIsHoveringSensor] = useState(false);
  const [customStrokeColor, setCustomStrokeColor] = useState(strokeColor);
  const [customFillColor, setCustomFillColor] = useState(fillColor);
  const [pageInputVal, setPageInputVal] = useState(pageNav?.currentPage?.toString() || '1');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pageNav?.currentPage) {
      setPageInputVal(pageNav.currentPage.toString());
    }
  }, [pageNav?.currentPage]);

  // Determine what kind of property controls to render in Row 2
  const primarySelectedType = selectedElementTypes[0] || '';
  const isShapeActive =
    activeTool === 'rectangle' ||
    activeTool === 'diamond' ||
    activeTool === 'ellipse' ||
    activeTool === 'shape' ||
    activeTool === 'line' ||
    activeTool === 'arrow' ||
    primarySelectedType === 'rectangle' ||
    primarySelectedType === 'diamond' ||
    primarySelectedType === 'ellipse' ||
    primarySelectedType === 'line' ||
    primarySelectedType === 'arrow';

  const isFreehandActive =
    activeTool === 'pen' ||
    activeTool === 'highlighter' ||
    activeTool === 'drawToShape' ||
    primarySelectedType === 'freedraw';

  const isTextOrStickyActive =
    activeTool === 'text' ||
    activeTool === 'sticky' ||
    primarySelectedType === 'text';

  const isBucketActive = activeTool === 'bucketFill';

  // If dock is hidden, render invisible bottom-edge hover sensor + reveal pill
  if (isDockHidden) {
    return (
      <div className="absolute bottom-0 left-0 w-full h-12 pointer-events-none z-40">
        {/* Invisible hover trigger strip at bottom edge with lower z-index */}
        <div
          className="absolute bottom-0 left-0 w-full h-8 pointer-events-auto z-10"
          onMouseEnter={() => setIsHoveringSensor(true)}
          data-testid="dock-hover-sensor"
        />
        {/* Reveal pill button with higher z-index (z-50) */}
        <button
          type="button"
          data-testid="btn-reveal-toolbar"
          onClick={onToggleHideDock}
          onMouseEnter={() => setIsHoveringSensor(true)}
          onMouseLeave={() => setIsHoveringSensor(false)}
          className={`absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141417]/95 border border-[#27272A] shadow-2xl backdrop-blur-md text-xs font-medium text-[#E4E4E7] hover:text-white hover:border-[#38BDF8]/60 transition-all cursor-pointer z-50 ${
            isHoveringSensor ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <ChevronUp className="w-3.5 h-3.5 text-[#8E8E93]" />
          <span>Show Toolbar</span>
        </button>
      </div>
    );
  }

  // Base icon button style: 32x32px, rounded-lg, tactile active scale, monochrome SOS theme
  const getToolBtnClass = (isActive: boolean) =>
    `w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-[0.97] ${
      isActive
        ? 'bg-[#222226] text-[#F4F4F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
        : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-[#18181B]'
    }`;

  return (
    <div
      data-testid="docked-excalidraw-toolbar"
      className="w-full shrink-0 border-t border-[#1F1F23] bg-[#0A0A0A]/95 backdrop-blur-xl z-30 select-none flex flex-col items-center justify-center text-xs text-[#D4D4D8] transition-all duration-150"
    >
      {/* Hidden file input for Insert Image (I) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onInsertImage) {
            onInsertImage(file);
          }
          e.target.value = '';
        }}
      />

      {/* ======================================================== */}
      {/* ROW 1: STRICTLY CENTERED DYNAMIC TOOL PROPERTIES BAR (TOP ROW) */}
      {/* ======================================================== */}
      <div
        data-testid="toolbar-properties-row"
        className="w-full min-h-[40px] flex items-center justify-center gap-3 px-4 py-1.5 bg-[#0D0D10] border-b border-[#18181B] overflow-x-auto custom-scrollbar"
      >
        {/* ============================================================ */}
        {/* CASE 1: SHAPES (RECTANGLE, DIAMOND, ELLIPSE, ARROW, LINE) */}
        {/* ============================================================ */}
        {isShapeActive && (
          <div className="flex items-center gap-3 shrink-0">
            {/* 3 Stroke Weight Dots: 1px, 2px, 4px in 24x24 hit targets */}
            <div className="flex items-center gap-0.5" data-testid="prop-width-group">
              {[
                { w: 1, sizeClass: 'w-1 h-1' },
                { w: 2, sizeClass: 'w-1.5 h-1.5' },
                { w: 4, sizeClass: 'w-2.5 h-2.5' }
              ].map(({ w, sizeClass }) => (
                <button
                  key={w}
                  type="button"
                  data-testid={`prop-width-${w}`}
                  onClick={() => onChangeStrokeWidth(w)}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer active:scale-[0.97] ${
                    strokeWidth === w
                      ? 'bg-[#222226] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-[#18181B]'
                  }`}
                  title={`Stroke Weight ${w}px`}
                >
                  <span className={`${sizeClass} rounded-full bg-current`} />
                </button>
              ))}
            </div>

            <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />

            {/* Stroke Color Swatches (Strictly 16x16 uniform circles with ring highlight) */}
            <div className="flex items-center gap-1.5">
              {STROKE_COLORS.map((c) => {
                const isSelected = strokeColor.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    data-testid={`prop-stroke-${c.name.toLowerCase()}`}
                    onClick={() => onChangeStrokeColor(c.value)}
                    className={`w-4 h-4 rounded-full shrink-0 transition-transform active:scale-[0.9] cursor-pointer ${
                      isSelected ? 'ring-[1.5px] ring-white ring-offset-2 ring-offset-[#0D0D10]' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={`Stroke: ${c.name}`}
                  />
                );
              })}
              {/* Custom Stroke Color Wheel Trigger */}
              <label
                className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center bg-[#1C1C21] border border-[#27272A] hover:border-[#52525B] cursor-pointer text-[#8E8E93] hover:text-white transition-all relative overflow-hidden"
                title="Custom Stroke Color"
              >
                <Plus className="w-2.5 h-2.5 pointer-events-none" />
                <input
                  type="color"
                  value={customStrokeColor}
                  onChange={(e) => {
                    setCustomStrokeColor(e.target.value);
                    onChangeStrokeColor(e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>

            <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />

            {/* Fill Color Swatches (Uniform 16x16 circles) */}
            <div className="flex items-center gap-1.5">
              {FILL_COLORS.map((c) => {
                const isSelected = fillColor.toLowerCase() === c.value.toLowerCase();
                const isTransparent = c.value === 'transparent';
                return (
                  <button
                    key={c.value}
                    type="button"
                    data-testid={`prop-fill-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => onChangeFillColor(c.value)}
                    className={`w-4 h-4 rounded-full shrink-0 transition-transform active:scale-[0.9] cursor-pointer relative overflow-hidden ${
                      isSelected ? 'ring-[1.5px] ring-white ring-offset-2 ring-offset-[#0D0D10]' : 'hover:scale-110'
                    } ${isTransparent ? 'border border-[#3F3F46] bg-[#141417]' : ''}`}
                    style={!isTransparent ? { backgroundColor: c.value } : undefined}
                    title={`Fill: ${c.name}`}
                  >
                    {isTransparent && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-[120%] h-[1px] bg-[#EF4444] rotate-45 transform origin-center" />
                      </span>
                    )}
                  </button>
                );
              })}
              {/* Custom Fill Color Wheel Trigger */}
              <label
                className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center bg-[#1C1C21] border border-[#27272A] hover:border-[#52525B] cursor-pointer text-[#8E8E93] hover:text-white transition-all relative overflow-hidden"
                title="Custom Fill Color"
              >
                <Plus className="w-2.5 h-2.5 pointer-events-none" />
                <input
                  type="color"
                  value={customFillColor}
                  onChange={(e) => {
                    setCustomFillColor(e.target.value);
                    onChangeFillColor(e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>

            <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />

            {/* Fill Pattern (Solid, Hachure, Cross-Hatch) */}
            <div className="flex items-center gap-0.5">
              {[
                { id: 'solid' as FillStyle, title: 'Solid Fill', icon: '■' },
                { id: 'hachure' as FillStyle, title: 'Hachure Fill', icon: '▨' },
                { id: 'cross-hatch' as FillStyle, title: 'Cross-Hatch Fill', icon: '▦' }
              ].map(({ id, title, icon }) => (
                <button
                  key={id}
                  type="button"
                  data-testid={`prop-pattern-${id}`}
                  onClick={() => onChangeFillStyle(id)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono transition-all cursor-pointer active:scale-[0.97] ${
                    fillStyle === id
                      ? 'bg-[#222226] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-[#18181B]'
                  }`}
                  title={title}
                >
                  {icon}
                </button>
              ))}
            </div>

            <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />

            {/* Stroke Style (Solid, Dashed, Dotted) */}
            <div className="flex items-center gap-0.5">
              {[
                { id: 'solid' as StrokeStyle, title: 'Solid Stroke', dash: '0' },
                { id: 'dashed' as StrokeStyle, title: 'Dashed Stroke', dash: '4 3' },
                { id: 'dotted' as StrokeStyle, title: 'Dotted Stroke', dash: '1.5 2.5' }
              ].map(({ id, title, dash }) => (
                <button
                  key={id}
                  type="button"
                  data-testid={`prop-style-${id}`}
                  onClick={() => onChangeStrokeStyle(id)}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer active:scale-[0.97] ${
                    strokeStyle === id
                      ? 'bg-[#222226] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-[#18181B]'
                  }`}
                  title={title}
                >
                  <svg width="14" height="2" viewBox="0 0 14 2" className="overflow-visible">
                    <line x1="0" y1="1" x2="14" y2="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray={dash} />
                  </svg>
                </button>
              ))}
            </div>

            <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />

            {/* Sloppiness (Roughness: 0 Clean, 1 Artist, 2 Cartoon) */}
            <div className="flex items-center gap-0.5">
              {[
                { val: 0 as Sloppiness, title: 'Clean Geometric (0)', label: '—' },
                { val: 1 as Sloppiness, title: 'Hand-drawn Artist (1)', label: '~' },
                { val: 2 as Sloppiness, title: 'Sketch Cartoon (2)', label: '≈' }
              ].map(({ val, title, label }) => (
                <button
                  key={val}
                  type="button"
                  data-testid={`prop-sloppiness-${val}`}
                  onClick={() => onChangeSloppiness(val)}
                  className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs transition-all cursor-pointer active:scale-[0.97] ${
                    sloppiness === val
                      ? 'bg-[#222226] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-[#18181B]'
                  }`}
                  title={title}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />

            {/* Edges (Sharp vs Round) */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                data-testid="prop-edges-sharp"
                onClick={() => onChangeRoundness('sharp')}
                className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer active:scale-[0.97] ${
                  roundness === 'sharp'
                    ? 'bg-[#222226] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-[#18181B]'
                }`}
                title="Sharp Edges"
              >
                <div className="w-2.5 h-2.5 border border-current" />
              </button>
              <button
                type="button"
                data-testid="prop-edges-round"
                onClick={() => onChangeRoundness('round')}
                className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer active:scale-[0.97] ${
                  roundness === 'round'
                    ? 'bg-[#222226] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-[#18181B]'
                }`}
                title="Rounded Edges"
              >
                <div className="w-2.5 h-2.5 border border-current rounded-sm" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CASE 2: FREEHAND (PEN, HIGHLIGHTER, DRAW-TO-SHAPE) */}
        {/* ============================================================ */}
        {isFreehandActive && (
          <div className="flex items-center gap-3 shrink-0">
            {/* 3 Stroke Weights */}
            <div className="flex items-center gap-0.5">
              {[
                { w: 1, sizeClass: 'w-1 h-1' },
                { w: 2, sizeClass: 'w-1.5 h-1.5' },
                { w: 4, sizeClass: 'w-2.5 h-2.5' }
              ].map(({ w, sizeClass }) => (
                <button
                  key={w}
                  type="button"
                  data-testid={`prop-width-${w}`}
                  onClick={() => onChangeStrokeWidth(w)}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer active:scale-[0.97] ${
                    strokeWidth === w
                      ? 'bg-[#222226] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-[#18181B]'
                  }`}
                  title={`Stroke Weight ${w}px`}
                >
                  <span className={`${sizeClass} rounded-full bg-current`} />
                </button>
              ))}
            </div>

            <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />

            {/* Stroke Color Swatches */}
            <div className="flex items-center gap-1.5">
              {STROKE_COLORS.map((c) => {
                const isSelected = strokeColor.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    data-testid={`prop-stroke-${c.name.toLowerCase()}`}
                    onClick={() => onChangeStrokeColor(c.value)}
                    className={`w-4 h-4 rounded-full shrink-0 transition-transform active:scale-[0.9] cursor-pointer ${
                      isSelected ? 'ring-[1.5px] ring-white ring-offset-2 ring-offset-[#0D0D10]' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={`Stroke: ${c.name}`}
                  />
                );
              })}
              <label
                className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center bg-[#1C1C21] border border-[#27272A] hover:border-[#52525B] cursor-pointer text-[#8E8E93] hover:text-white transition-all relative overflow-hidden"
                title="Custom Stroke Color"
              >
                <Plus className="w-2.5 h-2.5 pointer-events-none" />
                <input
                  type="color"
                  value={customStrokeColor}
                  onChange={(e) => {
                    setCustomStrokeColor(e.target.value);
                    onChangeStrokeColor(e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>

            <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />

            {/* Pressure Simulation Indicator */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#141417] border border-[#27272A] text-[11px] text-[#A1A1AA]"
              title="Pressure simulation enabled for natural pen lines"
            >
              <Activity className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Pressure Dynamic</span>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CASE 3: TEXT & STICKY NOTE */}
        {/* ============================================================ */}
        {isTextOrStickyActive && (
          <div className="flex items-center gap-3 shrink-0">
            {/* Font Family Segmented Pill: Sans (1) | Hand (2) | Mono (3) | Serif (4) */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#141417] border border-[#27272A]">
              {[
                { id: 1 as FontFamily, label: 'Sans' },
                { id: 2 as FontFamily, label: 'Hand' },
                { id: 3 as FontFamily, label: 'Mono' },
                { id: 4 as FontFamily, label: 'Serif' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  data-testid={`prop-font-${label.toLowerCase()}`}
                  onClick={() => onChangeFontFamily(id)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all active:scale-[0.97] cursor-pointer ${
                    fontFamily === id
                      ? 'bg-[#222226] text-white shadow-xs'
                      : 'text-[#8E8E93] hover:text-[#F4F4F5]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />

            {/* Font Size Segmented Pill: S (16) | M (20) | L (28) | XL (36) */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#141417] border border-[#27272A]">
              {[
                { sz: 16, label: 'S' },
                { sz: 20, label: 'M' },
                { sz: 28, label: 'L' },
                { sz: 36, label: 'XL' }
              ].map(({ sz, label }) => (
                <button
                  key={sz}
                  type="button"
                  data-testid={`prop-size-${label.toLowerCase()}`}
                  onClick={() => onChangeFontSize(sz)}
                  className={`w-6 h-5 rounded-md text-[11px] font-mono flex items-center justify-center transition-all active:scale-[0.97] cursor-pointer ${
                    fontSize === sz
                      ? 'bg-[#222226] text-white shadow-xs'
                      : 'text-[#8E8E93] hover:text-[#F4F4F5]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />

            {/* Text Alignment (Left, Center, Right) */}
            <div className="flex items-center gap-0.5">
              {[
                { align: 'left' as const, icon: AlignLeft },
                { align: 'center' as const, icon: AlignCenter },
                { align: 'right' as const, icon: AlignRight }
              ].map(({ align, icon: Icon }) => (
                <button
                  key={align}
                  type="button"
                  data-testid={`prop-align-${align}`}
                  onClick={() => onChangeTextAlign(align)}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer active:scale-[0.97] ${
                    textAlign === align
                      ? 'bg-[#222226] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-[#18181B]'
                  }`}
                  title={`Align ${align}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>

            <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />

            {/* Text / Sticky Note Color Swatches */}
            <div className="flex items-center gap-1.5">
              {STICKY_COLORS.map((c) => {
                const isSelected = fillColor.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    data-testid={`prop-sticky-color-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => {
                      onChangeFillColor(c.value);
                      if (c.value === '#1E1E24') {
                        onChangeStrokeColor('#F4F4F5');
                      } else {
                        onChangeStrokeColor('#18181B');
                      }
                    }}
                    className={`w-4 h-4 rounded-full shrink-0 transition-transform active:scale-[0.9] cursor-pointer ${
                      isSelected ? 'ring-[1.5px] ring-white ring-offset-2 ring-offset-[#0D0D10]' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={`Card Tint: ${c.name}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CASE 4: BUCKET FILL */}
        {/* ============================================================ */}
        {isBucketActive && (
          <div className="flex items-center gap-3 shrink-0">
            {/* Fill Color Swatches */}
            <div className="flex items-center gap-1.5">
              {FILL_COLORS.map((c) => {
                const isSelected = fillColor.toLowerCase() === c.value.toLowerCase();
                const isTransparent = c.value === 'transparent';
                return (
                  <button
                    key={c.value}
                    type="button"
                    data-testid={`prop-bucket-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => onChangeFillColor(c.value)}
                    className={`w-4 h-4 rounded-full shrink-0 transition-transform active:scale-[0.9] cursor-pointer relative overflow-hidden ${
                      isSelected ? 'ring-[1.5px] ring-white ring-offset-2 ring-offset-[#0D0D10]' : 'hover:scale-110'
                    } ${isTransparent ? 'border border-[#3F3F46] bg-[#141417]' : ''}`}
                    style={!isTransparent ? { backgroundColor: c.value } : undefined}
                    title={`Bucket Fill: ${c.name}`}
                  >
                    {isTransparent && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-[120%] h-[1px] bg-[#EF4444] rotate-45 transform origin-center" />
                      </span>
                    )}
                  </button>
                );
              })}
              <label
                className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center bg-[#1C1C21] border border-[#27272A] hover:border-[#52525B] cursor-pointer text-[#8E8E93] hover:text-white transition-all relative overflow-hidden"
                title="Custom Flood Color"
              >
                <Plus className="w-2.5 h-2.5 pointer-events-none" />
                <input
                  type="color"
                  value={customFillColor}
                  onChange={(e) => {
                    setCustomFillColor(e.target.value);
                    onChangeFillColor(e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>

            <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />

            {/* Fill Style */}
            <div className="flex items-center gap-0.5">
              {[
                { id: 'solid' as FillStyle, title: 'Solid Flood', icon: '■' },
                { id: 'hachure' as FillStyle, title: 'Hachure Flood', icon: '▨' },
                { id: 'cross-hatch' as FillStyle, title: 'Cross-Hatch Flood', icon: '▦' }
              ].map(({ id, title, icon }) => (
                <button
                  key={id}
                  type="button"
                  data-testid={`prop-bucket-pattern-${id}`}
                  onClick={() => onChangeFillStyle(id)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono transition-all cursor-pointer active:scale-[0.97] ${
                    fillStyle === id
                      ? 'bg-[#222226] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-[#18181B]'
                  }`}
                  title={title}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CASE 5: DEFAULT / SELECTION / PAN / ERASER / LASER (MINIMAL BALANCED HINT) */}
        {/* ============================================================ */}
        {!isShapeActive && !isFreehandActive && !isTextOrStickyActive && !isBucketActive && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-[#71717A]">
              {activeTool === 'select'
                ? 'Click or drag across canvas to select elements'
                : activeTool === 'pan'
                ? 'Click and drag to pan workspace'
                : activeTool === 'laser'
                ? 'Laser pointer active — highlights vanish automatically'
                : activeTool === 'eraser'
                ? 'Click or drag over any stroke to erase'
                : 'Select any tool to activate drawing'}
            </span>

            <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onSelectAll}
                className="px-2 py-0.5 rounded-md text-[11px] bg-[#141417] border border-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#18181B] active:scale-[0.97] transition-all cursor-pointer"
                title="Select All (Ctrl+A)"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={onClearCanvas}
                className="px-2 py-0.5 rounded-md text-[11px] bg-[#141417] border border-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#18181B] active:scale-[0.97] transition-all cursor-pointer"
                title="Clear Canvas"
              >
                Clear Canvas
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SHARED RIGHT-ALIGNED CONTROLS: OPACITY SLIDER & LAYERING */}
        {/* ============================================================ */}
        <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />

        <div className="flex items-center gap-2 shrink-0">
          {/* Opacity Control: SunDim icon + monochrome track slider + tabular-nums */}
          <div className="flex items-center gap-1.5" title="Opacity">
            <SunDim className="w-3.5 h-3.5 text-[#8E8E93] shrink-0" />
            <input
              type="range"
              min={10}
              max={100}
              value={opacity}
              onChange={(e) => onChangeOpacity(parseInt(e.target.value, 10))}
              data-testid="prop-slider-opacity"
              className="w-20 h-1 bg-[#27272A] rounded-full appearance-none cursor-pointer accent-[#F4F4F5]"
            />
            <span className="font-mono text-[11px] text-[#A1A1AA] tabular-nums w-8">{opacity}%</span>
          </div>

          {/* Layering Controls (When Selection is Active) */}
          {hasSelection && (
            <>
              <div className="h-3.5 w-[1px] bg-[#27272A] shrink-0" />
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  data-testid="layer-send-to-back"
                  onClick={onSendToBack}
                  className="w-6 h-6 rounded flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-[#18181B] active:scale-[0.97] transition-all cursor-pointer"
                  title="Send to Back (Ctrl+Shift+[)"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  data-testid="layer-bring-to-front"
                  onClick={onBringToFront}
                  className="w-6 h-6 rounded flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-[#18181B] active:scale-[0.97] transition-all cursor-pointer"
                  title="Bring to Front (Ctrl+Shift+])"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* ROW 2: STRICTLY CENTERED PRIMARY TOOL PALETTE (BOTTOM ROW) */}
      {/* ======================================================== */}
      <div
        data-testid="toolbar-primary-row"
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 overflow-x-auto custom-scrollbar"
      >
        {/* 1. Multi-Page Nav (shown only on PDF, Docs, Slides) */}
        {pageNav && (
          <>
            <div data-testid="toolbar-page-nav" className="flex items-center gap-1">
              <button
                type="button"
                data-testid="dock-btn-prev-page"
                onClick={pageNav.onPrevPage}
                disabled={pageNav.currentPage <= 1}
                className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#18181B] active:scale-[0.97] disabled:opacity-30 disabled:hover:bg-transparent text-[#8E8E93] hover:text-[#FAFAFA] transition-all cursor-pointer"
                title="Previous Page (ArrowLeft)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1 font-mono text-[11px] text-[#A1A1AA] px-1.5 py-0.5 rounded bg-[#141417] border border-[#27272A]">
                <input
                  type="text"
                  value={pageInputVal}
                  onChange={(e) => setPageInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const p = parseInt(pageInputVal, 10);
                      if (!isNaN(p) && p >= 1 && p <= (pageNav?.totalPages || 1)) {
                        pageNav?.onGoToPage?.(p);
                      } else {
                        setPageInputVal(pageNav?.currentPage.toString() || '1');
                      }
                    }
                  }}
                  onBlur={() => {
                    const p = parseInt(pageInputVal, 10);
                    if (!isNaN(p) && p >= 1 && p <= (pageNav?.totalPages || 1)) {
                      pageNav?.onGoToPage?.(p);
                    } else {
                      setPageInputVal(pageNav?.currentPage.toString() || '1');
                    }
                  }}
                  className="w-7 text-center bg-transparent text-[#F4F4F5] focus:outline-none focus:text-white tabular-nums"
                />
                <span className="text-[#52525B]">/</span>
                <span className="tabular-nums">{pageNav.totalPages}</span>
              </div>
              <button
                type="button"
                data-testid="dock-btn-next-page"
                onClick={pageNav.onNextPage}
                disabled={pageNav.currentPage >= pageNav.totalPages}
                className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#18181B] active:scale-[0.97] disabled:opacity-30 disabled:hover:bg-transparent text-[#8E8E93] hover:text-[#FAFAFA] transition-all cursor-pointer"
                title="Next Page (ArrowRight)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-4 w-[1px] bg-[#27272A] mx-1 shrink-0" />
          </>
        )}

        {/* 2. Tool Lock (Q) | Hand/Pan (H) | Select (V) */}
        <button
          type="button"
          data-testid="tool-lock"
          onClick={onToggleToolLock}
          className={getToolBtnClass(isToolLocked)}
          title={isToolLocked ? 'Tool Lock Active (Q)' : 'Lock Tool (Q)'}
        >
          {isToolLocked ? <Lock className="w-3.5 h-3.5 text-[#F59E0B]" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          data-testid="tool-pan"
          onClick={() => onSelectTool('pan')}
          className={getToolBtnClass(activeTool === 'pan')}
          title="Hand / Pan Tool (H)"
        >
          <Hand className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="tool-select"
          onClick={() => onSelectTool('select')}
          className={getToolBtnClass(activeTool === 'select')}
          title="Select (V or 1)"
        >
          <MousePointer className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-[#27272A] mx-1 shrink-0" />

        {/* 3. Shapes: Rectangle (R) | Diamond (D) | Ellipse (O) | Arrow (A) | Line (L) */}
        <button
          type="button"
          data-testid="tool-rectangle"
          onClick={() => {
            onSelectShape('rectangle');
            onSelectTool('rectangle');
          }}
          className={getToolBtnClass(
            activeTool === 'rectangle' || (activeTool === 'shape' && selectedShape === 'rectangle')
          )}
          title="Rectangle (R or 2)"
        >
          <Square className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="tool-diamond"
          onClick={() => {
            onSelectShape('diamond');
            onSelectTool('diamond');
          }}
          className={getToolBtnClass(
            activeTool === 'diamond' || (activeTool === 'shape' && selectedShape === 'diamond')
          )}
          title="Diamond (D or 3)"
        >
          <Diamond className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="tool-ellipse"
          onClick={() => {
            onSelectShape('circle');
            onSelectTool('ellipse');
          }}
          className={getToolBtnClass(
            activeTool === 'ellipse' || (activeTool === 'shape' && selectedShape === 'circle')
          )}
          title="Ellipse (O or 4)"
        >
          <Circle className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="tool-arrow"
          onClick={() => onSelectTool('arrow')}
          className={getToolBtnClass(activeTool === 'arrow')}
          title="Arrow (A or 5)"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="tool-line"
          onClick={() => onSelectTool('line')}
          className={getToolBtnClass(activeTool === 'line')}
          title="Line (L or 6)"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-[#27272A] mx-1 shrink-0" />

        {/* 4. Freehand & Creation: Pen (P) | Highlighter | Draw-to-Shape | Bucket Fill */}
        <button
          type="button"
          data-testid="tool-pen"
          onClick={() => onSelectTool('pen')}
          className={getToolBtnClass(activeTool === 'pen')}
          title="Draw / Pen (P or 7)"
        >
          <PenTool className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="tool-highlighter"
          onClick={() => onSelectTool('highlighter')}
          className={getToolBtnClass(activeTool === 'highlighter')}
          title="Highlighter"
        >
          <Highlighter className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="tool-draw-to-shape"
          onClick={() => onSelectTool('drawToShape')}
          className={getToolBtnClass(activeTool === 'drawToShape')}
          title="Draw-to-Shape: Auto-snaps hand-drawn loops to clean geometric shapes!"
        >
          <Wand2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="tool-bucket-fill"
          onClick={() => onSelectTool('bucketFill')}
          className={getToolBtnClass(activeTool === 'bucketFill')}
          title="Bucket Fill: Click any shape or sticky note to flood-fill"
        >
          <PaintBucket className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-[#27272A] mx-1 shrink-0" />

        {/* 5. Content: Text (T) | Sticky Note (S) | Image (I) | Eraser (E) | Laser (K) | Library */}
        <button
          type="button"
          data-testid="tool-text"
          onClick={() => onSelectTool('text')}
          className={getToolBtnClass(activeTool === 'text')}
          title="Text (T or 8)"
        >
          <Type className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="tool-sticky"
          onClick={() => onSelectTool('sticky')}
          className={getToolBtnClass(activeTool === 'sticky')}
          title="Sticky Note Card (S or 9)"
        >
          <StickyNoteIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="tool-image"
          onClick={() => {
            onSelectTool('image');
            fileInputRef.current?.click();
          }}
          className={getToolBtnClass(activeTool === 'image')}
          title="Insert Image (I)"
        >
          <ImagePlus className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="tool-eraser"
          onClick={() => onSelectTool('eraser')}
          className={getToolBtnClass(activeTool === 'eraser')}
          title="Eraser (E or 0)"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="tool-laser"
          onClick={() => onSelectTool('laser')}
          className={getToolBtnClass(activeTool === 'laser')}
          title="Laser Pointer (K)"
        >
          <Laser className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="tool-library"
          onClick={onToggleLibrary}
          className={getToolBtnClass(isLibraryOpen)}
          title="Canvas Library Drawer"
        >
          <BookOpen className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-[#27272A] mx-1 shrink-0" />

        {/* 6. History: Undo (Ctrl+Z) | Redo (Ctrl+Y) */}
        <button
          type="button"
          data-testid="btn-undo"
          onClick={onUndo}
          disabled={!canUndo}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-[0.97] ${
            canUndo ? 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-[#18181B] cursor-pointer' : 'text-[#3F3F46] cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="btn-redo"
          onClick={onRedo}
          disabled={!canRedo}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-[0.97] ${
            canRedo ? 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-[#18181B] cursor-pointer' : 'text-[#3F3F46] cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-[#27272A] mx-1 shrink-0" />

        {/* 7. Help & Dock Collapse */}
        <button
          type="button"
          data-testid="btn-workspace-guide"
          onClick={onOpenGuide}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-[#18181B] active:scale-[0.97] transition-all duration-150 cursor-pointer"
          title="Shortcuts & Workspace Guide (?)"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-testid="btn-hide-toolbar"
          onClick={onToggleHideDock}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-[#18181B] active:scale-[0.97] transition-all duration-150 cursor-pointer"
          title="Hide Toolbar (Bottom hover reveals)"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const DockedAnnotationToolbar = React.memo(DockedAnnotationToolbarComponent);
