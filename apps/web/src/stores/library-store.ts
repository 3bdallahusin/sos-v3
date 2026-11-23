import { create } from 'zustand';
import type {
  LibraryItem,
  LibraryAncestor,
  SOSFileType,
  LibraryItemKind
} from '@sos/domain';
import {
  getLocalLibraryItems,
  saveLocalLibraryItem,
  bulkSaveLocalLibraryItems,
  deleteLocalLibraryItem,
  bulkDeleteLocalLibraryItems
} from '@sos/persistence';

export type LibraryViewMode = 'grid' | 'gallery' | 'list';
export type LibrarySizeMode = 'S' | 'M' | 'L';
export type LibraryFilterMode =
  | 'all'
  | 'folders'
  | 'files'
  | 'pdf'
  | 'docx'
  | 'slides'
  | 'note'
  | 'board'
  | 'video'
  | 'audio'
  | 'browser'
  | 'flashcards'
  | 'quiz'
  | 'exam';
export type LibrarySortBy = 'position' | 'name' | 'updatedAt' | 'size' | 'type';
export type LibrarySortOrder = 'asc' | 'desc';

export interface LibraryStoreState {
  items: LibraryItem[];
  breadcrumbs: LibraryAncestor[];
  activeFolderId: string | null;
  activeFolder: LibraryItem | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  // Layout Preferences (Persisted in localStorage)
  view: LibraryViewMode;
  size: LibrarySizeMode;
  filter: LibraryFilterMode;
  sortBy: LibrarySortBy;
  sortOrder: LibrarySortOrder;
  searchQuery: string;

  // Selected item(s) & Clipboard
  selectedIds: string[];
  lastSelectedId: string | null;
  selectedId: string | null;
  copiedItem: LibraryItem | null;
  clipboardItem: { item: LibraryItem; mode: 'copy' | 'cut' } | null;
  clipboardItems: { items: LibraryItem[]; mode: 'copy' | 'cut' } | null;
  renamingItemId: string | null;

  // Drag and drop reordering target indicator
  dragDropTarget: { targetId: string; edge: 'left' | 'right' | 'top' | 'bottom' | 'center' } | null;
  setDragDropTarget: (target: { targetId: string; edge: 'left' | 'right' | 'top' | 'bottom' | 'center' } | null) => void;

  // Modals & Popovers
  isViewPopoverOpen: boolean;
  isNewFolderModalOpen: boolean;
  isUploadModalOpen: boolean;
  isSetCoverModalOpen: boolean;
  isRenameModalOpen: boolean;
  modalTargetItem: LibraryItem | null;

  // Context Menus
  itemContextMenu: { x: number; y: number; item: LibraryItem } | null;
  canvasContextMenu: { x: number; y: number } | null;

  // Actions
  setView: (view: LibraryViewMode) => void;
  setSize: (size: LibrarySizeMode) => void;
  setFilter: (filter: LibraryFilterMode) => void;
  setSortBy: (sortBy: LibrarySortBy) => void;
  setSortOrder: (order: LibrarySortOrder) => void;
  setSearchQuery: (query: string) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelectId: (id: string) => void;
  selectRangeTo: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setRenamingItemId: (id: string | null) => void;
  toggleViewPopover: (open?: boolean) => void;

  // Modal Openers / Closers
  openNewFolderModal: () => void;
  closeNewFolderModal: () => void;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openSetCoverModal: (item: LibraryItem) => void;
  closeSetCoverModal: () => void;
  openRenameModal: (item: LibraryItem) => void;
  closeRenameModal: () => void;

  // Context Menu controls
  openItemContextMenu: (x: number, y: number, item: LibraryItem) => void;
  closeItemContextMenu: () => void;
  openCanvasContextMenu: (x: number, y: number) => void;
  closeCanvasContextMenu: () => void;

