import React, { useEffect, useRef } from 'react';
import { useLearningStore } from '../stores/learning-store.js';
import { LearningNewTabView } from '../components/learning/LearningNewTabView.js';
import { LearningComingSoonView } from '../components/learning/LearningComingSoonView.js';
import { LearningFlashcardsView } from '../components/learning/LearningFlashcardsView.js';
import { LearningQuizzesView } from '../components/learning/LearningQuizzesView.js';
import { LearningExamView } from '../components/learning/LearningExamView.js';
import { LearningVideosView } from '../components/learning/LearningVideosView.js';
import { LearningAudiosView } from '../components/learning/LearningAudiosView.js';
import { LearningNotesView } from '../components/learning/LearningNotesView.js';
import { LearningPdfView } from '../components/learning/LearningPdfView.js';
import { LearningDocxView } from '../components/learning/LearningDocxView.js';
import { LearningSlidesView } from '../components/learning/LearningSlidesView.js';
import { LearningBoardView } from '../components/learning/LearningBoardView.js';
import { ToolEmptyLauncher } from '../components/learning/ToolEmptyLauncher.js';
import type { LearningToolType } from '@sos/domain';

export const LearningPage: React.FC = () => {
  const { tabs, activeTabId, fetchTabs, openTab } = useLearningStore();

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  const hasHandledUrlRef = useRef(false);

  // Handle URL search params handoff (e.g. from Home or Library) - execute once on mount
  useEffect(() => {
    if (typeof window === 'undefined' || hasHandledUrlRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const deckId = params.get('deckId');
    const assetId = params.get('assetId');
    const fileId = params.get('fileId');
    const fileType = params.get('type');
    const resourceId = assetId || fileId || deckId;

    if (!resourceId && !fileType) return;
    hasHandledUrlRef.current = true;

    // Clean URL so params do not linger or re-trigger on subsequent tab switches
    window.history.replaceState({}, document.title, window.location.pathname);

    // Check if tab already exists for this resource
    if (resourceId) {
      const existingTab = tabs.find((t) => t.resourceId === resourceId);
      if (existingTab) {
        if (activeTabId !== existingTab.id) {
          useLearningStore.getState().switchTab(existingTab.id);
        }
        return;
      }
    }

    if (deckId || fileType === 'flashcards') {
      openTab('flashcards', 'Flashcard Deck', deckId || resourceId || undefined);
    } else if (fileType === 'video' || fileType === 'videos') {
      openTab('videos', 'Video Lecture', resourceId || undefined);
    } else if (fileType === 'audio' || fileType === 'audios') {
      openTab('audios', 'Audio Lecture', resourceId || undefined);
    } else if (fileType === 'pdf') {
      openTab('pdf', 'Document (PDF)', resourceId || undefined);
    } else if (fileType === 'docx') {
      openTab('docx', 'Document (DOCX)', resourceId || undefined);
    } else if (fileType === 'slides') {
      openTab('slides', 'Presentation', resourceId || undefined);
    } else if (fileType === 'board') {
      openTab('board', 'Workspace Board', resourceId || undefined);
    } else if (fileType === 'note' || fileType === 'notes') {
      openTab('notes', 'Study Note', resourceId || undefined);
    } else if (fileType === 'quiz' || fileType === 'quizzes') {
      openTab('quizzes', 'Practice Quiz', resourceId || undefined);
    } else if (fileType === 'exam') {
      openTab('exam', 'Proctored Exam', resourceId || undefined);
    }
  }, [openTab, tabs, activeTabId]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0] || {
    id: 'tab-new-tab',
    toolType: 'new_tab' as LearningToolType,
    title: 'New Tab',
    active: true
  };

  const renderActiveTool = () => {
    // If not a new tab or board and has no bound resource, render the 3-option empty launcher
    if (
      activeTab.toolType !== 'new_tab' &&
      activeTab.toolType !== 'new-tab' &&
      activeTab.toolType !== 'board' &&
      !activeTab.resourceId
    ) {
      return <ToolEmptyLauncher toolType={activeTab.toolType} tabId={activeTab.id} />;
    }

    switch (activeTab.toolType) {
      case 'new_tab':
      case 'new-tab':
        return <LearningNewTabView />;
      case 'flashcards':
        return <LearningFlashcardsView deckId={activeTab.resourceId!} />;
      case 'quizzes':
        return <LearningQuizzesView quizId={activeTab.resourceId!} />;
      case 'exam':
        return <LearningExamView />;
      case 'videos':
        return <LearningVideosView mediaId={activeTab.resourceId!} />;
      case 'audios':
        return <LearningAudiosView mediaId={activeTab.resourceId!} />;
      case 'notes':
        return <LearningNotesView documentId={activeTab.resourceId!} />;
      case 'pdf':
        return <LearningPdfView fileId={activeTab.resourceId!} />;
      case 'docx':
        return <LearningDocxView fileId={activeTab.resourceId!} />;
      case 'slides':
        return <LearningSlidesView fileId={activeTab.resourceId!} />;
      case 'board':
        return <LearningBoardView boardId={activeTab.resourceId!} />;
      case 'spreadsheet':
      case 'images':
      case 'browser':
        return <LearningComingSoonView toolType={activeTab.toolType} title={activeTab.title} />;
      default:
        return <LearningNewTabView />;
    }
  };

  return (
    <div
      data-testid="learning-page"
      className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#080808]"
    >
      <h1 className="sr-only">Learning Workspace</h1>

      {/* Dynamic Active Workspace Canvas */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {renderActiveTool()}
      </div>
    </div>
  );
};
