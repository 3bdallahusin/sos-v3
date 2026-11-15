import React from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  Clock,
  Trash2,
  FileText
} from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store.js';
import { SosEditor } from '@sos/editor';

export const LibraryEditorView: React.FC = () => {
  const {
    documents,
    activeDocumentId,
    isSidebarOpen,
    toggleSidebar,
    updateDocumentTitle,
    updateDocumentContent,
    deleteDocument,
    saveStatus
  } = useLibraryStore();

  const activeDoc = documents.find((d) => d.id === activeDocumentId);

  if (!activeDoc) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-[#09090B] text-center select-none">
        <FileText className="w-10 h-10 text-[#3F3F46] mb-3" />
        <h3 className="text-sm font-semibold text-white mb-1">
          No document selected
        </h3>
        <p className="text-xs text-[#71717A] max-w-sm">
          Select a document from the sidebar or create a new one to begin editing.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 h-full flex flex-col bg-[#09090B] overflow-hidden"
      data-testid="library-editor-view"
    >
      {/* Top Document Header Bar */}
      <div className="h-[48px] px-4 border-b border-[#1F1F23] flex items-center justify-between gap-3 bg-[#09090B] shrink-0 select-none z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-[#71717A] hover:text-white rounded-[6px] hover:bg-[#18181B] transition-colors shrink-0"
            title={isSidebarOpen ? 'Collapse library sidebar' : 'Expand library sidebar'}
            data-testid="toggle-library-sidebar"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          {/* Editable Document Title Input */}
          <input
            type="text"
            value={activeDoc.title}
            onChange={(e) => updateDocumentTitle(activeDoc.id, e.target.value)}
            placeholder="Untitled Document..."
            className="text-base font-semibold text-white bg-transparent outline-none truncate flex-1 tracking-tight placeholder-[#52525B] focus:border-b focus:border-[#3F3F46] transition-colors py-0.5"
            data-testid="active-document-title"
          />
        </div>

        {/* Right Status & Meta */}
        <div className="flex items-center gap-3 shrink-0 text-xs text-[#71717A] font-mono">
          {/* Save Status Indicator */}
          <div className="flex items-center gap-1.5" data-testid="save-status-indicator">
            {saveStatus === 'saving' ? (
              <span className="text-[11px] text-[#A1A1AA] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308] animate-pulse" />
                <span>Saving...</span>
              </span>
            ) : (
              <span className="text-[11px] text-[#10B981] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved</span>
              </span>
            )}
          </div>

          {/* Word Count & Read Time */}
          <span className="hidden sm:inline text-[11px] text-[#52525B]">
            {activeDoc.wordCount} words · {activeDoc.readTimeMinutes}m read
          </span>

          {/* Delete Action */}
          <button
            onClick={() => deleteDocument(activeDoc.id)}
            className="p-1.5 text-[#71717A] hover:text-[#EF4444] rounded-[6px] hover:bg-[#18181B] transition-colors"
            title="Delete document"
            data-testid="delete-active-doc"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Tiptap Editing Surface in Center Panel */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <SosEditor
          key={activeDoc.id}
          initialContent={activeDoc.content}
          onUpdate={(content, plainText, wordCount) => {
            updateDocumentContent(activeDoc.id, content, plainText, wordCount);
          }}
          placeholder="Start writing academic notes, synthesis, or lecture takeaways..."
        />
      </div>
    </div>
  );
};
