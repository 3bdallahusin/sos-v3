import React, { useState, useRef, useEffect } from 'react';
import { useRouterState, useNavigate } from '@tanstack/react-router';
import {
  Search,
  Send,
  Bell,
  MessageCircle
} from 'lucide-react';
import { useShellStore } from '../../stores/shell-store.js';
import { useTrackingStore } from '../../stores/tracking-store.js';
import { useLibraryStore } from '../../stores/library-store.js';
import { LearningTabBar } from '../learning/LearningTabBar.js';
import { HeaderBreadcrumb } from './HeaderBreadcrumb.js';

interface CentralWorkspaceProps {
  children: React.ReactNode;
}

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/library': 'Library',
  '/learning': 'Learning',
  '/tracking': 'Tracking',
  '/calendar': 'Calendar',
  '/profile': 'Profile',
  '/settings': 'Settings'
};

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Navigation' | 'Tasks' | 'Recent' | 'Essay';
  path: string;
}

const SEARCH_DATABASE: SearchResultItem[] = [
  // Navigation
  { id: 'nav-home', title: 'Home', subtitle: 'Dashboard Overview', category: 'Navigation', path: '/' },
  { id: 'nav-lib', title: 'Library', subtitle: 'Knowledge Base & Folders', category: 'Navigation', path: '/library' },
  { id: 'nav-learn', title: 'Learning', subtitle: 'Workspaces & Study Tools', category: 'Navigation', path: '/learning' },
  { id: 'nav-track', title: 'Tracking', subtitle: 'Habits & Pomodoro Activity', category: 'Navigation', path: '/tracking' },
  { id: 'nav-cal', title: 'Calendar', subtitle: 'Academic Schedule & Deadlines', category: 'Navigation', path: '/calendar' },
  { id: 'nav-prof', title: 'Profile', subtitle: 'Student Profile & Bio', category: 'Navigation', path: '/profile' },
  { id: 'nav-sett', title: 'Settings', subtitle: 'Account & Preferences', category: 'Navigation', path: '/settings' },
  // Tasks
  { id: 'task-1', title: 'Neurobiology Lecture 04', subtitle: "Today's Task", category: 'Tasks', path: '/' },
  { id: 'task-2', title: 'Review 14 Due Cards — SNARE Deck', subtitle: "Today's Task", category: 'Tasks', path: '/learning' },
  { id: 'task-3', title: 'Complete Kv1.1 Assessment', subtitle: "Today's Task", category: 'Tasks', path: '/learning' },
  { id: 'task-4', title: 'Summarize CaMKII notes', subtitle: "Today's Task", category: 'Tasks', path: '/learning' },
  // Recent
  { id: 'recent-1', title: 'Kandel_Principles_Ch12.pdf', subtitle: 'Recent Resource (Page 42)', category: 'Recent', path: '/learning' },
  { id: 'recent-2', title: 'Stanford_Neuro_Lecture_04.mp4', subtitle: 'Recent Video (16:48 / 45:00)', category: 'Recent', path: '/learning' },
  { id: 'recent-3', title: 'Cellular_Plasticity_Synthesis.md', subtitle: 'Recent Notes (Section 2)', category: 'Recent', path: '/learning' },
  { id: 'recent-4', title: 'SNARE_Machinery_Deck', subtitle: 'Recent Deck (Card 14 / 50)', category: 'Recent', path: '/learning' },
  // Essay
  { id: 'essay-1', title: 'On the Architecture of Deep Memory & Forgetting', subtitle: 'Daily Essay (3 min read)', category: 'Essay', path: '/' }
];

