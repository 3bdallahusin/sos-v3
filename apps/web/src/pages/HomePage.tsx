import React, { useEffect, useState } from 'react';
import { useShellStore } from '../stores/shell-store.js';
import { useHomeStore } from '../stores/home-store.js';
import {
  GreetingHeader,
  HorizonBar,
  DailyQuoteCard,
  DailyEssayCard,
  QuickResumeSection,
  TasksSection,
  QuickCaptureModal
} from '../components/home/index.js';
import { PenSquare, CheckCircle2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { workspace } = useShellStore();
  const {
    tasks,
    recentItems,
    isQuickCaptureOpen,
    loadHomeData,
    addTask,
    toggleTask,
    deleteTask,
    addQuickCaptureNote,
    setQuickCaptureOpen
  } = useHomeStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  // Global keyboard shortcut for quick-capture scratchpad: Cmd+N or Ctrl+N
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If user presses Cmd+N or Ctrl+N
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        // Prevent default browser new window
        e.preventDefault();
        setQuickCaptureOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setQuickCaptureOpen]);

  const handleSaveQuickNote = async (
    title: string,
    content: string,
    tags?: string[]
  ) => {
    await addQuickCaptureNote(title, content, tags);
    setToastMessage(`Saved note: "${title}"`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const userName =
    workspace && !workspace.isGuest && workspace.name !== 'Guest Workspace'
      ? workspace.name
      : 'Abdalla';

  return (
    <div
      data-testid="home-page"
      className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 md:px-10 md:py-4.5 flex flex-col items-center bg-[#09090B] relative"
    >
      <div className="w-full max-w-[1140px] flex flex-col">
        {/* ============================================================== */}
        {/* 1. CENTERED OVERSIZED DISPLAY GREETING                         */}
        {/* ============================================================== */}
        <GreetingHeader userName={userName} />

        {/* ============================================================== */}
        {/* 2. CLEAN FRAMELESS HORIZON BAR WITH PILL BADGES               */}
        {/* ============================================================== */}
        <HorizonBar
          title="Fall Semester 2026"
          daysLeft={48}
          percentage={50}
        />

        {/* ============================================================== */}
        {/* 3. FULL-WIDTH BALANCED EDITORIAL STACK (QUOTE & ESSAY)          */}
        {/* ============================================================== */}
        <div className="w-full flex flex-col gap-3 mb-3.5">
          <DailyQuoteCard
            quote="“We are what we repeatedly do. Excellence, then, is not an act, but a habit.”"
            author="Aristotle"
          />

          <DailyEssayCard
            title="On the Architecture of Deep Memory &amp; Forgetting"
            readTime="3 MIN READ"
            summary="Why deliberate retrieval beats passive re-reading in building durable mental models."
            onClick={() => {
              setToastMessage('Reading essay: On the Architecture of Deep Memory');
              setTimeout(() => setToastMessage(null), 2500);
            }}
          />
        </div>

        {/* ============================================================== */}
        {/* 4. REIMAGINED 50/50 EXECUTION ROW (LINEAR/RAYCAST MINIMALISM)   */}
        {/* ============================================================== */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch mb-4">
          <QuickResumeSection items={recentItems} />
          <TasksSection
            tasks={tasks}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
          />
        </div>

        {/* Quick Scratchpad Action Trigger */}
        <div className="w-full flex items-center justify-between pt-1 pb-3 px-1 text-[11px] text-[#52525B] font-mono">
          <button
            type="button"
            data-testid="open-quick-capture-btn"
            onClick={() => setQuickCaptureOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111114] border border-[#1F1F23] hover:border-[#2E2E33] hover:text-[#A1A1AA] transition-all text-[#71717A] cursor-pointer"
          >
            <PenSquare className="w-3 h-3 text-[#A1A1AA]" />
            <span>Quick Scratchpad Note</span>
            <kbd className="px-1 py-0.2 rounded bg-[#18181B] border border-[#27272A] text-[9.5px]">
              ⌘N
            </kbd>
          </button>
          <span>SOS Local Persistence &bull; Dexie v2</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* QUICK CAPTURE SCRATCHPAD MODAL                                */}
      {/* ============================================================== */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
        onSave={handleSaveQuickNote}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          data-testid="home-toast"
          className="fixed bottom-5 right-5 z-50 bg-[#18181B] border border-[#27272A] text-[#F4F4F5] px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs animate-in slide-in-from-bottom-2 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate max-w-[260px]">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
