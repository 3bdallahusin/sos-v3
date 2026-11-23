import React from 'react';
import { Link } from '@tanstack/react-router';
import { FileText, Video, FileCode, Layers, ArrowRight } from 'lucide-react';
import type { RecentStudyItem, StudyAssetType } from '@sos/domain';
import { humanizeTitle } from '../../utils/formatters.js';

interface QuickResumeSectionProps {
  items: RecentStudyItem[];
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

export const QuickResumeSection: React.FC<QuickResumeSectionProps> = ({ items }) => {
  return (
    <div
      data-testid="quick-resume-section"
      className="h-full bg-[#111114] border border-[#1F1F23] hover:border-[#27272A] rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-colors"
    >
      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#18181B]">
          <span className="text-[10px] text-[#71717A] font-mono uppercase tracking-[0.1em]">
            CONTINUE WHERE YOU LEFT OFF
          </span>
        </div>

        {/* 4 Spacious Resume Rows without divider lines */}
        <div className="flex flex-col space-y-1.5">
          {items.map((item) => {
            const Icon = getAssetIcon(item.type);
            return (
              <Link
                key={item.id}
                to={item.path || '/learning'}
                search={{ assetId: item.id } as any}
                data-testid={`resume-item-${item.id}`}
                className="px-2.5 py-2 flex items-center justify-between text-[13px] group/item transition-colors hover:bg-[#18181B]/70 rounded-[8px]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#161619] border border-[#242428] flex items-center justify-center text-[#A1A1AA] shrink-0 group-hover/item:border-[#38383E] group-hover/item:text-[#F4F4F5] transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0 gap-0.5">
                    <span className="text-[#F4F4F5] font-medium truncate text-[13px] group-hover/item:text-white transition-colors">
                      {humanizeTitle(item.title)}
                    </span>
                    <span className="text-[11.5px] text-[#71717A] truncate font-normal">
                      {item.subtitle}
                    </span>
                  </div>
                </div>
                <div className="flex items-center shrink-0 ml-3">
                  <ArrowRight className="w-3.5 h-3.5 text-[#52525B] group-hover/item:text-[#F4F4F5] transition-colors duration-140 ease-out" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
