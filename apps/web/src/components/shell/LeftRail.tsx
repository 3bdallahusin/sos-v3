import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  Home,
  FolderClosed,
  BookOpen,
  Clock,
  Calendar,
  Users,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useShellStore } from '../../stores/shell-store.js';
import { NAVIGATION_ITEMS, type NavigationDestination } from '@sos/domain';

const ICON_MAP: Record<NavigationDestination, React.ComponentType<{ className?: string }>> = {
  home: Home,
  library: FolderClosed,
  learning: BookOpen,
  tracking: Clock,
  calendar: Calendar,
  community: Users,
  profile: User,
  settings: Settings
};

export const LeftRail: React.FC = () => {
  const { railExpanded, toggleRail, workspace } = useShellStore();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <aside
      aria-label="Primary Navigation Rail"
      data-testid="left-rail"
      data-expanded={railExpanded}
      className={`h-full flex flex-col bg-[#09090B] border border-[#222226] rounded-[24px] overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex-shrink-0 select-none ${
        railExpanded ? 'w-[240px]' : 'w-[56px]'
      }`}
    >
      {/* 48px Header */}
      <div
        data-testid="left-rail-header"
        className="h-12 border-b border-[#222226] flex items-center px-2 justify-between flex-shrink-0"
      >
        <div className="flex items-center gap-2 overflow-hidden px-1">
          <div className="w-8 h-8 rounded-full bg-[#141417] border border-[#2A2A30] flex items-center justify-center flex-shrink-0">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#FAFAFA] flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-[#F97316]" />
            </div>
          </div>
          {railExpanded && (
            <span className="font-semibold text-xs tracking-wider uppercase text-[#FAFAFA] truncate">
              SOS v3
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={toggleRail}
          aria-label={railExpanded ? 'Collapse navigation rail' : 'Expand navigation rail'}
          title={railExpanded ? 'Collapse navigation rail' : 'Expand navigation rail'}
          className="w-7 h-7 rounded-[10px] flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-white/5 transition-colors flex-shrink-0"
        >
          {railExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Stack (8 destinations) */}
      <nav className="flex-1 py-3 px-1.5 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.id];
          const isActive =
            item.path === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.path);

          return (
            <Link
              key={item.id}
              to={item.path}
              data-testid={`nav-item-${item.id}`}
              data-active={isActive}
              title={railExpanded ? undefined : item.label}
              className={`h-10 flex items-center rounded-[14px] transition-all duration-150 relative group ${
                railExpanded ? 'px-3 gap-3 justify-start' : 'justify-center w-full'
              } ${
                isActive
                  ? 'bg-[#141417] text-[#FAFAFA] border border-[#2A2A30] shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {railExpanded && (
                <span className="text-xs font-medium truncate">{item.label}</span>
              )}

              {/* Accessible tooltip on collapsed hover */}
              {!railExpanded && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#1C1C21] border border-[#2A2A30] rounded-[10px] text-[11px] font-medium text-[#FAFAFA] whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Utility Stack: Guest Workspace identity indicator */}
      <div
        data-testid="left-rail-bottom"
        className="p-2 border-t border-[#222226] flex items-center justify-center flex-shrink-0"
      >
        <div
          title={workspace ? `Guest Workspace: ${workspace.id}` : 'Guest Mode'}
          className={`h-9 rounded-[14px] bg-[#0C0C0E] border border-[#222226] flex items-center ${
            railExpanded ? 'w-full px-2.5 gap-2 justify-start' : 'w-9 justify-center'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
          {railExpanded && (
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-medium text-[#FAFAFA] truncate">Guest Mode</span>
              <span className="text-[9px] text-[#71717A] truncate font-mono">
                {workspace ? workspace.id.slice(0, 8) : 'local'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
