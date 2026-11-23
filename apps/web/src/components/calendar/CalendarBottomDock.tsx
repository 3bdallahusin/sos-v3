import React, { useMemo } from 'react';
import { Pencil, Trash2, Play } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useTrackingStore } from '../../stores/tracking-store.js';
import { useCalendarStore } from '../../stores/calendar-store.js';
import {
  type LearningBlock,
  type CalendarBlocksSummary,
  CALENDAR_DOMAIN_COLORS,
  formatCalendarDuration,
  formatTimeRange12Hour
} from '@sos/domain';

interface CalendarBottomDockProps {
  summary: CalendarBlocksSummary;
  selectedBlock: LearningBlock | null;
  onEditBlock: (block: LearningBlock) => void;
  onDeleteBlock: (id: string) => void;
  blocks?: LearningBlock[];
}

export const CalendarBottomDock: React.FC<CalendarBottomDockProps> = ({
  summary,
  selectedBlock,
  onEditBlock,
  onDeleteBlock,
  blocks
}) => {
  const navigate = useNavigate();
  const storeBlocks = useCalendarStore((s) => s.blocks);
  const activeBlocks = blocks || storeBlocks || [];

  const legendDomains = useMemo(() => {
    const domainMap = new Map<string, string>();
    for (const b of activeBlocks) {
      if (b.domain && b.domain.trim().length > 0) {
        const domainName = b.domain.trim();
        if (!domainMap.has(domainName)) {
          domainMap.set(domainName, CALENDAR_DOMAIN_COLORS[domainName] || '#60A5FA');
        }
      }
    }
    if (domainMap.size === 0) {
      return [
        { name: 'Computer Science', color: CALENDAR_DOMAIN_COLORS['Computer Science'] || '#60A5FA' },
        { name: 'Economics & Finance', color: CALENDAR_DOMAIN_COLORS['Economics & Finance'] || '#94A3B8' },
        { name: 'Philosophy', color: CALENDAR_DOMAIN_COLORS['Philosophy'] || '#E4E4E7' }
      ];
    }
    return Array.from(domainMap.entries()).map(([name, color]) => ({ name, color }));
  }, [activeBlocks]);
  // State B: Selected Block Inspector (Single Row, Zero Wrapping, 48px height)
  if (selectedBlock) {
    const domainColor = CALENDAR_DOMAIN_COLORS[selectedBlock.domain] || '#38BDF8';
    const formattedDuration = formatCalendarDuration(selectedBlock.durationMinutes);
    const formattedTimeRange = formatTimeRange12Hour(selectedBlock.startTime, selectedBlock.endTime);

    return (
      <footer
        data-testid="calendar-bottom-dock"
        className="h-12 border-t border-[#1E1E22] px-4 bg-[#111113] flex items-center justify-between shrink-0 select-none z-30 text-xs shadow-lg"
      >
        {/* Left side: 2px solid domain bar + clean Session Title + THREE separate individual dark pill badges */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-5 w-0.5 rounded-full shrink-0"
            style={{ backgroundColor: domainColor }}
          />
          <span
            data-testid="dock-event-title"
            className="text-xs font-medium text-[#FAFAFA] whitespace-nowrap truncate max-w-xs md:max-w-md"
          >
            {selectedBlock.title}
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <div
              data-testid="dock-block-domain"
              className="h-6 px-2.5 rounded-lg bg-[#161619] border border-[#222226] flex items-center text-[#FAFAFA] whitespace-nowrap"
            >
              {selectedBlock.domain}
            </div>
            <div
              data-testid="dock-event-datetime"
              className="h-6 px-2.5 rounded-lg bg-[#161619] border border-[#222226] flex items-center text-[#A1A1AA] whitespace-nowrap"
            >
              {formattedTimeRange}
            </div>
            <div
              data-testid="dock-block-duration"
              className="h-6 px-2.5 rounded-lg bg-[#161619] border border-[#222226] flex items-center text-[#A1A1AA] whitespace-nowrap"
            >
              {formattedDuration}
            </div>
          </div>
        </div>

        {/* Right side: Icon buttons (32px x 32px: Play, Edit, Delete) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="dock-start-session-btn"
            onClick={async () => {
              await useTrackingStore.getState().startSessionFromCalendarBlock(selectedBlock);
              navigate({ to: '/tracking' });
            }}
            className="w-8 h-8 rounded-lg bg-[#60A5FA]/10 hover:bg-[#60A5FA]/20 border border-[#60A5FA]/30 text-[#60A5FA] flex items-center justify-center transition-colors cursor-pointer"
            title="Start Focus Session"
            aria-label="Start Focus Session"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            type="button"
            data-testid="dock-edit-block-btn"
            onClick={() => onEditBlock(selectedBlock)}
            className="w-8 h-8 rounded-lg bg-[#161619] hover:bg-[#202024] border border-[#222226] text-[#FAFAFA] flex items-center justify-center transition-colors cursor-pointer"
            title="Edit Block"
          >
            <Pencil className="w-3.5 h-3.5 text-[#A1A1AA]" />
          </button>
          <button
            type="button"
            data-testid="dock-delete-block-btn"
            onClick={() => onDeleteBlock(selectedBlock.id)}
            className="w-8 h-8 rounded-lg bg-[#161619] hover:bg-[#202024] border border-[#222226] text-[#A1A1AA] hover:text-[#EF4444] flex items-center justify-center transition-colors cursor-pointer"
            title="Delete Block"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    );
  }

  // State A: Default Persistent Bottom Bar (48px height, individual dark pill badges + domain legend, NO BLUE DOT)
  return (
    <footer
      data-testid="calendar-bottom-dock"
      className="h-12 border-t border-[#1E1E22] px-4 bg-[#111113] flex items-center justify-between shrink-0 select-none z-10 text-xs"
    >
      {/* Left: Two distinct pill badges with individual dark backgrounds matching Home/Tracking card surfaces */}
      <div className="flex items-center gap-2 font-mono">
        <div
          data-testid="dock-planned-duration"
          className="h-7 px-2.5 rounded-lg bg-[#161619] border border-[#222226] flex items-center text-xs"
        >
          <span className="text-[#FAFAFA] font-medium">{summary.formattedDuration} Planned</span>
        </div>
        <div
          data-testid="dock-block-count"
          className="h-7 px-2.5 rounded-lg bg-[#161619] border border-[#222226] flex items-center text-xs"
        >
          <span className="text-[#A1A1AA] font-medium">
            {summary.blockCount} {summary.blockCount === 1 ? 'Learning Block' : 'Learning Blocks'}
          </span>
        </div>
      </div>

      {/* Right: Dynamic Domain Color Legend (Anti-glare palette) */}
      <div className="flex items-center gap-4 text-[11px] text-[#A1A1AA] font-mono overflow-x-auto max-w-[50%]">
        {legendDomains.slice(0, 5).map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span>{d.name}</span>
          </div>
        ))}
      </div>
    </footer>
  );
};
