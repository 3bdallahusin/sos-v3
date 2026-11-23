import React, { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useHomeStore } from '../stores/home-store.js';
import { useSettingsStore } from '../stores/settings-store.js';
import {
  HeroGreetingCard,
  HeroClockCard,
  DailyQuoteCard,
  DailyArticleCard,
  ArticleReaderModal,
  FlashcardsSection,
  ContinueLearningSection,
  UndoToast
} from '../components/home/index.js';
import { getDailyEditorial, type EditorialArticle } from '../data/editorial.js';
import type { SpacedRepetitionDeck, RecentStudyItem } from '@sos/domain';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    recentItems,
    decks,
    undoToast,
    loadHomeData,
    deleteRecentItem,
    undoDeleteRecentItem,
    touchItem,
    dismissUndoToast
  } = useHomeStore();

  const { settings, loadSettings, isLoading: isSettingsLoading, isHydrated: isSettingsHydrated } = useSettingsStore();
  const { horizonBar } = settings.general;

  const [selectedArticle, setSelectedArticle] = useState<EditorialArticle | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);

  useEffect(() => {
    loadHomeData();
    loadSettings();
  }, [loadHomeData, loadSettings]);

  // Deterministically rotate quote and article based on dayOfYear % length
  const { quote, article } = getDailyEditorial();

  const handleOpenArticle = () => {
    setSelectedArticle(article);
    setIsArticleModalOpen(true);
  };

  const handleCloseArticle = () => {
    setIsArticleModalOpen(false);
  };

  const handleOpenDeck = async (deck: SpacedRepetitionDeck) => {
    await touchItem(deck.id, {
      title: deck.title,
      type: 'flashcards',
      subtitle: `${deck.dueCount} due`,
      path: '/learning'
    });
    navigate({
      to: '/learning',
      search: { deckId: deck.id, mode: 'recall' } as any
    });
  };

  const handleResumeItem = async (item: RecentStudyItem) => {
    await touchItem(item.id);
    navigate({
      to: (item.path || '/learning') as any,
      search: { assetId: item.id, type: item.type } as any
    });
  };

  return (
    <div
      data-testid="home-page"
      className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 md:px-8 md:py-6 flex flex-col items-center bg-[#080808]"
    >
      {/* Centered Dashboard Container (max-width: 1360px, width: 92%) */}
      <div className="w-[92%] max-w-[1360px] flex flex-col gap-4">
        {/* ========================================================================= */}
        {/* TIER 1: HERO ROW (GRID-COLS-3, 176px FIXED HEIGHT)                        */}
        {/* ========================================================================= */}
        <section
          data-testid="home-tier-1"
          className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch animate-tier-1"
        >
          {/* Top-Left Hero Card (grid-column: span 2) — Dynamic Greeting & Semester Calculator */}
          <HeroGreetingCard
            milestoneName={horizonBar?.milestoneName}
            startDate={horizonBar?.startDate}
            endDate={horizonBar?.endDate}
            isLoading={isSettingsLoading}
            isHydrated={isSettingsHydrated}
          />

          {/* Top-Right Hero Card (grid-column: span 1) — 60fps Precision Analog/Digital Clock & Date */}
          <HeroClockCard />
        </section>

        {/* ========================================================================= */}
        {/* TIER 2: EQUAL-HEIGHT CENTERED EDITORIAL CARDS (112px EACH)                */}
        {/* ========================================================================= */}
        <section
          data-testid="home-tier-2"
          className="w-full flex flex-col gap-4 animate-tier-2"
        >
          {/* Card A: DAILY QUOTE */}
          <DailyQuoteCard quote={quote.quote} author={quote.author} />

          {/* Card B: DAILY ARTICLE (Click opens reader modal, with option to expand into Learning) */}
          <DailyArticleCard
            title={article.title}
            summary={article.summary}
            onClick={handleOpenArticle}
          />
        </section>

        {/* ========================================================================= */}
        {/* TIER 3: 2-COLUMN 50/50 EXECUTION GRID (FLASHCARDS + CONTINUE LEARNING)    */}
        {/* ========================================================================= */}
        <section
          data-testid="home-tier-3"
          className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch pb-6 animate-tier-3"
        >
          {/* Column 1 (Left 50%): FLASHCARDS (Real Decks, Full Titles & Tabular Due Count) */}
          <FlashcardsSection
            decks={decks}
            onOpenDeck={handleOpenDeck}
          />

          {/* Column 2 (Right 50%): CONTINUE LEARNING (Recent Items, Full Titles, Crossfade Trash & Undo) */}
          <ContinueLearningSection
            items={recentItems}
            onDeleteItem={deleteRecentItem}
            onResumeItem={handleResumeItem}
          />
        </section>
      </div>

      {/* Floating Monochrome Undo Toast Pill */}
      <UndoToast
        isOpen={undoToast.isOpen}
        message="Removed from Continue Learning"
        onUndo={undoDeleteRecentItem}
        onDismiss={dismissUndoToast}
      />

      {/* Daily Article Full Reader Modal */}
      <ArticleReaderModal
        article={selectedArticle}
        isOpen={isArticleModalOpen}
        onClose={handleCloseArticle}
      />
    </div>
  );
};
