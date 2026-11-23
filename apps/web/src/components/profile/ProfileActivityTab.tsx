import React from 'react';
import {
  Activity,
  Flame,
  Clock,
  GitCommit
} from 'lucide-react';
import type { ProfileActivityMetrics } from '@sos/domain';
import { SOSCard } from '../ui/SOSCard.js';

export interface ProfileActivityTabProps {
  metrics: ProfileActivityMetrics;
}

const LEVEL_COLORS: Record<number, string> = {
  0: '#141417',
  1: '#0C2D48',
  2: '#145DA0',
  3: '#2E8BC0',
  4: '#60A5FA'
};

const MONTH_LABELS = [
  'Dec',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov'
];

export const ProfileActivityTab: React.FC<ProfileActivityTabProps> = ({ metrics }) => {
  const {
    totalStudyTimeHours,
    currentStreakDays,
    totalContributions,
    yearLabel,
    dateRangeLabel,
    dailyContributions
  } = metrics;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. ANNUAL STUDY ACTIVITY HEATMAP CARD */}
      <SOSCard
        tier={2}
        className="p-5 shadow-sm w-full"
        innerClassName="flex flex-col gap-4"
      >
        {/* Card Header: Annual Activity */}
        <div className="flex items-center justify-between border-b border-[#1E1E22] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-white" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Annual Activity
            </h2>
          </div>
          <span className="text-[11px] text-[#8E8E93] font-mono">
            {dateRangeLabel}
          </span>
        </div>

        {/* Heatmap Matrix: 52 Weeks x 7 Days Grid fitting 100% cleanly with ZERO horizontal scrolling */}
        <div className="w-full flex flex-col gap-2 pt-1">
          {/* Responsive 52-column x 7-row CSS Grid */}
          <div className="w-full grid grid-flow-col grid-rows-7 gap-[2.5px] items-stretch">
            {dailyContributions.map((item, idx) => {
              const bg = LEVEL_COLORS[item.level] || LEVEL_COLORS[0];
              return (
                <div
                  key={item.date || idx}
                  className="w-full aspect-square rounded-[2px] transition-all duration-150 ease-out hover:scale-[1.15] hover:z-20 hover:brightness-125 cursor-pointer"
                  style={{ backgroundColor: bg }}
                  title={`${item.date}: ${item.count} contributions`}
                />
              );
            })}
          </div>

          {/* Month Axis Labels across the 52 columns with improved contrast */}
          <div className="w-full flex items-center justify-between text-[10px] font-mono text-[#8E8E93] px-0.5 pt-1">
            {MONTH_LABELS.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>

          {/* Legend and Total Counter */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8E8E93] pt-2 border-t border-[#1E1E22]/60">
            <span>
              {totalContributions.toLocaleString()} total learning contributions in {yearLabel}
            </span>

            <div className="flex items-center gap-1.5 text-[11px] text-[#8E8E93]">
              <span>Less</span>
              <div className="flex items-center gap-[2.5px]">
                <div
                  className="w-2.5 h-2.5 rounded-[2px]"
                  style={{ backgroundColor: LEVEL_COLORS[0] }}
                  title="No contributions"
                />
                <div
                  className="w-2.5 h-2.5 rounded-[2px]"
                  style={{ backgroundColor: LEVEL_COLORS[1] }}
                  title="1-2 contributions"
                />
                <div
                  className="w-2.5 h-2.5 rounded-[2px]"
                  style={{ backgroundColor: LEVEL_COLORS[2] }}
                  title="3-4 contributions"
                />
                <div
                  className="w-2.5 h-2.5 rounded-[2px]"
                  style={{ backgroundColor: LEVEL_COLORS[3] }}
                  title="5-6 contributions"
                />
                <div
                  className="w-2.5 h-2.5 rounded-[2px]"
                  style={{ backgroundColor: LEVEL_COLORS[4] }}
                  title="7+ contributions"
                />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </SOSCard>

      {/* 2. THREE SUMMARY STAT CARDS (Strictly matching Stitch node_8348410134651814004) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
        {/* Card 1: TOTAL STUDY TIME */}
        <SOSCard
          tier={3}
          className="p-3.5 shadow-sm"
          innerClassName="flex flex-col justify-between gap-1.5 h-full"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-mono font-semibold text-[#8E8E93] tracking-wider uppercase whitespace-nowrap">
              TOTAL STUDY TIME
            </span>
            <Clock className="w-3.5 h-3.5 text-[#8E8E93]" />
          </div>
          <div className="flex items-center whitespace-nowrap">
            <span className="text-[15px] font-bold text-[#F4F4F5] font-mono tracking-tight whitespace-nowrap">
              {totalStudyTimeHours > 0 ? `${totalStudyTimeHours} Hours` : '0 Hours'}
            </span>
          </div>
        </SOSCard>

        {/* Card 2: CURRENT STREAK */}
        <SOSCard
          tier={3}
          className="p-3.5 shadow-sm"
          innerClassName="flex flex-col justify-between gap-1.5 h-full"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-mono font-semibold text-[#8E8E93] tracking-wider uppercase whitespace-nowrap">
              CURRENT STREAK
            </span>
            <Flame className="w-3.5 h-3.5 text-[#8E8E93]" />
          </div>
          <div className="flex items-center whitespace-nowrap">
            <span className="text-[15px] font-bold text-[#F4F4F5] font-mono tracking-tight whitespace-nowrap">
              {currentStreakDays} Days
            </span>
          </div>
        </SOSCard>

        {/* Card 3: CONTRIBUTIONS */}
        <SOSCard
          tier={3}
          className="p-3.5 shadow-sm"
          innerClassName="flex flex-col justify-between gap-1.5 h-full"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-mono font-semibold text-[#8E8E93] tracking-wider uppercase whitespace-nowrap">
              CONTRIBUTIONS
            </span>
            <GitCommit className="w-3.5 h-3.5 text-[#8E8E93]" />
          </div>
          <div className="flex items-center whitespace-nowrap">
            <span className="text-[15px] font-bold text-[#F4F4F5] font-mono tracking-tight whitespace-nowrap">
              {totalContributions.toLocaleString()}
            </span>
          </div>
        </SOSCard>
      </div>
    </div>
  );
};
