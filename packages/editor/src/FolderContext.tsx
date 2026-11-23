import React, { createContext, useContext } from 'react';
import type { LibraryFolder, LibraryFile, StudyAssetType } from '@sos/domain';

export interface FolderContextValue {
  currentFolderId: string;
  folders: LibraryFolder[];
  files: LibraryFile[];
  selectedIds?: Set<string>;
  onSelectIds?: (ids: Set<string>) => void;
  onOpenFolder?: (folderId: string) => void;
  onOpenFile?: (file: LibraryFile) => void;
  onCreateFolder?: (name?: string, parentId?: string) => Promise<LibraryFolder>;
  onCreateFile?: (title: string, type: StudyAssetType, folderId?: string, sizeFormatted?: string) => Promise<LibraryFile>;
  onUpdateFolder?: (folder: Partial<LibraryFolder> & { id: string }) => Promise<void>;
  onUpdateFile?: (file: Partial<LibraryFile> & { id: string }) => Promise<void>;
  onDeleteFolder?: (folderId: string) => Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<void>;
}

export const FolderEditorContext = createContext<FolderContextValue | null>(null);

export function useFolderEditorContext(): FolderContextValue {
  const ctx = useContext(FolderEditorContext);
  if (!ctx) {
    return {
      currentFolderId: 'library-root',
      folders: [],
      files: []
    };
  }
  return ctx;
}

export const FolderEditorProvider: React.FC<{
  value: FolderContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <FolderEditorContext.Provider value={value}>
      {children}
    </FolderEditorContext.Provider>
  );
};
