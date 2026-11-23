import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { SOSCard } from '../components/ui/SOSCard.js';

interface PlaceholderViewProps {
  phase: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tags?: string[];
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  phase,
  title,
  description,
  icon: Icon,
  tags = []
}) => {
  return (
    <div
      data-testid={`placeholder-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 md:px-8 md:py-6 flex flex-col items-center bg-[#09090B]"
    >
      <div className="w-[92%] max-w-[1360px] flex flex-col items-center justify-center min-h-[70vh]">
        <SOSCard
          tier={1}
          className="max-w-lg w-full p-8 shadow-xl text-center"
          innerClassName="flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 rounded-xl bg-[#161619] border border-[#242428] flex items-center justify-center text-[#FAFAFA] mb-4 shadow-sm">
            <Icon className="w-7 h-7 text-[#A1A1AA]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161619] border border-[#242428] text-[11px] font-mono text-[#F97316] mb-3">
            <span>{phase}</span>
          </div>

          <h2 className="text-lg font-semibold text-[#FAFAFA] mb-1.5">{title}</h2>
          <p className="text-xs text-[#71717A] leading-relaxed mb-6 max-w-sm">
            {description}
          </p>

          {tags.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-[#161619] border border-[#242428] text-[11px] text-[#A1A1AA]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </SOSCard>
      </div>
    </div>
  );
};
