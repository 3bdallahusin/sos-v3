import { create } from 'zustand';
import type {
  LearningToolType,
  LearningTab,
  SM2Flashcard,
  SM2Deck,
  QuizQuestion,
  QuizItem,
  ExamSession,
  ExamViolationLog,
  MediaItem,
  TranscriptSegment,
  LearningRecentItem,
  SavedNote
} from '@sos/domain';

export interface SelectedExcerptContext {
  text: string;
  pageNumber?: number;
  fileId?: string;
  fileName?: string;
  toolType?: string;
}

export interface LearningStoreState {
  // 1. TABS MANAGEMENT
  tabs: LearningTab[];
  activeTabId: string;
  tabsLoading: boolean;
  fetchTabs: () => Promise<void>;
  openTab: (toolType: LearningToolType, title: string, resourceId?: string, savedState?: any) => Promise<string>;
  morphActiveTab: (toolType: LearningToolType, title: string, resourceId?: string | null) => Promise<string>;
  updateTabResource: (tabId: string, resourceId: string, title?: string) => Promise<void>;
  reorderTabs: (sourceId: string, targetId: string) => Promise<void>;
  switchTab: (tabId: string) => Promise<void>;
  closeTab: (tabId: string) => Promise<void>;

  // 2. POMODORO FOCUS TIMER (24:18 default)
  focusTimerSeconds: number;
  focusTimerRunning: boolean;
  startFocusTimer: () => void;
  pauseFocusTimer: () => void;
  resetFocusTimer: (seconds?: number) => void;
  tickFocusTimer: () => void;

  // 3. NEW TAB / RECENT & RECOMMENDATIONS
  recentMaterials: any[];
  recommendations: any[];
  fetchRecentMaterials: () => Promise<void>;
  fetchRecommendations: () => Promise<void>;

  // 4. FLASHCARDS & SM-2
  decks: any[];
  activeDeck: any | null;
  activeDeckCards: any[];
  activeCardIndex: number;
  isCardFlipped: boolean;
  isEditModalOpen: boolean;
  flashcardsLoading: boolean;
  fetchDecks: () => Promise<void>;
  loadDeck: (deckId: string) => Promise<void>;
  flipCard: () => void;
  nextCard: () => void;
  prevCard: () => void;
  goToCard: (index: number) => void;
  submitReview: (rating: 1 | 2 | 3 | 4) => Promise<void>;
  updateCard: (cardId: string, data: any) => Promise<void>;
  createCardInActiveDeck: (cardData: any) => Promise<void>;
  setEditModalOpen: (open: boolean) => void;

  // 5. QUIZZES
  quizzes: any[];
  activeQuiz: any | null;
  quizQuestions: any[];
  currentQuizIndex: number;
  selectedQuizAnswers: Record<string, string>;
  evaluatedQuestions: Record<string, { correct: boolean; correctOption: string; explanation: string; distractorRationales?: any }>;
  flaggedQuestions: Record<string, boolean>;
  isQuizFinished: boolean;
  quizSummaryModalOpen: boolean;
  quizzesLoading: boolean;
  fetchQuizzes: () => Promise<void>;
  loadQuiz: (quizId: string) => Promise<void>;
  answerQuestion: (questionId: string, selectedOption: string) => Promise<void>;
  toggleQuestionFlag: (questionId: string) => Promise<void>;
  goToQuizQuestion: (index: number) => void;
  nextQuizQuestion: () => void;
  prevQuizQuestion: () => void;
  finishQuiz: () => void;
  setQuizSummaryModalOpen: (open: boolean) => void;

  // 6. PROCTORED EXAM
  examSession: any | null;
  examQuestions: any[];
  currentExamIndex: number;
  examAnswers: Record<string, string>;
  examFlagged: Record<string, boolean>;
  examRemainingSeconds: number;
  examIntegrityScore: number;
  examViolationsCount: number;
  isExamSubmitted: boolean;
  examFocusLocked: boolean;
  examLoading: boolean;
  fetchExamSession: () => Promise<void>;
  recordExamIntegrityViolation: (eventType: string, details?: string) => Promise<void>;
  selectExamAnswer: (questionNumber: number, optionKey: string) => void;
  toggleExamFlag: (questionNumber: number) => void;
  goToExamQuestion: (index: number) => void;
  nextExamQuestion: () => void;
  prevExamQuestion: () => void;
  tickExamTimer: () => void;
  submitExam: () => Promise<void>;

