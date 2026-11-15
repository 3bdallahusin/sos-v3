import React from 'react';
import { useRouterState } from '@tanstack/react-router';
import { Search, Sparkles, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useShellStore } from '../../stores/shell-store.js';
import { NAVIGATION_ITEMS } from '@sos/domain';

interface CentralWorkspaceProps {
  children: React.ReactNode;
}

export const CentralWorkspace: React.FC<CentralWorkspaceProps> = ({ children }) => {
  const { aiPanelOpen, toggleAiPanel, workspace } = useShellStore();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const currentItem = NAVIGATION_ITEMS.find((item) =>
    item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path)
  ) ?? { label: 'Overview' };

  return (
    <main
      data-testid="central-workspace"
      className="flex-1 min-w-0 h-full flex flex-col bg-[#09090B] border border-[#222226] rounded-[24px] overflow-hidden select-none"
    >
      {/* 48px Global Central Header */}
      <header
        data-testid="global-header"
        className="h-12 border-b border-[#222226] bg-[#0C0C0E]/50 px-4 flex items-center justify-between flex-shrink-0"
      >
        {/* Left: Breadcrumbs / Active Destination */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#71717A] hover:text-[#A1A1AA] transition-colors">
            {workspace?.name ?? 'Guest Workspace'}
          </span>
          <span className="text-[#3F3F46]">/</span>
          <span className="font-medium text-[#FAFAFA]">{currentItem.label}</span>
        </div>

        {/* Right: Static Header Timer mirror + Search + Right Drawer trigger */}
        <div className="flex items-center gap-2">
          {/* Static Header Timer Mirror (Static visual mirror of Tracking session; neutral inactive state in Phase 01) */}
          <div
            data-testid="header-timer-mirror"
            title="Tracking Timer Mirror (Controlled by Tracking module)"
            className="h-7 px-2.5 rounded-full bg-[#141417] border border-[#2A2A30] flex items-center gap-1.5 text-xs text-[#A1A1AA]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#71717A]" />
            <span className="font-mono text-[11px] tracking-tight">--:--</span>
            <span className="text-[10px] text-[#71717A] uppercase font-semibold">Idle</span>
          </div>

          {/* Quick Search Shortcut Pill */}
          <button
            type="button"
            className="h-7 px-2.5 rounded-[10px] bg-[#141417] border border-[#222226] hover:border-[#2A2A30] text-[#71717A] hover:text-[#A1A1AA] flex items-center gap-2 text-[11px] transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="px-1 py-0.2 bg-[#1C1C21] rounded text-[9px] font-mono text-[#71717A]">
              ⌘K
            </kbd>
          </button>

          {/* Right AI Drawer Toggle */}
          <button
            type="button"
            onClick={toggleAiPanel}
            aria-label={aiPanelOpen ? 'Collapse AI panel' : 'Expand AI panel'}
            title={aiPanelOpen ? 'Collapse AI panel (⌘J)' : 'Expand AI panel (⌘J)'}
            className={`h-7 w-7 rounded-[10px] flex items-center justify-center transition-colors border ${
              aiPanelOpen
                ? 'bg-[#141417] text-[#FAFAFA] border-[#2A2A30]'
                : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-white/5 border-transparent'
            }`}
          >
            {aiPanelOpen ? (
              <PanelRightClose className="w-3.5 h-3.5" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* Central Viewport */}
      <div
        data-testid="workspace-content"
        className="flex-1 overflow-auto p-6 flex flex-col"
      >
        {children}
      </div>
    </main>
  );
};
