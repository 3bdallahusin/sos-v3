import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { loadLibraryFolders } from '@sos/persistence';
import type { LibraryFolder } from '@sos/domain';

export interface CreatableFieldComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dataTestId?: string;
  className?: string;
}

const DECAGON_FIELDS = [
  'Computer Science',
  'Economics & Finance',
  'Cognitive Science',
  'Philosophy'
];

export const CreatableFieldCombobox: React.FC<CreatableFieldComboboxProps> = ({
  value,
  onChange,
  placeholder = 'Type or choose field...',
  dataTestId,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [libraryFolders, setLibraryFolders] = useState<LibraryFolder[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLibraryFolders()
      .then((folders) => {
        setLibraryFolders(
          folders.filter(
            (f) =>
              f.id !== 'library-root' &&
              !f.name.toLowerCase().includes('untitled study folder') &&
              !f.name.toLowerCase().includes('untitled')
          )
        );
      })
      .catch(() => {});
  }, []);

  // Close when clicking outside
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

  const searchTerm = value.trim().toLowerCase();

  const filteredDecagon = DECAGON_FIELDS.filter((f) =>
    f.toLowerCase().includes(searchTerm)
  );

  const filteredFolders = libraryFolders
    .map((f) => f.name)
    .filter(
      (name) =>
        !DECAGON_FIELDS.includes(name) &&
        name.toLowerCase().includes(searchTerm)
    );

  const isExactMatch =
    DECAGON_FIELDS.some((f) => f.toLowerCase() === searchTerm) ||
    libraryFolders.some((f) => f.name.toLowerCase() === searchTerm);

  const showCreateOption = searchTerm.length > 0 && !isExactMatch;

  const handleSelect = (fieldName: string) => {
    onChange(fieldName);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      data-testid={dataTestId}
    >
      {/* Combobox Input + Toggle Chevron */}
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
          className="w-full h-9 pl-3 pr-8 rounded-lg bg-[#111113] border border-[#1E1E22] hover:border-[#2A2A30] focus:border-[#FAFAFA] text-xs text-[#EDEDED] placeholder-[#71717A] focus:outline-none transition-colors font-sans"
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

      {/* Dark Glass Popover */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full min-w-[200px] bg-[#18181C] border border-[#26262A] rounded-xl shadow-2xl p-1 z-50 flex flex-col max-h-[220px] overflow-y-auto custom-scrollbar">
          {/* Create custom field option */}
          {showCreateOption && (
            <button
              type="button"
              onClick={() => handleSelect(value.trim())}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-[#60A5FA] hover:bg-[#222226] cursor-pointer transition-colors font-medium border-b border-[#26262A] mb-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="truncate">Create &ldquo;{value.trim()}&rdquo;</span>
            </button>
          )}

          {/* Group 1: The Decagon */}
          {filteredDecagon.length > 0 && (
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] px-2.5 py-1 font-semibold select-none">
                [ THE DECAGON ]
              </span>
              {filteredDecagon.map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => handleSelect(field)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    field.toLowerCase() === value.toLowerCase()
                      ? 'bg-[#222226] text-[#EDEDED] font-semibold'
                      : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#1E1E22]'
                  }`}
                >
                  <span className="truncate">{field}</span>
                  {field.toLowerCase() === value.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-[#EDEDED] shrink-0 ml-1.5" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Group 2: Library Folders */}
          {filteredFolders.length > 0 && (
            <div className="flex flex-col mt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] px-2.5 py-1 font-semibold select-none">
                Library Folders
              </span>
              {filteredFolders.map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => handleSelect(field)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    field.toLowerCase() === value.toLowerCase()
                      ? 'bg-[#222226] text-[#EDEDED] font-semibold'
                      : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#1E1E22]'
                  }`}
                >
                  <span className="truncate">{field}</span>
                  {field.toLowerCase() === value.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-[#EDEDED] shrink-0 ml-1.5" />
                  )}
                </button>
              ))}
            </div>
          )}

          {filteredDecagon.length === 0 && filteredFolders.length === 0 && !showCreateOption && (
            <div className="px-3 py-4 text-center text-xs text-[#71717A]">
              Type to create a new field
            </div>
          )}
        </div>
      )}
    </div>
  );
};
