import React, { useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import type { TaskItem } from '@sos/domain';

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
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const completedCount = tasks.filter((t) => t.completed).length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      e.preventDefault();
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  return (
    <div
      data-testid="tasks-section"
      className="bg-[#111114] border border-[#1F1F23] hover:border-[#27272A] rounded-2xl p-4.5 md:p-5 flex flex-col justify-between shadow-sm transition-colors"
    >
      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#18181B]">
          <span className="text-[10px] text-[#71717A] font-mono uppercase tracking-[0.1em]">
            TODAY&apos;S TASKS
          </span>
          <span
            data-testid="tasks-counter"
            className="text-[11.5px] text-[#71717A] font-mono tabular-nums"
          >
            {completedCount} / {tasks.length}
          </span>
        </div>

        {/* Quick-Add Task Input */}
        <div className="w-full h-9 px-3 bg-[#09090B] border border-[#1F1F23] rounded-xl flex items-center gap-2 mb-2 focus-within:border-[#2E2E33] focus-within:ring-1 focus-within:ring-[#2E2E33] transition-all">
          <Plus className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
          <input
            type="text"
            data-testid="add-task-input"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task..."
            className="w-full bg-transparent border-0 p-0 text-[12.5px] text-[#F4F4F5] placeholder-[#71717A] focus:ring-0 focus:outline-none"
          />
        </div>

        {/* Interactive Task Rows */}
        <div className="flex flex-col divide-y divide-[#161619]" data-testid="tasks-list">
          {tasks.length === 0 ? (
            <div className="py-6 text-center text-[12px] text-[#71717A] font-mono">
              No tasks for today. Add one above!
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                data-testid={`task-row-${task.id}`}
                onClick={() => onToggleTask(task.id)}
                className="py-2 px-2 flex items-center justify-between text-[13px] hover:bg-white/[0.02] rounded-lg transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    data-testid={`task-checkbox-${task.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTask(task.id);
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
                    data-testid={`task-title-${task.id}`}
                    className={`truncate font-normal text-[13px] transition-colors ${
                      task.completed
                        ? 'text-[#71717A] line-through'
                        : 'text-[#F4F4F5]'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                {/* Subtle Hover Delete Button */}
                <button
                  type="button"
                  data-testid={`task-delete-${task.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                  title="Delete task"
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#52525B] hover:text-[#EF4444] hover:bg-[#18181B] rounded transition-all ml-2"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
