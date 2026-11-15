import React from 'react';

interface GreetingHeaderProps {
  userName?: string;
  greeting?: string;
  dateString?: string;
}

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({
  userName = 'Abdalla',
  greeting = 'Good morning',
  dateString = 'Saturday, November 14, 2026'
}) => {
  return (
    <div
      data-testid="greeting-header"
      className="w-full flex flex-col items-center text-center mb-3.5 select-none"
    >
      <h1 className="text-[36px] font-semibold text-[#F4F4F5] tracking-[-0.03em] leading-[1.1]">
        {greeting}, {userName}
      </h1>
      <p className="text-[12.5px] text-[#71717A] mt-1 font-normal">
        {dateString}
      </p>
    </div>
  );
};
