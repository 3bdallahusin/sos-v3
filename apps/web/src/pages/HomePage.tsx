import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  FileText,
  Video,
  FileCode,
  Layers,
  ArrowRight,
  ArrowUpRight,
  Plus,
  Check
} from 'lucide-react';
import { useShellStore } from '../stores/shell-store.js';

interface RecentItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
}

const RECENT_ITEMS: RecentItem[] = [
  {
    id: 'kandel-pdf',
    title: 'Kandel_Principles_Ch12.pdf',
    subtitle: 'Page 42',
    icon: FileText,
    path: '/learning'
  },
  {
    id: 'stanford-video',
    title: 'Stanford_Neuro_Lecture_04.mp4',
    subtitle: '16:48 / 45:00',
    icon: Video,
    path: '/learning'
  },
  {
    id: 'plasticity-notes',
    title: 'Cellular_Plasticity_Synthesis.md',
    subtitle: 'Section 2',
    icon: FileCode,
    path: '/learning'
  },
  {
    id: 'snare-flashcards',
    title: 'SNARE_Machinery_Deck',
    subtitle: 'Card 14 / 50',
    icon: Layers,
    path: '/learning'
  }
];

const INITIAL_TASKS: TaskItem[] = [
  { id: 'task-1', title: 'Neurobiology Lecture 04', completed: false },
  { id: 'task-2', title: 'Review 14 Due Cards — SNARE Deck', completed: false },
  { id: 'task-3', title: 'Complete Kv1.1 Assessment', completed: false },
  { id: 'task-4', title: 'Summarize CaMKII notes', completed: true }
];

