import React, { useState } from 'react';
import {
  MessageCircle,
  X,
  Plus,
  Clock,
  Maximize2,
  Minimize2,
  ChevronDown,
  Paperclip,
  ArrowUp
} from 'lucide-react';
import { useShellStore } from '../../stores/shell-store.js';

export const RightAiPanel: React.FC = () => {
  const {
    aiPanelOpen,
    toggleAiPanel,
    isAiPanelFullscreen,
    toggleAiPanelFullscreen,
    workspace,
    rightAiPanelWidth,
    isDragging
  } = useShellStore();
  const [contextPillVisible, setContextPillVisible] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('Claude 3.7 Sonnet');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  if (!aiPanelOpen) {
    return null;
  }

  const models = ['Claude 3.7 Sonnet', 'Gemini 2.5 Flash', 'GPT-4.5 Preview'];

  return (
    <aside
      id="ai-panel"
      aria-label="AI Assistant Panel"
      data-testid="right-ai-panel"
      style={{
        width: isAiPanelFullscreen ? undefined : `${rightAiPanelWidth}px`
      }}
      className={`${
        isAiPanelFullscreen ? 'flex-1 min-w-0' : 'shrink-0'
      } h-full bg-[#09090B] border border-[#1F1F23] rounded-[24px] flex flex-col justify-between overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.60)] select-none ${
        isDragging
          ? ''
          : 'transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
      }`}
    >
      {/* Top Header Bar (48px height) */}
      <div
        data-testid="ai-panel-header"
        className="h-12 border-b border-[#1F1F23] px-2.5 flex items-center justify-between shrink-0 bg-[#0C0C0E]/60 select-none"
      >
        {/* Left: Tab Pill with Close & Add Tab */}
        <div className="flex items-center gap-1">
          <div className="h-7 px-2.5 rounded-[10px] bg-[#141417] text-[#F4F4F5] text-xs font-medium flex items-center gap-1.5 border border-[#27272A] shadow-sm">
            <MessageCircle className="w-3 h-3 text-[#F4F4F5]" />
            <span>AI Assistant</span>
            <button
              type="button"
              onClick={toggleAiPanel}
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#F4F4F5] ml-0.5 transition-colors"
              title="Close Tab"
              aria-label="Close Tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <button
            type="button"
            className="w-7 h-7 rounded-[8px] flex items-center justify-center hover:text-[#F4F4F5] hover:bg-white/5 text-[#71717A] active:scale-90 transition-all"
            title="New Chat"
            aria-label="New Chat"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: History, Maximize, Collapse */}
        <div className="flex items-center gap-0.5 text-[#71717A]">
          <button
            type="button"
            className="w-7 h-7 rounded-[8px] flex items-center justify-center hover:text-[#F4F4F5] hover:bg-white/5 active:scale-90 transition-all"
            title="History"
            aria-label="History"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleAiPanelFullscreen}
            className={`w-7 h-7 rounded-[8px] flex items-center justify-center transition-all ${
              isAiPanelFullscreen
                ? 'bg-[#18181B] text-[#F4F4F5] border border-[#27272A]'
                : 'hover:text-[#F4F4F5] hover:bg-white/5 active:scale-90 text-[#71717A]'
            }`}
            title={isAiPanelFullscreen ? "Exit Fullscreen" : "Full Screen AI Panel"}
            aria-label={isAiPanelFullscreen ? "Exit AI panel fullscreen" : "Fullscreen AI panel"}
          >
            {isAiPanelFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={toggleAiPanel}
            aria-label="Collapse AI panel"
            title="Collapse AI Panel (⌘J)"
            className="w-7 h-7 rounded-[8px] flex items-center justify-center hover:text-[#F4F4F5] hover:bg-white/5 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#71717A] hover:text-[#F4F4F5]" />
          </button>
        </div>
      </div>

      {/* AI Thread / Daily Study Briefing Card */}
      <div className="flex-1 py-4 px-3.5 flex flex-col gap-3 text-xs overflow-y-auto custom-scrollbar">
        <div className={`flex flex-col gap-3 ${isAiPanelFullscreen ? 'max-w-[820px] mx-auto w-full' : ''}`}>
          <div className="p-3.5 rounded-[18px] bg-[#141417] border border-[#27272A] text-[#A1A1AA] leading-relaxed flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-1.5 font-semibold text-[#F4F4F5]">
              <MessageCircle className="w-3.5 h-3.5 text-[#F4F4F5]" />
              <span>Daily Study Briefing</span>
            </div>
            <p>
              Good morning,{' '}
              <span className="text-[#F4F4F5] font-medium">Abdalla</span>! You have 14
              flashcards due for{' '}
              <span className="text-[#F4F4F5] font-medium">SNARE Complex</span> and your{' '}
              <span className="text-[#F4F4F5] font-medium">Neurobiology Lecture 04</span>{' '}
              scheduled at 14:00.
            </p>
            <div className="p-2 rounded bg-[#09090B] border border-[#27272A] text-[11px] text-[#A1A1AA]">
              Recommended focus: Complete the 15-min Kv1.1 quiz before lecture to prime your recall.
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Bottom AI Chat Input Dock (Matching Stitch pixel-for-pixel) */}
      <div className="p-3 bg-[#09090B] border-t border-[#1F1F23] flex flex-col shrink-0">
        <div className={`flex flex-col ${isAiPanelFullscreen ? 'max-w-[820px] mx-auto w-full' : ''}`}>
          {/* Context Row: Single active context pill followed immediately by 30x30 + button */}
          <div className="flex items-center gap-2 mb-2 select-none">
            {contextPillVisible && (
              <div className="h-6 px-2.5 rounded-full bg-[#141417] border border-[#27272A] flex items-center gap-1.5 text-[11px] text-[#F4F4F5] shrink-0">
                <span className="truncate max-w-[170px]">Home</span>
                <button
                  type="button"
                  onClick={() => setContextPillVisible(false)}
                  className="text-[#71717A] hover:text-[#F4F4F5] transition-colors"
                  title="Remove context"
                  aria-label="Remove context"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setContextPillVisible(true)}
              className="w-[30px] h-[30px] rounded-full bg-[#141417] hover:bg-[#1A1A1E] border border-[#27272A] flex items-center justify-center text-[#71717A] hover:text-[#F4F4F5] shrink-0 transition-colors"
              title="Add context"
              aria-label="Add context"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rounded Input Box (border-radius: 14px, #111114, 1px solid #27272A) */}
          <div className="rounded-[14px] bg-[#111114] border border-[#27272A] p-2.5 flex flex-col gap-2 shadow-sm relative">
            <textarea
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask SOS, / for skills, @ for context..."
              className="w-full bg-transparent resize-none border-0 p-0 text-[12.5px] text-[#F4F4F5] placeholder-[#71717A] focus:ring-0 focus:outline-none"
            />

            <div className="flex items-center justify-between pt-1 border-t border-[#1F1F23]/60 text-xs">
              {/* Left: Model Selector Pill displaying Claude 3.7 Sonnet ⌄ */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="h-6 px-2.5 rounded-full bg-[#18181B] hover:bg-[#202024] border border-[#27272A] text-[12px] font-medium text-[#D4D4D8] flex items-center gap-1.5 transition-colors"
                >
                  <span>{selectedModel}</span>
                  <ChevronDown className="w-3 h-3 text-[#71717A]" />
                </button>

                {modelDropdownOpen && (
                  <div className="absolute bottom-8 left-0 mb-1 w-44 bg-[#141417] border border-[#27272A] rounded-[10px] shadow-lg py-1 z-50">
                    {models.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m);
                          setModelDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-[#F4F4F5] hover:bg-white/5 transition-colors"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Paperclip attachment icon + circular white up-arrow submit button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-[#71717A] hover:text-[#F4F4F5] p-1 transition-colors"
                  title="Attach context"
                  aria-label="Attach context"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (inputValue.trim()) {
                      setInputValue('');
                    }
                  }}
                  className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#E4E4E7] active:scale-95 transition-all shadow-sm"
                  title="Send message"
                  aria-label="Send message"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
