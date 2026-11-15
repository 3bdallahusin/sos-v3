import { create } from 'zustand';
import type {
  LibraryFolder,
  LibraryItem,
  LibraryViewMode,
  LibraryCardSize,
  LibraryItemType
} from '@sos/domain';
import {
  loadLibraryFolders,
  saveLibraryFolder,
  deleteLibraryFolder,
  loadLibraryItems,
  saveLibraryItem,
  deleteLibraryItem,
  moveLibraryItem,
  getShellPreference,
  setShellPreference
} from '@sos/persistence';

interface LibraryStoreState {
  folders: LibraryFolder[];
  items: LibraryItem[];
  currentFolderId: string | null;
  viewMode: LibraryViewMode;
  cardSize: LibraryCardSize;
  searchQuery: string;
  isLoading: boolean;

  // Modals & UI controls
  isFolderModalOpen: boolean;
  editingFolder: LibraryFolder | null;
  isPageEditorOpen: boolean;
  editingItem: LibraryItem | null;
  isBackupModalOpen: boolean;
  deleteConfirmTarget: { type: 'folder' | 'item'; id: string; name: string } | null;

  // Actions
  loadLibraryData: () => Promise<void>;
  setCurrentFolderId: (id: string | null) => void;
  setViewMode: (mode: LibraryViewMode) => Promise<void>;
  setCardSize: (size: LibraryCardSize) => Promise<void>;
  setSearchQuery: (query: string) => void;