export const HomePage: React.FC = () => {
  const { workspace } = useShellStore();
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const completedCount = tasks.filter((t) => t.completed).length;

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      setTasks((prev) => [
        ...prev,
        { id: `task-${Date.now()}`, title: newTaskTitle.trim(), completed: false }
      ]);
      setNewTaskTitle('');
    }
  };

  return (
    <div
      data-testid="home-page"
      className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 md:px-10 md:py-4.5 flex flex-col items-center bg-[#09090B]"
    >
      <div className="w-full max-w-[1140px] flex flex-col">
        {/* ============================================================== */}
        {/* 1. CENTERED OVERSIZED DISPLAY GREETING                         */}
        {/* ============================================================== */}
        <div className="w-full flex flex-col items-center text-center mb-3.5">
          <h1 className="text-[36px] font-semibold text-[#F4F4F5] tracking-[-0.03em] leading-[1.1]">
            Good morning, Abdalla
          </h1>
          <p className="text-[12.5px] text-[#71717A] mt-1 font-normal">
            Saturday, November 14, 2026
          </p>
        </div>

        {/* ============================================================== */}
        {/* 2. CLEAN FRAMELESS HORIZON BAR WITH PILL BADGES               */}
        {/* ============================================================== */}
        <div className="w-full mb-3.5 flex flex-col px-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[#F4F4F5]">
              Fall Semester 2026
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-[6px] bg-[#18181B] border border-[#27272A] text-[11.5px] font-mono text-[#E4E4E7] tabular-nums">
                48 days left
              </span>
              <span className="px-2.5 py-0.5 rounded-[6px] bg-[#18181B] border border-[#27272A] text-[11.5px] font-mono text-[#E4E4E7] tabular-nums">
                50%
              </span>
            </div>
          </div>

          {/* Progress Track */}
          <div className="w-full h-[2.5px] bg-[#18181B] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E4E4E7] rounded-full transition-all duration-500"
              style={{ width: '50%' }}
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. FULL-WIDTH BALANCED EDITORIAL STACK (QUOTE & ESSAY)          */}
        {/* ============================================================== */}
        <div className="w-full flex flex-col gap-3 mb-3.5">
          {/* Full-Width Balanced Daily Quote Card */}
          <div className="w-full bg-[#111114] border border-[#1F1F23] hover:border-[#27272A] rounded-2xl px-6 py-3.5 md:px-7 md:py-3.5 shadow-sm flex flex-col justify-between transition-colors">
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
                “We are what we repeatedly do. Excellence, then, is not an act, but a habit.”
              </p>
            </blockquote>

            {/* Clean Attribution Row: — Aristotle (Unified surface, NO divider line) */}
            <div className="flex items-center pt-1.5 mt-0.5 text-xs">
              <span className="text-[12.5px] font-medium text-[#71717A] tracking-tight">
                — Aristotle
              </span>
            </div>
          </div>

          {/* Full-Width Clickable Editorial Feature Card (Daily Essay) */}
          <div className="w-full bg-[#111114] border border-[#1F1F23] hover:border-[#2E2E33] rounded-2xl px-6 py-3.5 md:px-7 md:py-3.5 shadow-sm flex flex-col cursor-pointer transition-all duration-200 group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-[#71717A] font-mono uppercase tracking-[0.12em]">
                DAILY ESSAY
              </span>
              <div className="flex items-center gap-1 text-[11px] font-mono text-[#71717A] uppercase tracking-wider group-hover:text-[#F4F4F5] transition-colors">
                <span>3 MIN READ</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <h2 className="text-[18px] md:text-[19.5px] font-semibold text-[#F4F4F5] tracking-[-0.02em] leading-[1.2] group-hover:text-white transition-colors mb-1">
              On the Architecture of Deep Memory &amp; Forgetting
            </h2>

            <p className="text-[13px] text-[#8E8E93] leading-[1.4] m-0 font-normal">
              Why deliberate retrieval beats passive re-reading in building durable mental models.
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. REIMAGINED 50/50 EXECUTION ROW (LINEAR/RAYCAST MINIMALISM)   */}
        {/* ============================================================== */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* Left Card: Continue Where You Left Off */}
          <div className="bg-[#111114] border border-[#1F1F23] hover:border-[#27272A] rounded-2xl p-4.5 md:p-5 flex flex-col justify-between shadow-sm transition-colors">
            <div>
              {/* Header Row */}
              <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-[#18181B]">
                <span className="text-[10px] text-[#71717A] font-mono uppercase tracking-[0.1em]">
                  CONTINUE WHERE YOU LEFT OFF
                </span>
              </div>

              {/* 4 Spacious Resume Rows */}
              <div className="flex flex-col divide-y divide-[#161619]">
                {RECENT_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className="py-2 px-2 flex items-center justify-between text-[13px] group/item transition-all hover:bg-white/[0.02] rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#161619] border border-[#242428] flex items-center justify-center text-[#A1A1AA] shrink-0 group-hover/item:border-[#38383E] group-hover/item:text-[#F4F4F5] transition-colors">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0 gap-0.5">
                          <span className="text-[#F4F4F5] font-medium truncate text-[13px] group-hover/item:text-white transition-colors">
                            {item.title}
                          </span>
                          <span className="text-[11.5px] text-[#71717A] truncate font-normal">
                            {item.subtitle}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0 ml-3">
                        <ArrowRight className="w-3.5 h-3.5 text-[#52525B] group-hover/item:text-[#F4F4F5] group-hover/item:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Card: Today's Tasks */}
          <div className="bg-[#111114] border border-[#1F1F23] hover:border-[#27272A] rounded-2xl p-4.5 md:p-5 flex flex-col justify-between shadow-sm transition-colors">
            <div>
              {/* Header Row */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#18181B]">
                <span className="text-[10px] text-[#71717A] font-mono uppercase tracking-[0.1em]">
                  TODAY&apos;S TASKS
                </span>
                <span className="text-[11.5px] text-[#71717A] font-mono tabular-nums">
                  {completedCount} / {tasks.length}
                </span>
              </div>

              {/* Quick-Add Task Input */}
              <div className="w-full h-9 px-3 bg-[#09090B] border border-[#1F1F23] rounded-xl flex items-center gap-2 mb-2 focus-within:border-[#2E2E33] focus-within:ring-1 focus-within:ring-[#2E2E33] transition-all">
                <Plus className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={handleAddTask}
                  placeholder="Add a task..."
                  className="w-full bg-transparent border-0 p-0 text-[12.5px] text-[#F4F4F5] placeholder-[#71717A] focus:ring-0 focus:outline-none"
                />
              </div>

              {/* Interactive Task Rows */}
              <div className="flex flex-col divide-y divide-[#161619]">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className="py-2 px-2 flex items-center text-[13px] hover:bg-white/[0.02] rounded-lg transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 w-full">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTask(task.id);
                        }}
                        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                        className={`w-3.5 h-3.5 rounded-[4px] flex items-center justify-center shrink-0 transition-colors ${
                          task.completed
                            ? 'bg-[#27272A] border border-[#3F3F46] text-[#F4F4F5]'
                            : 'border border-[#3F3F46] hover:border-[#71717A]'
                        }`}
                      >
                        {task.completed && <Check className="w-2 h-2 stroke-[3]" />}
                      </button>
                      <span
                        className={`truncate font-normal text-[13px] transition-colors ${
                          task.completed
                            ? 'text-[#71717A] line-through'
                            : 'text-[#F4F4F5]'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
