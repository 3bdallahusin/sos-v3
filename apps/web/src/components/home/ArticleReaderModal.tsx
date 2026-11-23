import React, { useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import type { EditorialArticle } from '../../data/editorial.js';
import { SOSCard } from '../ui/SOSCard.js';

interface ArticleReaderModalProps {
  article: EditorialArticle | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  article,
  isOpen,
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !article) return null;

  return (
    <div
      data-testid="article-reader-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <SOSCard
        interactive={false}
        className="w-full max-w-2xl rounded-[16px] shadow-[0_24px_64px_rgba(0,0,0,0.85)] max-h-[85vh] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="h-14 px-6 border-b border-[#1E1E22] flex items-center justify-between shrink-0 bg-[#0C0C0E] select-none">
          <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-[#71717A]" />
            <span>DAILY ARTICLE</span>
            <span className="text-[#3F3F46]">•</span>
            <span className="text-[#71717A]">{article.readTime}</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close article reader"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C20] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Article Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          {/* Metadata & Title */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-[6px] bg-[#18181B] border border-[#27272A] text-[11px] font-mono text-[#A1A1AA]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-[26px] md:text-[28px] font-semibold text-[#FAFAFA] tracking-[-0.02em] leading-tight m-0">
              {article.title}
            </h1>

            <div className="flex items-center gap-2 mt-3 text-xs text-[#71717A]">
              <span className="font-medium text-[#A1A1AA]">{article.author}</span>
              <span>•</span>
              <span>{article.date}</span>
            </div>
          </div>

          {/* Abstract / Summary Callout */}
          <div className="p-4 rounded-xl bg-[#161619] border border-[#222226] text-[13.5px] text-[#D4D4D8] italic leading-relaxed">
            {article.summary}
          </div>

          {/* Paragraphs */}
          <div className="flex flex-col gap-4 text-[14.5px] leading-[1.7] text-[#D4D4D8] font-normal">
            {article.content.map((p, idx) => (
              <p key={idx} className="m-0">
                {p}
              </p>
            ))}
          </div>
        </div>
      </SOSCard>
    </div>
  );
};
