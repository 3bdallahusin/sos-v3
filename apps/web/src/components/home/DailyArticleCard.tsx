import React from 'react';
import { SOSCard } from '../ui/SOSCard.js';

interface DailyArticleCardProps {
  title?: string;
  summary?: string;
  onClick?: () => void;
}

export const DailyArticleCard: React.FC<DailyArticleCardProps> = ({
  title = 'On the Architecture of Deep Memory & Forgetting',
  summary = 'Why deliberate retrieval beats passive re-reading in building durable mental models.',
  onClick
}) => {
  return (
    <SOSCard
      data-testid="daily-article-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="h-[112px] px-8 py-4 cursor-pointer group"
      innerClassName="w-full h-full flex flex-col items-center justify-center text-center"
    >
      <span className="text-[10px] text-[#A1A1AA] font-mono uppercase tracking-[0.1em] mb-1 group-hover:text-[#EDEDED] transition-colors text-center">
        DAILY ARTICLE
      </span>
      <h2 className="w-full text-[17px] font-bold text-[#EDEDED] tracking-[-0.015em] leading-snug group-hover:text-white transition-colors mb-0.5 text-center truncate m-0">
        {title}
      </h2>
      <p className="w-full text-[13px] text-[#A1A1AA] leading-normal m-0 text-center truncate font-normal">
        {summary}
      </p>
    </SOSCard>
  );
};
