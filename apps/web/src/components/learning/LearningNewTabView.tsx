import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  FileText,
  FileCode,
  Presentation,
  LayoutGrid,
  Table,
  Image as ImageIcon,
  Video,
  Headphones,
  Globe,
  PenTool,
  Layers,
  CheckCircle,
  ClipboardCheck,
  Sparkles
} from 'lucide-react';
import { useLearningStore } from '../../stores/learning-store.js';
import { SOSCard } from '../ui/SOSCard.js';
import type { LearningToolType } from '@sos/domain';

interface ToolConfig {
  type: LearningToolType;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOOLS: ToolConfig[] = [
  // Row 1: Notes | PDF | Docs | Slides
  { type: 'notes' as LearningToolType, title: 'Notes', icon: PenTool },
  { type: 'pdf' as LearningToolType, title: 'PDF', icon: FileText },
  { type: 'docx' as LearningToolType, title: 'Docs', icon: FileCode },
  { type: 'slides' as LearningToolType, title: 'Slides', icon: Presentation },

  // Row 2: Board | Images | Videos | Audios
  { type: 'board' as LearningToolType, title: 'Board', icon: LayoutGrid },
  { type: 'images' as LearningToolType, title: 'Images', icon: ImageIcon },
  { type: 'videos' as LearningToolType, title: 'Videos', icon: Video },
  { type: 'audios' as LearningToolType, title: 'Audios', icon: Headphones },

  // Row 3: Browser | Flashcards | Quizzes | Exam
  { type: 'browser' as LearningToolType, title: 'Browser', icon: Globe },
  { type: 'flashcards' as LearningToolType, title: 'Flashcards', icon: Layers },
  { type: 'quizzes' as LearningToolType, title: 'Quizzes', icon: CheckCircle },
  { type: 'exam' as LearningToolType, title: 'Exam', icon: ClipboardCheck }
];

export const LearningNewTabView: React.FC = () => {
  const {
    openTab,
    morphActiveTab,
    recentMaterials,
    fetchTabs,
    fetchRecentMaterials,
    fetchRecommendations
  } = useLearningStore();

  const [isSeeding, setIsSeeding] = useState(false);

  const handleLoadSampleWorkspace = async () => {
    try {
      setIsSeeding(true);
      const res = await fetch('/api/learning/seed-demo', { method: 'POST' });
      if (res.ok) {
        await fetchTabs();
        await fetchRecentMaterials();
        const data = await res.json();
        if (data.activeTabId) {
          useLearningStore.getState().switchTab(data.activeTabId);
        }
      }
    } catch (err) {
      console.error('Failed to seed sample workspace:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    fetchRecentMaterials();
    fetchRecommendations();
  }, [fetchRecentMaterials, fetchRecommendations]);

  const handleLaunchTool = (tool: ToolConfig) => {
    // Morph active New Tab in place without spawning an extra tab
    morphActiveTab(tool.type, tool.title, null);
  };

  const handleResumeRecent = (item: any) => {
    const toolType = item.toolType as LearningToolType;
    openTab(toolType, item.title, item.resourceId);
  };

  const getItemIcon = (toolType: string) => {
    switch (toolType) {
      case 'pdf':
        return FileText;
      case 'docx':
        return FileCode;
      case 'slides':
        return Presentation;
      case 'board':
        return LayoutGrid;
      case 'flashcards':
        return Layers;
      case 'notes':
        return PenTool;
      case 'videos':
        return Video;
      case 'audios':
        return Headphones;
      case 'quizzes':
        return CheckCircle;
      case 'exam':
        return ClipboardCheck;
      default:
        return FileText;
    }
  };

  return (
    <div
      data-testid="learning-new-tab"
      className="flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col items-center bg-[#080808] text-[#FAFAFA] select-none"
    >
      <div className="w-full max-w-[880px] flex flex-col gap-8">
        
        {/* Launcher Greeting (Clean Centered Heading, No Badge, No Subtitle) */}
        <div className="flex flex-col items-center text-center pt-2">
          <h1 className="text-[22px] font-semibold text-[#F4F4F5] tracking-tight">
            Open a Learning Tab
          </h1>
        </div>

        {/* 12 Approved Learning Tools Grid (3x4, Center-Aligned Icon & Title, Zero Descriptions) */}
        <div className="grid grid-cols-4 gap-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <SOSCard
                key={tool.type}
                enableSpotlight={true}
                interactive={true}
                className="h-[76px] rounded-[12px] bg-[#121214] border border-[#1E1E22] transition-all duration-150 ease-out cursor-pointer"
                innerClassName="items-center justify-center text-center p-3"
                onClick={() => handleLaunchTool(tool)}
                data-testid={`tool-card-${tool.type}`}
              >
                <Icon className="w-5 h-5 text-[#E4E4E7] group-hover/card:scale-[1.05] transition-transform duration-150 ease-out" />
                <span className="text-[13px] font-medium text-[#F4F4F5] mt-1.5 tracking-tight">
                  {tool.title}
                </span>
              </SOSCard>
            );
          })}
        </div>

        {/* Recent Study Materials Section (2x2 Grid of 4 Cards with Resume Pill Buttons) */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between border-b border-[#1E1E22] pb-2">
            <span className="text-xs font-semibold text-[#F4F4F5]">
              Recent Study Materials
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                data-testid="btn-load-sample-workspace"
                onClick={handleLoadSampleWorkspace}
                disabled={isSeeding}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] hover:bg-[#222226] text-[11px] font-medium text-[#E4E4E7] hover:text-white transition-all active:scale-[0.97] cursor-pointer"
                title="Populate realistic interconnected study boards, guides, review docs, and slide decks"
              >
                <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                <span>{isSeeding ? 'Loading Workspace...' : 'Load Sample Workspace'}</span>
              </button>
              <Link
                to="/library"
                className="text-[11px] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors"
              >
                View All in Library →
              </Link>
            </div>
          </div>

          {recentMaterials.length === 0 ? (
            <div className="py-8 px-4 rounded-[14px] bg-[#121214] border border-[#1E1E22] text-center flex flex-col items-center justify-center">
              <span className="text-xs text-[#71717A]">
                No recent study materials yet. Create a note, upload a document, or start a new board to get started.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {recentMaterials.slice(0, 4).map((item) => {
                const Icon = getItemIcon(item.toolType);
                return (
                  <SOSCard
                    key={item.id}
                    enableSpotlight={true}
                    interactive={true}
                    className="p-3.5 rounded-[12px] bg-[#121214] border border-[#1E1E22] transition-all duration-150 ease-out cursor-pointer shadow-sm"
                    innerClassName="flex-row items-center justify-between"
                    onClick={() => handleResumeRecent(item)}
                    data-testid={`recent-material-${item.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-[10px] bg-[#161619] border border-[#222226] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[#A1A1AA] group-hover/card:text-[#F4F4F5] transition-colors" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-[#F4F4F5] group-hover/card:text-white transition-colors truncate">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-[#71717A] truncate">
                          {item.metaText && item.lastOpened
                            ? `${item.metaText} • Opened ${item.lastOpened}`
                            : item.metaText || (item.lastOpened ? `Opened ${item.lastOpened}` : 'Recently Opened')}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResumeRecent(item);
                      }}
                      className="px-3 py-1 rounded-[8px] bg-[#1A1A1E] border border-[#2E2E34] text-[#F4F4F5] text-xs font-medium hover:border-[#3F3F46] hover:bg-[#222228] transition-all shrink-0 cursor-pointer"
                    >
                      Resume
                    </button>
                  </SOSCard>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
