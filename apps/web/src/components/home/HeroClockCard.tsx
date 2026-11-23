import React, { useEffect, useRef, useState } from 'react';
import { SOSCard } from '../ui/SOSCard.js';

export const HeroClockCard: React.FC = () => {
  const hourHandRef = useRef<SVGLineElement>(null);
  const minHandRef = useRef<SVGLineElement>(null);
  const secHandRef = useRef<SVGLineElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [digitalTime, setDigitalTime] = useState(() =>
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date())
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setDigitalTime(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(new Date())
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateHands = () => {
      const now = new Date();
      const hours = now.getHours() % 12;
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const millis = now.getMilliseconds();

      const secDeg = (seconds + millis / 1000) * 6;
      const minDeg = (minutes + seconds / 60) * 6;
      const hourDeg = (hours + minutes / 60) * 30;

      if (secHandRef.current) {
        secHandRef.current.setAttribute('transform', `rotate(${secDeg} 54 54)`);
      }
      if (minHandRef.current) {
        minHandRef.current.setAttribute('transform', `rotate(${minDeg} 54 54)`);
      }
      if (hourHandRef.current) {
        hourHandRef.current.setAttribute('transform', `rotate(${hourDeg} 54 54)`);
      }

      animFrameIdRef.current = requestAnimationFrame(updateHands);
    };

    animFrameIdRef.current = requestAnimationFrame(updateHands);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // Format dynamically via Intl European date formatter
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <SOSCard
      data-testid="hero-clock-card"
      className="lg:col-span-1 h-[176px] p-4"
      innerClassName="flex flex-col items-center justify-center text-center h-full"
    >
      {/* Precision Analog Clock (88px x 88px) */}
      <div className="relative w-[88px] h-[88px] rounded-full bg-[#080808] border border-[#27272A] flex items-center justify-center shadow-inner shrink-0">
        <svg
          data-testid="analog-clock-svg"
          className="w-[88px] h-[88px]"
          viewBox="0 0 108 108"
        >
          {/* 12 Radial Ticks */}
          {/* 12 o'clock */}
          <line x1="54" y1="7" x2="54" y2="14" stroke="#A1A1AA" strokeWidth="1.75" strokeLinecap="round" />
          {/* 1 o'clock */}
          <line x1="77.5" y1="13.3" x2="74" y2="19.3" stroke="#3F3F46" strokeWidth="1.25" strokeLinecap="round" />
          {/* 2 o'clock */}
          <line x1="94.7" y1="30.5" x2="88.7" y2="34" stroke="#3F3F46" strokeWidth="1.25" strokeLinecap="round" />
          {/* 3 o'clock */}
          <line x1="101" y1="54" x2="94" y2="54" stroke="#A1A1AA" strokeWidth="1.75" strokeLinecap="round" />
          {/* 4 o'clock */}
          <line x1="94.7" y1="77.5" x2="88.7" y2="74" stroke="#3F3F46" strokeWidth="1.25" strokeLinecap="round" />
          {/* 5 o'clock */}
          <line x1="77.5" y1="94.7" x2="74" y2="88.7" stroke="#3F3F46" strokeWidth="1.25" strokeLinecap="round" />
          {/* 6 o'clock */}
          <line x1="54" y1="101" x2="54" y2="94" stroke="#A1A1AA" strokeWidth="1.75" strokeLinecap="round" />
          {/* 7 o'clock */}
          <line x1="30.5" y1="94.7" x2="34" y2="88.7" stroke="#3F3F46" strokeWidth="1.25" strokeLinecap="round" />
          {/* 8 o'clock */}
          <line x1="13.3" y1="77.5" x2="19.3" y2="74" stroke="#3F3F46" strokeWidth="1.25" strokeLinecap="round" />
          {/* 9 o'clock */}
          <line x1="7" y1="54" x2="14" y2="54" stroke="#A1A1AA" strokeWidth="1.75" strokeLinecap="round" />
          {/* 10 o'clock */}
          <line x1="13.3" y1="30.5" x2="19.3" y2="34" stroke="#3F3F46" strokeWidth="1.25" strokeLinecap="round" />
          {/* 11 o'clock */}
          <line x1="30.5" y1="13.3" x2="34" y2="19.3" stroke="#3F3F46" strokeWidth="1.25" strokeLinecap="round" />

          {/* Hands */}
          <line
            ref={hourHandRef}
            x1="54"
            y1="54"
            x2="54"
            y2="30"
            stroke="#EDEDED"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            ref={minHandRef}
            x1="54"
            y1="54"
            x2="54"
            y2="20"
            stroke="#D4D4D8"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <line
            ref={secHandRef}
            x1="54"
            y1="58"
            x2="54"
            y2="16"
            stroke="#EDEDED"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <circle cx="54" cy="54" r="2.5" fill="#EDEDED" />
        </svg>
      </div>

      {/* Synchronized Live Digital Clock Readout */}
      <div
        data-testid="digital-time-readout"
        className="mt-2 text-[13px] font-mono font-medium text-[#EDEDED] tabular-nums tracking-wide"
      >
        {digitalTime}
      </div>

      {/* European Date String */}
      <span
        data-testid="european-date"
        className="text-[11.5px] font-mono text-[#A1A1AA] tracking-tight mt-0.5"
      >
        {formattedDate}
      </span>
    </SOSCard>
  );
};
