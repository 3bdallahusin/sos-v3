import React from 'react';

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
  return (
    <div
      data-testid="horizon-bar"
      className="w-full mb-3.5 flex flex-col px-0.5"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-medium text-[#F4F4F5]">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-[6px] bg-[#18181B] border border-[#27272A] text-[11.5px] font-mono text-[#E4E4E7] tabular-nums">
            {daysLeft} days left
          </span>
          <span className="px-2.5 py-0.5 rounded-[6px] bg-[#18181B] border border-[#27272A] text-[11.5px] font-mono text-[#E4E4E7] tabular-nums">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div
        className="w-full h-[2.5px] bg-[#18181B] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-[#E4E4E7] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
};