  // Data operations
  loadItems: (folderId?: string | null) => Promise<void>;
  navigateToFolder: (folderId: string | null) => Promise<void>;
  navigateUp: () => Promise<void>;
  createFolder: (name: string, icon?: string | null) => Promise<LibraryItem | null>;
  uploadFiles: (files: FileList | File[], onProgress?: (percent: number, loaded: number, total: number) => void) => Promise<LibraryItem[]>;
  renameItem: (id: string, newName: string) => Promise<void>;
  changeItemIcon: (id: string, icon: string | null) => Promise<void>;
  setItemCover: (id: string, coverFileOrUrl: File | string) => Promise<void>;
  removeItemCover: (id: string) => Promise<void>;
  moveItem: (id: string, targetParentId: string | null) => Promise<void>;
  moveItems: (ids: string[], targetParentId: string | null) => Promise<void>;
  reorderItems: (orderedIds: string[]) => Promise<void>;
  duplicateItem: (id: string, targetParentId?: string | null) => Promise<LibraryItem | null>;
  duplicateItems: (ids: string[], targetParentId?: string | null) => Promise<LibraryItem[]>;
  deleteItem: (id: string) => Promise<void>;
  deleteItems: (ids: string[]) => Promise<void>;
  cutItem: (item: LibraryItem) => void;
  cutItems: (items?: LibraryItem[]) => void;
  copyItem: (item: LibraryItem) => void;
  copyItems: (items?: LibraryItem[]) => void;
  clearClipboard: () => void;
  pasteItem: (targetFolderId?: string | null) => Promise<void>;
  pasteItems: (targetFolderId?: string | null) => Promise<void>;
}

const API_BASE = '/api/library';

export function filterAndSortLibraryItems(
  rawItems: LibraryItem[],
  activeFolderId: string | null,
  filter: LibraryFilterMode,
  searchQuery: string,
  sortBy: LibrarySortBy,
  sortOrder: LibrarySortOrder
): LibraryItem[] {
  const targetParent = activeFolderId === 'root' ? null : (activeFolderId || null);

  const filtered = rawItems.filter((item) => {
    // Exclude legacy seed/mock artifacts if present
    if (item._id === 'library-root' || item.id === 'library-root') return false;

    // ParentId matching
    const itemParent = item.parentId === 'root' ? null : (item.parentId || null);
    if (itemParent !== targetParent) return false;

    // Search query matching
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Kind and type filtering
    if (filter === 'all') return true;
    if (filter === 'folders') return item.itemKind === 'folder';
    if (filter === 'files') return item.itemKind === 'file';
    if (filter === 'pdf') return item.fileType === 'pdf';
    if (filter === 'docx') return ['docx', 'doc', 'txt', 'md'].includes(item.fileType);
    if (filter === 'slides') return ['slides', 'pptx', 'ppt'].includes(item.fileType);
    if (filter === 'note') return item.fileType === 'note';
    if (filter === 'board') return item.fileType === 'board';
    if (filter === 'video') return item.fileType === 'video';
    if (filter === 'audio') return item.fileType === 'audio';
    if (filter === 'browser') return item.fileType === 'browser';
    if (filter === 'flashcards') return item.fileType === 'flashcards';
    if (filter === 'quiz') return item.fileType === 'quiz';
    if (filter === 'exam') return item.fileType === 'exam';
    return true;
  });

  // Sort: Folders always first when filter === 'all'
  filtered.sort((a, b) => {
    if (filter === 'all' && a.itemKind !== b.itemKind) {
      return a.itemKind === 'folder' ? -1 : 1;
    }
    let cmp = 0;
    if (sortBy === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else if (sortBy === 'updatedAt') {
      cmp = (new Date(b.updatedAt).getTime() || 0) - (new Date(a.updatedAt).getTime() || 0);
    } else if (sortBy === 'size') {
      cmp = (b.storage?.sizeBytes || 0) - (a.storage?.sizeBytes || 0);
    } else if (sortBy === 'type') {
      cmp = (a.fileType || '').localeCompare(b.fileType || '');
    } else {
      const posA = a.position ?? 0;
      const posB = b.position ?? 0;
      cmp = posA !== posB ? posA - posB : a.name.localeCompare(b.name);
    }
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  return filtered;
}

function getInitialLibraryCache(): { items: LibraryItem[]; isHydrated: boolean } {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('sos_library_cache_root');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { items: parsed, isHydrated: true };
        }
      }
    } catch {}
  }
  return { items: [], isHydrated: false };
}

