import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

export interface CustomSearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  dataTestId?: string;
  searchable?: boolean;
}

export const CustomSearchableSelect: React.FC<CustomSearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  triggerClassName = '',
  dataTestId,
  searchable = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  // Filter out unwanted titles like "Untitled Study Folder"
  const cleanOptions = options.filter(
    (opt) =>
      !opt.label.toLowerCase().includes('untitled study folder') &&
      !opt.value.toLowerCase().includes('untitled')
  );

  const filtered = cleanOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Group options if group is specified
  const groups = new Map<string, SelectOption[]>();
  const ungrouped: SelectOption[] = [];

  for (const opt of filtered) {
    if (opt.group) {
      if (!groups.has(opt.group)) {
        groups.set(opt.group, []);
      }
      groups.get(opt.group)!.push(opt);
    } else {
      ungrouped.push(opt);
    }
  }

  const selectedOpt = cleanOptions.find((o) => o.value === value);
  const displayLabel = selectedOpt ? selectedOpt.label : placeholder;

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      data-testid={dataTestId}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-9 px-3 rounded-lg bg-[#111113] border border-[#1E1E22] hover:border-[#2A2A30] text-xs text-[#EDEDED] flex items-center justify-between transition-colors cursor-pointer active:scale-[0.99] ${triggerClassName}`}
      >
        <span className="truncate pr-2 font-medium">{displayLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#71717A] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[#EDEDED]' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full min-w-[180px] bg-[#18181C] border border-[#26262A] rounded-xl shadow-2xl p-1 z-50 flex flex-col max-h-[240px] overflow-hidden">
          {searchable && cleanOptions.length > 5 && (
            <div className="p-1 border-b border-[#26262A] mb-1">
              <div className="relative flex items-center">
                <Search className="w-3 h-3 text-[#71717A] absolute left-2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full h-7 pl-7 pr-2 rounded-md bg-[#111113] text-[11px] text-[#EDEDED] placeholder-[#71717A] border border-[#222226] focus:outline-none focus:border-[#3E3E48]"
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 pr-0.5">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[#71717A]">
                No matching options
              </div>
            ) : (
              <>
                {ungrouped.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      opt.value === value
                        ? 'bg-[#222226] text-[#EDEDED] font-semibold'
                        : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#1E1E22]'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.value === value && (
                      <Check className="w-3.5 h-3.5 text-[#EDEDED] shrink-0 ml-1.5" />
                    )}
                  </button>
                ))}

                {Array.from(groups.entries()).map(([groupName, groupOpts]) => (
                  <div key={groupName} className="flex flex-col mt-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] px-2.5 py-1 font-semibold select-none">
                      {groupName}
                    </div>
                    {groupOpts.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                          setSearch('');
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          opt.value === value
                            ? 'bg-[#222226] text-[#EDEDED] font-semibold'
                            : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#1E1E22]'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {opt.value === value && (
                          <Check className="w-3.5 h-3.5 text-[#EDEDED] shrink-0 ml-1.5" />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
