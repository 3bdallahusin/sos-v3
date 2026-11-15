import React from 'react';

interface ResizeHandleProps {
  id: 'left' | 'right';
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  ariaLabel?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  id,
  isDragging,
  onMouseDown,
  onDoubleClick,
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
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className="w-[6px] -mx-[7px] relative h-full shrink-0 z-30 select-none cursor-col-resize bg-transparent"
    />
  );
};
