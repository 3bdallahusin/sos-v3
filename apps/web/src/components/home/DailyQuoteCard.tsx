import React from 'react';
import { SOSCard } from '../ui/SOSCard.js';

interface DailyQuoteCardProps {
  quote?: string;
  author?: string;
}

export const DailyQuoteCard: React.FC<DailyQuoteCardProps> = ({
  quote = '“We are what we repeatedly do. Excellence, then, is not an act, but a habit.”',
  author = 'Aristotle'
}) => {
  return (
    <SOSCard
      data-testid="daily-quote-card"
      className="h-[112px] px-8 py-4"
      innerClassName="w-full h-full flex flex-col items-center justify-center text-center"
    >
      <span className="text-[10px] text-[#A1A1AA] font-mono uppercase tracking-[0.1em] mb-1 text-center">
        DAILY QUOTE
      </span>
      <p
        className="w-full text-[17px] font-semibold leading-snug text-[#EDEDED] italic font-serif tracking-[-0.015em] m-0 text-center"
        style={{ fontFamily: "'Newsreader', Georgia, serif" }}
      >
        {quote}
      </p>
      <span className="text-[12px] text-[#A1A1AA] mt-1 tracking-tight font-medium text-center">
        — {author}
      </span>
    </SOSCard>
  );
};
