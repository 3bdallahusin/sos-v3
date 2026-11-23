import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { useTrackingStore } from '../../stores/tracking-store.js';
import type { AnnualHeatmapDay } from '@sos/contracts';

export interface AnnualActivityHeatmapProps {
  variant?: 'default' | 'profile';
  className?: string;
  data?: {
    weeks: AnnualHeatmapDay[][];
    startDate?: string;
    endDate?: string;
    dateRangeLabel?: string;
    totalHours?: number;
    currentStreak?: number;
  };
}

export const AnnualActivityHeatmap: React.FC<AnnualActivityHeatmapProps> = ({
  data,
  className = ''
}) => {
  const { heatmap } = useTrackingStore();
  const [hoveredCell, setHoveredCell] = useState<{ day: AnnualHeatmapDay; wIdx: number; dIdx: number } | null>(null);

  const weeks = data?.weeks || heatmap?.weeks || [];
  const startDate = data?.startDate || heatmap?.startDate;
  const endDate = data?.endDate || heatmap?.endDate;
  const currentStreak = data?.currentStreak ?? heatmap?.currentStreak ?? 0;
  const totalHours = data?.totalHours ?? heatmap?.totalHours ?? 0;

  const computeDateRangeLabel = () => {
    if (data?.dateRangeLabel) return data.dateRangeLabel;
    if ((heatmap as any)?.dateRangeLabel) return (heatmap as any).dateRangeLabel;
    if (startDate && endDate) {
      try {
        const s = new Date(`${startDate}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const e = new Date(`${endDate}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return `${s} - ${e}`;
      } catch {
        return 'Nov 2025 - Nov 2026';
      }
    }
    return 'Nov 2025 - Nov 2026';
  };

  const dateRangeLabel = computeDateRangeLabel();

  // Strictly #60A5FA Accent Opacity Ramp
  const getColorStyle = (level: number, isFuture: boolean): string => {
    if (isFuture || level === 0) return '#141416';
    if (level === 1) return 'rgba(96, 165, 250, 0.22)';
    if (level === 2) return 'rgba(96, 165, 250, 0.45)';
    if (level === 3) return 'rgba(96, 165, 250, 0.72)';
    return '#60A5FA';
  };

  const months = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

  return (
    <section
      data-testid="annual-activity-heatmap"
      className={`bg-[#111113] border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between gap-2.5 w-full h-full select-text ${className}`}
    >
      {/* Card Header: Activity icon + uppercase monospace title on left, monospace date range on right */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#A1A1AA]" />
          <h3 className="font-mono text-[12px] uppercase tracking-[0.05em] text-[#E4E4E7] font-medium">
            ANNUAL ACTIVITY
          </h3>
        </div>
        <span className="font-mono text-[11px] text-[#8E8E93] tabular-nums">{dateRangeLabel}</span>
      </div>

      {/* 52x7 Heatmap Grid + Month Labels */}
      <div className="flex flex-col gap-1.5 min-w-0 w-full">
        <div className="w-full overflow-hidden relative min-w-0">
          <div className="flex items-start gap-[2px] min-w-0 w-full justify-between">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[2px] flex-1 min-w-0">
                {week.map((day, dIdx) => {
                  const isHovered = hoveredCell?.wIdx === wIdx && hoveredCell?.dIdx === dIdx;

                  return (
                    <div
                      key={`${wIdx}-${dIdx}`}
                      onMouseEnter={() => setHoveredCell({ day, wIdx, dIdx })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`relative w-full aspect-square rounded-[2px] transition-all duration-150 ease-out hover:scale-[1.25] hover:z-20 hover:brightness-125 cursor-pointer ${
                        day.level === 0 || day.isFuture ? 'border border-white/[0.04] bg-[#141416]' : ''
                      }`}
                      style={{
                        backgroundColor: day.level > 0 && !day.isFuture
                          ? getColorStyle(day.level, false)
                          : '#141416'
                      }}
                    >
                      {/* Anchored Tooltip */}
                      {isHovered && !day.isFuture && (
                        <div
                          className={`absolute pointer-events-none px-2.5 py-1 rounded-md bg-[#1C1C21] border border-[#2E2E35] text-[11px] font-mono text-[#FAFAFA] shadow-2xl flex items-center gap-2 z-50 whitespace-nowrap transition-all duration-75 ${
                            dIdx <= 1 ? 'top-full mt-2' : 'bottom-full mb-2'
                          } ${
                            wIdx < 4 ? 'left-0 translate-x-0' : wIdx > 48 ? 'right-0 translate-x-0' : 'left-1/2 -translate-x-1/2'
                          }`}
                        >
                          <span className="text-[#A1A1AA]">{day.dayLabel || day.date}:</span>
                          <span className="text-[#60A5FA] font-semibold tabular-nums">{day.hours}h studied</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Month Labels */}
          <div className="grid grid-cols-12 text-[10.5px] text-[#8E8E93] pt-1.5 select-none min-w-0 w-full font-mono">
            {months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer: Streak & Total Readout on bottom-left, Less ... More Legend on bottom-right */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        <div className="text-[11px] font-mono text-[#8E8E93] tabular-nums flex items-center gap-1.5">
          <span>Current Streak:</span>
          <span className="text-[#FAFAFA] font-medium">{currentStreak}d</span>
          <span className="text-[#52525B]">•</span>
          <span>Total:</span>
          <span className="text-[#FAFAFA] font-medium">{totalHours}h</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#8E8E93]">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#141416] border border-white/[0.04]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[rgba(96,165,250,0.22)]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[rgba(96,165,250,0.45)]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[rgba(96,165,250,0.72)]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#60A5FA]" />
          <span>More</span>
        </div>
      </div>
    </section>
  );
};
