import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UniversalCanvasHost, SpatialElement, ViewMode } from '../canvas/UniversalCanvasHost.js';
import { useLearningStore } from '../../stores/learning-store.js';
import {
  Loader2,
  Image as ImageIcon,
  Smile,
  X,
  Check,
  RotateCcw
} from 'lucide-react';
import type { LearningToolType } from '@sos/domain';

// Pure Native BlockNote Imports
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote, useEditorChange } from '@blocknote/react';

interface LearningNotesViewProps {
  documentId?: string;
}

const COVER_PRESETS = [
  {
    name: 'Neural Mesh',
    url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1600&q=80',
    gradient: 'from-[#0F172A] via-[#1E1B4B] to-[#0A0A0E]'
  },
  {
    name: 'Obsidian Wave',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
    gradient: 'from-[#18181B] via-[#09090B] to-[#000000]'
  },
  {
    name: 'Deep Synapse',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
    gradient: 'from-[#172554] via-[#0F172A] to-[#0A0A0E]'
  },
  {
    name: 'Emerald Biome',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
    gradient: 'from-[#064E3B] via-[#022C22] to-[#0A0A0E]'
  },
  {
    name: 'Cosmic Obsidian',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
    gradient: 'from-[#2E1065] via-[#1E1B4B] to-[#0A0A0E]'
  }
];

const EMOJI_OPTIONS = [
  '🧠', '⚡', '🔬', '🧬', '📚', '🧪', '💡', '🎯',
  '🩺', '📖', '📝', '🎓', '🔥', '✨', '⭐', '🏆'
];

// Pure, Native BlockNote Document Editor Sub-component
const PureBlockNoteEditor: React.FC<{
  initialContent: any[];
  documentId: string;
}> = ({ initialContent, documentId }) => {
  const editor = useCreateBlockNote({
    initialContent:
      initialContent && Array.isArray(initialContent) && initialContent.length > 0
        ? initialContent
        : undefined
  });

  const saveTimeoutRef = useRef<any>(null);

  // Debounced auto-save to backend whenever user types or modifies blocks
  useEditorChange(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const blocks = editor.document;
        await fetch(`http://127.0.0.1:3001/api/learning/notes/${documentId}/blocks`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocksJson: blocks })
        });
      } catch (err) {
        console.error('Failed to auto-save BlockNote blocks:', err);
      }
    }, 500);
  }, editor);

  return (
    <div
      data-testid="blocknote-view-container"
      className="w-full relative mt-4 text-[15px] leading-relaxed text-[#D4D4D8]"
    >
      <BlockNoteView
        editor={editor}
        theme="dark"
        data-testid="blocknote-view"
      />
    </div>
  );
};

