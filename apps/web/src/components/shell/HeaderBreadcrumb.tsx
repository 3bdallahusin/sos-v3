import React from 'react';
import { ArrowLeft } from 'lucide-react';

export interface BreadcrumbSegment {
  label: string;
  onClick?: () => void;
  testId?: string;
}

export interface HeaderBreadcrumbProps {
  onBack?: () => void;
  backAriaLabel?: string;
  backTitle?: string;
  backTestId?: string;
  segments: BreadcrumbSegment[];
  testId?: string;
  className?: string;
}

export const HeaderBreadcrumb: React.FC<HeaderBreadcrumbProps> = ({
  onBack,
  backAriaLabel = 'Go back',
  backTitle = 'Go back',
  backTestId,
  segments,
  testId,
  className = ''
}) => {
  return (
    <div
      className={`flex items-center gap-2.5 flex-1 min-w-0 pl-1 ${className}`}
      data-testid={testId}
    >
      {/* Circular Tactile Back Button (32px x 32px, Apple/Linear style) */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={backAriaLabel}
          title={backTitle}
          data-testid={backTestId}
          className="w-8 h-8 rounded-full bg-[#141417] border border-[#27272A] hover:bg-[#1F1F23] hover:border-[#3F3F46] active:scale-[0.95] transition-all duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] flex items-center justify-center text-[#A1A1AA] hover:text-[#FFFFFF] cursor-pointer shrink-0 shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        </button>
      )}

      {/* Subtle Breadcrumb: Parent / [Child] */}
      <div className="flex items-center gap-1.5 text-[13px] font-medium select-none overflow-hidden">
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1;

          return (
            <React.Fragment key={idx}>
              {isLast ? (
                <span
                  data-testid={seg.testId}
                  className="text-[#FFFFFF] tracking-tight truncate max-w-[280px]"
                >
                  {seg.label}
                </span>
              ) : (
                <>
                  {seg.onClick ? (
                    <button
                      type="button"
                      onClick={seg.onClick}
                      data-testid={seg.testId}
                      className="text-[#71717A] hover:text-[#FAFAFA] transition-colors cursor-pointer shrink-0"
                    >
                      {seg.label}
                    </button>
                  ) : (
                    <span
                      data-testid={seg.testId}
                      className="text-[#71717A] shrink-0"
                    >
                      {seg.label}
                    </span>
                  )}
                  <span className="text-[#52525B] font-mono text-[11px] shrink-0">/</span>
                </>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
