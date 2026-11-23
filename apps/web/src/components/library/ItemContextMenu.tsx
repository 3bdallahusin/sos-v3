import React, { useEffect, useRef } from 'react';
import {
  ExternalLink,
  ImagePlus,
  Edit3,
  Copy,
  Scissors,
  Trash2
} from 'lucide-react';
import type { LibraryItem } from '@sos/domain';
import { useLibraryStore } from '../../stores/library-store.js';

interface ItemContextMenuProps {
  onOpenFile: (item: LibraryItem) => void;
}

export const ItemContextMenu: React.FC<ItemContextMenuProps> = ({ onOpenFile }) => {
  const {
    itemContextMenu,
    closeItemContextMenu,
    navigateToFolder,
    openSetCoverModal,
    setRenamingItemId,
    duplicateItem,
    duplicateItems,
    deleteItem,
    deleteItems,
    cutItem,
    cutItems,
    copyItem,
    copyItems,
    selectedIds
  } = useLibraryStore();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeItemContextMenu();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeItemContextMenu]);

  if (!itemContextMenu) return null;

  const { x, y, item } = itemContextMenu;
  const isFolder = item.itemKind === 'folder';
  const isMulti = selectedIds.length > 1 && selectedIds.includes(item._id);

  // Ensure menu stays within viewport
  const menuWidth = 190;
  const menuHeight = isMulti ? 180 : 240;
  const safeX = Math.min(x, window.innerWidth - menuWidth - 10);
  const safeY = Math.min(y, window.innerHeight - menuHeight - 10);

  return (
    <div
      ref={menuRef}
      style={{ top: `${safeY}px`, left: `${safeX}px` }}
      className="fixed w-[190px] bg-[#111113] border border-[#27272A] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 select-none"
      data-testid="item-context-menu"
      onClick={(e) => e.stopPropagation()}
    >
      {isMulti ? (
        <>
          <button
            type="button"
            onClick={() => {
              closeItemContextMenu();
              copyItems();
            }}
            className="w-full px-2.5 py-1.5 rounded-md hover:bg-white/[0.06] text-left text-xs font-medium text-[#FAFAFA] flex items-center gap-2 transition-colors"
            data-testid="context-menu-copy"
          >
            <Copy className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Copy ({selectedIds.length} items)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeItemContextMenu();
              cutItems();
            }}
            className="w-full px-2.5 py-1.5 rounded-md hover:bg-white/[0.06] text-left text-xs font-medium text-[#FAFAFA] flex items-center gap-2 transition-colors"
            data-testid="context-menu-cut"
          >
            <Scissors className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Cut ({selectedIds.length} items)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeItemContextMenu();
              duplicateItems(selectedIds);
            }}
            className="w-full px-2.5 py-1.5 rounded-md hover:bg-white/[0.06] text-left text-xs font-medium text-[#FAFAFA] flex items-center gap-2 transition-colors"
            data-testid="context-menu-duplicate"
          >
            <Copy className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Duplicate ({selectedIds.length} items)</span>
          </button>

          <div className="border-t border-[#27272A] my-1" />

          <button
            type="button"
            onClick={() => {
              closeItemContextMenu();
              deleteItems(selectedIds);
            }}
            className="w-full px-2.5 py-1.5 rounded-md hover:bg-red-500/10 text-left text-xs font-medium text-red-400 flex items-center gap-2 transition-colors"
            data-testid="context-menu-delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Delete ({selectedIds.length} items)</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              closeItemContextMenu();
              if (isFolder) {
                navigateToFolder(item._id);
              } else {
                onOpenFile(item);
              }
            }}
            className="w-full px-2.5 py-1.5 rounded-md hover:bg-white/[0.06] text-left text-xs font-medium text-[#FAFAFA] flex items-center gap-2 transition-colors"
            data-testid="context-menu-open"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Open</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeItemContextMenu();
              openSetCoverModal(item);
            }}
            className="w-full px-2.5 py-1.5 rounded-md hover:bg-white/[0.06] text-left text-xs font-medium text-[#FAFAFA] flex items-center gap-2 transition-colors"
            data-testid="context-menu-set-cover"
          >
            <ImagePlus className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Set Cover</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeItemContextMenu();
              setRenamingItemId(item._id);
            }}
            className="w-full px-2.5 py-1.5 rounded-md hover:bg-white/[0.06] text-left text-xs font-medium text-[#FAFAFA] flex items-center gap-2 transition-colors"
            data-testid="context-menu-rename"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Rename</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeItemContextMenu();
              cutItem(item);
            }}
            className="w-full px-2.5 py-1.5 rounded-md hover:bg-white/[0.06] text-left text-xs font-medium text-[#FAFAFA] flex items-center gap-2 transition-colors"
            data-testid="context-menu-cut"
          >
            <Scissors className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Cut</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeItemContextMenu();
              copyItem(item);
            }}
            className="w-full px-2.5 py-1.5 rounded-md hover:bg-white/[0.06] text-left text-xs font-medium text-[#FAFAFA] flex items-center gap-2 transition-colors"
            data-testid="context-menu-copy"
          >
            <Copy className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Copy</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeItemContextMenu();
              duplicateItem(item._id);
            }}
            className="w-full px-2.5 py-1.5 rounded-md hover:bg-white/[0.06] text-left text-xs font-medium text-[#FAFAFA] flex items-center gap-2 transition-colors"
            data-testid="context-menu-duplicate"
          >
            <Copy className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Duplicate</span>
          </button>

          <div className="border-t border-[#27272A] my-1" />

          <button
            type="button"
            onClick={() => {
              closeItemContextMenu();
              deleteItem(item._id);
            }}
            className="w-full px-2.5 py-1.5 rounded-md hover:bg-red-500/10 text-left text-xs font-medium text-red-400 flex items-center gap-2 transition-colors"
            data-testid="context-menu-delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Delete</span>
          </button>
        </>
      )}
    </div>
  );
};
