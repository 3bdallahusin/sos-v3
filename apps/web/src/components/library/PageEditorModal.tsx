import React, { useState, useEffect } from 'react';
import { X, FileCode, Save } from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store.js';

export const PageEditorModal: React.FC = () => {
  const {
    isPageEditorOpen,
    editingItem,
    closePageEditor,
    createItem,
    updateItem,
    currentFolderId
  } = useLibraryStore();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setSubtitle(editingItem.subtitle || '');
      setContent(editingItem.content || '');
    } else {
      setTitle('');
      setSubtitle('');
      setContent('# Untitled Document\n\nWrite structured lecture notes, key takeaways, and synthesis here...\n\n- Key Point 1\n- Key Point 2\n');
    }
  }, [editingItem, isPageEditorOpen]);

  if (!isPageEditorOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    // Estimate read time (approx 200 words per minute)
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const readTimeMinutes = Math.max(1, Math.round(wordCount / 180));
    const sizeBytes = new TextEncoder().encode(content).length;

    if (editingItem) {
      await updateItem(editingItem.id, {
        title: trimmedTitle,
        subtitle: subtitle.trim(),
        content,
        readTimeMinutes,
        sizeBytes
      });
    } else {
      await createItem({
        title: trimmedTitle,
        subtitle: subtitle.trim(),
        type: 'notes',
        content,
        readTimeMinutes,
        sizeBytes,
        folderId: currentFolderId
      });
    }
    closePageEditor();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
      onClick={closePageEditor}
    >
      <div
        className="w-full max-w-2xl h-[80vh] flex flex-col rounded-[16px] bg-[#0E0E11] border border-[#27272A] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-testid="page-editor-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1F1F23] shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[6px] bg-[#18181B] border border-[#27272A]">
              <FileCode className="w-4 h-4 text-[#A1A1AA]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                {editingItem ? 'Edit Document Page' : 'New Library Page'}
              </h2>
            </div>
          </div>
          <button
            onClick={closePageEditor}
            className="p-1 text-[#71717A] hover:text-white rounded-[6px] hover:bg-[#18181B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-5 overflow-hidden">
          {/* Title & Subtitle */}
          <div className="flex flex-col gap-2 mb-3 shrink-0">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title (e.g. Synaptic Plasticity Summary.md)"
              className="w-full h-[38px] px-3.5 bg-[#141417] border border-[#27272A] focus:border-[#71717A] text-sm font-medium text-white rounded-[8px] outline-none transition-colors"
              autoFocus
              data-testid="page-title-input"
            />
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Subtitle or brief summary (optional)"
              className="w-full h-[30px] px-3 bg-[#141417] border border-[#27272A] focus:border-[#71717A] text-xs text-[#A1A1AA] rounded-[6px] outline-none transition-colors"
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0 flex flex-col">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1">
              Markdown Content / Notes
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your study notes..."
              className="w-full flex-1 p-3.5 bg-[#141417] border border-[#27272A] focus:border-[#71717A] text-xs font-mono text-white rounded-[8px] outline-none resize-none leading-relaxed overflow-y-auto"
              data-testid="page-content-input"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1F1F23] shrink-0">
            <span className="text-[11px] text-[#71717A] font-mono">
              {content.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closePageEditor}
                className="h-[32px] px-3 text-xs text-[#A1A1AA] hover:text-white hover:bg-[#18181B] rounded-[8px] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-[32px] px-4 flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-[#E4E4E7] text-black rounded-[8px] transition-colors shadow-sm"
                data-testid="save-page-submit"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Document</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
