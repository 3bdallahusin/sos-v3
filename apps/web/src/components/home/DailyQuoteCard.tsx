import React from 'react';

interface DailyQuoteCardProps {
  quote?: string;
  author?: string;
}

export const DailyQuoteCard: React.FC<DailyQuoteCardProps> = ({
  quote = '“We are what we repeatedly do. Excellence, then, is not an act, but a habit.”',
  author = 'Aristotle'
}) => {
  return (
    <div
      data-testid="daily-quote-card"
      className="w-full bg-[#111114] border border-[#1F1F23] hover:border-[#27272A] rounded-2xl px-6 py-3.5 md:px-7 md:py-3.5 shadow-sm flex flex-col justify-between transition-colors"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-[#71717A] font-mono uppercase tracking-[0.12em]">
          DAILY QUOTE
        </span>
      </div>

      {/* Spacious, Elegant Serif Quote */}
      <blockquote className="my-1">
        <p
          className="text-[17px] md:text-[18.5px] text-[#F4F4F5] italic font-serif leading-[1.4] tracking-[-0.01em] m-0"
          style={{ fontFamily: "'Newsreader', Georgia, serif" }}
        >
          {quote}
        </p>
      </blockquote>

      {/* Clean Attribution Row: — Aristotle */}
      <div className="flex items-center pt-1.5 mt-0.5 text-xs">
        <span className="text-[12.5px] font-medium text-[#71717A] tracking-tight">
          — {author}
        </span>
      </div>
    </div>
  );
};
