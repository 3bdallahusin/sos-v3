import React from 'react';

export interface AcademicHorizon {
  semesterName: string;
  startDate: string; // ISO string e.g. '2026-09-01'
  endDate: string;   // ISO string e.g. '2026-12-31'
}

/**
 * Computes the remaining days and progress percentage for an academic term.
 * Pure mathematical calculation based on local time.
 */
export function calculateAcademicHorizon(
  horizon: AcademicHorizon,
  currentDate = new Date()
): { daysLeft: number; percentage: number } {
  const start = new Date(horizon.startDate).getTime();
  const end = new Date(horizon.endDate).getTime();
  const now = currentDate.getTime();
  const totalDuration = end - start;

  if (totalDuration <= 0) {
    return { daysLeft: 0, percentage: 0 };
  }

  // Days remaining until end of term (ceil so current day counts)
  const diffTime = end - now;
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Percentage elapsed through term [0, 100]
  const elapsed = now - start;
  const percentage = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

  return { daysLeft, percentage };
}

interface HorizonBarProps {
  title?: string;
  daysLeft?: number;
  percentage?: number;
}

export const HorizonBar: React.FC<HorizonBarProps> = ({
  title = 'Fall Semester 2026',
  daysLeft = 48,
  percentage = 50
}) => {
  const hasActiveHorizon = Boolean(title && daysLeft !== undefined && percentage !== undefined);

  return (
    <div
      data-testid="horizon-bar"
      className="w-full mb-3.5 flex flex-col px-0.5"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-medium text-[#F4F4F5]">
          {hasActiveHorizon ? title : 'No Active Semester Horizon'}
        </span>
        {hasActiveHorizon ? (
          <div className="flex items-center gap-2">
            <span
              data-testid="horizon-days-badge"
              className="px-2.5 py-0.5 rounded-[6px] bg-[#18181B] border border-[#27272A] text-[11.5px] font-mono text-[#E4E4E7] tabular-nums"
            >
              {daysLeft} days left
            </span>
            <span
              data-testid="horizon-percent-badge"
              className="px-2.5 py-0.5 rounded-[6px] bg-[#18181B] border border-[#27272A] text-[11.5px] font-mono text-[#E4E4E7] tabular-nums"
            >
              {percentage}%
            </span>
          </div>
        ) : (
          <span className="text-[11.5px] font-mono text-[#71717A]">
            Set in Calendar
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div
        className="w-full h-[2.5px] bg-[#18181B] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={hasActiveHorizon ? percentage : 0}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-[#E4E4E7] rounded-full transition-all duration-150 ease-out"
          style={{ width: `${hasActiveHorizon ? Math.min(100, Math.max(0, percentage)) : 0}%` }}
        />
      </div>
    </div>
  );
};