  // 7. MEDIA (VIDEOS & AUDIOS) & TRANSCRIPTS
  videoMedia: any | null;
  audioMedia: any | null;
  activeMedia: any | null;
  activeTranscript: any[];
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  transcriptSearchQuery: string;
  mediaLoading: boolean;
  fetchMediaItem: (mediaId: string) => Promise<void>;
  setCurrentTime: (time: number) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setTranscriptSearchQuery: (query: string) => void;
  seekToTime: (time: number) => void;

  // 8. SAVED NOTES
  savedNotes: any[];
  saveNote: (data: { title: string; content: string; tags?: string[]; sourceContext: string }) => Promise<void>;
  fetchSavedNotes: () => Promise<void>;

  // 9. CONTEXT-AWARE AI CHAT
  selectedExcerpt: SelectedExcerptContext | null;
  setSelectedExcerpt: (excerpt: SelectedExcerptContext | null) => void;
  aiMessages: Array<{ id: string; sender: 'user' | 'assistant'; text: string; actionPill?: any; timestamp: string }>;
  aiThinking: boolean;
  sendAiMessage: (message: string, contextOverride?: string, contextDataOverride?: any) => Promise<void>;
}

export const useLearningStore = create<LearningStoreState>((set, get) => ({
  // 1. TABS
  tabs: [
    { id: 'tab-new-tab', toolType: 'new_tab' as LearningToolType, title: 'New Tab', active: true }
  ],
  activeTabId: 'tab-new-tab',
  tabsLoading: false,

  fetchTabs: async () => {
    set({ tabsLoading: true });
    try {
      const res = await fetch('/api/learning/tabs');
      if (res.ok) {
        const data = await res.json();
        if (data.tabs && data.tabs.length > 0) {
          const active = data.tabs.find((t: any) => t.active) || data.tabs[0];
          set({ tabs: data.tabs, activeTabId: active.id });
        }
      }
    } catch (err) {
      console.error('Failed to fetch tabs:', err);
    } finally {
      set({ tabsLoading: false });
    }
  },

  openTab: async (toolType, title, resourceId, savedState) => {
    const isNewTab = toolType === 'new_tab' || toolType === 'new-tab';

    // For tools with a resourceId, switch to existing tab if already open
    if (!isNewTab && resourceId) {
      const existing = get().tabs.find(
        (t) => t.toolType === toolType && t.resourceId === resourceId
      );
      if (existing) {
        await get().switchTab(existing.id);
        return existing.id;
      }
    }

    const tabId = isNewTab
      ? `tab-new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      : `tab-${toolType}-${Date.now()}`;

    const newTab: LearningTab = {
      id: tabId,
      toolType,
      title,
      resourceId,
      active: true,
      savedState
    };

    set((s) => ({
      tabs: s.tabs.map((t) => ({ ...t, active: false })).concat(newTab),
      activeTabId: tabId
    }));

    try {
      await fetch('/api/learning/tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tabId,
          toolType,
          title,
          resourceId,
          active: true,
          savedState
        })
      });
    } catch (err) {
      console.error('Failed to persist tab creation:', err);
    }

    return tabId;
  },

  morphActiveTab: async (toolType, title, resourceId = null) => {
    const { activeTabId, tabs } = get();
    const activeTab = tabs.find((t) => t.id === activeTabId);

    // If resource is already open in another tab, switch to it and clean up empty active tab
    if (resourceId) {
      const existing = tabs.find(
        (t) => t.id !== activeTabId && t.toolType === toolType && t.resourceId === resourceId
      );
      if (existing) {
        if (activeTab && (!activeTab.resourceId || activeTab.toolType === 'new_tab' || activeTab.toolType === 'new-tab')) {
          await get().closeTab(activeTab.id);
        }
        await get().switchTab(existing.id);
        return existing.id;
      }
    }

    // If currently active tab is a new_tab, or has no bound resource, or matches toolType: morph it in place!
    if (
      activeTab &&
      (activeTab.toolType === 'new_tab' ||
        activeTab.toolType === 'new-tab' ||
        !activeTab.resourceId ||
        activeTab.toolType === toolType)
    ) {
      const updatedTabs = tabs.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              toolType,
              title,
              resourceId: resourceId || undefined,
              active: true
            }
          : t
      );
      set({ tabs: updatedTabs, activeTabId });

      try {
        await fetch(`/api/learning/tabs/${activeTabId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolType,
            title,
            resourceId,
            active: true
          })
        });
      } catch (err) {
        console.error('Failed to persist morphed tab:', err);
      }
      return activeTabId;
    }

    // Otherwise, create a new tab as fallback
    return get().openTab(toolType, title, resourceId || undefined);
  },

  updateTabResource: async (tabId, resourceId, title) => {
    const { tabs } = get();
    const targetTab = tabs.find((t) => t.id === tabId);
    if (!targetTab) return;

    const newTitle = title || targetTab.title;
    const updatedTabs = tabs.map((t) =>
      t.id === tabId ? { ...t, resourceId, title: newTitle } : t
    );
    set({ tabs: updatedTabs });

    try {
      await fetch(`/api/learning/tabs/${tabId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId,
          title: newTitle
        })
      });
    } catch (err) {
      console.error('Failed to persist tab resource update:', err);
    }
  },

  reorderTabs: async (sourceId, targetId) => {
    const { tabs } = get();
    const fromIndex = tabs.findIndex((t) => t.id === sourceId);
    const toIndex = tabs.findIndex((t) => t.id === targetId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const newTabs = [...tabs];
    const [moved] = newTabs.splice(fromIndex, 1);
    newTabs.splice(toIndex, 0, moved);

    set({ tabs: newTabs });

    try {
      const tabIds = newTabs.map((t) => t.id);
      await fetch('/api/learning/tabs/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabIds })
      });
    } catch (err) {
      console.error('Failed to persist tab reordering:', err);
    }
  },

  switchTab: async (tabId) => {
    set((s) => ({
      tabs: s.tabs.map((t) => ({ ...t, active: t.id === tabId })),
      activeTabId: tabId
    }));

    try {
      await fetch(`/api/learning/tabs/${tabId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true })
      });
    } catch (err) {
      console.error('Failed to persist tab switch:', err);
    }
  },

  closeTab: async (tabId) => {
    const { tabs, activeTabId } = get();
    if (tabs.length <= 1) return; // Keep at least one tab

    const index = tabs.findIndex((t) => t.id === tabId);
    const updatedTabs = tabs.filter((t) => t.id !== tabId);
    let nextActiveId = activeTabId;

    if (activeTabId === tabId) {
      const nextTab = updatedTabs[Math.max(0, index - 1)];
      nextActiveId = nextTab.id;
      nextTab.active = true;
    }

    set({ tabs: updatedTabs, activeTabId: nextActiveId });

    try {
      await fetch(`/api/learning/tabs/${tabId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete tab:', err);
    }
  },

  // 2. FOCUS TIMER
  focusTimerSeconds: 24 * 60 + 18, // 24:18 default
  focusTimerRunning: false,
  startFocusTimer: () => set({ focusTimerRunning: true }),
  pauseFocusTimer: () => set({ focusTimerRunning: false }),
  resetFocusTimer: (seconds = 24 * 60 + 18) => set({ focusTimerSeconds: seconds, focusTimerRunning: false }),
  tickFocusTimer: () => {
    const { focusTimerSeconds, focusTimerRunning } = get();
    if (focusTimerRunning && focusTimerSeconds > 0) {
      set({ focusTimerSeconds: focusTimerSeconds - 1 });
    }
  },

  // 3. RECENT & RECOMMENDATIONS
  recentMaterials: [],
  recommendations: [],
  fetchRecentMaterials: async () => {
    try {
      const res = await fetch('/api/learning/recent');
      if (res.ok) {
        const data = await res.json();
        set({ recentMaterials: data.recent || [] });
      }
    } catch (err) {
      console.error('Failed to fetch recent materials:', err);
    }
  },
  fetchRecommendations: async () => {
    try {
      const res = await fetch('/api/learning/recommendations');
      if (res.ok) {
        const data = await res.json();
        set({ recommendations: data.recommendations || [] });
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  },

  // 4. FLASHCARDS
  decks: [],
  activeDeck: null,
  activeDeckCards: [],
  activeCardIndex: 0,
  isCardFlipped: false,
  isEditModalOpen: false,
  flashcardsLoading: false,

  fetchDecks: async () => {
    set({ flashcardsLoading: true });
    try {
      const res = await fetch('/api/learning/flashcards/decks');
      if (res.ok) {
        const data = await res.json();
        set({ decks: data.decks || [] });
      }
    } catch (err) {
      console.error('Failed to fetch decks:', err);
    } finally {
      set({ flashcardsLoading: false });
    }
  },

  loadDeck: async (deckId) => {
    set({ flashcardsLoading: true, isCardFlipped: false, activeCardIndex: 0 });
    try {
      const res = await fetch(`/api/learning/flashcards/decks/${deckId}`);
      if (res.ok) {
        const data = await res.json();
        set({
          activeDeck: data.deck,
          activeDeckCards: data.cards || [],
          activeCardIndex: 0,
          isCardFlipped: false
        });
      }
    } catch (err) {
      console.error('Failed to load deck:', err);
    } finally {
      set({ flashcardsLoading: false });
    }
  },

  flipCard: () => set((s) => ({ isCardFlipped: !s.isCardFlipped })),
  nextCard: () => {
    const { activeCardIndex, activeDeckCards } = get();
    if (activeCardIndex < activeDeckCards.length - 1) {
      set({ activeCardIndex: activeCardIndex + 1, isCardFlipped: false });
    }
  },
  prevCard: () => {
    const { activeCardIndex } = get();
    if (activeCardIndex > 0) {
      set({ activeCardIndex: activeCardIndex - 1, isCardFlipped: false });
    }
  },
  goToCard: (index) => set({ activeCardIndex: index, isCardFlipped: false }),

  submitReview: async (rating) => {
    const { activeDeckCards, activeCardIndex } = get();
    const currentCard = activeDeckCards[activeCardIndex];
    if (!currentCard) return;

    try {
      const res = await fetch('/api/learning/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: currentCard.id, rating })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedCards = [...activeDeckCards];
        updatedCards[activeCardIndex] = data.card;

        // Move to next card seamlessly or wrap around
        const nextIdx = (activeCardIndex + 1) % activeDeckCards.length;
        set((s) => ({
          activeDeckCards: updatedCards,
          activeCardIndex: nextIdx,
          isCardFlipped: false,
          activeDeck: s.activeDeck ? { ...s.activeDeck, ...data.deckStats } : s.activeDeck
        }));
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    }
  },

  updateCard: async (cardId, data) => {
    try {
      const res = await fetch(`/api/learning/flashcards/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        set((s) => ({
          activeDeckCards: s.activeDeckCards.map((c) => (c.id === cardId ? result.card : c)),
          isEditModalOpen: false
        }));
      }
    } catch (err) {
      console.error('Failed to update card:', err);
    }
  },

  createCardInActiveDeck: async (cardData) => {
    const { activeDeck } = get();
    const deckId = activeDeck?.id || 'deck-camkii';
    try {
      const res = await fetch(`/api/learning/flashcards/decks/${deckId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
      });
      if (res.ok) {
        const data = await res.json();
        set((s) => ({
          activeDeckCards: [...s.activeDeckCards, data.card],
          activeDeck: s.activeDeck
            ? { ...s.activeDeck, totalCards: s.activeDeck.totalCards + 1 }
            : null
        }));
      }
    } catch (err) {
      console.error('Failed to create card in deck:', err);
    }
  },

  setEditModalOpen: (open) => set({ isEditModalOpen: open }),

  // 5. QUIZZES
  quizzes: [],
  activeQuiz: null,
  quizQuestions: [],
  currentQuizIndex: 0,
  selectedQuizAnswers: {},
  evaluatedQuestions: {},
  flaggedQuestions: {},
  isQuizFinished: false,
  quizSummaryModalOpen: false,
  quizzesLoading: false,

  fetchQuizzes: async () => {
    set({ quizzesLoading: true });
    try {
      const res = await fetch('/api/learning/quizzes');
      if (res.ok) {
        const data = await res.json();
        set({ quizzes: data.quizzes || [] });
      }
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
    } finally {
      set({ quizzesLoading: false });
    }
  },

  loadQuiz: async (quizId) => {
    set({ quizzesLoading: true, currentQuizIndex: 0, isQuizFinished: false });
    try {
      const res = await fetch(`/api/learning/quizzes/${quizId}`);
      if (res.ok) {
        const data = await res.json();
        // Parse options if JSON string
        const parsedQuestions = (data.questions || []).map((q: any) => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
          distractorRationales:
            typeof q.distractorRationales === 'string'
              ? JSON.parse(q.distractorRationales)
              : q.distractorRationales
        }));

        const initialSelected: Record<string, string> = {};
        const initialEvaluated: Record<string, any> = {};
        const initialFlagged: Record<string, boolean> = {};

        parsedQuestions.forEach((q: any) => {
          if (q.userSelectedOption) {
            initialSelected[q.id] = q.userSelectedOption;
            initialEvaluated[q.id] = {
              correct: q.userSelectedOption.toUpperCase() === q.correctOption.toUpperCase(),
              correctOption: q.correctOption,
              explanation: q.explanation,
              distractorRationales: q.distractorRationales
            };
          }
          if (q.isFlagged) {
            initialFlagged[q.id] = true;
          }
        });

        set({
          activeQuiz: data.quiz,
          quizQuestions: parsedQuestions,
          currentQuizIndex: 0,
          selectedQuizAnswers: initialSelected,
          evaluatedQuestions: initialEvaluated,
          flaggedQuestions: initialFlagged,
          isQuizFinished: false
        });
      }
    } catch (err) {
      console.error('Failed to load quiz:', err);
    } finally {
      set({ quizzesLoading: false });
    }
  },

  answerQuestion: async (questionId, selectedOption) => {
    const { activeQuiz } = get();
    if (!activeQuiz) return;

    set((s) => ({
      selectedQuizAnswers: { ...s.selectedQuizAnswers, [questionId]: selectedOption }
    }));

    try {
      const res = await fetch(`/api/learning/quizzes/${activeQuiz.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, selectedOption })
      });

      if (res.ok) {
        const result = await res.json();
        set((s) => ({
          evaluatedQuestions: {
            ...s.evaluatedQuestions,
            [questionId]: result
          }
        }));
      }
    } catch (err) {
      console.error('Failed to submit quiz answer:', err);
    }
  },

  toggleQuestionFlag: async (questionId) => {
    const { activeQuiz, flaggedQuestions } = get();
    if (!activeQuiz) return;
    const isNowFlagged = !flaggedQuestions[questionId];

    set((s) => ({
      flaggedQuestions: { ...s.flaggedQuestions, [questionId]: isNowFlagged }
    }));

    try {
      await fetch(`/api/learning/quizzes/${activeQuiz.id}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, isFlagged: isNowFlagged })
      });
    } catch (err) {
      console.error('Failed to toggle flag:', err);
    }
  },

  goToQuizQuestion: (index) => set({ currentQuizIndex: index }),
  nextQuizQuestion: () => {
    const { currentQuizIndex, quizQuestions } = get();
    if (currentQuizIndex < quizQuestions.length - 1) {
      set({ currentQuizIndex: currentQuizIndex + 1 });
    }
  },
  prevQuizQuestion: () => {
    const { currentQuizIndex } = get();
    if (currentQuizIndex > 0) {
      set({ currentQuizIndex: currentQuizIndex - 1 });
    }
  },
  finishQuiz: () => set({ isQuizFinished: true, quizSummaryModalOpen: true }),
  setQuizSummaryModalOpen: (open) => set({ quizSummaryModalOpen: open }),

  // 6. PROCTORED EXAM
  examSession: null,
  examQuestions: [],
  currentExamIndex: 0,
  examAnswers: {},
  examFlagged: {},
  examRemainingSeconds: 2535,
  examIntegrityScore: 98,
  examViolationsCount: 0,
  isExamSubmitted: false,
  examFocusLocked: true,
  examLoading: false,

  fetchExamSession: async () => {
    set({ examLoading: true });
    try {
      const res = await fetch('/api/learning/exams/session');
      if (res.ok) {
        const data = await res.json();
        const parsedQuestions = (data.questions || []).map((q: any) => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        }));

        set({
          examSession: data.session,
          examQuestions: parsedQuestions,
          examRemainingSeconds: data.session?.timeRemainingSeconds ?? 2535,
          examAnswers: data.session?.answers || {},
          examFlagged: data.session?.flagged || {},
          examViolationsCount: (data.session?.integrityLogs || []).length,
          isExamSubmitted: data.session?.status === 'submitted'
        });
      }
    } catch (err) {
      console.error('Failed to fetch exam session:', err);
    } finally {
      set({ examLoading: false });
    }
  },

  recordExamIntegrityViolation: async (eventType, details) => {
    const { examSession } = get();
    if (!examSession || get().isExamSubmitted) return;

    try {
      const res = await fetch(`/api/learning/exams/session/${examSession.id}/integrity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, details })
      });
      if (res.ok) {
        const data = await res.json();
        set((s) => ({
          examViolationsCount: data.violationsCount,
          examIntegrityScore: Math.max(40, s.examIntegrityScore - 4)
        }));
      }
    } catch (err) {
      console.error('Failed to record violation:', err);
    }
  },

  selectExamAnswer: (questionNumber, optionKey) => {
    set((s) => ({
      examAnswers: { ...s.examAnswers, [String(questionNumber)]: optionKey }
    }));
  },

  toggleExamFlag: (questionNumber) => {
    set((s) => ({
      examFlagged: {
        ...s.examFlagged,
        [String(questionNumber)]: !s.examFlagged[String(questionNumber)]
      }
    }));
  },

  goToExamQuestion: (index) => set({ currentExamIndex: index }),
  nextExamQuestion: () => {
    const { currentExamIndex, examQuestions } = get();
    if (currentExamIndex < examQuestions.length - 1) {
      set({ currentExamIndex: currentExamIndex + 1 });
    }
  },
  prevExamQuestion: () => {
    const { currentExamIndex } = get();
    if (currentExamIndex > 0) {
      set({ currentExamIndex: currentExamIndex - 1 });
    }
  },
  tickExamTimer: () => {
    const { examRemainingSeconds, isExamSubmitted } = get();
    if (!isExamSubmitted && examRemainingSeconds > 0) {
      set({ examRemainingSeconds: examRemainingSeconds - 1 });
      if (examRemainingSeconds - 1 <= 0) {
        get().submitExam();
      }
    }
  },
  submitExam: async () => {
    const { examSession, examAnswers, examRemainingSeconds } = get();
    if (!examSession) return;

    set({ isExamSubmitted: true });
    try {
      await fetch(`/api/learning/exams/session/${examSession.id}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: examAnswers, timeRemainingSeconds: examRemainingSeconds })
      });
    } catch (err) {
      console.error('Failed to submit exam:', err);
    }
  },

  // 7. MEDIA & TRANSCRIPTS
  videoMedia: null,
  audioMedia: null,
  activeMedia: null,
  activeTranscript: [],
  currentTime: 1008, // 16:48 default
  isPlaying: false,
  playbackSpeed: 1.0,
  transcriptSearchQuery: '',
  mediaLoading: false,

  fetchMediaItem: async (mediaId) => {
    set({ mediaLoading: true });
    try {
      let data: any = null;
      const res = await fetch(`/api/learning/media/${mediaId}`);
      if (res.ok) {
        data = await res.json();
      } else {
        const libRes = await fetch(`/api/library/items/${mediaId}`);
        if (libRes.ok) {
          const libItem = await libRes.json();
          data = {
            media: {
              id: libItem._id,
              type: libItem.fileType === 'video' ? 'video' : 'audio',
              title: libItem.name,
              subtitle: 'Library Media',
              instructor: '',
              mediaUrl: libItem.storage?.url,
              durationSeconds: 0,
              currentTimestampSeconds: 0,
              chapters: [],
              tags: [],
              bannerUrl: libItem.coverImage
            },
            transcript: []
          };
        }
      }

      if (data) {
        const chapters =
          typeof data.media?.chapters === 'string'
            ? JSON.parse(data.media.chapters)
            : data.media?.chapters || [];

        const mediaItem = { ...data.media, chapters };
        set({
          activeMedia: mediaItem,
          activeTranscript: data.transcript || [],
          currentTime: mediaItem.currentTimestampSeconds || 0,
          isPlaying: false
        });
      }
    } catch (err) {
      console.error('Failed to fetch media item:', err);
    } finally {
      set({ mediaLoading: false });
    }
  },

  setCurrentTime: (time) => set({ currentTime: time }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setTranscriptSearchQuery: (query) => set({ transcriptSearchQuery: query }),
  seekToTime: (time) => {
    set({ currentTime: time, isPlaying: true });
    const { activeMedia } = get();
    if (activeMedia) {
      fetch(`/api/learning/media/${activeMedia.id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentTimestampSeconds: Math.floor(time) })
      }).catch(console.error);
    }
  },

  // 8. SAVED NOTES
  savedNotes: [],
  saveNote: async (data) => {
    try {
      const res = await fetch('/api/learning/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        set((s) => ({ savedNotes: [result.note, ...s.savedNotes] }));
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  },
  fetchSavedNotes: async () => {
    try {
      const res = await fetch('/api/learning/notes');
      if (res.ok) {
        const data = await res.json();
        set({ savedNotes: data.notes || [] });
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  },

  // 9. CONTEXT-AWARE AI CHAT
  selectedExcerpt: null,
  setSelectedExcerpt: (excerpt) => set({ selectedExcerpt: excerpt }),
  aiMessages: [
    {
      id: 'welcome-learning-ai',
      sender: 'assistant',
      text: '**SOS Learning Assistant Online**\n\nGrounded dynamically in your active workspace tool. Ask for mechanism breakdowns, exam trap analysis, or card creation.',
      timestamp: new Date().toISOString()
    }
  ],
  aiThinking: false,

  sendAiMessage: async (message, contextOverride, contextDataOverride) => {
    if (!message.trim()) return;

    const { tabs, activeTabId, activeDeckCards, activeCardIndex, quizQuestions, currentQuizIndex, currentTime, selectedExcerpt } = get();
    const activeTab = tabs.find((t) => t.id === activeTabId);
    const contextType = contextOverride || activeTab?.toolType || 'new_tab';

    let contextData = contextDataOverride ? { ...contextDataOverride } : {};
    if (selectedExcerpt) {
      contextData.selectedExcerpt = selectedExcerpt;
    }
    if (activeTab?.resourceId) {
      contextData.resourceId = activeTab.resourceId;
    }
    if (activeTab?.title) {
      contextData.resourceTitle = activeTab.title;
    }
    if (contextType === 'flashcards' && !contextDataOverride) {
      contextData = { ...contextData, ...(activeDeckCards[activeCardIndex] || {}) };
    } else if (contextType === 'quizzes' && !contextDataOverride) {
      contextData = { ...contextData, ...(quizQuestions[currentQuizIndex] || {}) };
    } else if ((contextType === 'videos' || contextType === 'audios') && !contextDataOverride) {
      contextData = { ...contextData, timestamp: currentTime };
    }

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      text: message,
      timestamp: new Date().toISOString()
    };

    set((s) => ({
      aiMessages: [...s.aiMessages, userMsg],
      aiThinking: true
    }));

    try {
      const res = await fetch('/api/learning/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextType, message, contextData })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg = {
          id: `ast-${Date.now()}`,
          sender: 'assistant' as const,
          text: data.reply,
          actionPill: data.actionPill,
          timestamp: data.timestamp || new Date().toISOString()
        };
        set((s) => ({
          aiMessages: [...s.aiMessages, assistantMsg],
          aiThinking: false
        }));
      } else if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        const lockedMsg = {
          id: `ast-lock-${Date.now()}`,
          sender: 'assistant' as const,
          text: `🔒 **${data.error || 'AI Locked'}**\n\n${data.reply}`,
          timestamp: new Date().toISOString()
        };
        set((s) => ({
          aiMessages: [...s.aiMessages, lockedMsg],
          aiThinking: false
        }));
      } else if (res.status === 502) {
        const data = await res.json().catch(() => ({}));
        const errReply = data.reply || (data.error ? `⚠️ **502 Bad Gateway**: ${data.error}` : '⚠️ **502 Bad Gateway**: Upstream Gemini service failed.');
        const errMsg = {
          id: `ast-err-${Date.now()}`,
          sender: 'assistant' as const,
          text: errReply,
          timestamp: new Date().toISOString()
        };
        set((s) => ({
          aiMessages: [...s.aiMessages, errMsg],
          aiThinking: false
        }));
      } else {
        const data = await res.json().catch(() => ({}));
        const errReply = data.reply || data.error || `HTTP ${res.status} error communicating with assistant.`;
        const errMsg = {
          id: `ast-err-${Date.now()}`,
          sender: 'assistant' as const,
          text: `⚠️ **Service Error**: ${errReply}`,
          timestamp: new Date().toISOString()
        };
        set((s) => ({
          aiMessages: [...s.aiMessages, errMsg],
          aiThinking: false
        }));
      }
    } catch (err: any) {
      console.error('Failed to send AI message:', err);
      const networkErrMsg = {
        id: `ast-net-err-${Date.now()}`,
        sender: 'assistant' as const,
        text: `⚠️ **Network Error**: Unable to reach AI chat service (${err?.message || 'Connection refused'}).`,
        timestamp: new Date().toISOString()
      };
      set((s) => ({
        aiMessages: [...s.aiMessages, networkErrMsg],
        aiThinking: false
      }));
    }
  }
}));
