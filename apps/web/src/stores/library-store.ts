import { create } from 'zustand';
import type { LibraryDocument, LibraryFolder } from '@sos/domain';
import {
  loadLibraryDocuments,
  saveLibraryDocument,
  deleteLibraryDocument,
  loadLibraryFolders,
  saveLibraryFolder,
  deleteLibraryFolder,
  getShellPreference,
  setShellPreference
} from '@sos/persistence';

interface LibraryStoreState {
  documents: LibraryDocument[];
  folders: LibraryFolder[];
  activeDocumentId: string | null;
  selectedFolderId: string | null;
  searchQuery: string;
  isSidebarOpen: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  isLoading: boolean;

  loadLibraryData: () => Promise<void>;
  setActiveDocumentId: (id: string | null) => void;
  setSelectedFolderId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;

  createDocument: (folderId?: string | null, title?: string) => Promise<LibraryDocument>;
  updateDocumentContent: (
    id: string,
    content: Record<string, unknown>,
    plainText: string,
    wordCount: number
  ) => Promise<void>;
  updateDocumentTitle: (id: string, title: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  createFolder: (name: string, icon?: string) => Promise<LibraryFolder>;
  deleteFolder: (id: string) => Promise<void>;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useLibraryStore = create<LibraryStoreState>((set, get) => ({
  documents: [],
  folders: [],
  activeDocumentId: null,
  selectedFolderId: null,
  searchQuery: '',
  isSidebarOpen: true,
  saveStatus: 'saved',
  isLoading: true,

  loadLibraryData: async () => {
    try {
      set({ isLoading: true });
      const [savedSidebarOpen, docs, folders] = await Promise.all([
        getShellPreference<boolean>('library:sidebarOpen', true),
        loadLibraryDocuments(),
        loadLibraryFolders()
      ]);

      let activeId = get().activeDocumentId;
      if (!activeId && docs.length > 0) {
        activeId = docs[0].id;
      } else if (activeId && !docs.some((d) => d.id === activeId)) {
        activeId = docs.length > 0 ? docs[0].id : null;
      }

      set({
        documents: docs,
        folders,
        activeDocumentId: activeId,
        isSidebarOpen: savedSidebarOpen,
        isLoading: false
      });
    } catch (err) {
      console.warn('Failed to load library data:', err);
      set({ isLoading: false });
    }
  },

  setActiveDocumentId: (id: string | null) => {
    set({ activeDocumentId: id });
  },

  setSelectedFolderId: (id: string | null) => {
    set({ selectedFolderId: id });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  toggleSidebar: () => {
    const next = !get().isSidebarOpen;
    set({ isSidebarOpen: next });
    setShellPreference('library:sidebarOpen', next);
  },

  createDocument: async (folderId = null, title = 'Untitled Document') => {
    const now = new Date().toISOString();
    const newDoc: LibraryDocument = {
      id: `doc-${Date.now()}`,
      workspaceId: 'default-workspace',
      folderId: folderId !== undefined ? folderId : get().selectedFolderId,
      title: title.trim() || 'Untitled Document',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: title.trim() || 'Untitled Document' }]
          },
          {
            type: 'paragraph'
          }
        ]
      },
      plainTextPreview: '',
      wordCount: 0,
      readTimeMinutes: 1,
      createdAt: now,
      updatedAt: now
    };

    set((state) => ({
      documents: [newDoc, ...state.documents],
      activeDocumentId: newDoc.id
    }));

    await saveLibraryDocument(newDoc);
    return newDoc;
  },

  updateDocumentContent: async (id, content, plainText, wordCount) => {
    const now = new Date().toISOString();
    const existing = get().documents.find((d) => d.id === id);
    if (!existing) return;

    const readTimeMinutes = Math.max(1, Math.round(wordCount / 180));
    const plainTextPreview = plainText.slice(0, 160).trim();

    const updated: LibraryDocument = {
      ...existing,
      content,
      plainTextPreview,
      wordCount,
      readTimeMinutes,
      updatedAt: now
    };

    set((state) => ({
      documents: state.documents.map((d) => (d.id === id ? updated : d)),
      saveStatus: 'saving'
    }));

    // Debounce persistence write to Dexie
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      try {
        await saveLibraryDocument(updated);
        set({ saveStatus: 'saved' });
      } catch (err) {
        console.warn('Failed to save document content to Dexie:', err);
        set({ saveStatus: 'unsaved' });
      }
    }, 400);
  },

  updateDocumentTitle: async (id, title) => {
    const now = new Date().toISOString();
    const existing = get().documents.find((d) => d.id === id);
    if (!existing) return;

    const updated: LibraryDocument = {
      ...existing,
      title,
      updatedAt: now
    };

    set((state) => ({
      documents: state.documents.map((d) => (d.id === id ? updated : d)),
      saveStatus: 'saving'
    }));

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      try {
        await saveLibraryDocument(updated);
        set({ saveStatus: 'saved' });
      } catch (err) {
        console.warn('Failed to save document title to Dexie:', err);
        set({ saveStatus: 'unsaved' });
      }
    }, 300);
  },

  deleteDocument: async (id: string) => {
    const nextDocs = get().documents.filter((d) => d.id !== id);
    let nextActive = get().activeDocumentId;

    if (nextActive === id) {
      nextActive = nextDocs.length > 0 ? nextDocs[0].id : null;
    }

    set({
      documents: nextDocs,
      activeDocumentId: nextActive
    });

    await deleteLibraryDocument(id);
  },

  createFolder: async (name, icon = '📁') => {
    const now = new Date().toISOString();
    const newFolder: LibraryFolder = {
      id: `folder-${Date.now()}`,
      workspaceId: 'default-workspace',
      name: name.trim() || 'New Folder',
      icon,
      color: '#3F3F46',
      createdAt: now,
      updatedAt: now
    };

    set((state) => ({
      folders: [...state.folders, newFolder],
      selectedFolderId: newFolder.id
    }));

    await saveLibraryFolder(newFolder);
    return newFolder;
  },

  deleteFolder: async (id: string) => {
    const nextFolders = get().folders.filter((f) => f.id !== id);
    const nextDocs = get().documents.map((d) =>
      d.folderId === id ? { ...d, folderId: null, updatedAt: new Date().toISOString() } : d
    );
    const nextSelected = get().selectedFolderId === id ? null : get().selectedFolderId;

    set({
      folders: nextFolders,
      documents: nextDocs,
      selectedFolderId: nextSelected
    });

    await deleteLibraryFolder(id);
  }
}));
