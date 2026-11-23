import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
}

export interface CustomDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  dataTestId?: string;
  className?: string;
  minWidth?: string;
}

interface DropdownPosition {
  top?: number;
  bottom?: number;
  right?: number;
  left?: number;
  width?: number;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  options,
  onChange,
  dataTestId,
  className = '',
  minWidth = 'min-w-[168px]'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  const updatePosition = useCallback(() => {
    const el = buttonRef.current ?? containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const estimatedHeight = options.length * 36 + 16;
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldFlipUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    const newPos: DropdownPosition = {
      right: Math.max(8, window.innerWidth - rect.right),
      width: rect.width
    };

    if (shouldFlipUp) {
      newPos.bottom = window.innerHeight - rect.top + 6;
    } else {
      newPos.top = rect.bottom + 6;
    }

    setPosition(newPos);
  }, [options.length]);

  // Open and update position
  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Keep position pinned during window resize and scroll
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Close when clicking outside both trigger and portal popover
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation (Escape to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const popoverMenu = isOpen && typeof document !== 'undefined' ? (
    createPortal(
      <div
        ref={popoverRef}
        data-testid="dropdown-menu-portal"
        style={{
          position: 'fixed',
          top: position.top !== undefined ? `${position.top}px` : undefined,
          bottom: position.bottom !== undefined ? `${position.bottom}px` : undefined,
          right: position.right !== undefined ? `${position.right}px` : undefined,
          width: position.width !== undefined ? `${position.width}px` : undefined
        }}
        className="z-[9999] box-border rounded-[12px] bg-[#141417] border border-[#222226] p-1 shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-md flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 ease-out"
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#1E1E22] text-white font-semibold'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#1E1E22]/60'
              }`}
            >
              <span>{option.label}</span>
              {isSelected && (
                <Check className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
              )}
            </button>
          );
        })}
      </div>,
      document.body
    )
  ) : null;

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Native select for Playwright and assistive accessibility */}
      {dataTestId && (
        <select
          data-testid={dataTestId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute top-0 right-0 w-4 h-4 opacity-0 pointer-events-none"
          tabIndex={-1}
          aria-hidden="true"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* Custom OLED dark trigger button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="w-full min-w-[168px] h-8 pl-3 pr-2.5 rounded-lg bg-[#141417] border border-[#222226] hover:border-[#323238] active:scale-[0.98] text-xs text-[#E4E4E7] font-medium flex items-center justify-between gap-2.5 transition-all duration-150 ease-out cursor-pointer shadow-sm select-none"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#71717A] transition-transform duration-200 ease-out shrink-0 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Floating Popover via Portal */}
      {popoverMenu}
    </div>
  );
};
