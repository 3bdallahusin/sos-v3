import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Hash } from 'lucide-react';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, tags?: string[]) => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['scratchpad']);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setTags(['scratchpad']);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, content, tags]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    onSave(
      title.trim() || 'Untitled Scratchpad Note',
      content.trim(),
      tags
    );
    onClose();
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="quick-capture-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        data-testid="quick-capture-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] bg-[#111114] border border-[#27272A] rounded-2xl shadow-2xl p-5 flex flex-col gap-3 text-[#F4F4F5] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#1F1F23]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[5px] bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#A1A1AA]">
              <Sparkles className="w-3 h-3 text-[#E4E4E7]" />
            </div>
            <span className="text-[12.5px] font-semibold text-[#F4F4F5] tracking-tight">
              Quick Capture Note
            </span>
          </div>
          <button
            type="button"
            data-testid="quick-capture-close-btn"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#18181B] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Note Title Input */}
        <input
          ref={titleInputRef}
          type="text"
          data-testid="quick-capture-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title or quick insight..."
          className="w-full bg-[#09090B] border border-[#1F1F23] rounded-xl px-3.5 py-2 text-[13.5px] text-[#F4F4F5] placeholder-[#71717A] focus:outline-none focus:border-[#3F3F46] focus:ring-1 focus:ring-[#3F3F46] transition-all"
        />

        {/* Note Content Textarea */}
        <textarea
          data-testid="quick-capture-content-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Capture your immediate thoughts without leaving Home... Saved directly to local Dexie persistence."
          rows={5}
          className="w-full bg-[#09090B] border border-[#1F1F23] rounded-xl px-3.5 py-2.5 text-[13px] text-[#F4F4F5] placeholder-[#71717A] focus:outline-none focus:border-[#3F3F46] focus:ring-1 focus:ring-[#3F3F46] transition-all resize-none custom-scrollbar"
        />

        {/* Tags Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-[#18181B] border border-[#27272A] text-[11px] font-mono text-[#A1A1AA]"
            >
              #{t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="hover:text-white transition-colors"
              >
                &times;
              </button>
            </span>
          ))}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-[#09090B] border border-[#1F1F23] text-[11px]">
            <Hash className="w-2.5 h-2.5 text-[#71717A]" />
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="add tag..."
              className="bg-transparent border-0 p-0 text-[11px] text-[#E4E4E7] placeholder-[#71717A] focus:outline-none w-16"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1F1F23] mt-1">
          <span className="text-[11px] font-mono text-[#71717A]">
            <kbd className="px-1.5 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[10px] text-[#A1A1AA]">
              Esc
            </kbd>{' '}
            cancel &bull;{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[10px] text-[#A1A1AA]">
              ⌘Enter
            </kbd>{' '}
            save
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="quick-capture-save-btn"
              onClick={handleSave}
              className="px-3.5 py-1.5 rounded-lg bg-[#F4F4F5] text-[#09090B] font-medium text-xs hover:bg-white active:scale-95 transition-all shadow-sm"
            >
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
