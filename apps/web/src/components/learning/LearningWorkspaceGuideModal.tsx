import React, { useState } from 'react';
import {
  X,
  Keyboard,
  FileText,
  FileCheck,
  Presentation,
  Layout,
  MousePointer,
  Sparkles,
  Command,
  Search,
  ZoomIn,
  ZoomOut,
  Layers,
  Palette
} from 'lucide-react';

interface LearningWorkspaceGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LearningWorkspaceGuideModal: React.FC<LearningWorkspaceGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'shortcuts' | 'arabic' | 'canvas'>('overview');

  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl bg-[#121214] border border-[#27272A] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-[#E4E4E7]"
        data-testid="learning-workspace-guide-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#18181B]/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">SOS Learning Workspace Guide</h2>
              <p className="text-xs text-[#71717A]">Complete manual for PDF, Docs, Slides, Canvas Board & Shortcuts</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            data-testid="guide-modal-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#27272A]/70 bg-[#121214]">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Workspace Tabs</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'shortcuts'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keyboard Shortcuts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('arabic')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'arabic'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Arabic & Typography</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'canvas'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Canvas & Excalidraw</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-medium">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">PDF Reader</span>
                  </div>
                  <p className="text-[#A1A1AA] leading-relaxed">
                    High-performance vector rendering powered by PDF.js with JBIG2 and OpenJPEG WASM acceleration.
                    Supports multi-hundred-page scanned documents, smart anti-glare dark mode luminance inversion, and continuous canvas overlay.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-medium">
                    <FileCheck className="w-4 h-4" />
                    <span className="text-sm">DOCX Viewer</span>
                  </div>
                  <p className="text-[#A1A1AA] leading-relaxed">
                    Renders Word documents with true typographic hierarchy, tables, callouts, and embedded figures.
                    Switch seamlessly between Doc View, Blended Annotation View, and Pure Canvas View.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-medium">
                    <Presentation className="w-4 h-4" />
                    <span className="text-sm">Slides Presentation</span>
                  </div>
                  <p className="text-[#A1A1AA] leading-relaxed">
                    Converts PPTX slide decks into 16:9 presentation slides with embedded imagery and native Arabic text direction.
                    Includes thumbnail rail navigation, presentation mode, and speaker notes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <Layout className="w-4 h-4" />
                    <span className="text-sm">Infinite Visual Board</span>
                  </div>
                  <p className="text-[#A1A1AA] leading-relaxed">
                    Full-featured infinite whiteboard with freehand drawing, vector shapes, connector arrows, image attachments,
                    and debounced cloud autosave backed by PostgreSQL.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#151518] border border-[#27272A]/70 flex items-center justify-between text-[#A1A1AA]">
                <span>Want to switch active views?</span>
                <span className="font-mono text-white bg-[#222227] px-2 py-0.5 rounded border border-[#323238]">
                  Doc / Blended / Canvas Switcher (Top Right)
                </span>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-3">
                  <h3 className="font-semibold text-white">General & Workspace</h3>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between items-center py-1 border-b border-[#27272A]/50">
                      <span className="text-[#A1A1AA]">Find in Document / Search</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[#27272A] text-white">{modKey}+F</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#27272A]/50">
                      <span className="text-[#A1A1AA]">Zoom In</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[#27272A] text-white">{modKey}++</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#27272A]/50">
                      <span className="text-[#A1A1AA]">Zoom Out</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[#27272A] text-white">{modKey}+-</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#A1A1AA]">Reset Zoom (100%)</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[#27272A] text-white">{modKey}+0</kbd>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-3">
                  <h3 className="font-semibold text-white">Canvas & Object Editing</h3>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between items-center py-1 border-b border-[#27272A]/50">
                      <span className="text-[#A1A1AA]">Undo / Redo</span>
                      <span className="space-x-1">
                        <kbd className="px-1.5 py-0.5 rounded bg-[#27272A] text-white">{modKey}+Z</kbd>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#27272A] text-white">{modKey}+Y</kbd>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#27272A]/50">
                      <span className="text-[#A1A1AA]">Select All</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[#27272A] text-white">{modKey}+A</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#27272A]/50">
                      <span className="text-[#A1A1AA]">Duplicate Selection</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[#27272A] text-white">{modKey}+D</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#27272A]/50">
                      <span className="text-[#A1A1AA]">Cut / Copy / Paste</span>
                      <span className="space-x-1">
                        <kbd className="px-1 py-0.5 rounded bg-[#27272A] text-white">{modKey}+X</kbd>
                        <kbd className="px-1 py-0.5 rounded bg-[#27272A] text-white">{modKey}+C</kbd>
                        <kbd className="px-1 py-0.5 rounded bg-[#27272A] text-white">{modKey}+V</kbd>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#A1A1AA]">Delete Selection</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[#27272A] text-white">Delete / Backspace</kbd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-3">
                <h3 className="font-semibold text-white">Toolbar Tool Shortcuts</h3>
                <div className="grid grid-cols-4 gap-2 font-mono">
                  <div className="flex justify-between items-center p-2 rounded bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA]">Selection</span>
                    <kbd className="text-sky-400 font-bold">V</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA]">Pan / Hand</span>
                    <kbd className="text-sky-400 font-bold">H</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA]">Pen</span>
                    <kbd className="text-sky-400 font-bold">P</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA]">Eraser</span>
                    <kbd className="text-sky-400 font-bold">E</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA]">Line</span>
                    <kbd className="text-sky-400 font-bold">L</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA]">Arrow</span>
                    <kbd className="text-sky-400 font-bold">A</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA]">Rectangle</span>
                    <kbd className="text-sky-400 font-bold">R</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA]">Ellipse</span>
                    <kbd className="text-sky-400 font-bold">O</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA]">Text</span>
                    <kbd className="text-sky-400 font-bold">T</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA]">Insert Image</span>
                    <kbd className="text-sky-400 font-bold">9</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA]">Lock Tool</span>
                    <kbd className="text-sky-400 font-bold">Q</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA]">Help Guide</span>
                    <kbd className="text-sky-400 font-bold">?</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'arabic' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2">
                <h3 className="font-semibold text-white">Full Arabic & Right-to-Left (RTL) Support</h3>
                <p className="text-[#A1A1AA] leading-relaxed">
                  SOS v3 features native support for right-to-left languages across all formats:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-[#D4D4D8]">
                  <li>
                    <strong className="text-white">Arabic PDFs:</strong> WebAssembly JBIG2 and OpenJPEG decoders render scanned and digital Arabic documents with zero missing glyphs or blank pages.
                  </li>
                  <li>
                    <strong className="text-white">DOCX & PPTX Conversion:</strong> Headless Chromium converts Arabic Word tables, PowerPoint slides, and student rosters with bidirectional font rendering (<code className="text-sky-400">Cairo</code>, <code className="text-sky-400">Amiri</code>, <code className="text-sky-400">Segoe UI</code>).
                  </li>
                  <li>
                    <strong className="text-white">Non-ASCII Filenames:</strong> UTF-8 encoded <code className="text-sky-400">Content-Disposition</code> headers ensure Arabic filenames download and upload without corruption.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'canvas' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2">
                <h3 className="font-semibold text-white">Image Uploads & Cloud Persistence</h3>
                <p className="text-[#A1A1AA] leading-relaxed">
                  The Canvas Board is in 100% parity with native Excalidraw:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-[#D4D4D8]">
                  <li>
                    <strong className="text-white">Insert Image:</strong> Use the <code className="text-sky-400">Insert Image</code> button in the bottom dock or press <kbd className="px-1 py-0.5 rounded bg-[#27272A] text-white">9</kbd> to upload diagrams and screenshots.
                  </li>
                  <li>
                    <strong className="text-white">Clipboard Paste:</strong> Copy any image from your clipboard and press <kbd className="px-1 py-0.5 rounded bg-[#27272A] text-white">{modKey}+V</kbd> directly onto the board.
                  </li>
                  <li>
                    <strong className="text-white">Persistence:</strong> All image assets and binary data URIs are stored in the <code className="text-sky-400">files_json</code> column in PostgreSQL and restored automatically on reload.
                  </li>
                  <li>
                    <strong className="text-white">Export Options:</strong> Right-click anywhere to export your board as high-res PNG, vector SVG, PDF, or raw Excalidraw JSON.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#27272A] bg-[#18181B]/50 flex items-center justify-between text-xs text-[#71717A]">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-[#27272A] text-white">?</kbd> anywhere in a learning tab to open this guide.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
