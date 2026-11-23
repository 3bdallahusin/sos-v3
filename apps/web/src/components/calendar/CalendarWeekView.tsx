import React, { useRef, useMemo, useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { LearningBlock } from '@sos/domain';
import {
  CALENDAR_DOMAIN_COLORS,
  format12HourAxisLabel,
  getTodayDateString,
  isSameCalendarDay,
  computeOverlapColumns
} from '@sos/domain';
import { useCalendarStore, getWeekRange } from '../../stores/calendar-store.js';
import { useSettingsStore } from '../../stores/settings-store.js';

const START_HOUR = 0;
const END_HOUR = 24;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 64; // Uniform 64px per hour

interface CalendarWeekViewProps {
  onSelectBlock: (id: string) => void;
  onOpenCreateModal: (slot?: { date: string; startTime: string; endTime: string }) => void;
  onEditBlock?: (block: LearningBlock) => void;
  onDeleteBlock?: (id: string, scope?: 'single' | 'following') => Promise<void>;
}

function timeStringToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTimeString(m: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, m));
  const h = Math.floor(clamped / 60);
  const min = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  onSelectBlock,
  onOpenCreateModal,
  onEditBlock,
  onDeleteBlock
}) => {
  const { blocks, currentDate, selectedBlockId, updateBlock, setCurrentDate } =
    useCalendarStore();
  const weekStartDay = useSettingsStore((s) => s.settings.general?.weekStartDay || 'saturday');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Live system clock updating every 10 seconds
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Current time position in pixels
  const currentTimeTop = useMemo(() => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    return (currentMinutes / 60) * HOUR_HEIGHT;
  }, [now]);

  // Auto-scroll on mount so current time (or 8 AM) is centered
  useEffect(() => {
    if (scrollContainerRef.current) {
      const curMin = now.getHours() * 60 + now.getMinutes();
      const targetY = (curMin / 60) * HOUR_HEIGHT - 200;
      scrollContainerRef.current.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });
    }
  }, []);

  // Compute 7 days for the active week respecting weekStartDay
  const weekDays = useMemo(() => {
    const { start } = getWeekRange(currentDate);
    const [sy, sm, sd] = start.split('-').map(Number);
    const startDate = new Date(sy, sm - 1, sd);

    const SATURDAY_WEEKDAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const MONDAY_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekdayNames = weekStartDay === 'saturday' ? SATURDAY_WEEKDAYS : MONDAY_WEEKDAYS;

    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(startDate);
      dt.setDate(startDate.getDate() + i);
      const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
        dt.getDate()
      ).padStart(2, '0')}`;
      const dayName = weekdayNames[i];
      const dayNumber = dt.getDate();
      const isRealToday = isSameCalendarDay(dateStr, todayStr);
      const isSelected = dateStr === currentDate;

      return {
        dateStr,
        dayName,
        dayNumber,
        isRealToday,
        isSelected
      };
    });
  }, [currentDate, todayStr, weekStartDay]);

  // Dragging / Resizing interaction states
  const [dragState, setDragState] = useState<{
    blockId: string;
    action: 'move' | 'resize-top' | 'resize-bottom';
    date: string;
    startY: number;
    initialStartMins: number;
    durationMins: number;
  } | null>(null);

  const [ghostBlock, setGhostBlock] = useState<{
    blockId: string;
    date: string;
    startMins: number;
    durationMins: number;
  } | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return;
    const deltaY = e.clientY - dragState.startY;
    const deltaMinutes = Math.round(((deltaY / HOUR_HEIGHT) * 60) / 15) * 15;

    if (dragState.action === 'move') {
      const newStart = Math.max(
        0,
        Math.min(24 * 60 - dragState.durationMins, dragState.initialStartMins + deltaMinutes)
      );
      setGhostBlock({
        blockId: dragState.blockId,
        date: dragState.date,
        startMins: newStart,
        durationMins: dragState.durationMins
      });
    } else if (dragState.action === 'resize-top') {
      const initialEndMins = dragState.initialStartMins + dragState.durationMins;
      const newStart = Math.min(initialEndMins - 15, Math.max(0, dragState.initialStartMins + deltaMinutes));
      setGhostBlock({
        blockId: dragState.blockId,
        date: dragState.date,
        startMins: newStart,
        durationMins: initialEndMins - newStart
      });
    } else if (dragState.action === 'resize-bottom') {
      const newDuration = Math.max(
        15,
        Math.min(24 * 60 - dragState.initialStartMins, dragState.durationMins + deltaMinutes)
      );
      setGhostBlock({
        blockId: dragState.blockId,
        date: dragState.date,
        startMins: dragState.initialStartMins,
        durationMins: newDuration
      });
    }
  };

  const handleMouseUp = async () => {
    if (!dragState || !ghostBlock) {
      setDragState(null);
      setGhostBlock(null);
      return;
    }

    const { blockId, date, startMins, durationMins } = ghostBlock;
    const startTime = minutesToTimeString(startMins);
    const endTime = minutesToTimeString(startMins + durationMins);

    setDragState(null);
    setGhostBlock(null);

    await updateBlock(blockId, {
      date,
      startTime,
      endTime
    });
  };

  const handleColumnClick = (dateStr: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top + scrollContainerRef.current.scrollTop;

    const totalMinutes = Math.floor((clickY / HOUR_HEIGHT) * 60);
    const snappedMinutes = Math.floor(totalMinutes / 30) * 30;
    const endMinutes = Math.min(24 * 60, snappedMinutes + 60);

    const startTime = minutesToTimeString(snappedMinutes);
    const endTime = minutesToTimeString(endMinutes);

    onOpenCreateModal({
      date: dateStr,
      startTime,
      endTime
    });
  };

  return (
    <div
      data-testid="calendar-week-view"
      onMouseMove={dragState ? handleMouseMove : undefined}
      onMouseUp={dragState ? handleMouseUp : undefined}
      className="flex-1 flex flex-col overflow-hidden w-full h-full relative select-none"
    >
      {/* Weekday Date Columns Header (7 Columns, 56px left spacer) */}
      <div className="h-11 border-b border-[#1E1E22] grid grid-cols-[56px_repeat(7,1fr)] shrink-0 bg-[#111113] select-none z-10">
        <div className="border-r border-[#1E1E22]" />

        {weekDays.map((day, i) => {
          const isLast = i === 6;

          return (
            <div
              key={day.dateStr}
              onClick={() => setCurrentDate(day.dateStr)}
              className={`flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.02] transition-colors ${
                !isLast ? 'border-r border-[#1E1E22]' : ''
              }`}
            >
              <span
                className={`text-[10px] uppercase font-mono ${
                  day.isSelected
                    ? 'text-[#FAFAFA] font-bold'
                    : day.isRealToday
                      ? 'text-[#FAFAFA] font-medium'
                      : 'text-[#71717A]'
                }`}
              >
                {day.dayName}
              </span>
              {day.isSelected ? (
                <span className="w-5 h-5 rounded-full bg-[#FAFAFA] text-[#09090B] text-xs font-bold flex items-center justify-center shadow-xs">
                  {day.dayNumber}
                </span>
              ) : day.isRealToday ? (
                <span className="w-5 h-5 rounded-full border-2 border-[#FAFAFA] text-[#FAFAFA] text-xs font-bold flex items-center justify-center">
                  {day.dayNumber}
                </span>
              ) : (
                <span className="text-xs font-semibold text-[#A1A1AA]">
                  {day.dayNumber}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable Hourly Grid (7 Columns) - Uniform 64px row height */}
      <div
        ref={scrollContainerRef}
        data-testid="calendar-scroll-grid"
        className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#111113] pb-0"
      >
        <div className="grid grid-cols-[56px_repeat(7,1fr)] min-h-[1536px] relative">
          {/* Time Axis (Left 56px, 12 AM to 11 PM, 64px/hr) */}
          <div className="border-r border-[#1E1E22] flex flex-col text-[10px] font-mono text-[#71717A] tabular-nums select-none relative">
            {HOURS.map((hour) => {
              const timeLabel = format12HourAxisLabel(hour);
              return (
                <div
                  key={hour}
                  className="h-[64px] border-b border-[#1E1E22] flex items-center justify-center text-center"
                >
                  {timeLabel}
                </div>
              );
            })}
          </div>

          {/* 7 Columns for Days */}
          {weekDays.map((day, colIndex) => {
            const isLast = colIndex === 6;
            const columnBlocks = blocks.filter((b) => b.date === day.dateStr);
            const overlapPlacements = computeOverlapColumns(columnBlocks);

            return (
              <div
                key={day.dateStr}
                onClick={(e) => handleColumnClick(day.dateStr, e)}
                className={`relative ${!isLast ? 'border-r border-[#1E1E22]' : ''}`}
              >
                {/* Hourly background lines for column with interactive hover */}
                {HOURS.map((h, hIdx) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 h-[64px] border-b border-[#1E1E22] hover:bg-white/[0.04] transition-colors duration-150 cursor-pointer pointer-events-auto"
                    style={{ top: `${hIdx * HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* Crisp White Current-Time Indicator ONLY inside Today's column */}
                {day.isRealToday && (
                  <div
                    data-testid="current-time-indicator"
                    className="absolute inset-x-0 pointer-events-none z-20 flex items-center"
                    style={{ top: `${currentTimeTop}px`, transform: 'translateY(-50%)' }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#FAFAFA] -ml-1 shrink-0 shadow-[0_0_6px_rgba(250,250,250,0.8)]" />
                    <div className="flex-1 h-[2px] bg-[#FAFAFA] shadow-[0_0_6px_rgba(250,250,250,0.6)]" />
                  </div>
                )}

                {/* Render Learning Blocks in this day column */}
                {columnBlocks.map((block) => {
                  const isSelected = selectedBlockId === block.id;
                  const domainColor = CALENDAR_DOMAIN_COLORS[block.domain] || '#60A5FA';

                  let startMins = timeStringToMinutes(block.startTime);
                  let durationMins = block.durationMinutes;

                  if (ghostBlock && ghostBlock.blockId === block.id) {
                    startMins = ghostBlock.startMins;
                    durationMins = ghostBlock.durationMins;
                  }

                  const top = (startMins / 60) * HOUR_HEIGHT;
                  const height = Math.max(26, (durationMins / 60) * HOUR_HEIGHT);

                  // Compute overlapping column subdivision
                  const placement = overlapPlacements.get(block.id) || { colIndex: 0, totalCols: 1 };
                  const colWidthPercent = 100 / placement.totalCols;
                  const leftPercent = placement.colIndex * colWidthPercent;

                  const isCompleted = block.status === 'completed';
                  const isMissed = block.status === 'missed';

                  return (
                    <div
                      key={block.id}
                      data-testid={`calendar-block-${block.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBlock(block.id);
                      }}
                      onMouseDown={(e) => {
                        if (e.button !== 0) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        if (e.clientY < rect.top + 6 || e.clientY > rect.bottom - 6) return;

                        setDragState({
                          blockId: block.id,
                          action: 'move',
                          date: day.dateStr,
                          startY: e.clientY,
                          initialStartMins: startMins,
                          durationMins
                        });
                      }}
                      className={`absolute rounded-lg bg-[#1C1C21] hover:bg-[#222228] p-[4px_6px] flex flex-col items-start justify-start text-left overflow-hidden transition-all shadow-xs group cursor-pointer ${
                        isSelected
                          ? 'border-2 shadow-lg z-20'
                          : isCompleted
                            ? 'border border-white/[0.08] hover:border-white/[0.14]'
                            : isMissed
                              ? 'border border-dashed border-rose-500/30 hover:border-rose-500/50'
                              : 'border border-[#2C2C34] hover:border-[#3E3E48]'
                      }`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `calc(${leftPercent}% + 1px)`,
                        width: `calc(${colWidthPercent}% - 2px)`,
                        ...(isSelected ? { borderColor: domainColor } : {})
                      }}
                    >
                      {/* Left Accent Strip */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-[2px] pointer-events-none"
                        style={{ backgroundColor: domainColor }}
                      />

                      <div className="flex items-center gap-1 w-full min-w-0 pl-0.5">
                        {isCompleted && (
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        )}
                        {isMissed && (
                          <AlertCircle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                        )}
                        <span className="text-[11px] leading-[1.25] font-medium text-[#FAFAFA] text-left select-none truncate">
                          {block.title}
                        </span>
                      </div>

                      {height >= 44 && (
                        <span className="text-[9.5px] font-mono text-[#8E8E93] truncate pl-0.5 mt-0.5 select-none">
                          {block.startTime}
                        </span>
                      )}

                      {/* Top invisible resize handle */}
                      <div
                        className="absolute top-0 inset-x-0 h-[6px] cursor-ns-resize bg-transparent z-10"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDragState({
                            blockId: block.id,
                            action: 'resize-top',
                            date: day.dateStr,
                            startY: e.clientY,
                            initialStartMins: startMins,
                            durationMins
                          });
                        }}
                      />

                      {/* Bottom invisible resize handle */}
                      <div
                        className="absolute bottom-0 inset-x-0 h-[6px] cursor-ns-resize bg-transparent z-10"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDragState({
                            blockId: block.id,
                            action: 'resize-bottom',
                            date: day.dateStr,
                            startY: e.clientY,
                            initialStartMins: startMins,
                            durationMins
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
