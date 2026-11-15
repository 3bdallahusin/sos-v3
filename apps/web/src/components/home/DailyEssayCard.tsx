import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface DailyEssayCardProps {
  title?: string;
  readTime?: string;
  summary?: string;
  onClick?: () => void;
}

export const DailyEssayCard: React.FC<DailyEssayCardProps> = ({
  title = 'On the Architecture of Deep Memory & Forgetting',
  readTime = '3 MIN READ',
  summary = 'Why deliberate retrieval beats passive re-reading in building durable mental models.',
  onClick
}) => {
  return (
    <div
      data-testid="daily-essay-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="w-full bg-[#111114] border border-[#1F1F23] hover:border-[#2E2E33] rounded-2xl px-6 py-3.5 md:px-7 md:py-3.5 shadow-sm flex flex-col cursor-pointer transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-[#3F3F46]"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-[#71717A] font-mono uppercase tracking-[0.12em]">
          DAILY ESSAY
        </span>
        <div className="flex items-center gap-1 text-[11px] font-mono text-[#71717A] uppercase tracking-wider group-hover:text-[#F4F4F5] transition-colors">
          <span>{readTime}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>

      <h2 className="text-[18px] md:text-[19.5px] font-semibold text-[#F4F4F5] tracking-[-0.02em] leading-[1.2] group-hover:text-white transition-colors mb-1">
        {title}
      </h2>

      <p className="text-[13px] text-[#8E8E93] leading-[1.4] m-0 font-normal">
        {summary}
      </p>
    </div>
  );
};
