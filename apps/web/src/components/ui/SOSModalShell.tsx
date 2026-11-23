import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface SOSModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  maxWidth?: string; // e.g. "max-w-lg", "max-w-md", "max-w-xl"
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const SOSModalShell: React.FC<SOSModalShellProps> = ({
  isOpen,
  onClose,
  title,
  description,
  maxWidth = 'max-w-lg',
  children,
  footer
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        className={`w-full ${maxWidth} bg-[#111113] border border-[#222226] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E1E22] bg-[#0C0C0E] flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-[15px] font-semibold text-[#FAFAFA] tracking-tight">{title}</h2>
            {description && (
              <p className="text-[12px] text-[#8E8E93] mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8E8E93] hover:text-[#FAFAFA] hover:bg-[#1C1C1F] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3.5 border-t border-[#1E1E22] bg-[#0C0C0E] flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
