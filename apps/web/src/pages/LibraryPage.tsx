import React, { useEffect, useMemo } from 'react';
import { GripVertical, Plus, FolderOpen } from 'lucide-react';
import { useLibraryStore } from '../stores/library-store.js';
import { LibraryHeader } from '../components/library/LibraryHeader.js';
import { FolderBanner } from '../components/library/FolderBanner.js';
import { GalleryView } from '../components/library/GalleryView.js';
import { ListView } from '../components/library/ListView.js';
import { TableView } from '../components/library/TableView.js';
import { FolderModal } from '../components/library/FolderModal.js';
import { PageEditorModal } from '../components/library/PageEditorModal.js';
import { BackupModal } from '../components/library/BackupModal.js';
import { DeleteConfirmModal } from '../components/library/DeleteConfirmModal.js';

export const LibraryPage: React.FC = () => {
  const {
    items,
    currentFolderId,
    viewMode,
    searchQuery,
    isLoading,
    loadLibraryData,
    openPageEditor
  } = useLibraryStore();

  useEffect(() => {
    loadLibraryData();
  }, [loadLibraryData]);

  const filteredItems = useMemo(() => {
    let list = items;
    // Filter by current folder if one is selected
    if (currentFolderId !== null) {
      list = list.filter((i) => i.folderId === currentFolderId);
    }
    // Filter by search query if present
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.subtitle && i.subtitle.toLowerCase().includes(q)) ||
          i.type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, currentFolderId, searchQuery]);

  return (
    <div
      className="w-full h-full flex flex-col bg-[#09090B] text-white overflow-hidden select-none"
      data-testid="library-page"
    >
      {/* Top Fixed Library Header */}
      <LibraryHeader />

      {/* Main Scrollable Library Workspace */}
      <div className="flex-1 overflow-y-auto min-h-0 relative">
        {/* Notion-style Cover Banner & Header */}
        <FolderBanner />

        {/* Resources Collection Area matching Stitch layout */}
        <div className="w-full max-w-[760px] mx-auto px-6 pb-16 flex flex-col gap-4 relative z-10">
          <section className="p-4 rounded-[16px] bg-[#0E0E11] border border-[#1F1F23] flex flex-col gap-3 shadow-sm">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-1 border-b border-[#1F1F23]/60">
              <div className="flex items-center gap-2">
                <GripVertical className="w-3.5 h-3.5 text-[#52525B] cursor-grab" />
                <span className="text-xs font-semibold font-mono tracking-wider text-white uppercase">
                  [ PRIMARY RESOURCES ]
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#18181B] border border-[#27272A] text-[10px] font-mono text-[#A1A1AA]">
                  {filteredItems.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openPageEditor()}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#A1A1AA] hover:text-white px-2 py-0.5 rounded-[6px] hover:bg-[#18181B] transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Resource</span>
                </button>
              </div>
            </div>

            {/* View Presentation */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-xs text-[#71717A] font-mono">
                Loading library resources...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 px-4 rounded-[12px] border border-dashed border-[#27272A] flex flex-col items-center justify-center text-center">
                <FolderOpen className="w-8 h-8 text-[#52525B] mb-2" />
                <h4 className="text-xs font-semibold text-white mb-1">
                  No resources found
                </h4>
                <p className="text-[11px] text-[#71717A] max-w-xs mb-3">
                  {searchQuery
                    ? `No learning assets match "${searchQuery}".`
                    : 'This folder is currently empty. Add your first note, PDF, or deck.'}
                </p>
                <button
                  onClick={() => openPageEditor()}
                  className="h-[28px] px-3 flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-[#E4E4E7] text-black rounded-[6px] transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Page</span>
                </button>
              </div>
            ) : viewMode === 'gallery' ? (
              <GalleryView items={filteredItems} />
            ) : viewMode === 'list' ? (
              <ListView items={filteredItems} />
            ) : (
              <TableView items={filteredItems} />
            )}
          </section>
        </div>
      </div>

      {/* Global Modals */}
      <FolderModal />
      <PageEditorModal />
      <BackupModal />
      <DeleteConfirmModal />
    </div>
  );
};
