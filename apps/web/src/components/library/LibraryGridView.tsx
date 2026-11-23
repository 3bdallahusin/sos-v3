import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { LibraryItem } from '@sos/domain';
import { useLibraryStore } from '../../stores/library-store.js';
import { LibraryTypeIcon, formatItemMetadata } from './LibraryIconHelper.js';
import { SOSCard } from '../ui/SOSCard.js';
import { humanizeTitle } from '../../utils/formatters.js';
import { InlineRenameField } from './InlineRenameField.js';

interface LibraryGridViewProps {
  onOpenFile: (item: LibraryItem) => void;
  items?: LibraryItem[];
}

export const LibraryGridView: React.FC<LibraryGridViewProps> = ({ onOpenFile, items: propItems }) => {
  const {
    items: storeItems,
    size,
    selectedIds,
    setSelectedIds,
    toggleSelectId,
    selectRangeTo,
    clipboardItem,
    clipboardItems,
    dragDropTarget,
    setDragDropTarget,
    renamingItemId,
    setRenamingItemId,
    renameItem,
    navigateToFolder,
    openItemContextMenu,
    moveItem,
    moveItems,
    reorderItems
  } = useLibraryStore();

  const items = propItems ?? storeItems;

  // Column responsiveness based on Size toggle
  const gridColClass = {
    S: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
    M: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    L: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
  }[size];

  const handleDragStart = (e: React.DragEvent, item: LibraryItem) => {
    if (selectedIds.includes(item._id) && selectedIds.length > 1) {
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'multi', ids: selectedIds }));
      e.dataTransfer.setData('text/plain', item._id);
    } else {
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'single', id: item._id }));
      e.dataTransfer.setData('text/plain', item._id);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, item: LibraryItem) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    const isFolder = item.itemKind === 'folder';
    if (isFolder && relX > width * 0.25 && relX < width * 0.75 && relY > height * 0.25 && relY < height * 0.75) {
      setDragDropTarget({ targetId: item._id, edge: 'center' });
    } else {
      const edge = relX < width * 0.5 ? 'left' : 'right';
      setDragDropTarget({ targetId: item._id, edge });
    }
  };

  const handleDragLeave = (e: React.DragEvent, item: LibraryItem) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragDropTarget?.targetId === item._id) {
      setDragDropTarget(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetItem: LibraryItem) => {
    e.preventDefault();
    const currentTarget = dragDropTarget;
    setDragDropTarget(null);

    let dragPayload: { type: 'single' | 'multi'; id?: string; ids?: string[] } | null = null;
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) dragPayload = JSON.parse(raw);
    } catch {}

    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId && !dragPayload) return;

    if (currentTarget?.targetId === targetItem._id) {
      if (currentTarget.edge === 'center' && targetItem.itemKind === 'folder') {
        if (dragPayload?.type === 'multi' && dragPayload.ids) {
          await moveItems(dragPayload.ids, targetItem._id);
        } else {
          await moveItem(dragPayload?.id || draggedId, targetItem._id);
        }
        return;
      }

      // Edge drop -> reorder
      if (draggedId && draggedId !== targetItem._id) {
        const currentIds = items.map((i) => i._id).filter((id) => id !== draggedId);
        const targetIdx = currentIds.indexOf(targetItem._id);
        if (targetIdx !== -1) {
          const insertIdx = currentTarget.edge === 'right' ? targetIdx + 1 : targetIdx;
          currentIds.splice(insertIdx, 0, draggedId);
          await reorderItems(currentIds);
        }
      }
    }
  };

  return (
    <div className={`grid ${gridColClass} gap-3.5`} data-testid="library-grid-view">
      {items.map((item) => {
        const isFolder = item.itemKind === 'folder';
        const isSelected = selectedIds.includes(item._id);
        const isRenaming = renamingItemId === item._id;
        const isCut =
          (clipboardItems?.mode === 'cut' && clipboardItems.items.some((i) => i._id === item._id)) ||
          (clipboardItem?.mode === 'cut' && clipboardItem.item._id === item._id);
        const isTarget = dragDropTarget?.targetId === item._id;
        const isCenterTarget = isTarget && dragDropTarget?.edge === 'center';
        const isLeftTarget = isTarget && dragDropTarget?.edge === 'left';
        const isRightTarget = isTarget && dragDropTarget?.edge === 'right';

        return (
          <SOSCard
            key={item._id}
            draggable={!isRenaming}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) => handleDragOver(e, item)}
            onDragLeave={(e) => handleDragLeave(e, item)}
            onDrop={(e) => handleDrop(e, item)}
            onClick={(e) => {
              e.stopPropagation();
              if (isRenaming) return;

              if (e.ctrlKey || e.metaKey) {
                toggleSelectId(item._id);
                return;
              }
              if (e.shiftKey) {
                selectRangeTo(item._id);
                return;
              }

              setSelectedIds([item._id]);
              if (isFolder) {
                navigateToFolder(item._id);
              } else {
                onOpenFile(item);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openItemContextMenu(e.clientX, e.clientY, item);
            }}
            selected={isSelected}
            className={`p-3.5 flex flex-col justify-between cursor-pointer relative group select-none transition-all ${
              isCut ? 'opacity-50' : ''
            } ${
              isSelected ? '!border-[#60A5FA] bg-[#60A5FA]/10' : ''
            } ${
              isCenterTarget ? '!bg-[#1E1E24] border-[#60A5FA] ring-2 ring-[#60A5FA]/30' : ''
            }`}
            data-library-item
            data-library-item-id={item._id}
            data-testid={`library-item-${item._id}`}
          >
            {/* Left Edge Drop Indicator Line */}
            {isLeftTarget && (
              <div className="absolute -left-2 top-0 bottom-0 w-[2px] bg-[#60A5FA] shadow-[0_0_8px_#60A5FA] rounded-full z-30 pointer-events-none" />
            )}

            {/* Right Edge Drop Indicator Line */}
            {isRightTarget && (
              <div className="absolute -right-2 top-0 bottom-0 w-[2px] bg-[#60A5FA] shadow-[0_0_8px_#60A5FA] rounded-full z-30 pointer-events-none" />
            )}
              {/* Row 1: Icon + Title / InlineRenameField */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="shrink-0 leading-none">
                  <LibraryTypeIcon type={item.fileType} icon={item.icon} className="w-3.5 h-3.5" size={14} />
                </div>
                {isRenaming ? (
                  <InlineRenameField
                    item={item}
                    className="flex-1 min-w-0"
                    inputClassName="text-[13px] font-medium leading-snug text-[#FAFAFA] font-sans"
                    onCommit={(newName) => {
                      renameItem(item._id, newName);
                      setRenamingItemId(null);
                    }}
                    onCancel={() => setRenamingItemId(null)}
                  />
                ) : (
                  <h3
                    className="text-[13px] font-medium leading-snug text-[#FAFAFA] font-sans truncate flex-1 min-w-0"
                    title={item.name}
                  >
                    {humanizeTitle(item.name)}
                  </h3>
                )}
              </div>

              {/* Row 2: Metadata left-aligned under the icon with ZERO left padding + ... Options button on bottom-right */}
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <span className="font-mono text-[11px] text-[#8E8E93] tnum truncate pr-1">
                  {formatItemMetadata(item)}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    openItemContextMenu(rect.left, rect.bottom + 4, item);
                  }}
                  title="Options"
                  className="w-5 h-5 rounded flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1E1E22] transition-colors shrink-0"
                  data-testid={`item-menu-button-${item._id}`}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </SOSCard>
        );
      })}
    </div>
  );
};
