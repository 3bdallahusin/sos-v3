import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  FolderPlus,
  Trash2,
  Folder,
  FolderOpen
} from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store.js';

export const LibrarySidebar: React.FC = () => {
  const {
    documents,
    folders,
    activeDocumentId,
    setActiveDocumentId,
    selectedFolderId,
    setSelectedFolderId,
    searchQuery,
    setSearchQuery,
    createDocument,
    deleteDocument,
    createFolder,
    deleteFolder
  } = useLibraryStore();

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    if (selectedFolderId && doc.folderId !== selectedFolderId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        doc.title.toLowerCase().includes(q) ||
        (doc.plainTextPreview && doc.plainTextPreview.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  return (
    <aside
      className="w-[260px] h-full shrink-0 border-r border-[#1F1F23] flex flex-col bg-[#09090B] select-none"
      data-testid="library-sidebar"
    >
      {/* Top Header */}
      <div className="p-3 border-b border-[#1F1F23] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
            Library Documents
          </span>
          <button
            onClick={() => createDocument()}
            className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-[#E4E4E7] text-black text-xs font-medium rounded-[6px] transition-colors shadow-sm"
            title="Create new document"
            data-testid="create-document-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#71717A] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full h-[28px] pl-8 pr-2.5 bg-[#141417] border border-[#27272A] focus:border-[#52525B] text-xs text-white placeholder-[#71717A] rounded-[6px] outline-none transition-colors"
            data-testid="document-search-input"
          />
        </div>
      </div>

      {/* Folders Bar */}
      <div className="px-3 py-2 border-b border-[#1F1F23] flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
            Folders
          </span>
          <button
            onClick={() => setIsCreatingFolder(!isCreatingFolder)}
            className="text-[10px] text-[#A1A1AA] hover:text-white flex items-center gap-1 transition-colors"
            title="Add folder"
          >
            <FolderPlus className="w-3 h-3" />
          </button>
        </div>

        {/* Folder Input Form */}
        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="flex items-center gap-1 my-1">
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="flex-1 h-[24px] px-2 bg-[#141417] border border-[#27272A] text-[11px] text-white rounded-[4px] outline-none"
            />
            <button
              type="submit"
              className="h-[24px] px-2 bg-[#27272A] hover:bg-[#3F3F46] text-white text-[11px] rounded-[4px]"
            >
              Add
            </button>
          </form>
        )}

        {/* Folder Pills */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono transition-colors ${
              selectedFolderId === null
                ? 'bg-[#27272A] text-white font-medium'
                : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-white'
            }`}
          >
            All ({documents.length})
          </button>
          {folders.map((f) => (
            <div key={f.id} className="group relative flex items-center">
              <button
                onClick={() => setSelectedFolderId(f.id)}
                className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono flex items-center gap-1 transition-colors ${
                  selectedFolderId === f.id
                    ? 'bg-[#27272A] text-white font-medium'
                    : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-white'
                }`}
              >
                <span>{f.icon || '📁'}</span>
                <span className="truncate max-w-[80px]">{f.name}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFolder(f.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-[#71717A] hover:text-[#EF4444] transition-opacity ml-0.5"
                title="Delete folder"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 min-h-0">
        {filteredDocs.length === 0 ? (
          <div className="py-8 px-2 text-center text-xs text-[#71717A]">
            No documents found
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isActive = doc.id === activeDocumentId;
            return (
              <div
                key={doc.id}
                onClick={() => setActiveDocumentId(doc.id)}
                className={`group relative p-2.5 rounded-[8px] cursor-pointer transition-all flex flex-col gap-1 ${
                  isActive
                    ? 'bg-[#18181B] text-white border border-[#27272A]'
                    : 'text-[#A1A1AA] hover:bg-[#141417] hover:text-white border border-transparent'
                }`}
                data-testid={`document-item-${doc.id}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-white' : 'text-[#71717A]'
                      }`}
                    />
                    <span className="text-xs font-semibold truncate tracking-tight">
                      {doc.title || 'Untitled Document'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDocument(doc.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#71717A] hover:text-[#EF4444] rounded-[4px] hover:bg-[#27272A] transition-all"
                    title="Delete document"
                    data-testid={`delete-doc-${doc.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {doc.plainTextPreview && (
                  <p className="text-[11px] text-[#71717A] line-clamp-1 leading-normal pl-5.5">
                    {doc.plainTextPreview}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-[#52525B] font-mono pl-5.5 pt-0.5">
                  <span>{doc.wordCount} words</span>
                  <span>{doc.updatedAt.slice(0, 10)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
