import React, { useState, useRef } from 'react';
import { X, UploadCloud, AlertCircle } from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store.js';
import { SOSCard } from '../ui/SOSCard.js';

export const UploadFileModal: React.FC = () => {
  const { isUploadModalOpen, closeUploadModal, uploadFiles } = useLibraryStore();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isUploadModalOpen) return null;

  const startUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setSelectedFiles(files);
    setIsUploading(true);
    setProgressPercent(0);
    setUploadError(null);

    try {
      await uploadFiles(files, (percent) => {
        setProgressPercent(percent);
      });
      setIsUploading(false);
      setSelectedFiles([]);
      closeUploadModal();
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed');
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      startUpload(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      startUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setUploadError(null);
    setSelectedFiles([]);
    closeUploadModal();
  };

  return (
    <div
      className="fixed inset-0 bg-[#050505]/75 backdrop-blur-[2px] z-50 flex items-center justify-center select-none"
      onClick={handleClose}
    >
      <SOSCard
        interactive={false}
        className="w-[360px] p-4 shadow-2xl flex flex-col gap-3.5"
        onClick={(e) => e.stopPropagation()}
        data-testid="upload-file-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[13.5px] font-semibold text-[#FAFAFA] tracking-tight">Upload File</h2>
          <button
            type="button"
            disabled={isUploading}
            onClick={handleClose}
            title="Close"
            className="w-6 h-6 rounded-md flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1E1E22] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Error Banner */}
        {uploadError && (
          <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">{uploadError}</span>
          </div>
        )}

        {/* Compact Dashed Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => {
            if (!isUploading) fileInputRef.current?.click();
          }}
          className={`border border-dashed border-[#2A2A30] hover:border-[#3F3F46] bg-[#0A0A0A] rounded-lg py-5 px-3 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isUploading ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            data-testid="upload-file-input"
          />
          <UploadCloud className="w-5 h-5 text-[#D4D4D8] mb-1.5" />
          <p className="text-xs font-medium text-[#FAFAFA]">
            {isUploading
              ? 'Uploading file(s)...'
              : 'Drop files here or click to browse'}
          </p>
          <p className="font-mono text-[10px] text-[#8E8E93] mt-0.5">
            Max 100MB per file: PDF, DOCX, PPTX, XLSX, MP4, MP3, PNG...
          </p>
        </div>

        {/* Real Progress Bar */}
        {(isUploading || selectedFiles.length > 0) && (
          <div className="flex flex-col gap-1.5 px-0.5">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="text-[#EDEDED] truncate mr-2">
                {selectedFiles[0]?.name || 'Uploading...'}
              </span>
              <span className="font-mono text-[#8E8E93] tnum shrink-0">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-1 bg-[#222226] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FAFAFA] rounded-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer with only Cancel/Close button */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={isUploading}
            onClick={handleClose}
            className="h-8 px-3 rounded-lg bg-[#161619] hover:bg-[#1E1E22] border border-[#222226] text-[#EDEDED] font-medium text-xs transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Cancel'}
          </button>
        </div>
      </SOSCard>
    </div>
  );
};
