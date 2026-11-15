import React from 'react';

interface CornerIconProps {
  className?: string;
}

/**
 * Outward-pointing corner brackets (image_77a883.png)
 * Top-right corner ┐ and bottom-left corner └ pointing outward.
 * Used for Default / Not Fullscreen state.
 */
export const CornerExpandIcon: React.FC<CornerIconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* Top-right outward corner ┐ */}
    <path d="M9.5 3.5H12.5V6.5" />
    {/* Bottom-left outward corner └ */}
    <path d="M3.5 9.5V12.5H6.5" />
  </svg>
);

/**
 * Inward-pointing corner brackets (image_77a881.png)
 * Top-right corner └ and bottom-left corner ┐ pointing inward toward the center.
 * Used for Active Fullscreen state.
 */
export const CornerCollapseIcon: React.FC<CornerIconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* Top-right inward corner └ */}
    <path d="M9 4V7H12" />
    {/* Bottom-left inward corner ┐ */}
    <path d="M4 9H7V12" />
  </svg>
);
