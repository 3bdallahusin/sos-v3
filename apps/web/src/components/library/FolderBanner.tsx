import React from 'react';
import { Edit2, Trash2, Folder, Sparkles } from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store.js';

export const FolderBanner: React.FC = () => {
  const {
    folders,
    currentFolderId,
    openFolderModal,
    openDeleteConfirm
  } = useLibraryStore();

  const folder = folders.find((f) => f.id === currentFolderId);

  // If no specific folder selected (e.g. root/all resources)
  if (!folder) {
    return (
      <div className="w-full max-w-[760px] mx-auto px-6 pt-6 pb-2">
        <div className="flex items-center justify-between pb-4 border-b border-[#1F1F23]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[14px] bg-[#141417] border border-[#27272A] flex items-center justify-center text-2xl shadow-sm">
              🗂️
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">
                All Resources
              </h1>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Workspace learning library catalog across all modules and folders
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      {/* Cover Banner Image */}
      <div className="h-[150px] relative overflow-hidden shrink-0 w-full bg-[#141417]">
        {folder.coverUrl ? (
          <img
            src={folder.coverUrl}
            alt={folder.name}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#18181B] via-[#27272A] to-[#18181B]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#09090B]/40 to-[#09090B]" />
      </div>

      {/* Main Content Column */}
      <div className="w-full max-w-[760px] mx-auto px-6 relative z-10 -mt-7">
        {/* Emoji Icon Badge */}
        <div className="flex items-end justify-between gap-4 mb-3">
          <button
            onClick={() => openFolderModal(folder)}
            className="text-3xl p-1.5 rounded-2xl bg-[#141417] border border-[#27272A] hover:border-[#52525B] shadow-md inline-block cursor-pointer transition-colors"
            title="Click to edit folder icon and details"
            data-testid="folder-emoji-badge"
          >
            {folder.icon || '🧠'}
          </button>

          {/* Folder Action Controls */}
          <div className="flex items-center gap-1.5 pb-1">
            <button
              onClick={() => openFolderModal(folder)}
              className="h-[28px] px-2.5 flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-white bg-[#141417]/90 hover:bg-[#1F1F23] border border-[#27272A] rounded-[8px] transition-colors shadow-sm"
              title="Edit folder metadata"
              data-testid="edit-folder-button"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Folder</span>
            </button>
            <button
              onClick={() =>
                openDeleteConfirm({
                  type: 'folder',
                  id: folder.id,
                  name: folder.name
                })
              }
              className="h-[28px] px-2 flex items-center justify-center text-[#71717A] hover:text-[#EF4444] bg-[#141417]/90 hover:bg-[#1F1F23] border border-[#27272A] rounded-[8px] transition-colors shadow-sm"
              title="Delete folder"
              data-testid="delete-folder-button"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title and Description */}
        <div className="mb-4">
          <h1
            className="text-2xl font-semibold text-white tracking-tight"
            data-testid="folder-title"
          >
            {folder.name}
          </h1>
          {folder.description && (
            <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
              {folder.description}
            </p>
          )}
        </div>

        {/* Structured Summary Blocks (as in Stitch screen) */}
        {folder.summaryBlocks && folder.summaryBlocks.length > 0 && (
          <div className="flex flex-col gap-2.5 mb-5">
            {folder.summaryBlocks.map((block) => {
              if (block.type === 'callout') {
                return (
                  <div
                    key={block.id}
                    className="p-3.5 rounded-[12px] bg-[#141417] border border-[#27272A] flex items-start gap-3 shadow-sm"
                  >
                    <span className="text-base select-none shrink-0 mt-0.5">
                      {block.icon || '📌'}
                    </span>
                    <div className="flex-1 min-w-0">
                      {block.title && (
                        <div className="text-xs font-semibold text-white mb-0.5 tracking-tight">
                          {block.title}
                        </div>
                      )}
                      <p className="text-xs text-[#A1A1AA] leading-relaxed">
                        {block.text}
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <p
                  key={block.id}
                  className="text-xs text-[#A1A1AA] leading-relaxed bg-[#0E0E11] p-3 rounded-[10px] border border-[#1F1F23]"
                >
                  {block.text}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
