import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { useTrackingStore } from '../../stores/tracking-store.js';

export const DeleteSessionModal: React.FC = () => {
  const {
    deleteModalSessionId,
    setDeleteModalSessionId,
    deleteSession
  } = useTrackingStore();

  if (!deleteModalSessionId) return null;

  const handleDelete = async () => {
    await deleteSession(deleteModalSessionId);
  };

  return (
    <div
      data-testid="delete-session-modal"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="w-full max-w-sm bg-[#111113] border border-[#27272A] rounded-[12px] p-6 flex flex-col gap-4 shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E1E22] pb-3">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-sm font-semibold text-[#FAFAFA] tracking-tight">
              Delete Session
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setDeleteModalSessionId(null)}
            className="text-[#71717A] hover:text-[#FAFAFA] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs text-[#A1A1AA] leading-relaxed">
          Are you sure you want to delete this study session? This action cannot be undone and will permanently remove it from your activity history and analytics reports.
        </p>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222226]">
          <button
            type="button"
            onClick={() => setDeleteModalSessionId(null)}
            className="px-4 py-2 rounded-xl bg-[#1C1C21] text-[#71717A] hover:text-[#FAFAFA] text-xs font-medium cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirm-delete-session-btn"
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#E57373] border border-red-500/25 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
