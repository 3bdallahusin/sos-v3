import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Layers,
  FileCode,
  Video,
  File,
  Plus,
  MoreVertical,
  Edit,
  FolderInput,
  Trash2,
  Clock,
  HardDrive
} from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store.js';
import type { LibraryItem, LibraryItemType } from '@sos/domain';

interface GalleryViewProps {
  items: LibraryItem[];
}

export const GalleryView: React.FC<GalleryViewProps> = ({ items }) => {
  const {
    cardSize,
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
        return <FileText className="w-3.5 h-3.5 text-[#E4E4E7]" />;
      case 'slides':
      case 'flashcards':
        return <Layers className="w-3.5 h-3.5 text-[#E4E4E7]" />;
      case 'notes':
      case 'page':
        return <FileCode className="w-3.5 h-3.5 text-[#E4E4E7]" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-[#E4E4E7]" />;
      default:
        return <File className="w-3.5 h-3.5 text-[#E4E4E7]" />;
    }
  };

  const getTypeBadgeLabel = (type: LibraryItemType) => {
    switch (type) {
      case 'pdf':
        return 'PDF';
      case 'slides':
        return 'DECK';
      case 'flashcards':
        return 'CARDS';
      case 'notes':
        return 'NOTES';
      case 'page':
        return 'PAGE';
      case 'video':
        return 'VIDEO';
      case 'audio':
        return 'AUDIO';
      default:
        return 'DOC';
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  const getThumbnailHeight = () => {
    switch (cardSize) {
      case 'compact':
        return 'h-[85px]';
      case 'spacious':
        return 'h-[145px]';
      case 'normal':
      default:
        return 'h-[115px]';
    }
  };

  return (
    <div
      className={`grid gap-3.5 ${
        cardSize === 'compact'
          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4'
          : cardSize === 'spacious'
          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3'
      }`}
      data-testid="library-gallery-grid"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative rounded-[14px] bg-[#141417] border border-[#27272A] hover:border-[#52525B] overflow-hidden transition-all flex flex-col shadow-sm cursor-pointer"
          onClick={() => {
            if (item.type === 'page' || item.type === 'notes') {
              openPageEditor(item);
            }
          }}
          data-testid={`library-card-${item.id}`}
        >
          {/* Thumbnail / Header Area */}
          <div
            className={`w-full ${getThumbnailHeight()} relative overflow-hidden bg-[#18181B] border-b border-[#1F1F23] shrink-0`}
          >
            {item.coverUrl ? (
              <img
                src={item.coverUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#18181B] to-[#0E0E11] text-[#3F3F46]">
                <div className="p-3 rounded-full bg-[#27272A]/50">
                  {getTypeIcon(item.type)}
                </div>
              </div>
            )}

            {/* Type Badge */}
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-[6px] bg-[#09090B]/80 backdrop-blur-md border border-[#27272A] text-[10px] font-mono font-medium text-white tracking-wider">
              {getTypeBadgeLabel(item.type)}
            </div>
          </div>

          {/* Card Body */}
          <div className="p-3 flex-1 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0">{getTypeIcon(item.type)}</span>
                  <h3
                    className="text-xs font-semibold text-white truncate tracking-tight"
                    title={item.title}
                  >
                    {item.title}
                  </h3>
                </div>

                {/* Context Menu Trigger */}
                <div className="relative shrink-0" ref={activeMenuId === item.id ? menuRef : null}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === item.id ? null : item.id);
                      setMoveMenuId(null);
                    }}
                    className="p-1 text-[#71717A] hover:text-white rounded-[4px] hover:bg-[#27272A] transition-colors"
                    title="More actions"
                    data-testid={`card-menu-trigger-${item.id}`}
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown Menu */}
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

                      {/* Move to Folder */}
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

              {item.subtitle && (
                <p className="text-[11px] text-[#A1A1AA] line-clamp-2 mt-1 leading-normal">
                  {item.subtitle}
                </p>
              )}
            </div>

            {/* Bottom Metadata */}
            <div className="pt-2 border-t border-[#1F1F23]/60 flex items-center justify-between text-[10px] text-[#71717A] font-mono">
              <div className="flex items-center gap-1">
                {item.sizeBytes && (
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    <span>{formatSize(item.sizeBytes)}</span>
                  </span>
                )}
                {item.readTimeMinutes && (
                  <span className="flex items-center gap-1 ml-2">
                    <Clock className="w-3 h-3" />
                    <span>{item.readTimeMinutes} min</span>
                  </span>
                )}
              </div>
              <span>{item.updatedAt.slice(0, 10)}</span>
            </div>
          </div>
        </div>
      ))}

      {/* + New page slot matching Stitch */}
      <div
        onClick={() => openPageEditor()}
        className="rounded-[14px] border border-dashed border-[#27272A] hover:border-[#71717A] bg-[#141417]/40 hover:bg-[#141417] transition-all p-4 flex flex-col items-center justify-center min-h-[170px] cursor-pointer text-[#71717A] hover:text-white group select-none shadow-sm"
        data-testid="gallery-add-new-slot"
      >
        <div className="w-10 h-10 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#71717A] group-hover:text-white group-hover:border-[#52525B] transition-colors mb-2">
          <Plus className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium tracking-tight">New page</span>
        <span className="text-[10px] text-[#71717A] mt-0.5">
          Create markdown notes or page
        </span>
      </div>
    </div>
  );
};
