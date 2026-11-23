import React from 'react';
import { useTrackingStore } from '../../stores/tracking-store.js';

interface AnnualMetricsSummaryCardProps {
  className?: string;
}

export const AnnualMetricsSummaryCard: React.FC<AnnualMetricsSummaryCardProps> = ({
  className = ''
}) => {
  const heatmap = useTrackingStore((s) => s.heatmap);

  const totalHours = heatmap?.totalHours ?? 0;
  const currentStreak = heatmap?.currentStreak ?? 0;
  const dailyAverageHours =
    heatmap?.dailyAverageHours ?? (totalHours > 0 ? Math.round((totalHours / 114) * 10) / 10 : 0);

  return (
    <div
      data-testid="annual-metrics-summary-card"
      className={`bg-[#111113] border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between gap-2.5 h-full ${className}`}
    >
      {/* Sub-Card 1: TOTAL STUDY TIME */}
      <div className="bg-[#161619] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between flex-1">
        <span className="text-[11px] font-medium tracking-wider uppercase text-zinc-400 select-none">
          TOTAL STUDY TIME
        </span>
        <span
          data-testid="metric-total-study-time"
          className="text-base font-semibold tabular-nums text-zinc-100 font-mono"
        >
          {totalHours}h
        </span>
      </div>

      {/* Sub-Card 2: CURRENT STREAK */}
      <div className="bg-[#161619] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between flex-1">
        <span className="text-[11px] font-medium tracking-wider uppercase text-zinc-400 select-none">
          CURRENT STREAK
        </span>
        <span
          data-testid="metric-current-streak"
          className="text-base font-semibold tabular-nums text-zinc-100 font-mono"
        >
          {currentStreak}d
        </span>
      </div>

      {/* Sub-Card 3: DAILY AVERAGE */}
      <div className="bg-[#161619] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between flex-1">
        <span className="text-[11px] font-medium tracking-wider uppercase text-zinc-400 select-none">
          DAILY AVERAGE
        </span>
        <span
          data-testid="metric-daily-average"
          className="text-base font-semibold tabular-nums text-zinc-100 font-mono"
        >
          {dailyAverageHours}h
        </span>
      </div>
    </div>
  );
};
