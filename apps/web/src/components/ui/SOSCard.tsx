import React, { useRef, useCallback } from 'react';

export interface SOSCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  enableSpotlight?: boolean;
  tier?: 1 | 2 | 3 | 4;
  interactive?: boolean;
  selected?: boolean;
}

export const SOSCard = React.forwardRef<HTMLDivElement, SOSCardProps>(
  (
    {
      children,
      className = '',
      innerClassName = '',
      enableSpotlight = true,
      interactive = true,
      selected = false,
      tier,
      onMouseMove,
      ...props
    },
    forwardedRef
  ) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleRef = useCallback(
      (node: HTMLDivElement | null) => {
        cardRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [forwardedRef]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (enableSpotlight) {
          const target = e.currentTarget;
          const rect = target.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          target.style.setProperty('--mouse-x', `${x}px`);
          target.style.setProperty('--mouse-y', `${y}px`);
        }
        onMouseMove?.(e);
      },
      [enableSpotlight, onMouseMove]
    );

    const tierClass = tier ? `animate-tier-${tier}` : '';
    const interactiveClass = interactive
      ? selected
        ? 'sos-card hover:-translate-y-[1px]'
        : 'sos-card hover:-translate-y-[1px] hover:border-[#2E2E34] hover:shadow-[0_4px_12px_rgba(0,0,0,0.16)]'
      : 'sos-card-static';
    const selectedClass = selected ? '!border-[#60A5FA] bg-[#60A5FA]/10' : '';

    return (
      <div
        ref={handleRef}
        onMouseMove={handleMouseMove}
        className={`group/card relative rounded-[12px] bg-[#111113] border border-[#1E1E22] transition-all duration-150 ease-out ${interactiveClass} ${tierClass} ${selectedClass} ${className}`}
        {...props}
      >
      {/* Subtle interior radial sheen (strictly single 1px outer container border) */}
      {enableSpotlight && !selected && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] z-10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(320px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(255, 255, 255, 0.02), transparent 70%)'
          }}
        />
      )}

      {/* Children Content Wrapper */}
      <div className={`relative z-10 w-full h-full rounded-[inherit] flex flex-col ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
});

SOSCard.displayName = 'SOSCard';
