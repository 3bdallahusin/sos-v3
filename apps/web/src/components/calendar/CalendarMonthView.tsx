import React, { useMemo } from 'react';
import {
  type LearningBlock,
  CALENDAR_DOMAIN_COLORS,
  getTodayDateString,
  isSameCalendarDay
} from '@sos/domain';
import { useCalendarStore } from '../../stores/calendar-store.js';
import { useSettingsStore } from '../../stores/settings-store.js';

interface CalendarMonthViewProps {
  onSelectBlock: (id: string) => void;
  onOpenCreateModal: (slot?: { date: string; startTime: string; endTime: string }) => void;
}

function calculateMonthBlockTop(startTime: string, index: number, totalOnDay: number): number {
  const [h, m] = startTime.split(':').map(Number);
  const totalMins = (h || 8) * 60 + (m || 0);
  // Full 24-hour day range: 00:00 (0 min) to 24:00 (1440 min)
  const ratio = Math.max(0, Math.min(1, totalMins / 1440));

  if (totalOnDay === 1) {
    // Single block: 12 AM near top at 26px, 12 PM in middle at 48px, 10 PM near bottom at 68px
    return Math.round(26 + ratio * 42);
  }

  // Multiple blocks: spaced cleanly so they never overlap
  if (index === 0) {
    return Math.min(36, Math.round(24 + ratio * 14));
  } else {
    return Math.max(50, Math.round(48 + ratio * 14));
  }
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  onSelectBlock,
  onOpenCreateModal
}) => {
  const { blocks, currentDate, setCurrentDate, setViewMode, selectedBlockId } = useCalendarStore();
  const weekStartDay = useSettingsStore((s) => s.settings.general?.weekStartDay || 'saturday');
  const todayStr = useMemo(() => getTodayDateString(), []);

  const [currYear, currMonth] = useMemo(() => {
    const [y, m] = currentDate.split('-').map(Number);
    return [y, m - 1];
  }, [currentDate]);

  const weekdayNames = useMemo(() => {
    return weekStartDay === 'saturday'
      ? ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }, [weekStartDay]);

  // Compute 42 calendar days (6 full weeks)
  const monthWeeks = useMemo(() => {
    const firstDayOfMonth = new Date(currYear, currMonth, 1);
    const dayOfWeek = firstDayOfMonth.getDay();

    let diffToStart = 0;
    if (weekStartDay === 'saturday') {
      diffToStart = (dayOfWeek + 1) % 7;
    } else {
      diffToStart = (dayOfWeek + 6) % 7;
    }
    const startCalendarDate = new Date(currYear, currMonth, 1 - diffToStart);

    const weeks = [];
    for (let w = 0; w < 6; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const index = w * 7 + d;
        const dt = new Date(
          startCalendarDate.getFullYear(),
          startCalendarDate.getMonth(),
          startCalendarDate.getDate() + index
        );
        const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
          dt.getDate()
        ).padStart(2, '0')}`;
        const isCurrentMonth = dt.getMonth() === currMonth;
        const dayNumber = dt.getDate();
        const isRealToday = isSameCalendarDay(dateStr, todayStr);
        const isSelected = dateStr === currentDate;

        days.push({
          dateStr,
          dayNumber,
          isCurrentMonth,
          isRealToday,
          isSelected
        });
      }
      weeks.push(days);
    }
    return weeks;
  }, [currYear, currMonth, currentDate, todayStr, weekStartDay]);

  return (
    <div
      data-testid="calendar-month-view"
      className="flex-1 flex flex-col overflow-hidden w-full h-full relative select-none"
    >
      {/* Weekday Headers */}
      <div className="h-8 border-b border-[#1E1E22] grid grid-cols-7 shrink-0 bg-[#111113] text-center select-none">
        {weekdayNames.map((dayName, idx) => (
          <div
            key={dayName}
            className={`${
              idx !== 6 ? 'border-r border-[#1E1E22]' : ''
            } flex items-center justify-center text-[10px] font-mono text-[#71717A] uppercase font-medium tracking-wider`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* 6-Row Grid Container (calc(100%/6) per row) */}
      <div className="flex-1 grid grid-rows-6 w-full h-full bg-[#111113] overflow-hidden">
        {monthWeeks.map((week, wIdx) => {
          const isLastRow = wIdx === 5;

          return (
            <div
              key={`week-${wIdx}`}
              className={`grid grid-cols-7 ${!isLastRow ? 'border-b border-[#1E1E22]' : ''} min-h-0`}
            >
              {week.map((day, dIdx) => {
                const isLastCol = dIdx === 6;
                const dayBlocks = blocks.filter((b) => b.date === day.dateStr);

                if (!day.isCurrentMonth) {
                  // Muted 35% for days outside active month
                  return (
                    <div
                      key={day.dateStr}
                      className={`${
                        !isLastCol ? 'border-r border-[#1E1E22]' : ''
                      } p-1.5 flex flex-col items-center opacity-30 bg-[#0C0C0E] relative`}
                    >
                      <span className="text-xs font-mono font-medium text-[#71717A] text-center">
                        {day.dayNumber}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => {
                      setCurrentDate(day.dateStr);
                      setViewMode('day');
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onOpenCreateModal({
                        date: day.dateStr,
                        startTime: '09:00',
                        endTime: '10:00'
                      });
                    }}
                    className={`${
                      !isLastCol ? 'border-r border-[#1E1E22]' : ''
                    } p-1.5 bg-[#111113] hover:bg-white/[0.035] hover:border-[#2E2E36] transition-colors relative flex flex-col items-center cursor-pointer`}
                    style={
                      day.isRealToday
                        ? {
                            border: '1px solid rgba(250, 250, 250, 0.25)',
                            boxShadow: 'inset 0 0 12px rgba(250, 250, 250, 0.04)'
                          }
                        : undefined
                    }
                  >
                    {/* Date Number centered at top: Solid white circle strictly on real Today */}
                    {day.isRealToday ? (
                      <span className="w-5 h-5 rounded-full bg-[#FAFAFA] text-[#09090B] text-xs font-bold flex items-center justify-center shadow-xs">
                        {day.dayNumber}
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-medium text-[#A1A1AA] text-center">
                        {day.dayNumber}
                      </span>
                    )}

                    {/* Proportional vertical placement of blocks according to time of day */}
                    {dayBlocks.slice(0, 2).map((b, bIdx) => {
                      const domainColor = CALENDAR_DOMAIN_COLORS[b.domain] || '#38BDF8';
                      const isSelected = selectedBlockId === b.id;
                      const topPx = calculateMonthBlockTop(b.startTime, bIdx, Math.min(dayBlocks.length, 2));

                      return (
                        <div
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBlock(b.id);
                          }}
                          className={`absolute inset-x-1.5 p-[4px_6px] rounded text-[10px] font-mono bg-[#1C1C21] hover:bg-[#222228] text-[#D4D4D8] flex items-center justify-center text-center truncate cursor-pointer transition-all shadow-xs overflow-hidden ${
                            isSelected
                              ? 'shadow-md z-10'
                              : 'hover:border-[#383840]'
                          }`}
                          style={{
                            top: `${topPx}px`,
                            border: isSelected ? `2px solid ${domainColor}` : '1px solid #2C2C34'
                          }}
                          title={`${b.title} (${b.startTime} - ${b.endTime})`}
                        >
                          {/* Dedicated Solid 2px Left Accent Bar */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-[2px] pointer-events-none"
                            style={{ backgroundColor: domainColor }}
                          />
                          <span className="truncate px-1">{b.title}</span>
                        </div>
                      );
                    })}

                    {/* Overflow Indicator (+N more) */}
                    {dayBlocks.length > 2 && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentDate(day.dateStr);
                          setViewMode('day');
                        }}
                        className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[9px] font-mono text-[#FAFAFA] hover:text-white hover:bg-[#222226] transition-colors cursor-pointer select-none"
                        title="View all blocks in Day View"
                      >
                        +{dayBlocks.length - 2} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
