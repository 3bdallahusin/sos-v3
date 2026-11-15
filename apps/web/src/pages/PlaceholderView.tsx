import React from 'react';
import type { LucideIcon } from 'lucide-react';

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
      className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto"
    >
      <div className="w-14 h-14 rounded-[20px] bg-[#141417] border border-[#2A2A30] flex items-center justify-center text-[#FAFAFA] mb-4 shadow-sm">
        <Icon className="w-7 h-7 text-[#A1A1AA]" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141417] border border-[#2A2A30] text-[11px] font-mono text-[#F97316] mb-3">
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
              className="px-2.5 py-1 rounded-[10px] bg-[#0C0C0E] border border-[#222226] text-[11px] text-[#A1A1AA]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