export const useLibraryStore = create<LibraryStoreState>((set, get) => {
  const initialView =
    typeof window !== 'undefined'
      ? ((localStorage.getItem('sos_library_view') as LibraryViewMode) || 'grid')
      : 'grid';
  const initialSize =
    typeof window !== 'undefined'
      ? ((localStorage.getItem('sos_library_size') as LibrarySizeMode) || 'M')
      : 'M';
  const initialCache = getInitialLibraryCache();

  return {
    items: initialCache.items,
    breadcrumbs: [],
    activeFolderId: null,
    activeFolder: null,
    isLoading: !initialCache.isHydrated,
    isHydrated: initialCache.isHydrated,
    error: null,

    view: initialView,
    size: initialSize,
    filter: 'all',
    sortBy: 'position',
    sortOrder: 'asc',
    searchQuery: '',

    selectedIds: [],
    lastSelectedId: null,
    selectedId: null,
    copiedItem: null,
    clipboardItem: null,
    clipboardItems: null,
    renamingItemId: null,

    dragDropTarget: null,
    setDragDropTarget: (target) => set({ dragDropTarget: target }),

    isViewPopoverOpen: false,
    isNewFolderModalOpen: false,
    isUploadModalOpen: false,
    isSetCoverModalOpen: false,
    isRenameModalOpen: false,
    modalTargetItem: null,

    itemContextMenu: null,
    canvasContextMenu: null,

    setView: (view: LibraryViewMode) => {
      set({ view, isViewPopoverOpen: false });
      if (typeof window !== 'undefined') {
        localStorage.setItem('sos_library_view', view);
      }
    },

    setSize: (size: LibrarySizeMode) => {
      set({ size });
      if (typeof window !== 'undefined') {
        localStorage.setItem('sos_library_size', size);
      }
    },

    setFilter: (filter: LibraryFilterMode) => {
      set({ filter });
      get().loadItems(get().activeFolderId);
    },

    setSortBy: (sortBy: LibrarySortBy) => {
      set({ sortBy });
      get().loadItems(get().activeFolderId);
    },

    setSortOrder: (sortOrder: LibrarySortOrder) => {
      set({ sortOrder });
      get().loadItems(get().activeFolderId);
    },

    setSearchQuery: (searchQuery: string) => {
      set({ searchQuery });
      get().loadItems(get().activeFolderId);
    },

    setSelectedId: (selectedId: string | null) =>
      set({
        selectedId,
        selectedIds: selectedId ? [selectedId] : [],
        lastSelectedId: selectedId
      }),

    setSelectedIds: (selectedIds: string[]) =>
      set({
        selectedIds,
        selectedId: selectedIds[0] || null,
        lastSelectedId: selectedIds[selectedIds.length - 1] || null
      }),

    toggleSelectId: (id: string) => {
      const { selectedIds } = get();
      const exists = selectedIds.includes(id);
      const newSelected = exists ? selectedIds.filter((i) => i !== id) : [...selectedIds, id];
      set({
        selectedIds: newSelected,
        selectedId: newSelected[0] || null,
        lastSelectedId: id
      });
    },

    selectRangeTo: (id: string) => {
      const { items, lastSelectedId, selectedIds } = get();
      if (!lastSelectedId) {
        set({ selectedIds: [id], selectedId: id, lastSelectedId: id });
        return;
      }
      const anchorIdx = items.findIndex((i) => i._id === lastSelectedId);
      const targetIdx = items.findIndex((i) => i._id === id);
      if (anchorIdx === -1 || targetIdx === -1) {
        set({ selectedIds: [id], selectedId: id, lastSelectedId: id });
        return;
      }
      const start = Math.min(anchorIdx, targetIdx);
      const end = Math.max(anchorIdx, targetIdx);
      const range = items.slice(start, end + 1).map((i) => i._id);
      const union = Array.from(new Set([...selectedIds, ...range]));
      set({ selectedIds: union, selectedId: id, lastSelectedId: id });
    },

    selectAll: () => {
      const { items } = get();
      const allIds = items.map((i) => i._id);
      set({
        selectedIds: allIds,
        selectedId: allIds[0] || null,
        lastSelectedId: allIds[allIds.length - 1] || null
      });
    },

    clearSelection: () => {
      set({ selectedIds: [], selectedId: null, lastSelectedId: null });
    },

    setRenamingItemId: (renamingItemId: string | null) => set({ renamingItemId }),

    toggleViewPopover: (open?: boolean) => {
      set((state) => ({
        isViewPopoverOpen: open !== undefined ? open : !state.isViewPopoverOpen
      }));
    },

    openNewFolderModal: () => set({ isNewFolderModalOpen: true }),
    closeNewFolderModal: () => set({ isNewFolderModalOpen: false }),

    openUploadModal: () => set({ isUploadModalOpen: true }),
    closeUploadModal: () => set({ isUploadModalOpen: false }),

    openSetCoverModal: (item: LibraryItem) =>
      set({ isSetCoverModalOpen: true, modalTargetItem: item }),
    closeSetCoverModal: () => set({ isSetCoverModalOpen: false, modalTargetItem: null }),

    openRenameModal: (item: LibraryItem) =>
      set({ renamingItemId: item._id, isRenameModalOpen: false, modalTargetItem: item }),
    closeRenameModal: () => set({ isRenameModalOpen: false, modalTargetItem: null }),

    openItemContextMenu: (x: number, y: number, item: LibraryItem) => {
      const { selectedIds } = get();
      const isAlreadySelected = selectedIds.includes(item._id);
      const newSelectedIds = isAlreadySelected ? selectedIds : [item._id];
      set({
        itemContextMenu: { x, y, item },
        canvasContextMenu: null,
        selectedIds: newSelectedIds,
        selectedId: item._id,
        lastSelectedId: item._id
      });
    },
    closeItemContextMenu: () => set({ itemContextMenu: null }),

    openCanvasContextMenu: (x: number, y: number) => {
      set({
        canvasContextMenu: { x, y },
        itemContextMenu: null
      });
    },
    closeCanvasContextMenu: () => set({ canvasContextMenu: null }),

    loadItems: async (folderId?: string | null) => {
      const activeId = folderId !== undefined ? folderId : get().activeFolderId;
      const { filter, sortBy, sortOrder, searchQuery, isHydrated } = get();
      set({ isLoading: !isHydrated, error: null });

      try {
        const cached = await getLocalLibraryItems(activeId);
        if (cached && cached.length > 0) {
          const filteredCached = filterAndSortLibraryItems(cached, activeId, filter, searchQuery, sortBy, sortOrder);
          if (filteredCached.length > 0) {
            set({ items: filteredCached, isHydrated: true });
          }
        }
      } catch {
        // Continue
      }

      try {
        const params = new URLSearchParams();
        if (activeId) params.set('parentId', activeId);
        if (searchQuery) params.set('search', searchQuery);
        if (filter !== 'all') params.set('filter', filter);
        if (sortBy) params.set('sortBy', sortBy);
        if (sortOrder) params.set('sortOrder', sortOrder);

        const url = `${API_BASE}/items?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch library items (${res.status})`);
        const data = await res.json();

        const filteredFetched = filterAndSortLibraryItems(
          data.items || [],
          activeId,
          filter,
          searchQuery,
          sortBy,
          sortOrder
        );

        set({
          items: filteredFetched,
          breadcrumbs: data.breadcrumbs || [],
          isLoading: false,
          isHydrated: true
        });

        if (!activeId && typeof window !== 'undefined') {
          try {
            localStorage.setItem('sos_library_cache_root', JSON.stringify(filteredFetched));
          } catch {}
        }

        if (data.items && data.items.length > 0) {
          await bulkSaveLocalLibraryItems(data.items);
        }
      } catch (err: any) {
        console.warn('Network fetch error, retaining local items:', err);
        set({ isLoading: false, isHydrated: true, error: err.message });
      }
    },

    navigateToFolder: async (folderId: string | null) => {
      const targetId = folderId === 'root' || !folderId ? null : folderId;
      set({
        activeFolderId: targetId,
        selectedId: null,
        itemContextMenu: null,
        canvasContextMenu: null
      });
      await get().loadItems(targetId);
    },

    navigateUp: async () => {
      const { breadcrumbs } = get();
      if (breadcrumbs.length <= 1) {
        await get().navigateToFolder(null);
      } else {
        const parentSegment = breadcrumbs[breadcrumbs.length - 2];
        await get().navigateToFolder(parentSegment._id);
      }
    },

    createFolder: async (name: string, icon?: string | null) => {
      const { activeFolderId } = get();
      try {
        const res = await fetch(`${API_BASE}/folders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            parentId: activeFolderId,
            icon: icon || '📁'
          })
        });

        if (!res.ok) throw new Error('Failed to create folder');
        const newFolder: LibraryItem = await res.json();

        set((state) => ({
          items: [newFolder, ...state.items],
          selectedId: newFolder._id,
          renamingItemId: null
        }));
        await saveLocalLibraryItem(newFolder);
        return newFolder;
      } catch (err: any) {
        console.error('Error creating folder:', err);
        return null;
      }
    },

    uploadFiles: async (files: FileList | File[], onProgress) => {
      const { activeFolderId } = get();
      const formData = new FormData();
      if (activeFolderId) formData.append('parentId', activeFolderId);

      const fileArray = Array.from(files);
      for (const f of fileArray) {
        formData.append('file', f);
      }

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/upload`);

        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent, e.loaded, e.total);
            }
          };
        }

        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resp = JSON.parse(xhr.responseText);
              const createdItems: LibraryItem[] = resp.items || [];
              set((state) => ({ items: [...createdItems, ...state.items], error: null }));
              await bulkSaveLocalLibraryItems(createdItems);
              resolve(createdItems);
            } catch (parseErr) {
              reject(parseErr);
            }
          } else {
            let errorMsg = `Upload failed (${xhr.status})`;
            try {
              const errObj = JSON.parse(xhr.responseText);
              if (errObj.error) errorMsg = errObj.error;
            } catch {}
            set({ error: errorMsg });
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => {
          const errorMsg = 'Upload network connection error';
          set({ error: errorMsg });
          reject(new Error(errorMsg));
        };
        xhr.send(formData);
      });
    },

    renameItem: async (id: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;

      set((state) => ({
        items: state.items.map((i) => (i._id === id ? { ...i, name: trimmed } : i))
      }));

      try {
        const res = await fetch(`${API_BASE}/items/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed })
        });
        if (!res.ok) throw new Error('Rename failed');
        const updated: LibraryItem = await res.json();
        await saveLocalLibraryItem(updated);
      } catch (err) {
        console.error('Error renaming item:', err);
      }
    },

    changeItemIcon: async (id: string, icon: string | null) => {
      set((state) => ({
        items: state.items.map((i) => (i._id === id ? { ...i, icon } : i))
      }));

      try {
        const res = await fetch(`${API_BASE}/items/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ icon })
        });
        if (!res.ok) throw new Error('Change icon failed');
        const updated: LibraryItem = await res.json();
        await saveLocalLibraryItem(updated);
      } catch (err) {
        console.error('Error changing icon:', err);
      }
    },

    setItemCover: async (id: string, coverFileOrUrl: File | string) => {
      try {
        let res: Response;
        if (typeof coverFileOrUrl === 'string') {
          res = await fetch(`${API_BASE}/items/${id}/cover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coverUrl: coverFileOrUrl })
          });
        } else {
          const formData = new FormData();
          formData.append('cover', coverFileOrUrl);
          res = await fetch(`${API_BASE}/items/${id}/cover`, {
            method: 'POST',
            body: formData
          });
        }

        if (!res.ok) throw new Error('Set cover failed');
        const updated: LibraryItem = await res.json();
        set((state) => ({
          items: state.items.map((i) =>
            i._id === id ? { ...i, coverImage: updated.coverImage } : i
          )
        }));
        await saveLocalLibraryItem(updated);
      } catch (err) {
        console.error('Error setting cover:', err);
      }
    },

    removeItemCover: async (id: string) => {
      set((state) => ({
        items: state.items.map((i) => (i._id === id ? { ...i, coverImage: null } : i))
      }));

      try {
        const res = await fetch(`${API_BASE}/items/${id}/cover`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Remove cover failed');
        const updated: LibraryItem = await res.json();
        await saveLocalLibraryItem(updated);
      } catch (err) {
        console.error('Error removing cover:', err);
      }
    },

    moveItem: async (id: string, targetParentId: string | null) => {
      await get().moveItems([id], targetParentId);
    },

    moveItems: async (ids: string[], targetParentId: string | null) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      if (targetParentId && idSet.has(targetParentId)) {
        alert('Cannot move an item into itself');
        return;
      }

      try {
        await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`${API_BASE}/items/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ parentId: targetParentId })
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              console.warn(`Move failed for item ${id}:`, data.error);
            }
          })
        );
        await get().loadItems(get().activeFolderId);
      } catch (err: any) {
        alert(err.message || 'Cannot move items');
      }
    },

    reorderItems: async (orderedIds: string[]) => {
      const { activeFolderId, items } = get();
      const itemMap = new Map(items.map((item) => [item._id, item]));
      const reordered: LibraryItem[] = [];
      for (let idx = 0; idx < orderedIds.length; idx++) {
        const it = itemMap.get(orderedIds[idx]);
        if (it) {
          reordered.push({ ...it, position: idx });
          itemMap.delete(orderedIds[idx]);
        }
      }
      for (const remaining of itemMap.values()) {
        reordered.push(remaining);
      }
      set({ items: reordered });

      try {
        const res = await fetch(`${API_BASE}/items/reorder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentId: activeFolderId, orderedIds })
        });
        if (!res.ok) throw new Error('Reorder failed');
        await bulkSaveLocalLibraryItems(reordered);
      } catch (err) {
        console.error('Error reordering library items:', err);
      }
    },

    duplicateItem: async (id: string, targetParentId?: string | null) => {
      const copies = await get().duplicateItems([id], targetParentId);
      return copies[0] || null;
    },

    duplicateItems: async (ids: string[], targetParentId?: string | null) => {
      if (ids.length === 0) return [];
      const destination = targetParentId !== undefined ? targetParentId : get().activeFolderId;
      const copies: LibraryItem[] = [];

      try {
        await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`${API_BASE}/items/${id}/duplicate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ parentId: destination })
            });
            if (res.ok) {
              const copy: LibraryItem = await res.json();
              copies.push(copy);
              await saveLocalLibraryItem(copy);
            }
          })
        );

        if (copies.length > 0) {
          set((state) => ({ items: [...copies, ...state.items] }));
        }
        return copies;
      } catch (err) {
        console.error('Error duplicating items:', err);
        return [];
      }
    },

    deleteItem: async (id: string) => {
      await get().deleteItems([id]);
    },

    deleteItems: async (ids: string[]) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      set((state) => ({
        items: state.items.filter((i) => !idSet.has(i._id)),
        selectedIds: state.selectedIds.filter((i) => !idSet.has(i)),
        selectedId: state.selectedId && idSet.has(state.selectedId) ? null : state.selectedId
      }));

      await bulkDeleteLocalLibraryItems(ids);

      try {
        await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' });
            if (!res.ok) console.warn(`Delete failed for item ${id}`);
          })
        );
      } catch (err) {
        console.error('Error deleting items:', err);
      }
    },

    cutItem: (item: LibraryItem) => {
      get().cutItems([item]);
    },

    cutItems: (itemsToCut?: LibraryItem[]) => {
      const { items, selectedIds } = get();
      const targetItems = itemsToCut && itemsToCut.length > 0
        ? itemsToCut
        : items.filter((i) => selectedIds.includes(i._id));
      if (targetItems.length === 0) return;

      set({
        clipboardItems: { items: targetItems, mode: 'cut' },
        clipboardItem: { item: targetItems[0], mode: 'cut' },
        copiedItem: targetItems[0]
      });
    },

    copyItem: (item: LibraryItem) => {
      get().copyItems([item]);
    },

    copyItems: (itemsToCopy?: LibraryItem[]) => {
      const { items, selectedIds } = get();
      const targetItems = itemsToCopy && itemsToCopy.length > 0
        ? itemsToCopy
        : items.filter((i) => selectedIds.includes(i._id));
      if (targetItems.length === 0) return;

      set({
        clipboardItems: { items: targetItems, mode: 'copy' },
        clipboardItem: { item: targetItems[0], mode: 'copy' },
        copiedItem: targetItems[0]
      });
    },

    clearClipboard: () => {
      set({ clipboardItems: null, clipboardItem: null, copiedItem: null });
    },

    pasteItem: async (targetFolderId?: string | null) => {
      await get().pasteItems(targetFolderId);
    },

    pasteItems: async (targetFolderId?: string | null) => {
      const { clipboardItems, activeFolderId } = get();
      if (!clipboardItems || clipboardItems.items.length === 0) return;
      const destination = targetFolderId !== undefined ? targetFolderId : activeFolderId;

      if (clipboardItems.mode === 'cut') {
        const ids = clipboardItems.items.map((i) => i._id);
        await get().moveItems(ids, destination);
        set({ clipboardItems: null, clipboardItem: null, copiedItem: null });
      } else {
        const ids = clipboardItems.items.map((i) => i._id);
        await get().duplicateItems(ids, destination);
      }
    }
  };
});
