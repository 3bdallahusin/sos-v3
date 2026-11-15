import React from 'react';
import { Sparkles, X, Paperclip, ArrowUp, Bot } from 'lucide-react';
import { useShellStore } from '../../stores/shell-store.js';

export const RightAiPanel: React.FC = () => {
  const { aiPanelOpen, toggleAiPanel, workspace } = useShellStore();

  if (!aiPanelOpen) {
    return null;
  }

  return (
    <aside
      aria-label="AI Assistant Panel"
      data-testid="right-ai-panel"
      className="w-[340px] h-full flex flex-col bg-[#09090B] border border-[#222226] rounded-[24px] overflow-hidden flex-shrink-0 select-none"
    >
      {/* 48px Header */}
      <div
        data-testid="ai-panel-header"
        className="h-12 border-b border-[#222226] px-4 flex items-center justify-between flex-shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[8px] bg-[#141417] border border-[#2A2A30] flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-[#F97316]" />
          </div>
          <span className="text-xs font-semibold text-[#FAFAFA] tracking-wide">
            SOS Assistant
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-[#141417] border border-[#2A2A30] text-[9px] font-mono text-[#71717A]">
            Phase 01
          </span>
        </div>

        <button
          type="button"
          onClick={toggleAiPanel}
          aria-label="Close AI panel"
          title="Close AI panel"
          className="w-7 h-7 rounded-[10px] flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-white/5 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Conversation Stream Empty State */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-between">
        <div className="flex flex-col items-center text-center mt-8 gap-3">
          <div className="w-12 h-12 rounded-[18px] bg-[#0C0C0E] border border-[#222226] flex items-center justify-center text-[#A1A1AA]">
            <Bot className="w-6 h-6 text-[#71717A]" />
          </div>

          <div className="flex flex-col gap-1 max-w-[260px]">
            <h3 className="text-xs font-semibold text-[#FAFAFA]">
              Context-Aware Study Partner
            </h3>
            <p className="text-[11px] text-[#71717A] leading-relaxed">
              Your AI workspace companion connects seamlessly to your notes, slides, and study sessions.
            </p>
          </div>

          {/* Connected Context Badge */}
          <div className="w-full mt-2 p-2.5 rounded-[14px] bg-[#0C0C0E] border border-[#222226] flex items-center justify-between text-[11px]">
            <span className="text-[#71717A]">Workspace Context:</span>
            <span className="text-[#16A34A] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              Guest (Local)
            </span>
          </div>

          {/* Model Selection Indicator */}
          <div className="w-full p-2.5 rounded-[14px] bg-[#0C0C0E] border border-[#222226] flex items-center justify-between text-[11px]">
            <span className="text-[#71717A]">Model:</span>
            <span className="text-[#FAFAFA] font-medium">Gemini 2.5 Flash</span>
          </div>
        </div>

        <div className="text-[10px] text-center text-[#71717A] py-2">
          Model execution & skills activate in subsequent learning phases.
        </div>
      </div>

      {/* Bottom Input Dock */}
      <div className="p-3 border-t border-[#222226] flex flex-col gap-2 flex-shrink-0">
        <div className="min-h-[44px] rounded-[14px] bg-[#141417] border border-[#2A2A30] px-3 py-2 flex items-center justify-between opacity-70">
          <span className="text-xs text-[#63636B]">Ask SOS Assistant or type / for skills...</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              aria-label="Attach context file"
              className="w-6 h-6 rounded flex items-center justify-center text-[#71717A] cursor-not-allowed"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled
              aria-label="Send query"
              className="w-6 h-6 rounded-full bg-[#2A2A30] flex items-center justify-center text-[#71717A] cursor-not-allowed"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
