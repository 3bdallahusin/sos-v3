import React, { useEffect } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  Home,
  BookMarked,
  BookOpen,
  Activity,
  Calendar,
  Settings,
  ChevronLeft
} from 'lucide-react';
import { useShellStore } from '../../stores/shell-store.js';
import { useSettingsStore } from '../../stores/settings-store.js';

interface NavDestination {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const PRIMARY_NAV_ITEMS: NavDestination[] = [
  { id: 'home', label: 'Home', path: '/', icon: Home },
  { id: 'library', label: 'Library', path: '/library', icon: BookMarked },
  { id: 'learning', label: 'Learning', path: '/learning', icon: BookOpen },
  { id: 'tracking', label: 'Tracking', path: '/tracking', icon: Activity },
  { id: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar }
];

export const LeftRail: React.FC = () => {
  const {
    railExpanded,
    toggleRail,
    workspace,
    leftRailWidth,
    isDragging
  } = useShellStore();
  const { settings, loadSettings } = useSettingsStore();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const avatarUrl = settings.account.avatarUrl || 'https://lh3.googleusercontent.com/aida/ALJJyrBE6EhsHOqBp174KlEE0XrgpcMjQmblnn2X7vXwDJVOKYPKb7yDZ06Vw_NqRcsrxOTsrvWRxDQX_0hgDLbZ2XZM7agGIy8rbv8bYGWpaF2d30oXkxqAisUNXabuoiebdVqFtSLIzj8vaZjVK-aSHuO3rGxN6TKHDCpJKjXzUfwMEsiIP42arHCi1DVwgFwpbkHrHihNRxcMxFhP6g71n-Ej2xAqvNVjJ8X9dDARkQt3DmGe0NVBhLB-3fYriiCAu3BiIg';
  const userName = settings.account.name || workspace?.name || 'Abdalla';

  return (
    <aside
      aria-label="Primary Navigation Rail"
      data-testid="left-rail"
      data-expanded={railExpanded}
      style={{
        width: railExpanded ? `${leftRailWidth}px` : '56px'
      }}
      className={`h-full flex flex-col justify-between items-center bg-[#09090B] border border-[#1F1F23] rounded-[24px] overflow-hidden flex-shrink-0 select-none shadow-[0_12px_40px_rgba(0,0,0,0.60)] ${
        isDragging
          ? ''
          : 'transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
      }`}
    >
      {/* 1. Top Collapse/Expand Toggle Header (Exact 48px height matching Central Workspace & AI Panel) */}
      <div
        data-testid="left-rail-header"
        className="h-12 w-full border-b border-[#1F1F23] flex items-center justify-center shrink-0 bg-[#09090B]"
      >
        {railExpanded ? (
          <div className="flex items-center justify-between w-full pl-[21px] pr-2.5">
            <div className="flex items-center">
              <img
                src="/logo-v3.png"
                alt="SOS Logo v3"
                className="h-[18px] w-auto object-contain select-none pointer-events-none"
              />
            </div>
            <button
              type="button"
              onClick={toggleRail}
              aria-label="Collapse navigation rail"
              title="Collapse navigation rail (⌘B)"
              className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[#71717A] hover:text-[#F4F4F5] hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleRail}
            aria-label="Expand navigation rail"
            title="Expand navigation rail (⌘B)"
            className="w-8 h-8 bg-transparent border-0 p-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity group"
          >
            <svg
              viewBox="22.5 22.5 19 19"
              className="w-5 h-5 select-none pointer-events-none group-hover:scale-105 transition-transform"
              fill="none"
              aria-label="SOS Brand Mark"
            >
              {/* Center O with Book/Scholar Motif directly from SOS logo */}
              <circle cx="32" cy="32" r="8.5" fill="#FFFFFF" />
              <circle cx="32" cy="28.5" r="1.3" fill="#09090B" />
              <path
                d="M 32 31.5 L 27.2 29.8 L 27.2 34.2 L 32 35.8 L 36.8 34.2 L 36.8 29.8 Z"
                fill="#09090B"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation Stack containing both Primary destinations and Bottom utilities */}
      <nav className="flex-1 flex flex-col justify-between w-full overflow-hidden">
        {/* 2. Primary Navigation Stack (6 icons in exact order) */}
        <div className="flex-1 flex flex-col gap-2 items-center w-full px-2 py-3 overflow-y-auto overflow-x-hidden custom-scrollbar select-none">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? currentPath === '/'
                : currentPath.startsWith(item.path);

            return (
              <div
                key={item.id}
                className={`relative group flex items-center w-full ${
                  railExpanded ? 'justify-start' : 'justify-center'
                }`}
              >
                <Link
                  to={item.path}
                  data-testid={`nav-item-${item.id}`}
                  data-active={isActive}
                  title={railExpanded ? undefined : item.label}
                  className={`h-10 flex items-center transition-all ${
                    railExpanded
                      ? 'w-full px-3 gap-3 rounded-[12px]'
                      : 'w-10 rounded-[8px] justify-center'
                  } ${
                    isActive
                      ? 'bg-[#18181B] border border-[#27272A] text-[#F4F4F5] shadow-sm'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/5 border border-transparent active:scale-95'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.75} />
                  {railExpanded && (
                    <span className="text-xs font-medium truncate">{item.label}</span>
                  )}
                </Link>

                {/* Collapsed Tooltip */}
                {!railExpanded && (
                  <div className="absolute left-14 px-2.5 py-1 rounded-[10px] bg-[#1C1C21] border border-[#3F3F46] text-xs font-medium text-[#F4F4F5] whitespace-nowrap shadow-lg pointer-events-none z-50 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    <span>{item.label}{isActive ? ' (Active)' : ''}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 3. Bottom Utility Stack (Divider -> Settings -> User Profile Avatar) */}
        <div
          data-testid="left-rail-bottom"
          className="h-[104px] flex flex-col items-center justify-center gap-2 w-full border-t border-[#1F1F23] bg-[#09090B] shrink-0 px-2"
        >
          {/* Settings */}
          <div
            className={`relative group flex items-center w-full ${
              railExpanded ? 'justify-start' : 'justify-center'
            }`}
          >
            <Link
              to="/settings"
              data-testid="nav-item-settings"
              data-active={currentPath.startsWith('/settings')}
              title={railExpanded ? undefined : 'Settings'}
              className={`h-10 flex items-center transition-all ${
                railExpanded
                  ? 'w-full px-3 gap-3 rounded-[12px]'
                  : 'w-10 rounded-[8px] justify-center'
              } ${
                currentPath.startsWith('/settings')
                  ? 'bg-[#18181B] border border-[#27272A] text-[#F4F4F5] shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/5 border border-transparent'
              }`}
            >
              <Settings className="w-5 h-5 flex-shrink-0" strokeWidth={1.75} />
              {railExpanded && (
                <span className="text-xs font-medium truncate">Settings</span>
              )}
            </Link>
            {!railExpanded && (
              <div className="absolute left-14 px-2.5 py-1 rounded-[10px] bg-[#1C1C21] border border-[#3F3F46] text-xs font-medium text-[#F4F4F5] whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <span>Settings</span>
              </div>
            )}
          </div>

          {/* User Portrait Avatar */}
          <div
            className={`relative group flex items-center w-full pt-0.5 ${
              railExpanded ? 'justify-start px-1' : 'justify-center'
            }`}
          >
            <Link
              to="/profile"
              data-testid="nav-item-profile"
              data-active={currentPath.startsWith('/profile')}
              title={userName}
              className={`flex items-center gap-2.5 overflow-hidden transition-colors ${
                railExpanded ? 'w-full' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full border border-[#27272A] overflow-hidden cursor-pointer hover:border-[#F4F4F5] transition-colors shrink-0 bg-[#18181B] flex items-center justify-center">
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              </div>
              {railExpanded && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-[#F4F4F5] truncate">
                    {userName}
                  </span>
                  <span className="text-[10px] text-[#71717A] truncate">
                    Learner Profile
                  </span>
                </div>
              )}
            </Link>
            {!railExpanded && (
              <div className="absolute left-14 px-2.5 py-1 rounded-[10px] bg-[#1C1C21] border border-[#3F3F46] text-xs font-medium text-[#F4F4F5] whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <span>Learner Profile</span>
              </div>
            )}
          </div>
        </div>
      </nav>
    </aside>
  );
};
