import React from 'react';
import { SOSCard } from '../ui/SOSCard.js';

interface HeroGreetingCardProps {
  milestoneName?: string;
  startDate?: string;
  endDate?: string;
  isLoading?: boolean;
  isHydrated?: boolean;
}

export function calculateSemesterProgress(
  startDateStr?: string,
  endDateStr?: string,
  currentDate = new Date()
): { daysLeft: number; progressPercent: number } {
  const now = currentDate.getTime();
  const currentYear = currentDate.getFullYear();
  const fallbackStart = new Date(`${currentYear}-09-01T00:00:00`).getTime();
  const fallbackEnd = new Date(`${currentYear}-12-31T23:59:59`).getTime();

  const start = startDateStr ? new Date(startDateStr).getTime() : fallbackStart;
  const end = endDateStr ? new Date(endDateStr).getTime() : fallbackEnd;

  const validStart = Number.isNaN(start) ? fallbackStart : start;
  const validEnd = Number.isNaN(end) || end <= validStart ? fallbackEnd : end;

  const totalDuration = validEnd - validStart;
  const daysLeft = Math.max(0, Math.ceil((validEnd - now) / (1000 * 60 * 60 * 24)));
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((now - validStart) / totalDuration) * 100))
  );

  return { daysLeft, progressPercent };
}

export const HeroGreetingCard: React.FC<HeroGreetingCardProps> = ({
  milestoneName,
  startDate,
  endDate,
  isLoading = false,
  isHydrated = true
}) => {
  // Time-aware title-case greeting
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const greeting = getGreeting();
  // Never show default content until settings are hydrated and horizon dates are verified
  const showSkeleton = isLoading || !isHydrated || !milestoneName || !startDate || !endDate || milestoneName === '2026';
  const effectiveMilestone = milestoneName || 'Fall Semester 2026';
  const { daysLeft, progressPercent } = calculateSemesterProgress(
    startDate || '2026-09-26',
    endDate || '2027-01-01'
  );

  return (
    <SOSCard
      data-testid="hero-greeting-card"
      className="lg:col-span-2 h-[176px] py-6 px-7"
      innerClassName="justify-between h-full flex flex-col"
    >
      {/* Top: Greeting & Subtitle with comfortable mt-1.5 spacing */}
      <div>
        <h1
          data-testid="greeting-heading"
          className="text-[28px] font-semibold text-[#EDEDED] tracking-[-0.02em] leading-tight m-0"
        >
          {greeting}
        </h1>
        <p className="text-[14px] text-[#A1A1AA] mt-1.5 font-normal tracking-normal m-0">
          What are you going to learn today?
        </p>
      </div>

      {/* Bottom: Live Semester Progress Section or Hydration Skeleton */}
      <div className="flex flex-col gap-2 pt-2.5 border-t border-[#1E1E1E]">
        {showSkeleton ? (
          <div data-testid="semester-progress-skeleton" className="flex flex-col gap-2 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 w-36 bg-[#121214] border border-[#27272A]/40 rounded" />
              <div className="flex items-center gap-2">
                <div className="h-5 w-20 bg-[#121214] border border-[#27272A]/40 rounded-[6px]" />
                <div className="h-5 w-12 bg-[#121214] border border-[#27272A]/40 rounded-[6px]" />
              </div>
            </div>
            <div className="w-full h-1 bg-[#121214] rounded-full mt-1" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#EDEDED] tracking-tight">
                {effectiveMilestone}
              </span>
              <div className="flex items-center gap-2">
                <span
                  data-testid="semester-days-badge"
                  className="px-2.5 py-0.5 rounded-[6px] bg-[#161619] border border-[#27272A] text-[11px] font-mono text-[#A1A1AA] tabular-nums"
                >
                  {daysLeft} days left
                </span>
                <span
                  data-testid="semester-percent-badge"
                  className="px-2.5 py-0.5 rounded-[6px] bg-[#161619] border border-[#27272A] text-[11px] font-mono text-[#EDEDED] font-medium tabular-nums"
                >
                  {progressPercent}%
                </span>
              </div>
            </div>

            {/* Horizontal Progress Bar: 4px track #27272A with clean pill geometry and #EDEDED fill */}
            <div
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full h-1 bg-[#27272A] rounded-full overflow-hidden mt-1 relative"
            >
              <div
                data-testid="semester-progress-fill"
                className="h-full bg-[#EDEDED] rounded-full transition-all duration-150 ease-out min-w-[4px]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </>
        )}
      </div>
    </SOSCard>
  );
};
