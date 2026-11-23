import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useCalendarStore, getWeekRange } from '../../stores/calendar-store.js';

interface CalendarToolbarProps {
  onNewEvent: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({ onNewEvent }) => {
  const {
    viewMode,
    currentDate,
    setViewMode,
    navigateRelative,
    goToToday
  } = useCalendarStore();

  const [y, m, d] = useMemo(() => {
    return currentDate.split('-').map(Number);
  }, [currentDate]);

  // View-aware title matching Stitch
  const headerDateLabel = useMemo(() => {
    const dt = new Date(y, m - 1, d);

    if (viewMode === 'day') {
      const weekday = WEEKDAY_NAMES[dt.getDay()];
      const monthShort = SHORT_MONTH_NAMES[dt.getMonth()];
      return `${weekday}, ${d} ${monthShort} ${y}`;
    }

    if (viewMode === 'week') {
      const { start, end } = getWeekRange(currentDate);
      const [, sm, sd] = start.split('-').map(Number);
      const [ey, em, ed] = end.split('-').map(Number);
      const sMonthShort = SHORT_MONTH_NAMES[sm - 1];
      const eMonthShort = SHORT_MONTH_NAMES[em - 1];

      if (sm === em) {
        return `${sd} – ${ed} ${eMonthShort} ${ey}`;
      }
      return `${sd} ${sMonthShort} – ${ed} ${eMonthShort} ${ey}`;
    }

    // month
    return `${MONTH_NAMES[m - 1]} ${y}`;
  }, [y, m, d, currentDate, viewMode]);

  return (
    <div
      data-testid="calendar-toolbar"
      className="h-12 border-b border-[#1E1E22] px-4 flex items-center justify-between shrink-0 bg-[#111113] select-none z-10"
    >
      {/* Left: Navigation & View-Aware Date (Unified Control: < Date Title >) */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#161619] border border-[#222226] flex items-center justify-center text-[#FAFAFA] shrink-0">
          <CalendarIcon className="w-4 h-4 text-[#FAFAFA]" />
        </div>

        {/* Unified Control: < Dynamic Date Title > */}
        <div className="flex items-center bg-[#161619] border border-[#222226] rounded-lg px-1 py-0.5 text-xs text-[#FAFAFA]">
          <button
            type="button"
            data-testid="calendar-prev-btn"
            onClick={() => navigateRelative('prev')}
            className="p-1 text-[#71717A] hover:text-[#FAFAFA] hover:bg-white/[0.04] rounded cursor-pointer active:scale-[0.95] transition-all"
            title="Previous"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            data-testid="calendar-today-btn"
            onClick={goToToday}
            className="px-2 py-0.5 text-xs font-semibold text-[#FAFAFA] hover:text-white cursor-pointer select-none tracking-tight transition-colors"
            title={viewMode === 'day' ? 'Jump to Today' : viewMode === 'week' ? 'Jump to This Week' : 'Jump to This Month'}
          >
            <span data-testid="calendar-month-label">{headerDateLabel}</span>
          </button>
          <button
            type="button"
            data-testid="calendar-next-btn"
            onClick={() => navigateRelative('next')}
            className="p-1 text-[#71717A] hover:text-[#FAFAFA] hover:bg-white/[0.04] rounded cursor-pointer active:scale-[0.95] transition-all"
            title="Next"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: View Switcher [ Day | Week | Month ] and High-Contrast White + New Event Button */}
      <div className="flex items-center gap-3">
        {/* Segmented View Switcher: Day | Week | Month */}
        <div className="h-7 p-0.5 rounded-lg bg-[#161619] border border-[#222226] flex items-center text-xs">
          <button
            type="button"
            data-testid="calendar-view-day"
            onClick={() => setViewMode('day')}
            className={`px-2.5 h-full rounded-[6px] transition-colors flex items-center justify-center ${
              viewMode === 'day'
                ? 'bg-[#222226] text-[#FAFAFA] font-medium border border-[#2E2E35] shadow-xs'
                : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
            }`}
          >
            Day
          </button>
          <button
            type="button"
            data-testid="calendar-view-week"
            onClick={() => setViewMode('week')}
            className={`px-2.5 h-full rounded-[6px] transition-colors flex items-center justify-center ${
              viewMode === 'week'
                ? 'bg-[#222226] text-[#FAFAFA] font-medium border border-[#2E2E35] shadow-xs'
                : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
            }`}
          >
            Week
          </button>
          <button
            type="button"
            data-testid="calendar-view-month"
            onClick={() => setViewMode('month')}
            className={`px-2.5 h-full rounded-[6px] transition-colors flex items-center justify-center ${
              viewMode === 'month'
                ? 'bg-[#222226] text-[#FAFAFA] font-medium border border-[#2E2E35] shadow-xs'
                : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
            }`}
          >
            Month
          </button>
        </div>

        {/* High-Contrast + New Event Button (#FAFAFA fill, #09090B dark text, 6px radius) */}
        <button
          type="button"
          data-testid="calendar-new-event-btn"
          onClick={onNewEvent}
          className="h-7 px-3 rounded-[6px] bg-[#FAFAFA] hover:bg-white text-[#09090B] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#09090B] stroke-[2.5]" />
          <span>New Event</span>
        </button>
      </div>
    </div>
  );
};
