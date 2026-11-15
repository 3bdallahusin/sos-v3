import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Layers,
  FileCode,
  Video,
  File,
  MoreVertical,
  Edit,
  FolderInput,
  Trash2
} from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store.js';
import type { LibraryItem, LibraryItemType } from '@sos/domain';

interface TableViewProps {
  items: LibraryItem[];
}

export const TableView: React.FC<TableViewProps> = ({ items }) => {
  const {
    openPageEditor,
    openDeleteConfirm,
    folders,
    moveItem
  } = useLibraryStore();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [moveMenuId, setMoveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
        setMoveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTypeIcon = (type: LibraryItemType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-[#A1A1AA]" />;
      case 'slides':
      case 'flashcards':
        return <Layers className="w-3.5 h-3.5 text-[#A1A1AA]" />;
      case 'notes':
      case 'page':
        return <FileCode className="w-3.5 h-3.5 text-[#A1A1AA]" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-[#A1A1AA]" />;
      default:
        return <File className="w-3.5 h-3.5 text-[#A1A1AA]" />;
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return 'Root';
    const folder = folders.find((f) => f.id === folderId);
    return folder ? `${folder.icon || '📁'} ${folder.name}` : 'Unknown';
  };

  return (
    <div className="w-full overflow-x-auto rounded-[12px] border border-[#27272A] bg-[#141417] shadow-sm select-none" data-testid="library-table-view">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-[#27272A] bg-[#18181B] text-[#71717A] text-[10px] font-mono uppercase tracking-wider">
            <th className="py-2.5 px-3.5 font-medium">Name</th>
            <th className="py-2.5 px-3.5 font-medium">Type</th>
            <th className="py-2.5 px-3.5 font-medium">Size</th>
            <th className="py-2.5 px-3.5 font-medium">Duration</th>
            <th className="py-2.5 px-3.5 font-medium">Folder</th>
            <th className="py-2.5 px-3.5 font-medium">Modified</th>
            <th className="py-2.5 px-3.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1F1F23]">
          {items.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-[#18181B]/80 transition-colors cursor-pointer group"
              onClick={() => {
                if (item.type === 'page' || item.type === 'notes') {
                  openPageEditor(item);
                }
              }}
              data-testid={`library-table-row-${item.id}`}
            >
              {/* Name */}
              <td className="py-2.5 px-3.5 text-white font-medium">
                <div className="flex items-center gap-2 max-w-[280px]">
                  <span className="shrink-0">{getTypeIcon(item.type)}</span>
                  <span className="truncate">{item.title}</span>
                </div>
              </td>

              {/* Type */}
              <td className="py-2.5 px-3.5 text-[#A1A1AA] uppercase font-mono text-[10px]">
                {item.type}
              </td>

              {/* Size */}
              <td className="py-2.5 px-3.5 text-[#71717A] font-mono text-[11px]">
                {formatSize(item.sizeBytes)}
              </td>

              {/* Duration */}
              <td className="py-2.5 px-3.5 text-[#71717A] font-mono text-[11px]">
                {item.readTimeMinutes ? `${item.readTimeMinutes}m` : '-'}
              </td>

              {/* Folder */}
              <td className="py-2.5 px-3.5 text-[#A1A1AA] text-[11px] truncate max-w-[140px]">
                {getFolderName(item.folderId)}
              </td>

              {/* Modified */}
              <td className="py-2.5 px-3.5 text-[#71717A] font-mono text-[11px]">
                {item.updatedAt.slice(0, 10)}
              </td>

              {/* Actions */}
              <td className="py-2.5 px-3.5 text-right">
                <div
                  className="relative inline-block"
                  ref={activeMenuId === item.id ? menuRef : null}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === item.id ? null : item.id);
                      setMoveMenuId(null);
                    }}
                    className="p-1 text-[#71717A] hover:text-white rounded-[4px] hover:bg-[#27272A] transition-colors"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {activeMenuId === item.id && (
                    <div className="absolute right-0 mt-1 w-44 rounded-[10px] bg-[#0E0E11] border border-[#27272A] shadow-xl py-1 z-50 text-left">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(null);
                          openPageEditor(item);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#E4E4E7] hover:bg-[#18181B] transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#A1A1AA]" />
                        <span>Edit item</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMoveMenuId(moveMenuId === item.id ? null : item.id);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-[#E4E4E7] hover:bg-[#18181B] transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FolderInput className="w-3.5 h-3.5 text-[#A1A1AA]" />
                          <span>Move to...</span>
                        </span>
                      </button>

                      {moveMenuId === item.id && (
                        <div className="px-2 py-1 bg-[#141417] border-y border-[#1F1F23] flex flex-col gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveItem(item.id, null);
                              setActiveMenuId(null);
                              setMoveMenuId(null);
                            }}
                            className="text-[11px] text-left px-2 py-1 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-[4px]"
                          >
                            🗂️ All Resources (Root)
                          </button>
                          {folders.map((f) => (
                            <button
                              key={f.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveItem(item.id, f.id);
                                setActiveMenuId(null);
                                setMoveMenuId(null);
                              }}
                              className="text-[11px] text-left px-2 py-1 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-[4px] truncate"
                            >
                              {f.icon || '📁'} {f.name}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="border-t border-[#1F1F23] my-1" />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(null);
                          openDeleteConfirm({
                            type: 'item',
                            id: item.id,
                            name: item.title
                          });
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#EF4444] hover:bg-[#18181B] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete item</span>
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
