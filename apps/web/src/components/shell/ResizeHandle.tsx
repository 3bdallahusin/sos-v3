import React from 'react';

interface ResizeHandleProps {
  id: 'left' | 'right';
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  title?: string;
  ariaLabel?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  id,
  isDragging,
  onMouseDown,
  onDoubleClick,
  title,
  ariaLabel
}) => {
  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label={
        ariaLabel ??
        `Resize ${id === 'left' ? 'navigation rail' : 'AI assistant panel'}`
      }
      data-testid={`resize-handle-${id}`}
      data-dragging={isDragging}
      title={title}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className="w-[6px] -mx-[7px] relative h-full shrink-0 z-30 select-none group flex items-center justify-center cursor-col-resize"
    >
      {/* 1.5px vertical hairline indicator */}
      <div
        className={`w-[1.5px] h-[calc(100%-32px)] rounded-full transition-colors duration-150 pointer-events-none ${
          isDragging
            ? 'bg-[#A1A1AA] opacity-100'
            : 'bg-[#3F3F46] opacity-0 group-hover:opacity-100'
        }`}
      />
    </div>
  );
};
