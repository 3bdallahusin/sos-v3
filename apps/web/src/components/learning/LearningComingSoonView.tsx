import React from 'react';
import {
  FileText,
  FileCode,
  Presentation,
  Table,
  Image,
  Globe,
  FileEdit,
  ArrowLeft,
  Sparkles,
  Layers,
  HelpCircle,
  Video
} from 'lucide-react';
import { useLearningStore } from '../../stores/learning-store.js';
import type { LearningToolType } from '@sos/domain';

interface ComingSoonProps {
  toolType: LearningToolType;
  title: string;
}

const TOOL_METADATA: Record<string, { icon: React.ComponentType<{ className?: string }>; description: string }> = {
  pdf: {
    icon: FileText,
    description: 'High-speed document viewing, native PDF annotations, multi-page side-by-side citations, and PDF-to-flashcard generation.'
  },
  docx: {
    icon: FileCode,
    description: 'Formatted manuscript writing and academic thesis editor with automatic citation graph formatting and export.'
  },
  slides: {
    icon: Presentation,
    description: 'Visual presentation deck renderer with synchronized speaker notes, slide outline navigation, and audio presentation recording.'
  },
  spreadsheet: {
    icon: Table,
    description: 'Tabular data analysis, statistical biophysics calculations, formula evaluation, and scientific charting.'
  },
  images: {
    icon: Image,
    description: 'High-resolution histological micrograph zoom, neuroanatomy 3D slice inspection, and anatomical visual tagging.'
  },
  browser: {
    icon: Globe,
    description: 'Sandboxed research web canvas for PubMed, arXiv, and university library search with one-click clipping to notes.'
  },
  notes: {
    icon: FileEdit,
    description: 'Distraction-free Markdown workspace with bidirectional backlinking, LaTeX formula rendering, and flashcard extraction.'
  }
};

export const LearningComingSoonView: React.FC<ComingSoonProps> = ({ toolType, title }) => {
  const { openTab } = useLearningStore();

  const meta = TOOL_METADATA[toolType] || {
    icon: FileText,
    description: 'Core academic workspace engine currently under active engineering.'
  };
  const Icon = meta.icon;

  return (
    <div
      data-testid="coming-soon-view"
      className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col items-center justify-center bg-[#080808] text-[#EDEDED]"
    >
      <div className="max-w-md w-full p-8 rounded-[12px] bg-[#111113] border border-[#1E1E22] flex flex-col items-center text-center shadow-sm">
        {/* Crisp Monochrome Icon Squircle */}
        <div className="w-16 h-16 rounded-2xl bg-[#18181E] border border-[#2B2B33] flex items-center justify-center text-[#FAFAFA] mb-5 shadow-inner">
          <Icon className="w-8 h-8 text-[#FAFAFA]" />
        </div>

        {/* Subtle Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1A1A22] border border-[#2E2E3C] text-[11px] font-mono text-[#A1A1AA] mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
          <span>In Active Development • Core Engine</span>
        </div>

        {/* Title & Description */}
        <h2 className="text-xl font-semibold text-[#FAFAFA] tracking-tight mb-2">
          {title}
        </h2>
        <p className="text-xs text-[#A1A1AA] leading-relaxed mb-6 max-w-sm">
          {meta.description}
        </p>

        {/* Quick Nav Actions */}
        <div className="w-full space-y-2.5">
          <button
            type="button"
            data-testid="return-new-tab-btn"
            onClick={() => openTab('new_tab' as LearningToolType, 'New Tab')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1E1E24] hover:bg-[#282830] border border-[#2E2E38] text-xs font-medium text-[#FAFAFA] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Command Center</span>
          </button>

          <div className="pt-2 text-[11px] text-[#71717A] font-mono uppercase tracking-wider mb-2">
            Or jump to active modules:
          </div>

          <div className="grid grid-cols-3 gap-2 w-full">
            <button
              type="button"
              onClick={() => openTab('flashcards' as LearningToolType, 'CaMKII_Receptor_Kinetics.cards', 'deck-camkii')}
              className="py-2 px-2 rounded-lg bg-[#151518] hover:bg-[#1C1C20] border border-[#24242A] text-[11px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#6EE7B7]" />
              <span>Flashcards</span>
            </button>

            <button
              type="button"
              onClick={() => openTab('quizzes' as LearningToolType, 'Neurophysiology_Quiz.quiz', 'quiz-neurophys')}
              className="py-2 px-2 rounded-lg bg-[#151518] hover:bg-[#1C1C20] border border-[#24242A] text-[11px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Quizzes</span>
            </button>

            <button
              type="button"
              onClick={() => openTab('videos' as LearningToolType, 'Synaptic_Transmission_Lecture.mp4', 'media-stanford-neuro-vid')}
              className="py-2 px-2 rounded-lg bg-[#151518] hover:bg-[#1C1C20] border border-[#24242A] text-[11px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <Video className="w-3.5 h-3.5 text-[#F472B6]" />
              <span>Videos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
