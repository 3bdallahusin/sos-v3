import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

export interface CreatableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  dataTestId?: string;
  className?: string;
  inputClassName?: string;
  centered?: boolean;
}

export const CreatableCombobox: React.FC<CreatableComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Type or choose...',
  dataTestId,
  className = '',
  inputClassName = '',
  centered = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const searchTerm = (value || '').trim().toLowerCase();
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm)
  );

  const isExactMatch = options.some((opt) => opt.toLowerCase() === searchTerm);
  const showCreateOption = searchTerm.length > 0 && !isExactMatch;

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      data-testid={dataTestId}
    >
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full h-9 pl-3 pr-8 rounded-lg bg-[#161619] border border-[#26262A] hover:border-[#3F3F46] focus:border-[#3F3F46] text-[13px] font-medium text-[#EDEDED] placeholder-[#52525B] placeholder:font-normal focus:outline-none transition-colors font-sans ${
            centered ? 'text-center' : ''
          } ${inputClassName}`}
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (!isOpen) inputRef.current?.focus();
          }}
          className="absolute right-2 text-[#71717A] hover:text-[#EDEDED] p-1 cursor-pointer transition-colors"
          tabIndex={-1}
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-[#EDEDED]' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full min-w-[200px] bg-[#18181C] border border-[#26262A] rounded-xl shadow-2xl p-1 z-50 flex flex-col max-h-[200px] overflow-y-auto custom-scrollbar">
          {showCreateOption && (
            <button
              type="button"
              onClick={() => handleSelect(value.trim())}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-[#60A5FA] hover:bg-[#222226] cursor-pointer transition-colors font-medium border-b border-[#26262A] mb-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Create &ldquo;{value.trim()}&rdquo;</span>
            </button>
          )}

          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = opt.toLowerCase() === (value || '').trim().toLowerCase();
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#222226] text-[#FAFAFA] font-medium'
                      : 'text-[#A1A1AA] hover:bg-[#1E1E22] hover:text-[#FAFAFA]'
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && <Check className="w-3 h-3 text-[#60A5FA] shrink-0 ml-1.5" />}
                </button>
              );
            })
          ) : !showCreateOption ? (
            <div className="px-2.5 py-2 text-center text-xs text-[#71717A]">
              No options available
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
