import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { FileText, FileCode, Layers, Video, Trash2 } from 'lucide-react';
import type { RecentStudyItem, StudyAssetType } from '@sos/domain';
import { SOSCard } from '../ui/SOSCard.js';
import { humanizeTitle } from '../../utils/formatters.js';

interface ContinueLearningSectionProps {
  items: RecentStudyItem[];
  onDeleteItem: (id: string) => void;
  onResumeItem?: (item: RecentStudyItem) => void;
}

const getAssetIcon = (type: StudyAssetType) => {
  switch (type) {
    case 'pdf':
      return FileText;
    case 'video':
      return Video;
    case 'notes':
      return FileCode;
    case 'flashcards':
      return Layers;
    default:
      return FileText;
  }
};

export const ContinueLearningSection: React.FC<ContinueLearningSectionProps> = ({
  items,
  onDeleteItem,
  onResumeItem
}) => {
  const navigate = useNavigate();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleResume = (item: RecentStudyItem) => {
    if (onResumeItem) {
      onResumeItem(item);
    } else {
      navigate({
        to: (item.path || '/learning') as any,
        search: { assetId: item.id, type: item.type } as any
      });
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Smooth slide-out + collapse animation
    setDeletingIds((prev) => new Set(prev).add(id));

    setTimeout(() => {
      onDeleteItem(id);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 240);
  };

  return (
    <SOSCard
      data-testid="continue-learning-section"
      className="h-[360px] px-4 py-4 flex flex-col"
      innerClassName="justify-between h-full flex flex-col"
    >
      <div>
        {/* Centered Section Header */}
        <div className="text-center pb-3 mb-2 border-b border-[#1E1E1E] select-none">
          <h3 className="text-[11px] uppercase text-[#A1A1AA] font-mono tracking-[0.1em] m-0">
            CONTINUE LEARNING
          </h3>
        </div>

        {/* 50% Full-Width Learning Rows */}
        <div className="flex flex-col space-y-1">
          {items.slice(0, 5).map((item) => {
            const Icon = getAssetIcon(item.type);
            const isDeleting = deletingIds.has(item.id);

            return (
              <div
                key={item.id}
                data-testid={`continue-item-${item.id}`}
                onClick={() => handleResume(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleResume(item);
                  }
                }}
                className={`sos-exec-row group/row h-[50px] px-3 flex items-center justify-between rounded-lg border border-transparent hover:border-[#2A2A2E] hover:bg-[#161619] transition-all cursor-pointer ${
                  isDeleting
                    ? 'translate-x-4 opacity-0 max-h-0 py-0 duration-140 overflow-hidden'
                    : 'duration-140'
                }`}
                style={{
                  transitionProperty: 'transform, opacity, max-height, padding, background-color, border-color',
                  transitionDuration: '140ms',
                  transitionTimingFunction: 'ease-out'
                }}
              >
                {/* Left: Icon Box + Full Untruncated Humanized File Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                  <div className="w-7 h-7 rounded-md bg-[#161619] border border-[#27272A] flex items-center justify-center text-[#A1A1AA] shrink-0 group-hover/row:border-[#3F3F46] group-hover/row:text-[#EDEDED] transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[13.5px] font-medium text-[#EDEDED] truncate flex-1 min-w-0 tracking-tight">
                    {humanizeTitle(item.title)}
                  </span>
                </div>

                {/* Right: Tabular Metadata with Hover Crossfade Swap to Trash */}
                <div className="relative flex items-center justify-end shrink-0 h-full">
                  {/* Default: Progress text (fades out on row hover) */}
                  <span className="text-[12px] font-mono text-[#A1A1AA] tabular-nums whitespace-nowrap opacity-100 group-hover/row:opacity-0 transition-opacity duration-150 pointer-events-auto group-hover/row:pointer-events-none select-none">
                    {item.subtitle}
                  </span>

                  {/* Row Hover: Destructive Red Trash Icon with Non-Clipped Tooltip */}
                  <div className="group/tooltip absolute right-0 flex items-center justify-center">
                    <button
                      type="button"
                      data-testid={`delete-recent-${item.id}`}
                      aria-label={`Remove ${humanizeTitle(item.title)}`}
                      onClick={(e) => handleDelete(e, item.id)}
                      className="flex items-center justify-center w-7 h-7 rounded-md text-[#71717A] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 opacity-0 group-hover/row:opacity-100 transition-all duration-150 pointer-events-none group-hover/row:pointer-events-auto cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-full right-0 mb-1.5 px-2 py-0.5 rounded-[6px] bg-[#1C1C21] border border-[#3F3F46] text-[11px] font-medium text-[#F4F4F5] whitespace-nowrap shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-140 pointer-events-none z-50">
                      Remove from recent
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SOSCard>
  );
};
