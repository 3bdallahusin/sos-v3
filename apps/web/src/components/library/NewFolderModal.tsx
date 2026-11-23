import React, { useState, useEffect, useRef } from 'react';
import { X, Folder } from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store.js';
import { SOSCard } from '../ui/SOSCard.js';

export const NewFolderModal: React.FC = () => {
  const { isNewFolderModalOpen, closeNewFolderModal, createFolder } = useLibraryStore();
  const [folderName, setFolderName] = useState('New Folder');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNewFolderModalOpen) {
      setFolderName('New Folder');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isNewFolderModalOpen]);

  if (!isNewFolderModalOpen) return null;

  const handleCreate = async () => {
    if (!folderName.trim()) return;
    await createFolder(folderName.trim());
    closeNewFolderModal();
  };

  return (
    <div
      className="fixed inset-0 bg-[#050505]/75 backdrop-blur-[2px] z-50 flex items-center justify-center select-none"
      onClick={closeNewFolderModal}
    >
      <SOSCard
        interactive={false}
        className="w-[300px] p-4 shadow-2xl flex flex-col gap-4 relative"
        onClick={(e) => e.stopPropagation()}
        data-testid="new-folder-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[13.5px] font-semibold text-[#FAFAFA] tracking-tight">New Folder</h2>
          <button
            type="button"
            onClick={closeNewFolderModal}
            title="Close"
            className="w-6 h-6 rounded-md flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1E1E22] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Input Row with Underline Style & Folder Icon */}
        <div className="flex items-center gap-2.5 border-b border-[#27272A] focus-within:border-[#FAFAFA] pb-1.5 transition-colors">
          <Folder className="w-4 h-4 text-[#A1A1AA] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') closeNewFolderModal();
            }}
            placeholder="Folder name..."
            className="w-full bg-transparent border-0 p-0 text-[13.5px] font-medium text-[#FAFAFA] focus:ring-0 outline-none placeholder:text-[#52525B]"
            data-testid="new-folder-name-input"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={closeNewFolderModal}
            className="h-7 px-3 rounded-lg bg-[#161619] hover:bg-[#1E1E22] border border-[#222226] text-[#EDEDED] font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="h-7 px-3 rounded-lg bg-[#EDEDED] hover:bg-white text-[#0A0A0A] font-medium text-xs transition-colors shadow-sm"
            data-testid="new-folder-submit-btn"
          >
            Create
          </button>
        </div>
      </SOSCard>
    </div>
  );
};
