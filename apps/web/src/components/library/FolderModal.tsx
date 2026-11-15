import React, { useState, useEffect } from 'react';
import { X, Folder, Image as ImageIcon } from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store.js';

const EMOJI_PRESETS = ['🧠', '🔬', '📚', '🧬', '💻', '🎨', '⚡', '📝', '📐', '🧪', '🫀', '🩺'];

const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80'
];

export const FolderModal: React.FC = () => {
  const {
    isFolderModalOpen,
    editingFolder,
    closeFolderModal,
    createFolder,
    updateFolder
  } = useLibraryStore();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🧠');
  const [coverUrl, setCoverUrl] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name);
      setIcon(editingFolder.icon || '🧠');
      setCoverUrl(editingFolder.coverUrl || '');
      setDescription(editingFolder.description || '');
    } else {
      setName('');
      setIcon('🧠');
      setCoverUrl(COVER_PRESETS[0]);
      setDescription('');
    }
  }, [editingFolder, isFolderModalOpen]);

  if (!isFolderModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (editingFolder) {
      await updateFolder(editingFolder.id, {
        name: trimmedName,
        icon,
        coverUrl,
        description: description.trim()
      });
    } else {
      await createFolder({
        name: trimmedName,
        icon,
        coverUrl,
        description: description.trim()
      });
    }
    closeFolderModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none"
      onClick={closeFolderModal}
    >
      <div
        className="w-full max-w-md rounded-[16px] bg-[#0E0E11] border border-[#27272A] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-testid="folder-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F1F23]">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              {editingFolder ? 'Edit Folder' : 'New Library Folder'}
            </h2>
          </div>
          <button
            onClick={closeFolderModal}
            className="p-1 text-[#71717A] hover:text-white rounded-[6px] hover:bg-[#18181B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] block mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Synaptic Transmission & Plasticity"
              className="w-full h-[36px] px-3 bg-[#141417] border border-[#27272A] focus:border-[#71717A] text-xs text-white rounded-[8px] outline-none transition-colors"
              autoFocus
              data-testid="folder-name-input"
            />
          </div>

          {/* Emoji Icon Picker */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] block mb-1.5">
              Folder Icon
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_PRESETS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`w-8 h-8 rounded-[8px] text-lg flex items-center justify-center border transition-all ${
                    icon === emoji
                      ? 'bg-[#27272A] border-[#71717A] scale-105'
                      : 'bg-[#141417] border-[#27272A] hover:bg-[#18181B]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] block mb-1.5">
              Description / Subtitle
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of learning assets in this folder..."
              className="w-full p-2.5 bg-[#141417] border border-[#27272A] focus:border-[#71717A] text-xs text-white rounded-[8px] outline-none resize-none transition-colors"
            />
          </div>

          {/* Cover Presets */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] block mb-1.5">
              Cover Image Preset
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COVER_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setCoverUrl(preset)}
                  className={`h-12 rounded-[6px] overflow-hidden border transition-all ${
                    coverUrl === preset
                      ? 'border-white ring-1 ring-white'
                      : 'border-[#27272A] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F1F23]">
            <button
              type="button"
              onClick={closeFolderModal}
              className="h-[32px] px-3 text-xs text-[#A1A1AA] hover:text-white hover:bg-[#18181B] rounded-[8px] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-[32px] px-4 text-xs font-medium bg-white hover:bg-[#E4E4E7] text-black rounded-[8px] transition-colors shadow-sm"
              data-testid="save-folder-submit"
            >
              {editingFolder ? 'Save Changes' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
