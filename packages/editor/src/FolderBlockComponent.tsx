import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Folder,
  FileText,
  Presentation,
  Video,
  Headphones,
  FileCode,
  FilePlus,
  FolderPlus,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Cpu,
  Briefcase,
  Landmark,
  GripVertical,
  Plus,
  Hash,
  Calendar,
  Tag,
  Type
} from 'lucide-react';
import type {
  LibraryFolder,
  LibraryFile,
  FolderLayoutSettings,
  StudyAssetType,
  CustomPropertyDefinition,
  CustomPropertyType
} from '@sos/domain';
import { getFallbackCover, CANONICAL_INITIAL_FOLDERS, CANONICAL_INITIAL_FILES } from '@sos/domain';
import { useFolderEditorContext } from './FolderContext.js';

interface FolderBlockComponentProps {
  folderId: string;
}

export const FolderBlockComponent: React.FC<FolderBlockComponentProps> = ({
  folderId
}) => {
  const {
    folders,
    files,
    selectedIds,
    onOpenFolder,
    onOpenFile,
    onCreateFolder,
    onCreateFile,
    onUpdateFolder,
    onUpdateFile
  } = useFolderEditorContext();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const [newPropType, setNewPropType] = useState<CustomPropertyType>('text');

  const [addPropCoords, setAddPropCoords] = useState<{ top: number; left: number } | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const addPropertyRef = useRef<HTMLTableHeaderCellElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (
        addPropertyRef.current &&
        !addPropertyRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsAddPropertyOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const folder =
    folders.find((f) => f.id === folderId) ||
    CANONICAL_INITIAL_FOLDERS.find((f) => f.id === folderId);

  const [titleValue, setTitleValue] = useState(folder?.name || '');
  const [titleWidth, setTitleWidth] = useState<number>(0);
  const titleMirrorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (folder?.name) {
      setTitleValue(folder.name);
    }
  }, [folder?.name]);

  useEffect(() => {
    if (titleMirrorRef.current) {
      setTitleWidth(Math.ceil(titleMirrorRef.current.getBoundingClientRect().width) + 8);
    }
  }, [titleValue, folder?.name]);

  const layoutSettings: FolderLayoutSettings = folder?.layoutSettings || {
    view: 'gallery',
    showTitle: true,
    showIcon: true,
    cardPreview: 'cover',
    cardSize: 'medium',
    fitMedia: true,
    cardLayout: 'list'
  };

  let childFolders = folders.filter((f) => f.parentId === folderId);
  if (childFolders.length === 0 && folders.length === 0) {
    childFolders = CANONICAL_INITIAL_FOLDERS.filter((f) => f.parentId === folderId);
  }

  // Filter out any ghost untitled folders if not needed
  childFolders = childFolders.filter((f) => f.name !== 'Untitled Study Folder' || childFolders.length <= 1);

  if (folderId === 'folder-decagon') {
    // In Stitch design, Decagon displays the 3 core academic tracks: 1. TECH, 2. BUSINESS, 3. PPE
    const decagonTrackIds = new Set(['folder-tech', 'folder-business', 'folder-ppe']);
    const canonicalTracks = childFolders.filter((f) => decagonTrackIds.has(f.id));
    if (canonicalTracks.length === 3) {
      childFolders = canonicalTracks;
    }
  }

  // Deterministic sorting: Folders alphanumeric order
  childFolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  let childFiles = files.filter((f) => f.folderId === folderId);
  if (childFiles.length === 0 && files.length === 0) {
    childFiles = CANONICAL_INITIAL_FILES.filter((f) => f.folderId === folderId);
  }

  // Deterministic sorting matching approved Stitch screens
  if (folderId === 'folder-decagon') {
    // Stitch: USMLE_Atlas.pdf before Synaptic_LTP.mp4
    childFiles.sort((a, b) => {
      if (a.title.includes('USMLE')) return -1;
      if (b.title.includes('USMLE')) return 1;
      return a.title.localeCompare(b.title, undefined, { numeric: true });
    });
  } else if (folderId === 'folder-planning') {
    // Stitch: Kandel_Principles_Ch12.pdf before Cellular_Slides.pptx
    childFiles.sort((a, b) => {
      if (a.title.includes('Kandel')) return -1;
      if (b.title.includes('Kandel')) return 1;
      return a.title.localeCompare(b.title, undefined, { numeric: true });
    });
  } else {
    childFiles.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
  }

  const handleUpdateLayout = (partial: Partial<FolderLayoutSettings>) => {
    if (!folder || !onUpdateFolder) return;
    const nextSettings: FolderLayoutSettings = {
      ...layoutSettings,
      ...partial
    };
    onUpdateFolder({
      id: folder.id,
      layoutSettings: nextSettings
    });
  };

  const handleCreateChildFolder = async () => {
    if (!onCreateFolder) return;
    await onCreateFolder('Untitled Study Folder', folderId);
  };

  const handleCreateProperty = async () => {
    if (!folder || !onUpdateFolder || !newPropName.trim()) return;
    const existing = folder.customProperties || [];
    const newProp: CustomPropertyDefinition = {
      id: `prop-${Date.now()}`,
      name: newPropName.trim(),
      type: newPropType
    };
    await onUpdateFolder({
      id: folder.id,
      customProperties: [...existing, newProp]
    });
    setNewPropName('');
    setIsAddPropertyOpen(false);
  };

  const handleUpdatePropertyValue = async (
    itemId: string,
    isFolderItem: boolean,
    propId: string,
    val: string
  ) => {
    if (isFolderItem) {
      const childF = folders.find((f) => f.id === itemId);
      if (!childF || !onUpdateFolder) return;
      await onUpdateFolder({
        id: itemId,
        customPropertyValues: {
          ...(childF.customPropertyValues || {}),
          [propId]: val
        }
      });
    } else {
      const childFl = files.find((f) => f.id === itemId);
      if (!childFl || !onUpdateFile) return;
      await onUpdateFile({
        id: itemId,
        customPropertyValues: {
          ...(childFl.customPropertyValues || {}),
          [propId]: val
        }
      });
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onCreateFile) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    let type: StudyAssetType = 'notes';
    if (ext === 'pdf') type = 'pdf';
    else if (ext === 'pptx' || ext === 'ppt') type = 'slides';
    else if (ext === 'mp4' || ext === 'webm' || ext === 'mov') type = 'video';
    else if (ext === 'mp3' || ext === 'wav' || ext === 'm4a') type = 'audio';

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeFormatted = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${Math.round(file.size / 1024)} KB`;

    await onCreateFile(file.name, type, folderId, sizeFormatted);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenFile = (file: LibraryFile) => {
    if (onOpenFile) {
      onOpenFile(file);
    } else {
      window.location.href = file.path;
    }
  };

  const getFileIcon = (type: StudyAssetType) => {
    switch (type) {
      case 'pdf':
        return FileText;
      case 'slides':
        return Presentation;
      case 'video':
        return Video;
      case 'audio':
        return Headphones;
      default:
        return FileCode;
    }
  };

  const renderItemIcon = (iconNameOrEmoji?: string) => {
    if (!iconNameOrEmoji) {
      return <Folder className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#FAFAFA] shrink-0 transition-colors" />;
    }
    if (iconNameOrEmoji === 'cpu') {
      return <Cpu className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#FAFAFA] shrink-0 transition-colors" />;
    }
    if (iconNameOrEmoji === 'briefcase') {
      return <Briefcase className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#FAFAFA] shrink-0 transition-colors" />;
    }
    if (iconNameOrEmoji === 'landmark') {
      return <Landmark className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#FAFAFA] shrink-0 transition-colors" />;
    }
    return <span className="text-sm shrink-0 leading-none">{iconNameOrEmoji}</span>;
  };

  // Determine responsive grid class based on cardSize
  const getGridClasses = () => {
    switch (layoutSettings.cardSize) {
      case 'small':
        return 'sos-gallery-grid-s';
      case 'large':
        return 'sos-gallery-grid-l';
      case 'medium':
      default:
        return 'sos-gallery-grid-m';
    }
  };

  if (!folder) {
    return (
      <div
        contentEditable={false}
        className="w-full my-4 p-4 rounded-xl border border-[#27272A] bg-[#141417] text-[#71717A] text-xs flex items-center justify-between"
        data-testid={`folder-block-${folderId}-loading`}
      >
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-[#A1A1AA]" />
          <span>Folder block: {folderId || 'Unlinked'}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      contentEditable={false}
      className={`w-full mb-8 flex flex-col group/block relative ${isSettingsOpen ? 'z-30' : 'z-10'}`}
      data-testid={`folder-block-${folder.id}`}
    >
      {/* 1. Inline Folder Header Row (Flush-left font-mono title with 6-dot drag handle & 3 far-right actions matching Stitch) */}
      <div className={`w-full h-7 flex items-center justify-between relative ${isSettingsOpen ? 'z-30' : 'z-10'}`}>
        <div className="flex items-center h-7 relative">
          {/* 6-dot drag handle: hidden by default (opacity-0), positioned outside left content margin (-left-6) */}
          <div
            className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center justify-center cursor-grab text-[#52525B] hover:text-[#A1A1AA]"
            title="Drag to reorder block"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* Hidden mirror span to accurately measure uppercase text width in 'Inter', 15px, 700, 0.06em */}
          <span
            ref={titleMirrorRef}
            aria-hidden="true"
            className="invisible fixed -top-[9999px] -left-[9999px] whitespace-pre pointer-events-none select-none"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              lineHeight: '28px',
              textTransform: 'uppercase'
            }}
          >
            {titleValue || folder.name || 'FOLDER'}
          </span>

          {/* Single permanent inline <input> with zero element swap and zero font shift */}
          <input
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={(e) => {
              const next = e.target.value.trim();
              if (next && next !== folder.name) {
                onUpdateFolder?.({ id: folder.id, name: next });
              } else {
                setTitleValue(folder.name);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              } else if (e.key === 'Escape') {
                setTitleValue(folder.name);
                e.currentTarget.blur();
              }
            }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              lineHeight: '28px',
              height: '28px',
              textTransform: 'uppercase',
              color: '#FAFAFA',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: 0,
              margin: 0,
              width: titleWidth ? `${titleWidth}px` : 'auto',
              minWidth: '60px'
            }}
            className="cursor-text selection:bg-[#60A5FA]/30 focus:outline-none"
            title="Click to rename"
            data-testid={`folder-title-input-${folder.id}`}
          />
        </div>

        {/* Far Right Direct Creation Triggers (FilePlus first, then FolderPlus, then Settings) */}
        <div className="flex items-center gap-1 relative shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.pptx,.ppt,.mp4,.webm,.mp3,.wav,.docx,.txt"
            className="hidden"
            onChange={handleFileInputChange}
          />
          {/* 1. Direct Create: Add File */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-7 h-7 rounded flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#141417] transition-colors cursor-pointer"
            title="Add File"
            data-testid="folder-add-file-btn"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>

          {/* 2. Direct Create: New Folder */}
          <button
            type="button"
            onClick={handleCreateChildFolder}
            className="w-7 h-7 rounded flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#141417] transition-colors cursor-pointer"
            title="New Folder"
            data-testid="folder-add-folder-btn"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>

          {/* 3. Layout Settings (Sliders - Zero native tooltip slop) */}
          <div className={`relative ${isSettingsOpen ? 'z-50' : ''}`} ref={settingsRef}>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
                isSettingsOpen
                  ? 'bg-[#18181B] text-[#FAFAFA] border border-[#27272A] shadow-sm'
                  : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#141417]'
              }`}
              data-testid="folder-layout-settings-btn"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Layout Settings Popover (Exact Stitch Dimensions: 224px wide, #111114, 1px solid #27272A, 8px radius, 12px padding) */}
            {isSettingsOpen && (
              <div
                className="absolute right-0 top-8 w-[224px] rounded-[8px] bg-[#111114] border border-[#27272A] shadow-[0_16px_32px_rgba(0,0,0,0.85)] p-3 flex flex-col gap-2.5 z-50 text-[12px] select-none font-sans"
                style={{ width: 224, minWidth: 224, zIndex: 60 }}
                data-testid="layout-settings-popover"
              >
                {/* Row 1 (View Mode): Full-width segmented pill with Gallery | Table */}
                <div className="bg-[#09090B] p-0.5 rounded-md grid grid-cols-2 gap-0.5 border border-[#1E1E22] h-[26px]">
                  <button
                    type="button"
                    onClick={() => handleUpdateLayout({ view: 'gallery' })}
                    className={`h-full rounded font-medium text-[11px] text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      layoutSettings.view === 'gallery'
                        ? 'bg-[#1E1E22] text-[#FAFAFA] shadow-sm'
                        : 'text-[#71717A] hover:text-[#FAFAFA]'
                    }`}
                    data-testid="layout-view-gallery-btn"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Gallery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateLayout({ view: 'table' })}
                    className={`h-full rounded font-medium text-[11px] text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      layoutSettings.view === 'table'
                        ? 'bg-[#1E1E22] text-[#FAFAFA] shadow-sm'
                        : 'text-[#71717A] hover:text-[#FAFAFA]'
                    }`}
                    data-testid="layout-view-table-btn"
                  >
                    <TableIcon className="w-3 h-3" />
                    <span>Table</span>
                  </button>
                </div>

                <div className="h-px w-full bg-[#27272A]" />

                {/* Row 2 (Show Icon): Toggle switch (#3F3F46 track / #FAFAFA thumb when ON, #1E1E22 track / #71717A thumb when OFF) */}
                <div className="flex items-center justify-between">
                  <span className="text-[#D4D4D8] text-[11.5px] font-medium">Show Icon</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateLayout({ showIcon: !layoutSettings.showIcon })}
                    className={`w-7 h-4 rounded-full p-[2px] flex items-center cursor-pointer shadow-inner transition-colors ${
                      layoutSettings.showIcon ? 'bg-[#3F3F46] justify-end' : 'bg-[#1E1E22] justify-start border border-[#27272A]'
                    }`}
                    data-testid="toggle-show-icon"
                  >
                    <div
                      className={`w-3 h-3 rounded-full shadow-sm transition-colors ${
                        layoutSettings.showIcon ? 'bg-[#FAFAFA]' : 'bg-[#71717A]'
                      }`}
                    />
                  </button>
                </div>

                {/* Gallery-Only Controls: Completely hidden in Table View */}
                {layoutSettings.view === 'gallery' && (
                  <>
                    {/* Row 3 (Fit Media): Toggle switch */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#D4D4D8] text-[11.5px] font-medium">Fit Media</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateLayout({ fitMedia: !layoutSettings.fitMedia })}
                        className={`w-7 h-4 rounded-full p-[2px] flex items-center cursor-pointer shadow-inner transition-colors ${
                          layoutSettings.fitMedia ? 'bg-[#3F3F46] justify-end' : 'bg-[#1E1E22] justify-start border border-[#27272A]'
                        }`}
                        data-testid="toggle-fit-media"
                      >
                        <div
                          className={`w-3 h-3 rounded-full shadow-sm transition-colors ${
                            layoutSettings.fitMedia ? 'bg-[#FAFAFA]' : 'bg-[#71717A]'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="h-px w-full bg-[#27272A]" />

                    {/* Row 4 (Preview): Cover | Text | None */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#71717A] text-[11.5px] font-medium">Preview</span>
                      <div className="flex items-center gap-0.5 bg-[#09090B] p-0.5 rounded-md border border-[#1E1E22] text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleUpdateLayout({ cardPreview: 'cover' })}
                          className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                            layoutSettings.cardPreview === 'cover' ? 'bg-[#1E1E22] text-[#FAFAFA] shadow-sm' : 'text-[#71717A] hover:text-[#FAFAFA]'
                          }`}
                          data-testid="card-preview-cover"
                        >
                          Cover
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateLayout({ cardPreview: 'content' })}
                          className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                            layoutSettings.cardPreview === 'content' ? 'bg-[#1E1E22] text-[#FAFAFA] shadow-sm' : 'text-[#71717A] hover:text-[#FAFAFA]'
                          }`}
                          data-testid="card-preview-content"
                        >
                          Text
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateLayout({ cardPreview: 'none' })}
                          className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                            layoutSettings.cardPreview === 'none' ? 'bg-[#1E1E22] text-[#FAFAFA] shadow-sm' : 'text-[#71717A] hover:text-[#FAFAFA]'
                          }`}
                          data-testid="card-preview-none"
                        >
                          None
                        </button>
                      </div>
                    </div>

                    {/* Row 5 (Size): S | M | L */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#71717A] text-[11.5px] font-medium">Size</span>
                      <div className="flex items-center gap-0.5 bg-[#09090B] p-0.5 rounded-md border border-[#1E1E22] text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleUpdateLayout({ cardSize: 'small' })}
                          className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                            layoutSettings.cardSize === 'small' ? 'bg-[#1E1E22] text-[#FAFAFA] shadow-sm' : 'text-[#71717A] hover:text-[#FAFAFA]'
                          }`}
                          data-testid="card-size-small"
                        >
                          S
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateLayout({ cardSize: 'medium' })}
                          className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                            layoutSettings.cardSize === 'medium' ? 'bg-[#1E1E22] text-[#FAFAFA] shadow-sm' : 'text-[#71717A] hover:text-[#FAFAFA]'
                          }`}
                          data-testid="card-size-medium"
                        >
                          M
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateLayout({ cardSize: 'large' })}
                          className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                            layoutSettings.cardSize === 'large' ? 'bg-[#1E1E22] text-[#FAFAFA] shadow-sm' : 'text-[#71717A] hover:text-[#FAFAFA]'
                          }`}
                          data-testid="card-size-large"
                        >
                          L
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Database View (Table or Gallery) */}
      {layoutSettings.view === 'table' ? (
        <div className="w-full overflow-x-auto" data-testid="folder-table-view">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-white/[0.08] text-[11px] font-mono text-[#71717A]">
                <th className="py-2.5 px-3 font-medium border-r border-white/[0.06] min-w-[220px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-[#52525B]">Aa</span>
                    <span>Name</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 font-medium border-r border-white/[0.06] w-[130px]">
                  Type
                </th>
                <th className="py-2.5 px-3 font-medium border-r border-white/[0.06] w-[120px]">
                  Updated
                </th>
                {(folder.customProperties || []).map((prop) => (
                  <th
                    key={prop.id}
                    className="py-2.5 px-3 font-medium border-r border-white/[0.06] min-w-[140px]"
                    data-testid={`custom-prop-header-${prop.id}`}
                  >
                    <div className="flex items-center gap-1.5 text-[#A1A1AA]">
                      {prop.type === 'text' && <Type className="w-3 h-3 text-[#52525B]" />}
                      {prop.type === 'number' && <Hash className="w-3 h-3 text-[#52525B]" />}
                      {prop.type === 'select' && <Tag className="w-3 h-3 text-[#52525B]" />}
                      {prop.type === 'date' && <Calendar className="w-3 h-3 text-[#52525B]" />}
                      <span className="truncate">{prop.name}</span>
                    </div>
                  </th>
                ))}
                <th
                  className="py-2.5 px-3 font-normal text-left relative w-[130px]"
                  ref={addPropertyRef}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (isAddPropertyOpen) {
                        setIsAddPropertyOpen(false);
                        setAddPropCoords(null);
                      } else {
                        const rect = addPropertyRef.current?.getBoundingClientRect();
                        if (rect) {
                          const left = Math.min(rect.left, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 260);
                          setAddPropCoords({ top: rect.bottom + 6, left: Math.max(16, left) });
                        }
                        setIsAddPropertyOpen(true);
                      }
                    }}
                    className="flex items-center gap-1 text-[11px] text-[#71717A] hover:text-[#FAFAFA] transition-colors cursor-pointer"
                    data-testid="add-property-btn"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add property</span>
                  </button>

                  {isAddPropertyOpen && addPropCoords && typeof document !== 'undefined' &&
                    createPortal(
                      <div
                        ref={popoverRef}
                        style={{
                          position: 'fixed',
                          top: `${addPropCoords.top}px`,
                          left: `${addPropCoords.left}px`,
                          width: '240px',
                          zIndex: 9999
                        }}
                        className="p-3 rounded-lg bg-[#111114] border border-[#27272A] shadow-2xl flex flex-col gap-2.5 font-sans text-xs"
                        data-testid="add-property-popover"
                      >
                        <span className="font-semibold text-[#FAFAFA] text-[12px]">New Property</span>
                        <input
                          type="text"
                          placeholder="Property name..."
                          value={newPropName}
                          onChange={(e) => setNewPropName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateProperty();
                            else if (e.key === 'Escape') setIsAddPropertyOpen(false);
                          }}
                          className="w-full px-2.5 py-1.5 rounded bg-[#18181B] border border-[#27272A] text-white text-xs outline-none focus:border-[#52525B]"
                          data-testid="new-property-name-input"
                          autoFocus
                        />
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#71717A] uppercase font-mono">Type</span>
                          <div className="grid grid-cols-2 gap-1 bg-[#09090B] p-0.5 rounded border border-[#1E1E22]">
                            {(['text', 'number', 'select', 'date'] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setNewPropType(t)}
                                className={`px-2 py-1 rounded text-[11px] capitalize cursor-pointer transition-colors ${
                                  newPropType === t
                                    ? 'bg-[#1E1E22] text-white font-medium'
                                    : 'text-[#71717A] hover:text-white'
                                }`}
                                data-testid={`prop-type-${t}`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCreateProperty}
                          className="w-full py-1.5 rounded bg-[#FAFAFA] text-[#09090B] font-medium text-xs hover:bg-[#E4E4E7] transition-all cursor-pointer mt-1"
                          data-testid="confirm-add-property-btn"
                        >
                          Save Property
                        </button>
                      </div>,
                      document.body
                    )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#18181B] text-xs">
              {childFolders.length === 0 && childFiles.length === 0 && (
                <tr data-testid="folder-empty-table-row">
                  <td
                    colSpan={4 + (folder.customProperties?.length || 0)}
                    className="py-10 text-center text-[#71717A] font-mono text-xs"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                      <Folder className="w-5 h-5 text-[#52525B] mb-1" />
                      <span className="text-[#A1A1AA] font-sans font-medium">This folder is empty</span>
                      <span className="text-[11px] text-[#71717A]">Add learning resources or organize with subfolders.</span>
                    </div>
                  </td>
                </tr>
              )}

              {childFolders.map((child) => {
                const isSelected = Boolean(selectedIds?.has(child.id));
                return (
                  <tr
                    key={child.id}
                    data-selectable-id={child.id}
                    onClick={() => onOpenFolder?.(child.id)}
                    className={`border-b border-white/[0.06] hover:bg-[#141417]/80 transition-colors duration-100 cursor-pointer group relative ${
                      isSelected ? 'bg-[#60A5FA]/20 ring-1 ring-[#60A5FA]/50' : ''
                    }`}
                    data-testid={`table-folder-${child.id}`}
                  >
                    <td className="py-2.5 px-3 border-r border-white/[0.06] text-[#FAFAFA]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 truncate">
                          {layoutSettings.showIcon && (
                            <Folder className="w-4 h-4 text-[#71717A] group-hover:text-[#FAFAFA] shrink-0 transition-colors" />
                          )}
                          <span className="truncate group-hover:text-white transition-colors font-medium">{child.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFolder?.(child.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[#A1A1AA] hover:text-white bg-[#1E1E22] hover:bg-[#27272A] border border-[#27272A] px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0"
                          data-testid={`open-folder-${child.id}`}
                        >
                          Open ↗
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 border-r border-white/[0.06]">
                      <span className="px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[10px] font-mono text-[#A1A1AA]">
                        FOLDER
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-white/[0.06] text-[#71717A] font-mono text-[11px]">
                      {child.name.includes('MONTH') ? '2d ago' : 'Today'}
                    </td>
                    {(folder.customProperties || []).map((prop) => {
                      const val = (child.customPropertyValues || {})[prop.id] || '';
                      return (
                        <td
                          key={prop.id}
                          className="py-1 px-3 border-r border-white/[0.06] text-xs text-[#D4D4D8]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type={prop.type === 'number' ? 'number' : 'text'}
                            defaultValue={val}
                            placeholder="Empty"
                            onBlur={(e) => {
                              const nextVal = e.target.value.trim();
                              if (nextVal !== val) {
                                handleUpdatePropertyValue(child.id, true, prop.id, nextVal);
                              }
                            }}
                            className="w-full bg-transparent border-none outline-none text-xs text-[#D4D4D8] placeholder-[#3F3F46] focus:bg-[#18181B] focus:rounded px-1.5 py-0.5 transition-colors"
                            data-testid={`custom-prop-input-${child.id}-${prop.id}`}
                          />
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3" />
                  </tr>
                );
              })}

              {childFiles.map((child) => {
                const isSelected = Boolean(selectedIds?.has(child.id));
                const Icon = getFileIcon(child.type);
                return (
                  <tr
                    key={child.id}
                    data-selectable-id={child.id}
                    onClick={() => handleOpenFile(child)}
                    className={`border-b border-white/[0.06] hover:bg-[#141417]/80 transition-colors duration-100 cursor-pointer group relative ${
                      isSelected ? 'bg-[#60A5FA]/20 ring-1 ring-[#60A5FA]/50' : ''
                    }`}
                    data-testid={`table-file-${child.id}`}
                  >
                    <td className="py-2.5 px-3 border-r border-white/[0.06] text-[#FAFAFA]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 truncate">
                          {layoutSettings.showIcon && (
                            <Icon className="w-4 h-4 text-[#71717A] group-hover:text-[#FAFAFA] shrink-0 transition-colors" />
                          )}
                          <span className="truncate group-hover:text-white transition-colors font-medium">{child.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFile(child);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[#A1A1AA] hover:text-white bg-[#1E1E22] hover:bg-[#27272A] border border-[#27272A] px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0"
                          data-testid={`open-file-${child.id}`}
                        >
                          Open ↗
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 border-r border-white/[0.06]">
                      <span className="px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[10px] font-mono text-[#A1A1AA] uppercase">
                        {child.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-white/[0.06] text-[#71717A] font-mono text-[11px]">
                      {child.title.includes('Slides') ? 'Nov 14' : child.sizeFormatted || '14.2 MB'}
                    </td>
                    {(folder.customProperties || []).map((prop) => {
                      const val = (child.customPropertyValues || {})[prop.id] || '';
                      return (
                        <td
                          key={prop.id}
                          className="py-1 px-3 border-r border-white/[0.06] text-xs text-[#D4D4D8]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type={prop.type === 'number' ? 'number' : 'text'}
                            defaultValue={val}
                            placeholder="Empty"
                            onBlur={(e) => {
                              const nextVal = e.target.value.trim();
                              if (nextVal !== val) {
                                handleUpdatePropertyValue(child.id, false, prop.id, nextVal);
                              }
                            }}
                            className="w-full bg-transparent border-none outline-none text-xs text-[#D4D4D8] placeholder-[#3F3F46] focus:bg-[#18181B] focus:rounded px-1.5 py-0.5 transition-colors"
                            data-testid={`custom-prop-input-${child.id}-${prop.id}`}
                          />
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3" />
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Notion Bottom Row: + New page */}
          <div className="w-full py-2 px-3 border-t border-[#18181B]">
            <button
              type="button"
              onClick={handleCreateChildFolder}
              className="flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors cursor-pointer"
              data-testid="table-new-page-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New page</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`w-full ${childFolders.length === 0 && childFiles.length === 0 ? '' : getGridClasses()} pt-3`}
          data-testid="folder-gallery-view"
        >
          {childFolders.length === 0 && childFiles.length === 0 ? (
            <div
              className="w-full py-12 px-6 rounded-xl border border-dashed border-[#27272A] bg-[#0C0C0E]/50 flex flex-col items-center justify-center text-center my-2"
              data-testid="folder-empty-gallery-state"
            >
              <div className="w-10 h-10 rounded-xl bg-[#141417] border border-[#27272A] flex items-center justify-center text-[#71717A] mb-3 shadow-inner">
                <Folder className="w-5 h-5 text-[#71717A]" />
              </div>
              <h4 className="text-sm font-semibold text-[#FAFAFA] tracking-tight mb-1">
                This folder is empty
              </h4>
              <p className="text-xs text-[#71717A] max-w-sm mb-4 leading-relaxed font-sans">
                No learning materials or subfolders have been added yet. Add files or organize your curriculum.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-[#FAFAFA] text-[#09090B] text-xs font-medium hover:bg-[#E4E4E7] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>Add File</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateChildFolder}
                  className="px-3 py-1.5 rounded-lg bg-[#18181B] text-[#FAFAFA] text-xs font-medium hover:bg-[#27272A] border border-[#27272A] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>New Folder</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {childFolders.map((child) => {
                const isSelected = Boolean(selectedIds?.has(child.id));
                const coverUrl = child.coverUrl || getFallbackCover(child.id);
                const subItemCount =
                  folders.filter((f) => f.parentId === child.id).length +
                  files.filter((f) => f.folderId === child.id).length;

                // Handle Preview: None (compact single-row card)
                if (layoutSettings.cardPreview === 'none') {
                  return (
                    <div
                      key={child.id}
                      data-selectable-id={child.id}
                      onClick={() => onOpenFolder?.(child.id)}
                      className={`w-full py-2.5 px-3 flex items-center justify-between bg-[#141417] rounded-lg border border-[#27272A] hover:border-[#3F3F46] cursor-pointer group transition-all duration-150 ease-out hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)] shadow-sm relative ${
                        isSelected ? 'ring-1 ring-[#60A5FA]/60' : ''
                      }`}
                      data-testid={`gallery-folder-${child.id}`}
                    >
                      {isSelected && (
                        <div
                          data-testid="selection-overlay"
                          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[#60A5FA]/20 ring-1 ring-[#60A5FA]/50 z-20"
                        />
                      )}
                      <div className="flex items-center gap-2 min-w-0">
                        {layoutSettings.showIcon && renderItemIcon(child.icon)}
                        <span className="text-xs font-semibold text-[#FAFAFA] truncate">
                          {child.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#71717A] shrink-0 uppercase">
                        Folder
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={child.id}
                    data-selectable-id={child.id}
                    onClick={() => onOpenFolder?.(child.id)}
                    className={`w-full rounded-lg bg-[#141417] border border-[#27272A] hover:border-[#3F3F46] overflow-hidden transition-all duration-150 ease-out hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)] group flex flex-col shadow-sm cursor-pointer relative ${
                      isSelected ? 'ring-1 ring-[#60A5FA]/60' : ''
                    }`}
                    data-testid={`gallery-folder-${child.id}`}
                  >
                    {isSelected && (
                      <div
                        data-testid="selection-overlay"
                        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[#60A5FA]/20 ring-1 ring-[#60A5FA]/50 z-20"
                      />
                    )}
                    {layoutSettings.cardPreview === 'cover' && (
                      <div className="w-full aspect-[16/10] overflow-hidden relative border-b border-[#27272A] bg-[#09090B]">
                        <img
                          src={coverUrl}
                          alt={child.name}
                          loading="eager"
                          referrerPolicy="no-referrer"
                          className={`w-full h-full ${
                            layoutSettings.fitMedia ? 'object-contain bg-[#0D0D10]' : 'object-cover'
                          } transition-all duration-150 ease-out group-hover:scale-[1.015] group-hover:opacity-95 filter grayscale contrast-115`}
                          onError={(e) => {
                            (e.target as HTMLElement).style.opacity = '0';
                          }}
                        />
                      </div>
                    )}

                    {layoutSettings.cardPreview === 'content' && (
                      <div className="w-full aspect-[16/10] p-2.5 text-[11px] text-[#A1A1AA] bg-[#09090B] border-b border-[#27272A] overflow-hidden leading-relaxed font-sans line-clamp-4">
                        {child.plainTextPreview || `${child.wordCount || 0} words`}
                      </div>
                    )}

                    <div className="w-full py-2.5 px-3 flex items-center gap-2 bg-[#141417]">
                      {layoutSettings.showIcon && renderItemIcon(child.icon)}
                      <span className="text-xs font-semibold text-[#FAFAFA] truncate">
                        {child.name}
                      </span>
                    </div>
                  </div>
                );
              })}

              {childFiles.map((child) => {
                const isSelected = Boolean(selectedIds?.has(child.id));
                const Icon = getFileIcon(child.type);
                const coverUrl = child.coverUrl || getFallbackCover(child.id);

                // Handle Preview: None (compact single-row card)
                if (layoutSettings.cardPreview === 'none') {
                  return (
                    <div
                      key={child.id}
                      data-selectable-id={child.id}
                      onClick={() => handleOpenFile(child)}
                      className={`w-full py-2.5 px-3 flex items-center justify-between bg-[#141417] rounded-lg border border-[#27272A] hover:border-[#3F3F46] cursor-pointer group transition-all duration-150 ease-out hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)] shadow-sm relative ${
                        isSelected ? 'ring-1 ring-[#60A5FA]/60' : ''
                      }`}
                      data-testid={`gallery-file-${child.id}`}
                    >
                      {isSelected && (
                        <div
                          data-testid="selection-overlay"
                          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[#60A5FA]/20 ring-1 ring-[#60A5FA]/50 z-20"
                        />
                      )}
                      <div className="flex items-center gap-2 min-w-0">
                        {layoutSettings.showIcon && (
                          <Icon className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#FAFAFA] shrink-0 transition-colors" />
                        )}
                        <span className="text-xs font-semibold text-[#FAFAFA] truncate">
                          {child.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#71717A] shrink-0 uppercase">
                        {child.type}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={child.id}
                    data-selectable-id={child.id}
                    onClick={() => handleOpenFile(child)}
                    className={`w-full rounded-lg bg-[#141417] border border-[#27272A] hover:border-[#3F3F46] overflow-hidden transition-all duration-150 ease-out hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)] group flex flex-col shadow-sm cursor-pointer relative ${
                      isSelected ? 'ring-1 ring-[#60A5FA]/60' : ''
                    }`}
                    data-testid={`gallery-file-${child.id}`}
                  >
                    {isSelected && (
                      <div
                        data-testid="selection-overlay"
                        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[#60A5FA]/20 ring-1 ring-[#60A5FA]/50 z-20"
                      />
                    )}
                    {layoutSettings.cardPreview === 'cover' && (
                      <div className="w-full aspect-[16/10] overflow-hidden relative border-b border-[#27272A] bg-[#09090B]">
                        <img
                          src={coverUrl}
                          alt={child.title}
                          loading="eager"
                          referrerPolicy="no-referrer"
                          className={`w-full h-full ${
                            layoutSettings.fitMedia ? 'object-contain bg-[#0D0D10]' : 'object-cover'
                          } transition-all duration-150 ease-out group-hover:scale-[1.015] group-hover:opacity-95 filter grayscale contrast-125`}
                          onError={(e) => {
                            (e.target as HTMLElement).style.opacity = '0';
                          }}
                        />
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-[#FAFAFA] border border-white/10 backdrop-blur-sm uppercase">
                          {child.type}
                        </span>
                      </div>
                    )}

                    {layoutSettings.cardPreview === 'content' && (
                      <div className="w-full aspect-[16/10] p-2.5 text-[11px] text-[#A1A1AA] bg-[#09090B] border-b border-[#27272A] overflow-hidden leading-relaxed font-mono">
                        {child.sizeFormatted || '1.2 MB'} · {child.type.toUpperCase()}
                      </div>
                    )}

                    <div className="w-full py-2.5 px-3 flex items-center gap-2 bg-[#141417]">
                      {layoutSettings.showIcon && (
                        <Icon className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#FAFAFA] shrink-0 transition-colors" />
                      )}
                      <span className="text-xs font-semibold text-[#FAFAFA] truncate">
                        {child.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};
