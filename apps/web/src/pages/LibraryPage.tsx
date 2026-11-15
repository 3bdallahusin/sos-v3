import React, { useEffect } from 'react';
import { FileEdit, Plus } from 'lucide-react';
import { useLibraryStore } from '../stores/library-store.js';
import { LibrarySidebar } from '../components/library/LibrarySidebar.js';
import { LibraryEditorView } from '../components/library/LibraryEditorView.js';

export const LibraryPage: React.FC = () => {
  const {
    documents,
    isLoading,
    isSidebarOpen,
    loadLibraryData,
    createDocument
  } = useLibraryStore();

  useEffect(() => {
    loadLibraryData();
  }, [loadLibraryData]);

  return (
    <div
      className="w-full h-full flex bg-[#09090B] text-white overflow-hidden"
      data-testid="library-page"
    >
      {/* Integrated Library Document Navigation Sidebar */}
      {isSidebarOpen && <LibrarySidebar />}

      {/* Main Center Panel Editing Surface */}
      {isLoading ? (
        <div className="flex-1 h-full flex items-center justify-center text-xs text-[#71717A] font-mono">
          Loading learning library...
        </div>
      ) : documents.length === 0 ? (
        <div
          className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center select-none"
          data-testid="empty-library-view"
        >
          <div className="w-12 h-12 rounded-[14px] bg-[#141417] border border-[#27272A] flex items-center justify-center text-[#71717A] mb-3">
            <FileEdit className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1 tracking-tight">
            No Documents Yet
          </h3>
          <p className="text-xs text-[#71717A] max-w-sm mb-4 leading-relaxed">
            Your Library is ready for focused academic study and lecture synthesis notes.
          </p>
          <button
            onClick={() => createDocument()}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#E4E4E7] text-black text-xs font-medium rounded-[8px] transition-colors shadow-sm"
            data-testid="create-first-document-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Document</span>
          </button>
        </div>
      ) : (
        <LibraryEditorView />
      )}
    </div>
  );
};
