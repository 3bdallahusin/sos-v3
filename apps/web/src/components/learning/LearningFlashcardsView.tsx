import React, { useEffect, useState } from 'react';
import {
  RotateCw,
  CheckCircle,
  Zap,
  Edit3,
  X,
  Save
} from 'lucide-react';
import { useLearningStore } from '../../stores/learning-store.js';

interface FlashcardsViewProps {
  deckId?: string;
}

export const LearningFlashcardsView: React.FC<FlashcardsViewProps> = ({ deckId = 'deck-camkii' }) => {
  const {
    activeDeck,
    activeDeckCards,
    activeCardIndex,
    isCardFlipped,
    isEditModalOpen,
    flashcardsLoading,
    loadDeck,
    flipCard,
    nextCard,
    prevCard,
    submitReview,
    updateCard,
    setEditModalOpen
  } = useLearningStore();

  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswerTitle, setEditAnswerTitle] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editMechanism, setEditMechanism] = useState('');

  useEffect(() => {
    loadDeck(deckId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const currentCard = activeDeckCards[activeCardIndex];

  // Open edit modal with current card data
  const handleOpenEdit = () => {
    if (!currentCard) return;
    setEditQuestion(currentCard.question);
    setEditAnswerTitle(currentCard.answerTitle);
    setEditAnswer(currentCard.answer);
    setEditMechanism(currentCard.mechanismSnippet || '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentCard) return;
    await updateCard(currentCard.id, {
      question: editQuestion,
      answerTitle: editAnswerTitle,
      answer: editAnswer,
      mechanismSnippet: editMechanism
    });
  };

  // Keyboard shortcut listener: Space to flip, 1-4 to rate, Left/Right arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditModalOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        flipCard();
      } else if (e.key === '1') {
        e.preventDefault();
        submitReview(1);
      } else if (e.key === '2') {
        e.preventDefault();
        submitReview(2);
      } else if (e.key === '3') {
        e.preventDefault();
        submitReview(3);
      } else if (e.key === '4') {
        e.preventDefault();
        submitReview(4);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextCard();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditModalOpen, flipCard, submitReview, nextCard, prevCard]);

  if (flashcardsLoading && !currentCard) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0A] text-[#71717A] text-xs font-mono">
        Loading flashcard deck and SM-2 retention state...
      </div>
    );
  }

  const totalCards = activeDeckCards.length || 1;
  const learningCount = activeDeck?.learning ?? activeDeckCards.filter((c) => c.status === 'learning').length;
  const reviewCount = activeDeck?.review ?? activeDeckCards.filter((c) => c.status === 'review').length;
  const masteredCount = activeDeck?.mastered ?? activeDeckCards.filter((c) => c.status === 'mastered').length;

  const masteredPercent = Math.round((masteredCount / totalCards) * 100);
  const reviewPercent = Math.round((reviewCount / totalCards) * 100);
  const learningPercent = Math.max(0, 100 - masteredPercent - reviewPercent);

  return (
    <div
      data-testid="learning-flashcards-view"
      className="flex-1 flex flex-col items-center justify-start overflow-y-auto custom-scrollbar w-full h-full relative px-6 py-6 pb-16 bg-[#0A0A0A] text-[#FAFAFA] select-none"
    >
      {/* Centered Column Container (680px max-width, matching Stitch) */}
      <div className="w-full max-w-[680px] flex flex-col items-center mx-auto">
        
        {/* Top Status & Progress Bar (full 680px width) */}
        <div className="w-full flex flex-col gap-2 mb-6">
          <div className="flex items-center justify-between text-xs pb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#F4F4F5]">
                {activeDeck?.topic || 'Neuroscience • Ch. 12'}
              </span>
              <span className="text-[#71717A] font-mono text-[11px]">•</span>
              <span className="px-2 py-0.5 rounded-[10px] bg-[#18181B] border border-[#27272A] font-mono text-[11px] text-[#F4F4F5] font-medium">
                CARD {activeCardIndex + 1} OF {totalCards}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#A1A1AA]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Learning:</span>
                <span className="text-[#F4F4F5] font-semibold">{learningCount}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Review:</span>
                <span className="text-[#F4F4F5] font-semibold">{reviewCount}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Mastered:</span>
                <span className="text-[#F4F4F5] font-semibold">{masteredCount}</span>
              </span>
            </div>
          </div>

          {/* Segmented Progress Track */}
          <div className="w-full h-1.5 bg-[#18181B] rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500/70 h-full transition-all duration-300"
              style={{ width: `${masteredPercent}%` }}
              title="Mastered"
            />
            <div
              className="bg-amber-500/70 h-full transition-all duration-300"
              style={{ width: `${reviewPercent}%` }}
              title="Review"
            />
            <div
              className="bg-rose-500/70 h-full transition-all duration-300"
              style={{ width: `${learningPercent}%` }}
              title="Learning"
            />
          </div>
        </div>

        {/* CRISP FLAT 2D FLASHCARD (ZERO BLUR, RAZOR-SHARP TEXT RENDERING, full 680px width) */}
        {currentCard && (
          <div
            id="flashcard-container"
            data-testid="flashcard-tactile-container"
            onClick={flipCard}
            className="w-full min-h-[360px] cursor-pointer group select-none relative"
          >
            {/* FRONT SIDE (Question) */}
            {!isCardFlipped ? (
              <div
                id="card-front"
                className="w-full h-full min-h-[360px] rounded-2xl bg-[#111114] border border-[#27272A] p-8 flex flex-col justify-between shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-colors hover:border-[#3F3F46]"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-[#18181B] border border-[#27272A] font-mono text-[11px] text-[#8E8E93] uppercase">
                    {currentCard.topicTag || 'QUESTION • MOLECULAR BIOLOGY'}
                  </span>
                  <span className="text-[#8E8E93] flex items-center gap-1.5 text-[11px]">
                    <RotateCw className="w-3.5 h-3.5 text-[#71717A]" />
                    <span>Click or Space to Flip</span>
                  </span>
                </div>

                {/* Question Content (Centered, Razor-Sharp Anti-Aliased Typography) */}
                <div className="text-center px-4 my-auto py-6">
                  {currentCard.subTopic && (
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-[#8E8E93] mb-3 font-mono">
                      {currentCard.subTopic}
                    </div>
                  )}
                  <h2 className="text-xl md:text-[22px] font-semibold text-[#F4F4F5] leading-relaxed antialiased max-w-xl mx-auto">
                    {currentCard.question}
                  </h2>
                </div>
              </div>
            ) : (
              /* BACK SIDE (Answer & Mechanism) */
              <div
                id="card-back"
                className="w-full h-full min-h-[360px] rounded-2xl bg-[#141417] border border-[#27272A] p-8 flex flex-col justify-between shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-colors hover:border-[#3F3F46]"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-[#18181B] border border-[#27272A] font-mono text-[11px] text-[#F4F4F5] font-medium uppercase">
                    ANSWER & MECHANISM
                  </span>
                  <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verified Answer • SM-2</span>
                  </span>
                </div>

                {/* Answer Content */}
                <div className="px-4 my-auto py-4 space-y-3">
                  <div className="text-lg font-bold text-[#F4F4F5] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      ✓
                    </span>
                    <span>{currentCard.answerTitle}</span>
                  </div>
                  <p className="text-[13px] text-[#A1A1AA] leading-relaxed antialiased">
                    {currentCard.answer}
                  </p>
                  {currentCard.mechanismSnippet && (
                    <div className="p-2.5 rounded-xl bg-[#111113] border border-[#27272A] text-[11.5px] text-[#8E8E93] flex items-center gap-2 font-mono">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{currentCard.mechanismSnippet}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#A1A1AA] pt-2">
                  <span>Ref: Neuroanatomy Atlas § 14.3</span>
                  <span className="text-[#8E8E93] hover:text-[#F4F4F5] transition-colors">
                    Click to flip back
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SPACED REPETITION CONFIDENCE RATING BAR (full 680px width, 4 equal columns) */}
        <div className="w-full mt-6 flex flex-col items-center">
          <div className="grid grid-cols-4 gap-3 w-full">
            
            {/* Again Button (< 1m): Restrained Muted Crimson */}
            <button
              type="button"
              data-testid="rating-btn-1"
              onClick={() => submitReview(1)}
              className="flex flex-col items-center justify-center py-2.5 px-4 rounded-[14px] bg-rose-500/[0.12] hover:bg-rose-500/[0.20] border border-rose-500/30 hover:border-rose-500/50 text-rose-300 hover:text-white transition-all active:scale-95 group shadow-sm cursor-pointer"
            >
              <span className="text-xs font-semibold">Again</span>
              <span className="text-[10px] font-mono text-rose-400/80">&lt; 1 min</span>
            </button>

            {/* Hard Button (6m): Restrained Neutral Grayscale */}
            <button
              type="button"
              data-testid="rating-btn-2"
              onClick={() => submitReview(2)}
              className="flex flex-col items-center justify-center py-2.5 px-4 rounded-[14px] bg-[#18181B] hover:bg-[#202024] border border-[#27272A] text-[#F4F4F5] transition-all active:scale-95 group cursor-pointer"
            >
              <span className="text-xs font-semibold">Hard</span>
              <span className="text-[10px] font-mono text-[#A1A1AA]">6 mins</span>
            </button>

            {/* Good Button (1d): Restrained Muted Emerald */}
            <button
              type="button"
              data-testid="rating-btn-3"
              onClick={() => submitReview(3)}
              className="flex flex-col items-center justify-center py-2.5 px-4 rounded-[14px] bg-emerald-500/[0.12] hover:bg-emerald-500/[0.20] border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 hover:text-white transition-all active:scale-95 group shadow-sm cursor-pointer"
            >
              <span className="text-xs font-bold">Good</span>
              <span className="text-[10px] font-mono text-emerald-400/80">1 day</span>
            </button>

            {/* Easy Button (4d): Restrained Muted Emerald */}
            <button
              type="button"
              data-testid="rating-btn-4"
              onClick={() => submitReview(4)}
              className="flex flex-col items-center justify-center py-2.5 px-4 rounded-[14px] bg-emerald-500/[0.12] hover:bg-emerald-500/[0.20] border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 hover:text-white transition-all active:scale-95 group shadow-sm cursor-pointer"
            >
              <span className="text-xs font-semibold">Easy</span>
              <span className="text-[10px] font-mono text-emerald-400/80">4 days</span>
            </button>

          </div>
        </div>

      </div>

      {/* Bottom Keyboard Shortcuts Helper (Anchored at bottom matching Stitch) */}
      <div className="absolute bottom-3 left-6 right-6 flex items-center justify-between text-[11px] text-[#71717A] border-t border-[#1E1E22] pt-2 bg-[#0A0A0A]">
        <div className="flex items-center space-x-4">
          <span><kbd className="px-1.5 py-0.5 bg-[#18181B] border border-[#27272A] rounded font-mono text-[#F4F4F5]">Space</kbd> Flip Card</span>
          <span><kbd className="px-1.5 py-0.5 bg-[#18181B] border border-[#27272A] rounded font-mono text-[#F4F4F5]">1</kbd> Again</span>
          <span><kbd className="px-1.5 py-0.5 bg-[#18181B] border border-[#27272A] rounded font-mono text-[#F4F4F5]">2</kbd> Hard</span>
          <span><kbd className="px-1.5 py-0.5 bg-[#18181B] border border-[#27272A] rounded font-mono text-[#F4F4F5]">3</kbd> Good</span>
          <span><kbd className="px-1.5 py-0.5 bg-[#18181B] border border-[#27272A] rounded font-mono text-[#F4F4F5]">4</kbd> Easy</span>
        </div>
        <button
          type="button"
          data-testid="edit-card-btn"
          onClick={handleOpenEdit}
          className="flex items-center space-x-1.5 text-[#A1A1AA] hover:text-[#F4F4F5] cursor-pointer transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit this Card</span>
        </button>
      </div>

      {/* Edit Flashcard Modal (Real DB Mutation) */}
      {isEditModalOpen && (
        <div
          data-testid="edit-card-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#141417] border border-[#27272A] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
              <h3 className="text-sm font-semibold text-[#FAFAFA]">
                Edit Flashcard in Database
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-[#71717A] hover:text-[#FAFAFA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A1A1AA] mb-1 font-mono text-[11px]">
                  Question:
                </label>
                <textarea
                  rows={3}
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0F0F12] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#3F3F46]"
                />
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-1 font-mono text-[11px]">
                  Answer Title / Core Concept:
                </label>
                <input
                  type="text"
                  value={editAnswerTitle}
                  onChange={(e) => setEditAnswerTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0F0F12] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#3F3F46]"
                />
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-1 font-mono text-[11px]">
                  Answer Body / Explanation:
                </label>
                <textarea
                  rows={3}
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0F0F12] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#3F3F46]"
                />
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-1 font-mono text-[11px]">
                  Mechanism / Memory Cue:
                </label>
                <input
                  type="text"
                  value={editMechanism}
                  onChange={(e) => setEditMechanism(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0F0F12] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#3F3F46]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F1F24]">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#18181D] hover:bg-[#222228] text-xs text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-lg bg-[#FAFAFA] hover:bg-white text-xs font-semibold text-black transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
