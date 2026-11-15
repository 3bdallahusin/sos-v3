import React, { useEffect } from 'react';
import { useShellStore } from '../stores/shell-store.js';
import { useHomeStore } from '../stores/home-store.js';
import {
  GreetingHeader,
  HorizonBar,
  DailyQuoteCard,
  DailyEssayCard,
  QuickResumeSection,
  TasksSection
} from '../components/home/index.js';

export const HomePage: React.FC = () => {
  const { workspace } = useShellStore();
  const {
    tasks,
    recentItems,
    loadHomeData,
    addTask,
    toggleTask,
    deleteTask
  } = useHomeStore();

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  // Derive genuine user display name if configured; Guest users receive the generic greeting
  const userDisplayName =
    workspace && !workspace.isGuest && workspace.name && workspace.name !== 'Guest Workspace'
      ? workspace.name
      : undefined;

  return (
    <div
      data-testid="home-page"
      className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 md:px-10 md:py-4.5 flex flex-col items-center bg-[#09090B]"
    >
      <div className="w-full max-w-[1140px] flex flex-col">
        {/* ============================================================== */}
        {/* 1. CENTERED OVERSIZED DISPLAY GREETING                         */}
        {/* ============================================================== */}
        <GreetingHeader userName={userDisplayName} />

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
          />
        </div>

        {/* ============================================================== */}
        {/* 4. REIMAGINED 50/50 EXECUTION ROW (LINEAR/RAYCAST MINIMALISM)   */}
        {/* ============================================================== */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch pb-4">
          <QuickResumeSection items={recentItems} />
          <TasksSection
            tasks={tasks}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
          />
        </div>
      </div>
    </div>
  );
};
