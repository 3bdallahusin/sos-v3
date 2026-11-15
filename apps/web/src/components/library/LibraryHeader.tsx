import React, { useState, useRef, useEffect } from 'react';
import {
  BookMarked,
  ChevronDown,
  Search,
  LayoutGrid,
  List,
  Table as TableIcon,
  SlidersHorizontal,
  Plus,
  FolderPlus,
  Archive,
  Check
} from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store.js';
import type { LibraryViewMode, LibraryCardSize } from '@sos/domain';

export const LibraryHeader: React.FC = () => {
  const {
    folders,
    currentFolderId,
    setCurrentFolderId,
    viewMode,
    setViewMode,
    cardSize,
    setCardSize,
    searchQuery,
    setSearchQuery,
    openFolderModal,
    openPageEditor,
    openBackupModal
  } = useLibraryStore();

  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  const folderDropdownRef = useRef<HTMLDivElement>(null);
  const viewDropdownRef = useRef<HTMLDivElement>(null);

  const currentFolder = folders.find((f) => f.id === currentFolderId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        folderDropdownRef.current &&
        !folderDropdownRef.current.contains(e.target as Node)
      ) {
        setIsFolderDropdownOpen(false);
      }
      if (
        viewDropdownRef.current &&
        !viewDropdownRef.current.contains(e.target as Node)
      ) {
        setIsViewDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[48px] px-6 border-b border-[#1F1F23] flex items-center justify-between gap-4 bg-[#09090B] shrink-0 select-none z-20">
      {/* Left: Breadcrumbs & Folder Selector */}
      <div className="flex items-center gap-2 min-w-0" ref={folderDropdownRef}>
        <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] font-mono">
          <BookMarked className="w-3.5 h-3.5 text-[#E4E4E7]" />
          <button
            onClick={() => setCurrentFolderId(null)}
            className="hover:text-white transition-colors"
          >
            Library
          </button>
          <span>/</span>
        </div>

        {/* Current Folder Selector */}
        <div className="relative">
          <button
            onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
            className="flex items-center gap-1.5 text-xs font-medium text-white hover:bg-[#18181B] px-2 py-1 rounded-[6px] border border-[#27272A] transition-colors max-w-[240px] truncate"
            title="Switch workspace folder"
            data-testid="library-folder-selector"
          >
            <span className="text-sm">{currentFolder ? currentFolder.icon || '📁' : '🗂️'}</span>
            <span className="truncate">
              {currentFolder ? currentFolder.name : 'All Resources'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#71717A] shrink-0" />
          </button>

          {isFolderDropdownOpen && (
            <div className="absolute left-0 mt-1 w-64 rounded-[10px] bg-[#0E0E11] border border-[#27272A] shadow-xl py-1 z-50">
              <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#71717A] border-b border-[#1F1F23]">
                Switch Folder
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                <button
                  onClick={() => {
                    setCurrentFolderId(null);
                    setIsFolderDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left transition-colors ${
                    currentFolderId === null
                      ? 'bg-[#27272A] text-white font-medium'
                      : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span>🗂️</span>
                    <span className="truncate">All Resources (Root)</span>
                  </span>
                  {currentFolderId === null && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setCurrentFolderId(folder.id);
                      setIsFolderDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left transition-colors ${
                      currentFolderId === folder.id
                        ? 'bg-[#27272A] text-white font-medium'
                        : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span>{folder.icon || '📁'}</span>
                      <span className="truncate">{folder.name}</span>
                    </span>
                    {currentFolderId === folder.id && (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-[#1F1F23] pt-1 px-1">
                <button
                  onClick={() => {
                    setIsFolderDropdownOpen(false);
                    openFolderModal();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#E4E4E7] hover:bg-[#18181B] rounded-[6px] transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>+ New Folder</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Quick Search */}
      <div className="flex-1 max-w-[280px]">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#71717A] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources..."
            className="w-full h-[28px] pl-8 pr-2.5 bg-[#141417] border border-[#27272A] focus:border-[#52525B] text-xs text-white placeholder-[#71717A] rounded-[8px] outline-none transition-colors"
            data-testid="library-search-input"
          />
        </div>
      </div>

      {/* Right: Layout Switcher & Action Controls */}
      <div className="flex items-center gap-2">
        {/* View Layout Options Dropdown */}
        <div className="relative" ref={viewDropdownRef}>
          <button
            onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
            className="h-[28px] px-2.5 flex items-center gap-1.5 text-xs font-medium text-[#A1A1AA] hover:text-white hover:bg-[#18181B] border border-[#27272A] rounded-[8px] transition-colors"
            title="View options"
            data-testid="library-view-options-button"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="capitalize hidden sm:inline">{viewMode}</span>
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
          </button>

          {isViewDropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 rounded-[10px] bg-[#0E0E11] border border-[#27272A] shadow-xl p-1.5 z-50">
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                Layout
              </div>
              <div className="grid grid-cols-3 gap-1 mb-2">
                <button
                  onClick={() => {
                    setViewMode('gallery');
                    setIsViewDropdownOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-[6px] text-xs transition-colors ${
                    viewMode === 'gallery'
                      ? 'bg-[#27272A] text-white font-medium'
                      : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-white'
                  }`}
                  data-testid="view-mode-gallery"
                >
                  <LayoutGrid className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px]">Gallery</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode('list');
                    setIsViewDropdownOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-[6px] text-xs transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#27272A] text-white font-medium'
                      : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-white'
                  }`}
                  data-testid="view-mode-list"
                >
                  <List className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px]">List</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode('table');
                    setIsViewDropdownOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-[6px] text-xs transition-colors ${
                    viewMode === 'table'
                      ? 'bg-[#27272A] text-white font-medium'
                      : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-white'
                  }`}
                  data-testid="view-mode-table"
                >
                  <TableIcon className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px]">Table</span>
                </button>
              </div>

              {viewMode === 'gallery' && (
                <>
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#71717A] border-t border-[#1F1F23]">
                    Card Size
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {(['compact', 'normal', 'spacious'] as LibraryCardSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => setCardSize(size)}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded-[6px] text-xs capitalize transition-colors ${
                          cardSize === size
                            ? 'bg-[#27272A] text-white font-medium'
                            : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-white'
                        }`}
                      >
                        <span>{size}</span>
                        {cardSize === size && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Backup & Restore */}
        <button
          onClick={openBackupModal}
          className="h-[28px] px-2.5 flex items-center gap-1.5 text-xs font-medium text-[#A1A1AA] hover:text-white hover:bg-[#18181B] border border-[#27272A] rounded-[8px] transition-colors"
          title="Backup & Portability (.sos)"
          data-testid="library-backup-button"
        >
          <Archive className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Backup</span>
        </button>

        {/* + New Page */}
        <button
          onClick={() => openPageEditor()}
          className="h-[28px] px-2.5 flex items-center gap-1.5 text-xs font-medium bg-[#141417] hover:bg-[#1F1F23] text-white border border-[#27272A] rounded-[8px] transition-colors"
          data-testid="library-new-page-button"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Page</span>
        </button>

        {/* + New Folder */}
        <button
          onClick={() => openFolderModal()}
          className="h-[28px] px-2.5 flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-[#E4E4E7] text-black rounded-[8px] transition-colors"
          data-testid="library-new-folder-button"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Folder</span>
        </button>
      </div>
    </header>
  );
};
