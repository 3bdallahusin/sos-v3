import React from 'react';
import {
  FileText,
  FileCode,
  Presentation,
  Table,
  Image as ImageIcon,
  Video,
  Headphones,
  Globe,
  PenTool,
  Layers,
  CheckCircle,
  ClipboardCheck,
  LayoutGrid,
  Plus,
  X
} from 'lucide-react';
import { useLearningStore } from '../../stores/learning-store.js';
import type { LearningToolType } from '@sos/domain';

export const getToolIcon = (toolType: string) => {
  switch (toolType) {
    case 'new_tab':
    case 'new-tab':
      return Plus;
    case 'flashcards':
      return Layers;
    case 'quizzes':
      return CheckCircle;
    case 'exam':
      return ClipboardCheck;
    case 'videos':
      return Video;
    case 'audios':
      return Headphones;
    case 'pdf':
      return FileText;
    case 'docx':
      return FileCode;
    case 'slides':
      return Presentation;
    case 'board':
      return LayoutGrid;
    case 'spreadsheet':
      return Table;
    case 'images':
      return ImageIcon;
    case 'browser':
      return Globe;
    case 'notes':
      return PenTool;
    default:
      return Plus;
  }
};

export const LearningTabBar: React.FC = () => {
  const { tabs, activeTabId, switchTab, closeTab, openTab, reorderTabs } = useLearningStore();
  const [draggedTabId, setDraggedTabId] = React.useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = React.useState<string | null>(null);

  const handleNewTab = () => {
    openTab('new_tab' as LearningToolType, 'New Tab');
  };

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    e.dataTransfer.setData('text/plain', tabId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTabId(tabId);
  };

  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTabId !== tabId) {
      setDragOverTabId(tabId);
    }
  };

  const handleDragLeave = (tabId: string) => {
    if (dragOverTabId === tabId) {
      setDragOverTabId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedTabId;
    if (sourceId && sourceId !== targetTabId) {
      reorderTabs(sourceId, targetTabId);
    }
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  return (
    <div
      data-testid="learning-tab-bar"
      className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1 select-none flex-1 min-w-0"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isDragging = tab.id === draggedTabId;
        const isDragOver = tab.id === dragOverTabId && !isDragging;
        const Icon = getToolIcon(tab.toolType);

        return (
          <div
            key={tab.id}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => handleDragOver(e, tab.id)}
            onDragLeave={() => handleDragLeave(tab.id)}
            onDrop={(e) => handleDrop(e, tab.id)}
            onDragEnd={handleDragEnd}
            onClick={() => switchTab(tab.id)}
            data-testid={`tab-${tab.id}`}
            data-active={isActive ? "true" : "false"}
            className={`h-8 px-3 rounded-[14px] text-xs font-medium flex items-center gap-2 border shadow-sm shrink-0 cursor-pointer transition-all duration-150 ${
              isDragging
                ? 'opacity-40 scale-95 border-dashed border-[#60A5FA]'
                : isDragOver
                ? 'border-[#60A5FA] bg-[#1C1C24] ring-1 ring-[#60A5FA]/50'
                : isActive
                ? 'bg-[#18181B] text-[#F4F4F5] border-[#27272A]'
                : 'bg-[#111113] text-[#A1A1AA] border-[#1F1F23] hover:text-[#F4F4F5] hover:bg-[#18181B]'
            }`}
          >
            {tab.toolType !== 'new_tab' && tab.toolType !== 'new-tab' && (
              <Icon className="w-3.5 h-3.5 text-[#F4F4F5] shrink-0" />
            )}
            <bdi className="truncate max-w-[160px] sm:max-w-[200px] whitespace-nowrap" dir="auto">
              {tab.title.replace(/^\+\s*/, '')}
            </bdi>

            {tabs.length > 1 && (
              <button
                type="button"
                data-testid={`close-tab-${tab.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="w-4 h-4 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#F4F4F5] hover:bg-white/10 ml-0.5 transition-colors"
                title="Close Tab"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      {/* + New Tab Launcher Button */}
      <button
        type="button"
        onClick={handleNewTab}
        data-testid="new-tab-btn"
        className="w-7 h-7 rounded-[10px] flex items-center justify-center hover:bg-white/5 text-[#71717A] hover:text-[#F4F4F5] transition-all shrink-0 active:scale-95 ml-0.5 cursor-pointer"
        title="Open New Tab"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
