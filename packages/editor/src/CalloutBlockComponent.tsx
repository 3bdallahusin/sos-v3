import React, { useState, useRef, useEffect } from 'react';
import { Pin } from 'lucide-react';

const CALLOUT_ICONS = ['📌', '💡', '⚠️', 'ℹ️', '🎯', '🧠', '🔥', '✅', '📝', '⚡'];

interface CalloutBlockComponentProps {
  icon: string;
  onUpdateIcon: (icon: string) => void;
  contentRef?: (node: HTMLElement | null) => void;
  children?: React.ReactNode;
  updatedAt?: string;
}

export const CalloutBlockComponent: React.FC<CalloutBlockComponentProps> = ({
  icon,
  onUpdateIcon,
  contentRef,
  children,
  updatedAt
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMonochromePin = !icon || icon === 'pin' || icon === '📌' || icon === '💡';

  return (
    <div
      className="my-3 p-3.5 rounded-xl bg-[#141417] border border-[#27272A] flex items-center gap-3 shadow-sm relative group/callout w-full"
      data-testid="blocknote-callout-block"
    >
      {/* Icon Badge matching Stitch (w-6 h-6, #18181B, #27272A border, monochrome Pin in #A1A1AA) */}
      <div className="relative shrink-0 select-none" ref={pickerRef} contentEditable={false}>
        <button
          type="button"
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className="w-6 h-6 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center shrink-0 text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors cursor-pointer"
          title="Change callout icon"
          data-testid="callout-icon-btn"
        >
          {isMonochromePin ? (
            <Pin className="w-3.5 h-3.5 text-[#A1A1AA]" />
          ) : (
            <span className="text-xs leading-none">{icon}</span>
          )}
        </button>

        {isPickerOpen && (
          <div
            className="absolute left-0 top-full mt-1.5 p-2 bg-[#18181B] border border-[#27272A] rounded-xl shadow-2xl z-50 grid grid-cols-5 gap-1.5 animate-in fade-in zoom-in-95"
            data-testid="callout-icon-picker"
          >
            <button
              type="button"
              onClick={() => {
                onUpdateIcon('pin');
                setIsPickerOpen(false);
              }}
              className="w-7 h-7 rounded hover:bg-[#27272A] flex items-center justify-center text-xs text-[#A1A1AA] transition-colors"
              title="Pin"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            {CALLOUT_ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onUpdateIcon(emoji);
                  setIsPickerOpen(false);
                }}
                className="w-7 h-7 rounded hover:bg-[#27272A] flex items-center justify-center text-base transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editable or Static Content Slot with Far Right Updated Timestamp */}
      <div className="flex items-center justify-between w-full text-xs min-w-0">
        <div
          ref={contentRef}
          className="flex-1 min-w-0 text-xs text-[#D4D4D8] leading-relaxed outline-none"
          data-testid="callout-content-slot"
        >
          {children}
        </div>
        {updatedAt && (
          <span className="text-[11px] font-mono text-[#71717A] shrink-0 ml-4 select-none">
            {updatedAt}
          </span>
        )}
      </div>
    </div>
  );
};