export const LearningNotesView: React.FC<LearningNotesViewProps> = ({
  documentId = 'doc-synaptic-plasticity'
}) => {
  const { openTab } = useLearningStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [documentData, setDocumentData] = useState<any>(null);
  const [canvasScene, setCanvasScene] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('blended');
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);

  // Live Editable Header State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [iconEmoji, setIconEmoji] = useState('🧠');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Popover UI State
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customCoverUrl, setCustomCoverUrl] = useState('');

  const titleDebounceRef = useRef<any>(null);
  const subtitleDebounceRef = useRef<any>(null);

  // Fetch document details and canvas scene from backend
  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://127.0.0.1:3001/api/learning/notes/${documentId}`);
      if (!res.ok) throw new Error('Failed to load note document');
      const data = await res.json();
      setDocumentData(data.document);
      setCanvasScene(data.canvasScene);
      setTitle(data.document?.title || 'Synaptic Transmission & Plasticity');
      setSubtitle(
        data.document?.subtitle ||
          'Folder workspace containing lecture notes and canonical learning assets'
      );
      setIconEmoji(data.document?.iconEmoji || '🧠');
      setCoverUrl(data.document?.coverUrl || null);

      if (data.canvasScene?.appStateJson?.viewMode) {
        setViewMode(data.canvasScene.appStateJson.viewMode);
      }
    } catch (err: any) {
      console.error('Error loading notes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // Persist Title Changes
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(async () => {
      try {
        await fetch(`http://127.0.0.1:3001/api/learning/notes/${documentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle })
        });
      } catch (err) {
        console.error('Failed to update title:', err);
      }
    }, 400);
  };

  // Persist Subtitle / Description Changes
  const handleSubtitleChange = (newSubtitle: string) => {
    setSubtitle(newSubtitle);
    if (subtitleDebounceRef.current) clearTimeout(subtitleDebounceRef.current);
    subtitleDebounceRef.current = setTimeout(async () => {
      try {
        await fetch(`http://127.0.0.1:3001/api/learning/notes/${documentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subtitle: newSubtitle })
        });
      } catch (err) {
        console.error('Failed to update subtitle:', err);
      }
    }, 400);
  };

  // Persist Icon / Emoji Changes
  const handleSelectEmoji = async (emoji: string) => {
    setIconEmoji(emoji);
    setShowEmojiPicker(false);
    try {
      await fetch(`http://127.0.0.1:3001/api/learning/notes/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iconEmoji: emoji })
      });
    } catch (err) {
      console.error('Failed to update icon emoji:', err);
    }
  };

  // Persist Cover Banner Changes
  const handleSelectCover = async (url: string | null) => {
    setCoverUrl(url);
    setShowCoverPicker(false);
    try {
      await fetch(`http://127.0.0.1:3001/api/learning/notes/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverUrl: url })
      });
    } catch (err) {
      console.error('Failed to update cover url:', err);
    }
  };

  // Listen for AI highlight events (from AI Assistant action button)
  useEffect(() => {
    const handleHighlightEvent = (e: CustomEvent<{ elementId: string }>) => {
      if (e.detail?.elementId) {
        setHighlightedElementId(e.detail.elementId);
        setTimeout(() => setHighlightedElementId(null), 3000);
      }
    };

    window.addEventListener('highlight-spatial-element' as any, handleHighlightEvent);
    return () =>
      window.removeEventListener('highlight-spatial-element' as any, handleHighlightEvent);
  }, []);

  // Update canvas scene elements in backend
  const handleUpdateCanvasScene = async (elements: SpatialElement[], appState: any) => {
    try {
      await fetch(`http://127.0.0.1:3001/api/learning/canvas/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementsJson: elements,
          appStateJson: { ...appState, viewMode }
        })
      });
    } catch (err) {
      console.error('Failed to persist canvas elements:', err);
    }
  };

  if (loading && !documentData) {
    return (
      <div
        data-testid="learning-notes-loading"
        className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0E] text-[#A1A1AA] gap-3"
      >
        <Loader2 className="w-6 h-6 animate-spin text-[#60A5FA]" />
        <span className="text-xs font-mono">Loading Dual-Layer Notes Workspace...</span>
      </div>
    );
  }

  // Parse elements from canvas scene
  const parsedElements: SpatialElement[] = Array.isArray(canvasScene?.elementsJson)
    ? canvasScene.elementsJson
    : typeof canvasScene?.elementsJson === 'string'
    ? JSON.parse(canvasScene.elementsJson)
    : [];

  const parsedBlocks = Array.isArray(documentData?.blocksJson)
    ? documentData.blocksJson
    : typeof documentData?.blocksJson === 'string'
    ? JSON.parse(documentData.blocksJson)
    : [];

  const baseLayerContent = (
    <div className="flex flex-col w-full relative">
      {/* 1. Full-Bleed Interactive Cover Banner (180px height) */}
      <div
        data-testid="notes-cover-banner"
        className="w-full h-[180px] relative shrink-0 select-none group bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0A0A0E] z-30"
      >
        <div className="absolute inset-0 overflow-hidden">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Document Cover"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0A0A0E]">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 35%, #3B82F6 0, transparent 40%),
                                    radial-gradient(circle at 75% 44%, #8B5CF6 0, transparent 50%),
                                    radial-gradient(circle at 50% 80%, #10B981 0, transparent 45%)`
                }}
              />
              <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="neural-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="1.5" fill="#60A5FA" />
                    <path d="M20 20 L40 40 M20 20 L0 40" stroke="#38BDF8" strokeWidth="0.5" strokeDasharray="2 4" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#neural-pattern)" />
              </svg>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0E]/30 to-[#0A0A0E]" />
        </div>

        {/* Controls: Change Cover / Remove Cover */}
        <div className="absolute bottom-3 right-6 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity z-20">
          <button
            type="button"
            onClick={() => setShowCoverPicker(!showCoverPicker)}
            data-testid="btn-change-cover"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/75 hover:bg-black/90 border border-white/15 text-xs text-[#FAFAFA] font-medium backdrop-blur-md shadow-lg transition-all active:scale-95"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Change cover</span>
          </button>
          {coverUrl && (
            <button
              type="button"
              onClick={() => handleSelectCover(null)}
              data-testid="btn-remove-cover"
              className="p-1.5 rounded-lg bg-black/75 hover:bg-black/90 border border-white/15 text-xs text-[#A1A1AA] hover:text-rose-400 backdrop-blur-md shadow-lg transition-all"
              title="Remove cover"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Change Cover Popover */}
        {showCoverPicker && (
          <div
            className="absolute top-20 right-6 w-72 rounded-2xl bg-[#141417]/95 border border-[#27272A] shadow-2xl p-3 flex flex-col gap-3 z-50 text-xs backdrop-blur-xl"
            onMouseLeave={() => setShowCoverPicker(false)}
          >
            <div className="flex items-center justify-between pb-1 border-b border-[#27272A]">
              <span className="font-semibold text-[#FAFAFA]">Choose Cover Preset</span>
              <button
                type="button"
                onClick={() => setShowCoverPicker(false)}
                className="text-[#71717A] hover:text-[#FAFAFA]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {COVER_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectCover(preset.url)}
                  data-testid={`cover-preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group/preset relative h-14 rounded-lg overflow-hidden border border-[#27272A] hover:border-[#60A5FA] transition-all text-left"
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 group-hover/preset:bg-black/20 flex items-end p-1">
                    <span className="text-[10px] text-white font-medium drop-shadow-md">
                      {preset.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1 pt-1 border-t border-[#27272A]">
              <span className="text-[10px] text-[#71717A] font-mono">Custom Image URL</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customCoverUrl}
                  onChange={(e) => setCustomCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-2 py-1 rounded bg-[#0A0A0E] border border-[#27272A] text-xs text-[#FAFAFA] placeholder:text-[#52525B] outline-none focus:border-[#60A5FA]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customCoverUrl.trim()) {
                      handleSelectCover(customCoverUrl.trim());
                      setCustomCoverUrl('');
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-[#27272A] hover:bg-[#3F3F46] text-xs text-[#FAFAFA] font-medium"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Seamless Editorial Column (max-w-[940px] centered cleanly, NO gray container box) */}
      <div className="w-full max-w-[940px] mx-auto px-8 pb-48 flex flex-col relative z-35">
        {/* Document Header (Overlapping Emoji Icon Badge -mt-10) */}
        <div className="flex flex-col gap-2 pb-4">
          {/* Overlapping Clickable Icon Badge with Emoji Picker */}
          <div className="-mt-10 relative inline-block self-start z-40">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              data-testid="notes-icon-badge"
              className="text-4xl p-2 rounded-2xl bg-[#141417] border border-[#27272A] hover:border-[#60A5FA] hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer flex items-center justify-center select-none"
              title="Click to change page icon"
            >
              <span>{iconEmoji}</span>
            </button>

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
              <div
                className="absolute top-16 left-0 p-3 rounded-2xl bg-[#141417]/95 border border-[#27272A] shadow-2xl z-50 backdrop-blur-xl flex flex-col gap-2 min-w-[220px]"
                onMouseLeave={() => setShowEmojiPicker(false)}
              >
                <div className="flex items-center justify-between pb-1 border-b border-[#27272A] text-xs">
                  <span className="font-semibold text-[#FAFAFA]">Select Page Icon</span>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-[#71717A] hover:text-[#FAFAFA]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-2xl p-1">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSelectEmoji(emoji)}
                      data-testid={`emoji-option-${emoji}`}
                      className="p-1.5 rounded-lg hover:bg-[#27272A] transition-all text-center active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Editable Title Input (No box, no border, text-3xl font-bold) */}
          <div className="flex flex-col gap-1 mt-1">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled Note"
              data-testid="notes-document-title"
              className="w-full bg-transparent text-3xl md:text-4xl font-bold tracking-tight text-[#FAFAFA] placeholder:text-[#3F3F46] outline-none border-none py-1 focus:ring-0 leading-tight"
            />
            {/* Live Editable Subtitle / Description Input */}
            <input
              type="text"
              value={subtitle}
              onChange={(e) => handleSubtitleChange(e.target.value)}
              placeholder="Add a description or lecture context..."
              data-testid="notes-document-subtitle"
              className="w-full bg-transparent text-sm text-[#A1A1AA] placeholder:text-[#3F3F46] outline-none border-none py-0.5 focus:ring-0"
            />
          </div>
        </div>

        {/* 3. Pure Native BlockNote Editor (No gray box, transparent, generous 940px width) */}
        {documentData && (
          <PureBlockNoteEditor
            key={documentData.id || documentId}
            initialContent={parsedBlocks}
            documentId={documentId}
          />
        )}
      </div>
    </div>
  );

  return (
    <UniversalCanvasHost
      resourceId={documentId}
      resourceType="note"
      baseLayer={baseLayerContent}
      elements={parsedElements}
      viewMode={viewMode}
      onChangeViewMode={setViewMode}
      onUpdateCanvasScene={handleUpdateCanvasScene}
      highlightedElementId={highlightedElementId}
    />
  );
};
