import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  UploadCloud,
  FilePlus2,
  FileText,
  FileCode,
  Presentation,
  LayoutGrid,
  PenTool,
  Layers,
  CheckCircle,
  Video,
  Headphones,
  X,
  Search,
  Check
} from 'lucide-react';
import { useLearningStore } from '../../stores/learning-store.js';
import { SOSCard } from '../ui/SOSCard.js';
import type { LearningToolType } from '@sos/domain';

interface ToolEmptyLauncherProps {
  toolType: LearningToolType;
  tabId: string;
}

const TOOL_META: Record<string, { label: string; uploadExts: string; icon: React.ComponentType<{ className?: string }> }> = {
  pdf: { label: 'PDF', uploadExts: '.pdf', icon: FileText },
  docx: { label: 'Document', uploadExts: '.docx,.doc', icon: FileCode },
  slides: { label: 'Presentation', uploadExts: '.pptx,.ppt', icon: Presentation },
  board: { label: 'Board', uploadExts: '.excalidraw,.json', icon: LayoutGrid },
  notes: { label: 'Study Note', uploadExts: '.md,.txt', icon: PenTool },
  flashcards: { label: 'Flashcard Deck', uploadExts: '.json,.csv', icon: Layers },
  quizzes: { label: 'Quiz', uploadExts: '.json', icon: CheckCircle },
  videos: { label: 'Video', uploadExts: '.mp4,.mov,.webm', icon: Video },
  audios: { label: 'Audio', uploadExts: '.mp3,.wav,.m4a', icon: Headphones },
  images: { label: 'Image', uploadExts: '.png,.jpg,.jpeg,.webp', icon: FileText },
  browser: { label: 'Web Session', uploadExts: '', icon: FileText },
  exam: { label: 'Proctored Exam', uploadExts: '', icon: CheckCircle }
};

