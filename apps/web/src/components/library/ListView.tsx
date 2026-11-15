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
  Trash2,
  HardDrive,
  Clock
} from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store.js';
import type { LibraryItem, LibraryItemType } from '@sos/domain';

interface ListViewProps {
  items: LibraryItem[];
}

export const ListView: React.FC<ListViewProps> = ({ items }) => {
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
        return <FileText className="w-4 h-4 text-[#A1A1AA]" />;
      case 'slides':
      case 'flashcards':
        return <Layers className="w-4 h-4 text-[#A1A1AA]" />;
      case 'notes':
      case 'page':
        return <FileCode className="w-4 h-4 text-[#A1A1AA]" />;
      case 'video':
        return <Video className="w-4 h-4 text-[#A1A1AA]" />;
      default:
        return <File className="w-4 h-4 text-[#A1A1AA]" />;
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="flex flex-col gap-1.5" data-testid="library-list-view">
      {items.map((item) => (
        <div
          key={item.id}
          className="group flex items-center justify-between p-3 rounded-[12px] bg-[#141417] border border-[#27272A] hover:border-[#52525B] transition-all cursor-pointer shadow-sm"
          onClick={() => {
            if (item.type === 'page' || item.type === 'notes') {
              openPageEditor(item);
            }
          }}
          data-testid={`library-list-row-${item.id}`}
        >
          {/* Left: Icon, Title & Subtitle */}
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
            <div className="w-8 h-8 rounded-[8px] bg-[#18181B] border border-[#27272A] flex items-center justify-center shrink-0">
              {getTypeIcon(item.type)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white tracking-tight truncate">
                  {item.title}
                </span>
                <span className="px-1.5 py-0.2 rounded-[4px] bg-[#27272A] text-[9px] font-mono text-[#A1A1AA] uppercase">
                  {item.type}
                </span>
              </div>
              {item.subtitle && (
                <p className="text-[11px] text-[#A1A1AA] truncate mt-0.5">
                  {item.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Meta Details & Menu */}
          <div className="flex items-center gap-4 text-xs text-[#71717A] font-mono shrink-0">
            {item.sizeBytes && (
              <span className="hidden sm:flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                <span>{formatSize(item.sizeBytes)}</span>
              </span>
            )}
            {item.readTimeMinutes && (
              <span className="hidden md:flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{item.readTimeMinutes} min</span>
              </span>
            )}
            <span className="hidden lg:inline">{item.updatedAt.slice(0, 10)}</span>

            {/* Menu */}
            <div className="relative" ref={activeMenuId === item.id ? menuRef : null}>
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
                <div className="absolute right-0 mt-1 w-44 rounded-[10px] bg-[#0E0E11] border border-[#27272A] shadow-xl py-1 z-50">
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
          </div>
        </div>
      ))}
    </div>
  );
};
