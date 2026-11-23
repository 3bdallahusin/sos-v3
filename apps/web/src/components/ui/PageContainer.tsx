import React from 'react';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  'data-testid'?: string;
}

/**
 * PageContainer enforces the canonical layout wrapper standard extracted from Home.tsx:
 * - Outer: flex-1 overflow-y-auto custom-scrollbar px-4 py-4 md:px-8 md:py-6 flex flex-col items-center bg-[#09090B]
 * - Inner: w-[92%] max-w-[1360px] flex flex-col gap-4
 *
 * Mandatory single source of truth for all current and future views.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  innerClassName = '',
  'data-testid': testId,
  ...props
}) => {
  return (
    <div
      data-testid={testId}
      className={`flex-1 overflow-y-auto custom-scrollbar px-4 py-4 md:px-8 md:py-6 flex flex-col items-center bg-[#09090B] ${className}`}
      {...props}
    >
      <div className={`w-[92%] max-w-[1360px] flex flex-col gap-4 ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};