export const ToolEmptyLauncher: React.FC<ToolEmptyLauncherProps> = ({ toolType, tabId }) => {
  const { updateTabResource, morphActiveTab } = useLearningStore();
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const meta = TOOL_META[toolType] || { label: toolType.toUpperCase(), uploadExts: '', icon: FileText };
  const MainIcon = meta.icon;

  // 1. CHOOSE FROM LIBRARY
  const handleOpenLibrary = async () => {
    setIsLibraryModalOpen(true);
    setIsLoadingLibrary(true);
    setErrorMessage(null);
    try {
      const [filesRes, libRes] = await Promise.all([
        fetch('/api/learning/files').catch(() => null),
        fetch('/api/library/items').catch(() => null)
      ]);

      const items: any[] = [];
      if (filesRes && filesRes.ok) {
        const files = await filesRes.json();
        if (Array.isArray(files)) {
          items.push(
            ...files.map((f: any) => ({
              id: f.id,
              title: f.filename,
              type: f.fileType,
              meta: `Uploaded • ${f.pageCount || 1} pages`,
              raw: f
            }))
          );
        }
      }

      if (libRes && libRes.ok) {
        const libData = await libRes.json();
        const libItems = Array.isArray(libData.items) ? libData.items : Array.isArray(libData) ? libData : [];
        for (const it of libItems) {
          if (!items.some((existing) => existing.id === it._id || existing.id === it.id)) {
            items.push({
              id: it._id || it.id,
              title: it.name,
              type: it.fileType,
              meta: it.fileType ? `Library • ${it.fileType.toUpperCase()}` : 'Library Asset',
              raw: it
            });
          }
        }
      }

      // Filter to compatible items
      const compatible = items.filter((it) => {
        if (!it.type) return false;
        const t = it.type.toLowerCase();
        if (toolType === 'pdf') return t === 'pdf';
        if (toolType === 'docx') return t === 'docx' || t === 'doc';
        if (toolType === 'slides') return t === 'slides' || t === 'pptx' || t === 'ppt';
        if (toolType === 'board') return t === 'board';
        if (toolType === 'notes') return t === 'note' || t === 'notes' || t === 'md';
        if (toolType === 'videos') return t === 'video' || t === 'videos';
        if (toolType === 'audios') return t === 'audio' || t === 'audios';
        if (toolType === 'flashcards') return t === 'flashcards';
        if (toolType === 'quizzes') return t === 'quiz' || t === 'quizzes';
        return true;
      });

      setLibraryItems(compatible);
    } catch (err: any) {
      console.warn('[ToolEmptyLauncher] Failed to load library items:', err);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const handleSelectLibraryItem = async (item: any) => {
    setIsLibraryModalOpen(false);
    // Morph active tab in place with selected library asset (no extra tabs spawned)
    await morphActiveTab(toolType, item.title, item.id);
  };

  // 2. UPLOAD NEW FILE
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/learning/files/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }

      const fileData = await res.json();
      await morphActiveTab(toolType, fileData.filename, fileData.id);
    } catch (err: any) {
      console.error('[ToolEmptyLauncher] Upload error:', err);
      setErrorMessage(err?.message || 'File upload failed. Ensure the server is online.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 3. CREATE NEW BLANK FILE
  const handleCreateBlank = async () => {
    setIsCreating(true);
    setErrorMessage(null);
    try {
      if (toolType === 'pdf' || toolType === 'docx' || toolType === 'slides') {
        const res = await fetch('/api/learning/files/create-blank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileType: toolType,
            title: `Untitled_${meta.label}`
          })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to create blank document');
        }

        const data = await res.json();
        await morphActiveTab(toolType, data.filename, data.id);
      } else if (toolType === 'board') {
        const res = await fetch('/api/learning/boards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Untitled Canvas'
          })
        });

        if (!res.ok) throw new Error('Failed to create blank board');
        const data = await res.json();
        await morphActiveTab('board', data.title, data.id);
      } else if (toolType === 'notes') {
        const res = await fetch('/api/learning/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Untitled Study Note',
            isDocument: true
          })
        });

        if (!res.ok) throw new Error('Failed to create blank note');
        const data = await res.json();
        await morphActiveTab('notes', data.title, data.id);
      } else {
        // Fallback for flashcards/quizzes
        await morphActiveTab(toolType, `New ${meta.label}`, `blank-${toolType}-${Date.now()}`);
      }
    } catch (err: any) {
      console.error('[ToolEmptyLauncher] Create blank error:', err);
      setErrorMessage(err?.message || 'Failed to create blank workspace record.');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredLibraryItems = libraryItems.filter((it) =>
    it.title?.toLowerCase().includes(librarySearch.toLowerCase())
  );

  return (
    <div
      data-testid="tool-empty-launcher"
      className="flex-1 flex flex-col items-center justify-center p-8 bg-[#080808] text-[#FAFAFA] select-none"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={meta.uploadExts}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="w-full max-w-[640px] flex flex-col items-center text-center gap-6">
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-[#141417] border border-[#27272A] flex items-center justify-center shadow-lg">
            <MainIcon className="w-6 h-6 text-[#A1A1AA]" />
          </div>
          <h2 className="text-xl font-semibold text-[#F4F4F5] tracking-tight">
            Open {meta.label}
          </h2>
          <p className="text-xs text-[#71717A] max-w-sm">
            Choose a document from your academic library, upload a new file, or start with a blank {meta.label.toLowerCase()}.
          </p>
        </div>

        {errorMessage && (
          <div className="w-full p-3 rounded-xl bg-[#261012] border border-[#5E1B22] text-xs text-[#F87171] text-left">
            {errorMessage}
          </div>
        )}

        {/* 3-Option Launcher Cards */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {/* Option 1: Choose from Library */}
          <SOSCard
            enableSpotlight={true}
            interactive={true}
            className="h-[120px] rounded-xl bg-[#121214] border border-[#1E1E22] transition-all cursor-pointer"
            innerClassName="flex flex-col items-center justify-center p-4 text-center gap-2"
            onClick={handleOpenLibrary}
            data-testid="launcher-choose-library"
          >
            <FolderOpen className="w-5 h-5 text-[#60A5FA]" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#F4F4F5]">
                Choose from Library
              </span>
              <span className="text-[10.5px] text-[#71717A] mt-0.5">
                Browse existing assets
              </span>
            </div>
          </SOSCard>

          {/* Option 2: Upload New */}
          <SOSCard
            enableSpotlight={true}
            interactive={!isUploading}
            className={`h-[120px] rounded-xl bg-[#121214] border border-[#1E1E22] transition-all cursor-pointer ${
              isUploading ? 'opacity-50 pointer-events-none' : ''
            }`}
            innerClassName="flex flex-col items-center justify-center p-4 text-center gap-2"
            onClick={handleUploadClick}
            data-testid="launcher-upload-file"
          >
            {isUploading ? (
              <span className="w-5 h-5 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5 text-[#10B981]" />
            )}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#F4F4F5]">
                {isUploading ? 'Uploading...' : `Upload New`}
              </span>
              <span className="text-[10.5px] text-[#71717A] mt-0.5">
                {meta.uploadExts || 'Import local file'}
              </span>
            </div>
          </SOSCard>

          {/* Option 3: Create New Blank */}
          <SOSCard
            enableSpotlight={true}
            interactive={!isCreating}
            className={`h-[120px] rounded-xl bg-[#121214] border border-[#1E1E22] transition-all cursor-pointer ${
              isCreating ? 'opacity-50 pointer-events-none' : ''
            }`}
            innerClassName="flex flex-col items-center justify-center p-4 text-center gap-2"
            onClick={handleCreateBlank}
            data-testid="launcher-create-blank"
          >
            {isCreating ? (
              <span className="w-5 h-5 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
            ) : (
              <FilePlus2 className="w-5 h-5 text-[#A855F7]" />
            )}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#F4F4F5]">
                {isCreating ? 'Creating...' : `Create Blank`}
              </span>
              <span className="text-[10.5px] text-[#71717A] mt-0.5">
                Fresh {meta.label.toLowerCase()}
              </span>
            </div>
          </SOSCard>
        </div>
      </div>

      {/* Library Selection Modal */}
      {isLibraryModalOpen && (
        <div
          data-testid="library-picker-modal"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsLibraryModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-[#121214] border border-[#27272A] shadow-2xl flex flex-col overflow-hidden max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-[#1F1F23] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#60A5FA]" />
                <span className="text-sm font-semibold text-[#F4F4F5]">
                  Select {meta.label} from Library
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLibraryModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#F4F4F5] hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3 border-b border-[#1F1F23] bg-[#0E0E10]">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161619] border border-[#222226] text-xs">
                <Search className="w-3.5 h-3.5 text-[#71717A]" />
                <input
                  type="text"
                  placeholder="Filter library items..."
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-[#F4F4F5] placeholder-[#71717A] flex-1 text-xs"
                />
              </div>
            </div>

            {/* Modal Items List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-1.5 min-h-[220px]">
              {isLoadingLibrary ? (
                <div className="flex items-center justify-center py-12 text-xs text-[#71717A] gap-2">
                  <span className="w-4 h-4 border-2 border-[#60A5FA] border-t-transparent rounded-full animate-spin" />
                  <span>Loading library assets...</span>
                </div>
              ) : filteredLibraryItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-[#71717A] gap-1">
                  <span>No compatible {meta.label} files found in library.</span>
                  <span className="text-[11px] text-[#52525B]">Use "Upload New" or "Create Blank" to add one.</span>
                </div>
              ) : (
                filteredLibraryItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectLibraryItem(item)}
                    className="w-full text-left p-3 rounded-xl bg-[#161619] hover:bg-[#1E1E24] border border-[#222226] hover:border-[#323238] flex items-center justify-between transition-colors group cursor-pointer"
                    data-testid={`library-picker-item-${item.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-7 h-7 rounded-lg bg-[#1E1E24] border border-[#2A2A32] flex items-center justify-center shrink-0">
                        <MainIcon className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#F4F4F5]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-[#F4F4F5] truncate">
                          {item.title}
                        </span>
                        <span className="text-[10.5px] text-[#71717A] truncate">
                          {item.meta}
                        </span>
                      </div>
                    </div>
                    <Check className="w-4 h-4 text-[#71717A] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
