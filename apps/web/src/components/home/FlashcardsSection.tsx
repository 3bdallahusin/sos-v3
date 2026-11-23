import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Layers } from 'lucide-react';
import type { SpacedRepetitionDeck } from '@sos/domain';
import { SOSCard } from '../ui/SOSCard.js';
import { humanizeTitle } from '../../utils/formatters.js';

interface FlashcardsSectionProps {
  decks: SpacedRepetitionDeck[];
  onOpenDeck?: (deck: SpacedRepetitionDeck) => void;
}

export const FlashcardsSection: React.FC<FlashcardsSectionProps> = ({ decks, onOpenDeck }) => {
  const navigate = useNavigate();

  // Sort strictly in descending priority order (highest dueCount first)
  const sortedDecks = [...decks].sort((a, b) => b.dueCount - a.dueCount);

  const handleOpenDeck = (deck: SpacedRepetitionDeck) => {
    if (onOpenDeck) {
      onOpenDeck(deck);
    } else {
      navigate({
        to: '/learning',
        search: { deckId: deck.id, mode: 'recall' } as any
      });
    }
  };

  return (
    <SOSCard
      data-testid="flashcards-section"
      className="h-[360px] px-4 py-4 flex flex-col"
      innerClassName="justify-between h-full flex flex-col"
    >
      <div>
        {/* Centered Section Header */}
        <div className="text-center pb-3 mb-2 border-b border-[#1E1E1E] select-none">
          <h3 className="text-[11px] uppercase text-[#A1A1AA] font-mono tracking-[0.1em] m-0">
            FLASHCARDS
          </h3>
        </div>

        {/* 50% Full-Width Deck Rows with untruncated titles & tabular due count */}
        <div className="flex flex-col space-y-1">
          {sortedDecks.slice(0, 5).map((deck) => (
            <div
              key={deck.id}
              data-testid={`deck-row-${deck.id}`}
              onClick={() => handleOpenDeck(deck)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenDeck(deck);
                }
              }}
              className="sos-exec-row group/row h-[50px] px-3 flex items-center justify-between rounded-lg border border-transparent hover:border-[#2A2A2E] hover:bg-[#161619] transition-all cursor-pointer"
            >
              {/* Left: Icon Box + Full Untruncated Deck Name */}
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                <div className="w-7 h-7 rounded-md bg-[#161619] border border-[#27272A] flex items-center justify-center text-[#A1A1AA] shrink-0 group-hover/row:border-[#3F3F46] group-hover/row:text-[#EDEDED] transition-colors">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[13.5px] font-medium text-[#EDEDED] truncate flex-1 min-w-0 tracking-tight">
                  {humanizeTitle(deck.title)}
                </span>
              </div>

              {/* Right: Tabular Live Due Count */}
              <span className="text-[12px] font-mono text-[#A1A1AA] tabular-nums whitespace-nowrap shrink-0 group-hover/row:text-[#EDEDED] transition-colors">
                {deck.dueCount} due
              </span>
            </div>
          ))}
        </div>
      </div>
    </SOSCard>
  );
};