export const CentralWorkspace: React.FC<CentralWorkspaceProps> = ({ children }) => {
  const {
    aiPanelOpen,
    toggleAiPanel,
    hasUnreadMessages,
    hasUnreadNotifications,
    setHasUnreadMessages,
    setHasUnreadNotifications
  } = useShellStore();

  const routerState = useRouterState();
  const navigate = useNavigate();
  const currentPath = routerState.location.pathname;
  const currentTitle = ROUTE_TITLES[currentPath] ?? 'Home';
  const trackingActiveView = useTrackingStore((s) => s.activeView);
  const libraryBreadcrumbs = useLibraryStore((s) => s.breadcrumbs);
  const libraryActiveFolderId = useLibraryStore((s) => s.activeFolderId);
  const libraryNavigateToFolder = useLibraryStore((s) => s.navigateToFolder);
  const libraryNavigateUp = useLibraryStore((s) => s.navigateUp);

  // Tracking timer mirror state
  const timerStatus = useTrackingStore((s) => s.status);
  const timerMode = useTrackingStore((s) => s.mode);
  const timerRemaining = useTrackingStore((s) => s.remainingSeconds);
  const timerElapsed = useTrackingStore((s) => s.elapsedSeconds);
  const activeTimerSeconds = timerMode === 'stopwatch' ? timerElapsed : timerRemaining;
  const formatTimerDigits = (sec: number) => {
    const safeSec = Math.max(0, sec);
    const m = Math.floor(safeSec / 60);
    const s = safeSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Search State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filter search results
  const filteredResults = searchQuery.trim()
    ? SEARCH_DATABASE.filter(
        item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Toggle Search Bar
  const handleToggleSearch = () => {
    setSearchOpen(prev => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else {
        setSearchQuery('');
      }
      return next;
    });
  };

  // Keyboard shortcut for Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && searchOpen) {
        e.preventDefault();
        setSearchOpen(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Handle clicking outside search container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };

    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  // Handle keyboard navigation in search results
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredResults.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % (filteredResults.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      }
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    navigate({ to: item.path });
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <main
      id="central-workspace"
      data-testid="central-workspace"
      className="flex-1 min-w-[480px] bg-[#09090B] border border-[#1F1F23] rounded-[24px] flex flex-col overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.60)] relative"
    >
      {/* Top Browser Tab Bar (48px height) */}
      <header
        data-testid="global-header"
        className="h-12 border-b border-[#1F1F23] flex items-center justify-between px-3 shrink-0 bg-[#0C0C0E] select-none z-20 relative"
      >
        {/* Left: Learning Browser Tabs on /learning, Tracking History Breadcrumb on /tracking history, or Static View Title elsewhere */}
        <div className="flex items-center flex-1 min-w-0 pr-4">
          {currentPath === '/learning' ? (
            <LearningTabBar />
          ) : currentPath === '/library' ? (
            <HeaderBreadcrumb
              onBack={libraryActiveFolderId ? () => libraryNavigateUp() : undefined}
              backAriaLabel="Back to Parent Folder"
              backTitle="Back to Parent Folder"
              backTestId="library-breadcrumb-back-btn"
              segments={[
                {
                  label: 'Library',
                  onClick: () => libraryNavigateToFolder(null),
                  testId: 'library-breadcrumb-root'
                },
                ...libraryBreadcrumbs.map((b, idx) => ({
                  label: b.name,
                  onClick: () => libraryNavigateToFolder(b._id),
                  testId: `library-breadcrumb-segment-${idx}`
                }))
              ]}
              testId="library-header-breadcrumb"
            />
          ) : currentPath === '/tracking' && trackingActiveView === 'history' ? (
            <HeaderBreadcrumb
              onBack={() => useTrackingStore.getState().setActiveView('dashboard')}
              backAriaLabel="Back to Tracking Dashboard"
              backTitle="Back to Tracking Dashboard"
              backTestId="history-back-to-dashboard-btn"
              segments={[
                {
                  label: 'Tracking',
                  onClick: () => useTrackingStore.getState().setActiveView('dashboard'),
                  testId: 'tracking-breadcrumb-parent'
                },
                {
                  label: 'Session History',
                  testId: 'tracking-breadcrumb-child'
                }
              ]}
              testId="tracking-header-breadcrumb"
            />
          ) : (
            <span className="text-[13.5px] font-medium text-[#F4F4F5] tracking-tight pl-4">
              {currentTitle}
            </span>
          )}
        </div>

        {/* Right Side Global Window Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. Animated Inline Search Input & Trigger */}
          <div ref={searchContainerRef} className="relative flex items-center">
            <div
              className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center ${
                searchOpen ? 'w-[240px] opacity-100 mr-1.5' : 'w-0 opacity-0 mr-0'
              }`}
            >
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search SOS, tasks, notes... (Esc)"
                className="w-full h-7 px-2.5 rounded-[8px] bg-[#141417] border border-[#27272A] text-xs text-[#F4F4F5] placeholder-[#71717A] focus:outline-none focus:border-[#3F3F46]"
              />
            </div>

            <button
              type="button"
              onClick={handleToggleSearch}
              className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-all ${
                searchOpen
                  ? 'bg-[#18181B] text-[#F4F4F5] border border-[#27272A]'
                  : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/5 active:scale-90'
              }`}
              title="Search or Jump to... (⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Live Filter Popover Dropdown */}
            {searchOpen && searchQuery.trim().length > 0 && (
              <div
                data-testid="search-popover"
                className="absolute top-10 right-0 w-[300px] bg-[#111114] border border-[#27272A] rounded-[12px] shadow-2xl p-1.5 z-50 flex flex-col max-h-[320px] overflow-y-auto custom-scrollbar"
              >
                {filteredResults.length > 0 ? (
                  filteredResults.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-[8px] flex items-center justify-between text-xs transition-colors ${
                        selectedIndex === index
                          ? 'bg-[#18181B] text-[#F4F4F5]'
                          : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/5'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-medium truncate text-[12.5px]">
                          {item.title}
                        </span>
                        <span className="text-[10.5px] text-[#71717A] truncate">
                          {item.subtitle}
                        </span>
                      </div>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1C1C21] text-[#71717A] border border-[#27272A] shrink-0">
                        {item.category}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-xs text-[#71717A]">
                    No matches found for &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Messages Icon Button */}
          <button
            type="button"
            onClick={() => {
              setHasUnreadMessages(false);
            }}
            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/5 active:scale-90 transition-all relative"
            title="Messages"
          >
            <Send className="w-4 h-4" />
            {hasUnreadMessages && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#F4F4F5] ring-2 ring-[#0C0C0E]" />
            )}
          </button>

          {/* 3. Notifications Icon Button */}
          <button
            type="button"
            onClick={() => setHasUnreadNotifications(false)}
            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/5 active:scale-90 transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnreadNotifications && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#F4F4F5] ring-2 ring-[#0C0C0E]" />
            )}
          </button>

          {/* 4. Global Top Bar Timer Pill: Render ONLY when running or paused */}
          {(timerStatus === 'running' || timerStatus === 'paused') && (
            <button
              type="button"
              data-testid="header-timer-pill"
              title="Active Focus Timer (Click to view Tracking)"
              onClick={() => navigate({ to: '/tracking' })}
              className="h-8 px-2.5 rounded-full bg-[#141417] border border-[#27272A] flex items-center gap-1.5 text-xs shadow-sm cursor-pointer hover:border-[#3F3F46] hover:bg-[#1A1A1E] transition-all"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  timerStatus === 'running'
                    ? 'bg-[#60A5FA] animate-pulse'
                    : 'bg-white'
                }`}
              />
              <span className="font-mono text-[#F4F4F5] tabular-nums text-xs font-medium">
                {formatTimerDigits(activeTimerSeconds)}
              </span>
            </button>
          )}

          {/* 5. Dynamic AI Toggle Icon (Only rendered when AI Panel is collapsed AND strictly on /learning) */}
          {currentPath === '/learning' && !aiPanelOpen && (
            <button
              type="button"
              onClick={toggleAiPanel}
              aria-label="Expand AI panel"
              title="Open AI Assistant (⌘J)"
              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/5 active:scale-90 transition-all border border-[#27272A] bg-[#141417] ml-0.5"
            >
              <MessageCircle className="w-4 h-4 text-[#F4F4F5]" />
            </button>
          )}
        </div>
      </header>

      {/* Central Viewport */}
      <div
        data-testid="workspace-content"
        className="flex-1 overflow-hidden flex flex-col select-text"
      >
        {children}
      </div>
    </main>
  );
};
