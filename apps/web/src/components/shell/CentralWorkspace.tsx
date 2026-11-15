import React from 'react';
import { useRouterState } from '@tanstack/react-router';
import {
  Search,
  Send,
  Bell,
  Maximize2,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { useShellStore } from '../../stores/shell-store.js';

interface CentralWorkspaceProps {
  children: React.ReactNode;
}

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/library': 'Library',
  '/learning': 'Learning',
  '/tracking': 'Tracking',
  '/calendar': 'Calendar',
  '/community': 'Community',
  '/profile': 'Profile',
  '/settings': 'Settings'
};

export const CentralWorkspace: React.FC<CentralWorkspaceProps> = ({ children }) => {
  const { aiPanelOpen, toggleAiPanel } = useShellStore();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const currentTitle = ROUTE_TITLES[currentPath] ?? 'Home';

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <main
      id="central-workspace"
      data-testid="central-workspace"
      className="flex-1 min-w-0 bg-[#09090B] border border-[#1F1F23] rounded-[24px] flex flex-col overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.60)] relative transition-all duration-300"
    >
      {/* Top Browser Tab Bar (48px height) */}
      <header
        data-testid="global-header"
        className="h-12 border-b border-[#1F1F23] flex items-center justify-between px-3 shrink-0 bg-[#0C0C0E] select-none z-20"
      >
        {/* Left: Static View Title */}
        <div className="flex items-center flex-1 pl-4">
          <span className="text-[13.5px] font-medium text-[#F4F4F5] tracking-tight">
            {currentTitle}
          </span>
        </div>

        {/* Right Side Global Window Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. Search Icon Button */}
          <button
            type="button"
            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/5 active:scale-90 transition-all"
            title="Search or Jump to... (⌘K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* 2. Messages Icon Button */}
          <button
            type="button"
            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/5 active:scale-90 transition-all relative"
            title="Messages"
          >
            <Send className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#F4F4F5] ring-2 ring-[#0C0C0E]" />
          </button>

          {/* 3. Notifications Icon Button */}
          <button
            type="button"
            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/5 active:scale-90 transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#F4F4F5] ring-2 ring-[#0C0C0E]" />
          </button>

          {/* 4. Full Screen Icon Button */}
          <button
            type="button"
            onClick={toggleFullScreen}
            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/5 active:scale-90 transition-all"
            title="Full Screen Viewport"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* 5. Standard Global Tracking Timer Pill (🟠 24:18) */}
          <div
            data-testid="header-timer-mirror"
            title="Tracking Timer Mirror (Controlled by Tracking module)"
            className="h-8 px-2.5 rounded-full bg-[#141417] border border-[#27272A] flex items-center gap-1.5 text-xs shadow-sm cursor-pointer hover:border-[#3F3F46] transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
            <span className="font-mono text-[#F4F4F5] tabular-nums text-xs">24:18</span>
          </div>

          {/* 6. AI Panel Drawer Toggle (for quick header access) */}
          <button
            type="button"
            onClick={toggleAiPanel}
            aria-label={aiPanelOpen ? 'Toggle AI panel' : 'Expand AI panel'}
            title={aiPanelOpen ? 'Toggle AI panel (⌘J)' : 'Expand AI panel (⌘J)'}
            className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors border ${
              aiPanelOpen
                ? 'bg-[#18181B] text-[#F4F4F5] border-[#27272A]'
                : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/5 border-transparent'
            }`}
          >
            {aiPanelOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Central Viewport */}
      <div
        data-testid="workspace-content"
        className="flex-1 overflow-hidden flex flex-col"
      >
        {children}
      </div>
    </main>
  );
};
