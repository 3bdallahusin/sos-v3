import React, { useState, useRef, useEffect } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import type { TaskItem } from '@sos/domain';
import { SOSCard } from '../ui/SOSCard.js';

interface TasksSectionProps {
  tasks: TaskItem[];
  onAddTask: (title: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask
}) => {
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isPulsing, setIsPulsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isInputOpen) {
      inputRef.current?.focus();
    }
  }, [isInputOpen]);

  const handleCommitTask = () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) {
      setIsInputOpen(false);
      return;
    }

    setIsPulsing(true);
    onAddTask(trimmed);
    setNewTaskTitle('');

    setTimeout(() => {
      setIsPulsing(false);
      setIsInputOpen(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommitTask();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setNewTaskTitle('');
      setIsInputOpen(false);
    }
  };

  return (
    <SOSCard
      data-testid="tasks-section"
      className="h-[320px] px-3.5 py-4"
      innerClassName="justify-between"
    >
      <div>
        {/* Centered Header with Tucked Corner + Button */}
        <div className="relative pb-3 mb-1.5 border-b border-[#1E1E22]/80 flex items-center justify-center select-none">
          <h3 className="text-[11px] uppercase text-[#71717A] font-mono tracking-[0.1em] m-0">
            TODAY&apos;S TASKS
          </h3>

          <button
            type="button"
            data-testid="add-task-toggle-button"
            onClick={() => setIsInputOpen((prev) => !prev)}
            aria-label="Add a task"
            title="Add task"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#18181B] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tactile Expanding Inline Input Row */}
        <div
          className={`transition-all duration-140 ease-out overflow-hidden ${
            isInputOpen ? 'h-[38px] opacity-100 my-1' : 'h-0 opacity-0 my-0'
          }`}
        >
          <div
            className={`w-full h-[36px] px-3 bg-[#09090B] border border-[#27272A] rounded-lg flex items-center gap-2 transition-all ${
              isPulsing ? 'ring-2 ring-white/40 border-white/60 bg-[#141417]' : ''
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              data-testid="inline-task-input"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newTaskTitle.trim()) {
                  setIsInputOpen(false);
                }
              }}
              placeholder="What task needs to be completed?"
              className="w-full bg-transparent border-0 p-0 text-[12.5px] text-[#FAFAFA] placeholder-[#71717A] focus:ring-0 focus:outline-none"
            />
          </div>
        </div>

        {/* Clean vertical spacing (space-y-1) without horizontal divider lines */}
        <div className="flex flex-col space-y-1">
          {tasks.slice(0, 4).map((task) => (
            <div
              key={task.id}
              data-testid={`task-row-${task.id}`}
              onClick={() => onToggleTask(task.id)}
              className="sos-exec-row group/row h-[52px] px-2 flex items-center justify-between rounded-lg transition-colors cursor-pointer hover:bg-[#161619]"
            >
              {/* Fix 2: Crisp 11x11 Lucide Check with strokeWidth={2.5} inside 16x16 container */}
              <div className="flex items-center gap-2.5 min-w-0 overflow-hidden flex-1 mr-2">
                <button
                  type="button"
                  data-testid={`task-checkbox-${task.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(task.id);
                  }}
                  aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                  className={`w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0 transition-all ${
                    task.completed
                      ? 'bg-[#27272A] border border-[#3F3F46] text-[#FAFAFA]'
                      : 'border border-[#3F3F46] hover:border-[#71717A]'
                  }`}
                >
                  {task.completed && (
                    <Check
                      className="w-2.5 h-2.5 text-white"
                      strokeWidth={2.5}
                    />
                  )}
                </button>

                <span
                  data-testid={`task-title-${task.id}`}
                  className={`text-[13px] font-normal truncate flex-1 min-w-0 whitespace-nowrap transition-all duration-140 ease-out ${
                    task.completed
                      ? 'text-[#52525B] line-through'
                      : 'text-[#FAFAFA]'
                  }`}
                >
                  {task.title}
                </span>
              </div>

              {/* Hover Delete Action (shrink-0) */}
              <div className="relative group/tooltip flex items-center justify-center shrink-0">
                <button
                  type="button"
                  data-testid={`task-delete-${task.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                  aria-label={`Delete ${task.title}`}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[#71717A] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 opacity-0 group-hover/row:opacity-100 transition-all duration-150 shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-full right-0 mb-1.5 px-2 py-0.5 rounded-[6px] bg-[#1C1C21] border border-[#3F3F46] text-[11px] font-medium text-[#F4F4F5] whitespace-nowrap shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-140 pointer-events-none z-50">
                  Delete task
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SOSCard>
  );
};
