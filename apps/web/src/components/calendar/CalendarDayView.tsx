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
import { useCalendarStore } from '../../stores/calendar-store.js';

const START_HOUR = 0;
const END_HOUR = 24;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 64; // Exactly 64px per hour

interface CalendarDayViewProps {
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

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  onSelectBlock,
  onOpenCreateModal,
  onEditBlock,
  onDeleteBlock
}) => {
  const { blocks, currentDate, selectedBlockId, updateBlock } = useCalendarStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Live system clock updating every 10 seconds
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => getTodayDateString(), []);
  const isToday = isSameCalendarDay(currentDate, todayStr);

  // Current time position in pixels
  const currentTimeTop = useMemo(() => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    return (currentMinutes / 60) * HOUR_HEIGHT;
  }, [now]);

  // Dragging / Resizing interaction states
  const [dragState, setDragState] = useState<{
    blockId: string;
    action: 'move' | 'resize-top' | 'resize-bottom';
    startY: number;
    initialStartMins: number;
    durationMins: number;
  } | null>(null);

  const [ghostBlock, setGhostBlock] = useState<{
    blockId: string;
    startMins: number;
    durationMins: number;
  } | null>(null);

  // Auto-scroll on mount / date change
  useEffect(() => {
    if (containerRef.current) {
      let targetMinutes = 8 * 60; // 8:00 AM default
      if (isToday) {
        const curMin = now.getHours() * 60 + now.getMinutes();
        targetMinutes = Math.max(0, curMin);
      }
      const targetY = (targetMinutes / 60) * HOUR_HEIGHT - 200;
      containerRef.current.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });
    }
  }, [currentDate, isToday]);

  // Filter blocks for current day
  const dayBlocks = useMemo(() => {
    return blocks.filter((b) => b.date === currentDate);
  }, [blocks, currentDate]);

  // Compute column placements for overlapping blocks
  const overlapPlacements = useMemo(() => {
    return computeOverlapColumns(dayBlocks);
  }, [dayBlocks]);

  // Handle grid click to create a block
  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top + containerRef.current.scrollTop;

    const totalMinutes = Math.floor((clickY / HOUR_HEIGHT) * 60);
    const snappedMinutes = Math.floor(totalMinutes / 30) * 30;
    const endMinutes = Math.min(24 * 60, snappedMinutes + 60);

    const startTime = minutesToTimeString(snappedMinutes);
    const endTime = minutesToTimeString(endMinutes);

    onOpenCreateModal({
      date: currentDate,
      startTime,
      endTime
    });
  };

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
        startMins: newStart,
        durationMins: dragState.durationMins
      });
    } else if (dragState.action === 'resize-top') {
      const initialEndMins = dragState.initialStartMins + dragState.durationMins;
      const newStart = Math.min(initialEndMins - 15, Math.max(0, dragState.initialStartMins + deltaMinutes));
      setGhostBlock({
        blockId: dragState.blockId,
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

    const { blockId, startMins, durationMins } = ghostBlock;
    const startTime = minutesToTimeString(startMins);
    const endTime = minutesToTimeString(startMins + durationMins);

    setDragState(null);
    setGhostBlock(null);

    await updateBlock(blockId, {
      startTime,
      endTime
    });
  };

  return (
    <div
      data-testid="calendar-day-view"
      ref={containerRef}
      onMouseMove={dragState ? handleMouseMove : undefined}
      onMouseUp={dragState ? handleMouseUp : undefined}
      className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#111113] select-none pb-0"
    >
      <div className="relative min-h-[1536px] w-full">
        {/* Full 24-Hour Time Axis with 1-Hour Interactive Slots */}
        {HOURS.map((hour, index) => {
          const top = index * HOUR_HEIGHT;
          const timeLabel = format12HourAxisLabel(hour);
          const t00 = minutesToTimeString(hour * 60);
          const t60 = minutesToTimeString(hour * 60 + 60);

          return (
            <div
              key={hour}
              className="absolute inset-x-0 h-[64px] border-b border-[#1E1E22] flex"
              style={{ top: `${top}px` }}
            >
              {/* Hour Label */}
              <span className="w-16 shrink-0 h-full flex items-center justify-center text-center text-xs font-mono text-[#71717A] tabular-nums select-none border-r border-[#1E1E22]">
                {timeLabel}
              </span>

              {/* Full 1-Hour Interactive Hover Cell */}
              <div
                className="flex-1 h-full hover:bg-white/[0.035] transition-colors duration-100 cursor-pointer relative"
                onClick={() => onOpenCreateModal({ date: currentDate, startTime: t00, endTime: t60 })}
              />
            </div>
          );
        })}

        {/* Crisp Pure White Current-Time Indicator */}
        {isToday && (
          <div
            data-testid="current-time-indicator"
            className="absolute left-16 right-0 z-30 pointer-events-none flex items-center"
            style={{ top: `${currentTimeTop}px`, transform: 'translateY(-50%)' }}
          >
            <div className="w-2 h-2 rounded-full bg-[#FAFAFA] -ml-1 shrink-0 shadow-[0_0_6px_rgba(250,250,250,0.8)]" />
            <div className="flex-1 h-[2px] bg-[#FAFAFA] shadow-[0_0_6px_rgba(250,250,250,0.6)]" />
          </div>
        )}

        {/* Learning Blocks Container */}
        <div className="absolute top-0 bottom-0 left-16 right-4 max-w-5xl pointer-events-none">
          {dayBlocks.map((block) => {
            const isSelected = selectedBlockId === block.id;
            const domainColor = CALENDAR_DOMAIN_COLORS[block.domain] || '#60A5FA';

            let startMins = timeStringToMinutes(block.startTime);
            let durationMins = block.durationMinutes;

            if (ghostBlock && ghostBlock.blockId === block.id) {
              startMins = ghostBlock.startMins;
              durationMins = ghostBlock.durationMins;
            }

            const top = (startMins / 60) * HOUR_HEIGHT;
            const height = Math.max(28, (durationMins / 60) * HOUR_HEIGHT);

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
                    startY: e.clientY,
                    initialStartMins: startMins,
                    durationMins
                  });
                }}
                className={`absolute rounded-lg bg-[#1C1C21] hover:bg-[#222228] p-[6px_10px] flex flex-col items-start justify-start text-left transition-all shadow-xs group cursor-pointer overflow-hidden pointer-events-auto ${
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
                  left: `calc(${leftPercent}% + 2px)`,
                  width: `calc(${colWidthPercent}% - 4px)`,
                  ...(isSelected ? { borderColor: domainColor } : {})
                }}
              >
                {/* 2px Left Accent Strip */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[2px] pointer-events-none"
                  style={{ backgroundColor: domainColor }}
                />

                <div className="flex items-center gap-1.5 w-full min-w-0 pl-1">
                  {isCompleted && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  )}
                  {isMissed && (
                    <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                  )}
                  <h3 className="text-[12.5px] font-medium text-[#FAFAFA] truncate text-left group-hover:text-white select-none">
                    {block.title}
                  </h3>
                </div>

                {height >= 48 && (
                  <span className="text-[10.5px] font-mono text-[#8E8E93] truncate pl-1 mt-0.5 select-none">
                    {block.startTime} – {block.endTime}
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
      </div>
    </div>
  );
};
