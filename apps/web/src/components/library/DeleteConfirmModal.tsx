import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store.js';

export const DeleteConfirmModal: React.FC = () => {
  const {
    deleteConfirmTarget,
    closeDeleteConfirm,
    deleteFolder,
    deleteItem
  } = useLibraryStore();

  if (!deleteConfirmTarget) return null;

  const handleConfirm = async () => {
    if (deleteConfirmTarget.type === 'folder') {
      await deleteFolder(deleteConfirmTarget.id);
    } else {
      await deleteItem(deleteConfirmTarget.id);
    }
    closeDeleteConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
      onClick={closeDeleteConfirm}
    >
      <div
        className="w-full max-w-sm rounded-[16px] bg-[#0E0E11] border border-[#27272A] shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
        data-testid="delete-confirm-modal"
      >
        <div className="flex items-center gap-3 mb-3 text-[#EF4444]">
          <div className="p-2 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Delete {deleteConfirmTarget.type === 'folder' ? 'Folder' : 'Item'}?
            </h3>
            <p className="text-[11px] text-[#A1A1AA]">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#A1A1AA] mb-4 leading-relaxed bg-[#141417] p-2.5 rounded-[8px] border border-[#1F1F23]">
          Are you sure you want to permanently delete{' '}
          <strong className="text-white">"{deleteConfirmTarget.name}"</strong>
          {deleteConfirmTarget.type === 'folder'
            ? ' and all resources nested inside it?'
            : '?'}
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={closeDeleteConfirm}
            className="h-[32px] px-3.5 text-xs text-[#A1A1AA] hover:text-white hover:bg-[#18181B] rounded-[8px] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="h-[32px] px-4 text-xs font-medium bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-[8px] transition-colors shadow-sm"
            data-testid="confirm-delete-btn"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
