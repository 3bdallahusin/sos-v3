import React from 'react';

interface GreetingHeaderProps {
  userName?: string;
  greeting?: string;
  dateString?: string;
}

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({
  userName,
  greeting,
  dateString
}) => {
  // Compute greeting dynamically based on local time of day
  const getGreetingText = (): string => {
    if (greeting) return greeting;
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Derive date dynamically from the user's local timezone
  const formattedDate =
    dateString ||
    new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date());

  const currentGreeting = getGreetingText();
  const headingText = userName ? `${currentGreeting}, ${userName}` : currentGreeting;

  return (
    <div
      data-testid="greeting-header"
      className="w-full flex flex-col items-center text-center mb-3.5 select-none"
    >
      <h1
        data-testid="greeting-heading"
        className="text-[36px] font-semibold text-[#F4F4F5] tracking-[-0.03em] leading-[1.1]"
      >
        {headingText}
      </h1>
      <p
        data-testid="greeting-date"
        className="text-[12.5px] text-[#71717A] mt-1 font-normal"
      >
        {formattedDate}
      </p>
    </div>
  );
};
