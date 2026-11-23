import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { LibraryItem } from '@sos/domain';
import { useLibraryStore } from '../../stores/library-store.js';
import { LibraryTypeIcon, formatBytes, formatDate } from './LibraryIconHelper.js';
import { humanizeTitle } from '../../utils/formatters.js';
import { InlineRenameField } from './InlineRenameField.js';

interface LibraryListViewProps {
  onOpenFile: (item: LibraryItem) => void;
  items?: LibraryItem[];
}

export const LibraryListView: React.FC<LibraryListViewProps> = ({ onOpenFile, items: propItems }) => {
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

  // Row height driven by Size mode
  const rowHeightClass = {
    S: 'h-9 py-1',
    M: 'h-12 py-2.5',
    L: 'h-[60px] py-3.5'
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
    const relY = e.clientY - rect.top;
    const height = rect.height;

    const isFolder = item.itemKind === 'folder';
    if (isFolder && relY > height * 0.25 && relY < height * 0.75) {
      setDragDropTarget({ targetId: item._id, edge: 'center' });
    } else {
      const edge = relY < height * 0.5 ? 'top' : 'bottom';
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
          const isBefore = currentTarget.edge === 'top';
          const insertIdx = isBefore ? targetIdx : targetIdx + 1;
          currentIds.splice(insertIdx, 0, draggedId);
          await reorderItems(currentIds);
        }
      }
    }
  };

  return (
    <div
      className="w-full rounded-xl border border-[#1E1E22] bg-[#0C0C0E] overflow-hidden select-none"
      data-testid="library-list-view"
    >
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#1E1E22] bg-[#09090B] text-[#8E8E93] font-mono text-[10.5px] uppercase tracking-wider">
            <th className="py-2.5 pl-4 pr-3 font-medium">Name</th>
            <th className="py-2.5 px-3 font-medium w-28">Type</th>
            <th className="py-2.5 px-3 font-medium w-32">Size / Items</th>
            <th className="py-2.5 px-3 font-medium w-32">Modified</th>
            <th className="py-2.5 pl-3 pr-4 text-right font-medium w-12" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1E1E22]/60">
          {items.map((item, index) => {
            const isFolder = item.itemKind === 'folder';
            const isSelected = selectedIds.includes(item._id);
            const isPrevSelected = index > 0 && selectedIds.includes(items[index - 1]._id);
            const isNextSelected = index < items.length - 1 && selectedIds.includes(items[index + 1]._id);
            const isRenaming = renamingItemId === item._id;
            const isCut =
              (clipboardItems?.mode === 'cut' && clipboardItems.items.some((i) => i._id === item._id)) ||
              (clipboardItem?.mode === 'cut' && clipboardItem.item._id === item._id);
            const isTarget = dragDropTarget?.targetId === item._id;
            const isCenterTarget = isTarget && dragDropTarget?.edge === 'center';
            const isTopTarget = isTarget && dragDropTarget?.edge === 'top';
            const isBottomTarget = isTarget && dragDropTarget?.edge === 'bottom';

            let sizeOrItemsText = '';
            if (isFolder) {
              const count = item.childCount ?? 0;
              sizeOrItemsText = `${count} ${count === 1 ? 'item' : 'items'}`;
            } else if (item.storage?.sizeBytes) {
              sizeOrItemsText = formatBytes(item.storage.sizeBytes);
            } else if (item.artifactData?.metrics?.cardCount) {
              sizeOrItemsText = `${item.artifactData.metrics.cardCount} cards`;
            } else if (item.artifactData?.metrics?.questionCount) {
              sizeOrItemsText = `${item.artifactData.metrics.questionCount} Qs`;
            } else if (item.artifactData?.metrics?.wordCount) {
              sizeOrItemsText = `${item.artifactData.metrics.wordCount} words`;
            } else {
              sizeOrItemsText = '—';
            }

            return (
              <tr
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
                className={`transition-colors cursor-pointer group relative ${rowHeightClass} ${
                  isSelected ? 'bg-[#60A5FA]/10 hover:bg-[#60A5FA]/15' : 'hover:bg-[#161619]/60'
                } ${
                  isCut ? 'opacity-50' : ''
                } ${
                  isSelected
                    ? `!border-l !border-r !border-[#60A5FA] hover:!border-l hover:!border-r hover:!border-[#60A5FA] ${
                        !isPrevSelected ? '!border-t !border-[#60A5FA] hover:!border-t hover:!border-[#60A5FA]' : 'border-t-0'
                      } ${
                        !isNextSelected ? '!border-b !border-[#60A5FA] hover:!border-b hover:!border-[#60A5FA]' : 'border-b border-[#60A5FA]/20'
                      }`
                    : ''
                } ${
                  isCenterTarget ? 'bg-[#1E1E24] ring-2 ring-[#60A5FA]' : ''
                }`}
                data-library-item
                data-library-item-id={item._id}
                data-testid={`library-list-row-${item._id}`}
              >
                {/* Top/Bottom Drop Indicator Line (simulated as cell overlay) */}
                {isTopTarget && (
                  <td colSpan={5} className="p-0 border-0 pointer-events-none">
                    <div className="absolute -top-[1px] left-0 right-0 h-[2px] bg-[#60A5FA] shadow-[0_0_8px_#60A5FA] rounded-full z-30" />
                  </td>
                )}
                {isBottomTarget && (
                  <td colSpan={5} className="p-0 border-0 pointer-events-none">
                    <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-[#60A5FA] shadow-[0_0_8px_#60A5FA] rounded-full z-30" />
                  </td>
                )}

                {/* NAME column */}
                <td className={`pl-4 pr-3 min-w-0 ${isSelected ? 'border-l border-[#60A5FA]' : ''}`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0 leading-none">
                      <LibraryTypeIcon type={item.fileType} icon={item.icon} size={15} />
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
                      <span className="text-[13px] font-medium leading-snug text-[#FAFAFA] font-sans truncate flex-1 min-w-0" title={item.name}>
                        {humanizeTitle(item.name)}
                      </span>
                    )}
                  </div>
                </td>

                {/* TYPE column */}
                <td className="px-3 font-mono text-[11px] text-[#8E8E93] uppercase">
                  {item.fileType}
                </td>

                {/* SIZE / ITEMS column */}
                <td className="px-3 font-mono text-[11px] text-[#A1A1AA] tnum">
                  {sizeOrItemsText}
                </td>

                {/* MODIFIED column */}
                <td className="px-3 font-mono text-[11px] text-[#8E8E93] tnum">
                  {formatDate(item.updatedAt)}
                </td>

                {/* ACTIONS column */}
                <td className={`pl-3 pr-4 text-right ${isSelected ? 'border-r border-[#60A5FA]' : ''}`}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      openItemContextMenu(rect.left, rect.bottom + 4, item);
                    }}
                    title="Options"
                    className="w-7 h-7 rounded-md inline-flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#222226] transition-colors"
                    data-testid={`item-menu-button-${item._id}`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