  createFolder: (data: {
    name: string;
    icon?: string;
    color?: string;
    description?: string;
    coverUrl?: string;
    parentId?: string | null;
  }) => Promise<LibraryFolder>;
  updateFolder: (id: string, updates: Partial<LibraryFolder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  createItem: (data: Partial<LibraryItem> & { title: string; type: LibraryItemType }) => Promise<LibraryItem>;
  updateItem: (id: string, updates: Partial<LibraryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  moveItem: (id: string, targetFolderId: string | null) => Promise<void>;

  openFolderModal: (folder?: LibraryFolder | null) => void;
  closeFolderModal: () => void;
  openPageEditor: (item?: LibraryItem | null) => void;
  closePageEditor: () => void;
  openBackupModal: () => void;
  closeBackupModal: () => void;
  openDeleteConfirm: (target: { type: 'folder' | 'item'; id: string; name: string }) => void;
  closeDeleteConfirm: () => void;
}

export const useLibraryStore = create<LibraryStoreState>((set, get) => ({
  folders: [],
  items: [],
  currentFolderId: 'folder-synaptic-plasticity',
  viewMode: 'gallery',
  cardSize: 'normal',
  searchQuery: '',
  isLoading: true,

  isFolderModalOpen: false,
  editingFolder: null,
  isPageEditorOpen: false,
  editingItem: null,
  isBackupModalOpen: false,
  deleteConfirmTarget: null,

  loadLibraryData: async () => {
    try {
      set({ isLoading: true });
      const [savedViewMode, savedCardSize, folders, items] = await Promise.all([
        getShellPreference<LibraryViewMode>('library:viewMode', 'gallery'),
        getShellPreference<LibraryCardSize>('library:cardSize', 'normal'),
        loadLibraryFolders(),
        loadLibraryItems()
      ]);

      // If current folder does not exist, default to first folder or null
      let currentFolder = get().currentFolderId;
      if (currentFolder && !folders.some(f => f.id === currentFolder)) {
        currentFolder = folders.length > 0 ? folders[0].id : null;
      } else if (!currentFolder && folders.length > 0) {
        currentFolder = folders[0].id;
      }

      set({
        folders,
        items,
        viewMode: savedViewMode,
        cardSize: savedCardSize,
        currentFolderId: currentFolder,
        isLoading: false
      });
    } catch (err) {
      console.warn('Failed to load library data:', err);
      set({ isLoading: false });
    }
  },

  setCurrentFolderId: (id: string | null) => {
    set({ currentFolderId: id });
  },

  setViewMode: async (mode: LibraryViewMode) => {
    set({ viewMode: mode });
    await setShellPreference('library:viewMode', mode);
  },

  setCardSize: async (size: LibraryCardSize) => {
    set({ cardSize: size });
    await setShellPreference('library:cardSize', size);
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  createFolder: async (data) => {
    const now = new Date().toISOString();
    const newFolder: LibraryFolder = {
      id: `folder-${Date.now()}`,
      workspaceId: 'default-workspace',
      parentId: data.parentId !== undefined ? data.parentId : get().currentFolderId,
      name: data.name.trim() || 'Untitled Folder',
      icon: data.icon || '📁',
      coverUrl: data.coverUrl || '',
      color: data.color || '#3F3F46',
      description: data.description || '',
      summaryBlocks: [],
      order: get().folders.length,
      createdAt: now,
      updatedAt: now
    };

    set(state => ({
      folders: [...state.folders, newFolder],
      currentFolderId: newFolder.id
    }));

    await saveLibraryFolder(newFolder);
    return newFolder;
  },

  updateFolder: async (id, updates) => {
    const now = new Date().toISOString();
    const existing = get().folders.find(f => f.id === id);
    if (!existing) return;

    const updated: LibraryFolder = {
      ...existing,
      ...updates,
      updatedAt: now
    };

    set(state => ({
      folders: state.folders.map(f => (f.id === id ? updated : f))
    }));

    await saveLibraryFolder(updated);
  },

  deleteFolder: async (id: string) => {
    const nextFolders = get().folders.filter(f => f.id !== id && f.parentId !== id);
    const nextItems = get().items.filter(item => item.folderId !== id);
    let nextCurrent = get().currentFolderId;

    if (nextCurrent === id) {
      nextCurrent = nextFolders.length > 0 ? nextFolders[0].id : null;
    }

    set({
      folders: nextFolders,
      items: nextItems,
      currentFolderId: nextCurrent
    });

    await deleteLibraryFolder(id, true);
  },

  createItem: async (data) => {
    const now = new Date().toISOString();
    const newItem: LibraryItem = {
      id: `item-${Date.now()}`,
      workspaceId: 'default-workspace',
      folderId: data.folderId !== undefined ? data.folderId : get().currentFolderId,
      title: data.title.trim() || 'Untitled Asset',
      type: data.type,
      subtitle: data.subtitle || '',
      coverUrl: data.coverUrl,
      icon: data.icon,
      sizeBytes: data.sizeBytes,
      readTimeMinutes: data.readTimeMinutes,
      assetPath: data.assetPath,
      content: data.content,
      metadata: data.metadata,
      createdAt: now,
      updatedAt: now
    };

    set(state => ({
      items: [newItem, ...state.items]
    }));

    await saveLibraryItem(newItem);
    return newItem;
  },

  updateItem: async (id, updates) => {
    const now = new Date().toISOString();
    const existing = get().items.find(i => i.id === id);
    if (!existing) return;

    const updated: LibraryItem = {
      ...existing,
      ...updates,
      updatedAt: now
    };

    set(state => ({
      items: state.items.map(i => (i.id === id ? updated : i))
    }));

    await saveLibraryItem(updated);
  },

  deleteItem: async (id: string) => {
    set(state => ({
      items: state.items.filter(i => i.id !== id)
    }));
    await deleteLibraryItem(id);
  },

  moveItem: async (id, targetFolderId) => {
    const now = new Date().toISOString();
    set(state => ({
      items: state.items.map(i =>
        i.id === id ? { ...i, folderId: targetFolderId, updatedAt: now } : i
      )
    }));
    await moveLibraryItem(id, targetFolderId);
  },

  openFolderModal: (folder = null) => {
    set({ isFolderModalOpen: true, editingFolder: folder });
  },

  closeFolderModal: () => {
    set({ isFolderModalOpen: false, editingFolder: null });
  },

  openPageEditor: (item = null) => {
    set({ isPageEditorOpen: true, editingItem: item });
  },

  closePageEditor: () => {
    set({ isPageEditorOpen: false, editingItem: null });
  },

  openBackupModal: () => {
    set({ isBackupModalOpen: true });
  },

  closeBackupModal: () => {
    set({ isBackupModalOpen: false });
  },

  openDeleteConfirm: (target) => {
    set({ deleteConfirmTarget: target });
  },

  closeDeleteConfirm: () => {
    set({ deleteConfirmTarget: null });
  }
}));
