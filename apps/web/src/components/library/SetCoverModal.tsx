import React, { useState, useRef } from 'react';
import { X, ImagePlus } from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store.js';
import { SOSCard } from '../ui/SOSCard.js';

export const SetCoverModal: React.FC = () => {
  const {
    isSetCoverModalOpen,
    closeSetCoverModal,
    modalTargetItem,
    setItemCover,
    removeItemCover
  } = useLibraryStore();

  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isSetCoverModalOpen || !modalTargetItem) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (selectedFile) {
      await setItemCover(modalTargetItem._id, selectedFile);
    } else if (imageUrl.trim()) {
      await setItemCover(modalTargetItem._id, imageUrl.trim());
    }
    closeSetCoverModal();
  };

  const handleRemove = async () => {
    await removeItemCover(modalTargetItem._id);
    closeSetCoverModal();
  };

  const hasCurrentCover = Boolean(modalTargetItem.coverImage) || Boolean(previewUrl);

  return (
    <div
      className="fixed inset-0 bg-[#050505]/75 backdrop-blur-[2px] z-50 flex items-center justify-center select-none"
      onClick={closeSetCoverModal}
    >
      <SOSCard
        interactive={false}
        className="w-[320px] p-4 shadow-2xl flex flex-col gap-3.5"
        onClick={(e) => e.stopPropagation()}
        data-testid="set-cover-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[13.5px] font-semibold text-[#FAFAFA] tracking-tight">Set Cover</h2>
          <button
            type="button"
            onClick={closeSetCoverModal}
            title="Close"
            className="w-6 h-6 rounded-md flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1E1E22] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 16:9 Image Upload Dropzone / Preview */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="aspect-video w-full border border-dashed border-[#2A2A30] hover:border-[#3F3F46] bg-[#0A0A0A] rounded-lg flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            data-testid="cover-file-input"
          />

          {previewUrl || modalTargetItem.coverImage ? (
            <img
              src={previewUrl || modalTargetItem.coverImage!}
              alt="Cover Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <ImagePlus className="w-5 h-5 text-[#D4D4D8] mb-1.5" />
              <p className="text-xs font-medium text-[#FAFAFA]">Upload cover image</p>
            </>
          )}
        </div>

        {/* Optional Image Link Input */}
        <div>
          <label className="text-[11px] font-medium text-[#A1A1AA] mb-1 block">
            Or paste image link:
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full h-7 px-2 rounded-md bg-[#161619] border border-[#222226] text-xs text-[#EDEDED] placeholder-[#71717A] focus:outline-none focus:border-[#323238]"
            data-testid="cover-url-input"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          {hasCurrentCover ? (
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-[#E57373] hover:underline"
              data-testid="remove-cover-button"
            >
              Remove
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeSetCoverModal}
              className="h-7 px-3 rounded-lg bg-[#161619] hover:bg-[#1E1E22] border border-[#222226] text-[#EDEDED] font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-7 px-3 rounded-lg bg-[#EDEDED] hover:bg-white text-[#0A0A0A] font-medium text-xs transition-colors shadow-sm"
              data-testid="save-cover-button"
            >
              Save
            </button>
          </div>
        </div>
      </SOSCard>
    </div>
  );
};
