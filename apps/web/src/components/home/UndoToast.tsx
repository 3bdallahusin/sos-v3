import React from 'react';
import { RotateCcw, X } from 'lucide-react';

interface UndoToastProps {
  isOpen: boolean;
  message?: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  isOpen,
  message = 'Removed from Continue Learning',
  onUndo,
  onDismiss
}) => {
  if (!isOpen) return null;

  return (
    <div
      data-testid="undo-toast"
      className="fixed bottom-6 left-1/2 md:left-[calc(50%+32px)] -translate-x-1/2 z-50 flex items-center gap-3.5 px-4 py-2.5 rounded-full bg-[#18181B] border border-[#2E2E34] text-[#F4F4F5] text-[13px] shadow-[0_12px_36px_rgba(0,0,0,0.7)] animate-fade-in-up select-none"
    >
      <span className="font-normal text-[#D4D4D8]">{message}</span>

      <button
        type="button"
        data-testid="undo-toast-button"
        onClick={onUndo}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#27272A] hover:bg-[#3F3F46] text-white text-[12px] font-mono transition-colors font-medium cursor-pointer"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Undo</span>
      </button>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-[#71717A] hover:text-[#FAFAFA] transition-colors p-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
