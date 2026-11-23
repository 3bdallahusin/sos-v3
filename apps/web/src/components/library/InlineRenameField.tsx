import React, { useState, useEffect, useRef } from 'react';
import type { LibraryItem } from '@sos/domain';

interface InlineRenameFieldProps {
  item: LibraryItem;
  onCommit: (newName: string) => void;
  onCancel: () => void;
  className?: string;
  inputClassName?: string;
}

export const InlineRenameField: React.FC<InlineRenameFieldProps> = ({
  item,
  onCommit,
  onCancel,
  className = '',
  inputClassName = 'text-[13px] font-medium leading-snug text-[#FAFAFA] font-sans'
}) => {
  const isFile = item.itemKind === 'file';
  const lastDot = isFile ? item.name.lastIndexOf('.') : -1;
  const ext = lastDot > 0 ? item.name.slice(lastDot) : '';
  const initialStem = ext ? item.name.slice(0, lastDot) : item.name;

  const [stem, setStem] = useState(initialStem);
  const inputRef = useRef<HTMLInputElement>(null);
  const isCommittedRef = useRef(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(0, initialStem.length);
    }
  }, [initialStem]);

  const handleCommit = () => {
    if (isCommittedRef.current) return;
    isCommittedRef.current = true;
    const trimmed = stem.trim();
    if (!trimmed || trimmed === initialStem) {
      onCancel();
      return;
    }
    const finalName = ext ? `${trimmed}${ext}` : trimmed;
    onCommit(finalName);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      isCommittedRef.current = true;
      onCancel();
    }
  };

  return (
    <div
      className={`inline-flex items-center w-full min-w-0 ${className}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        type="text"
        value={stem}
        onChange={(e) => setStem(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleCommit}
        className={`bg-transparent border-0 outline-none ring-0 focus:ring-0 focus:outline-none p-0 m-0 w-full selection:bg-[#60A5FA]/30 ${inputClassName}`}
        aria-label="Rename item"
      />
      {ext && <span className="text-[#71717A] text-[11px] font-mono ml-1 select-none shrink-0">{ext}</span>}
    </div>
  );
};
