import React, { useState, useEffect, useCallback } from 'react';
import { LeftRail } from './LeftRail.js';
import { CentralWorkspace } from './CentralWorkspace.js';
import { RightAiPanel } from './RightAiPanel.js';
import { ResizeHandle } from './ResizeHandle.js';
import {
  useShellStore,
  MIN_LEFT_RAIL_WIDTH,
  MAX_LEFT_RAIL_WIDTH,
  COLLAPSE_LEFT_RAIL_THRESHOLD,
  COLLAPSED_LEFT_RAIL_WIDTH,
  MIN_RIGHT_AI_WIDTH,
  MAX_RIGHT_AI_WIDTH,
  MIN_CENTRAL_WORKSPACE_WIDTH
} from '../../stores/shell-store.js';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const {
    toggleAiPanel,
    toggleRail,
    isAiPanelFullscreen,
    railExpanded,
    aiPanelOpen,
    leftRailWidth,
    rightAiPanelWidth,
    setLeftRailWidth,
    setRightAiPanelWidth,
    resetLeftRailWidth,
    resetRightAiPanelWidth,
    setRailExpanded,
    setIsDragging
  } = useShellStore();

  const [activeDragHandle, setActiveDragHandle] = useState<'left' | 'right' | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Right AI panel on ⌘J / Ctrl+J
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        toggleAiPanel();
      }
      // Toggle Left Navigation rail on ⌘B / Ctrl+B
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleRail();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAiPanel, toggleRail]);

  const handleStartDrag = useCallback(
    (handle: 'left' | 'right', e: React.MouseEvent) => {
      e.preventDefault();
      setActiveDragHandle(handle);
      setIsDragging(true);
    },
    [setIsDragging]
  );

  useEffect(() => {
    if (!activeDragHandle) return;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      if (activeDragHandle === 'left') {
        const rawWidth = e.clientX - 8;
        if (rawWidth < COLLAPSE_LEFT_RAIL_THRESHOLD) {
          setRailExpanded(false);
        } else {
          const currentAiWidth =
            aiPanelOpen && !isAiPanelFullscreen ? rightAiPanelWidth : 0;
          const totalChrome =
            16 + (aiPanelOpen && !isAiPanelFullscreen ? 16 : 8);
          const maxAvailableForLeft =
            window.innerWidth -
            totalChrome -
            MIN_CENTRAL_WORKSPACE_WIDTH -
            currentAiWidth;
          const maxBound = Math.min(
            MAX_LEFT_RAIL_WIDTH,
            Math.max(MIN_LEFT_RAIL_WIDTH, maxAvailableForLeft)
          );
          const clamped = Math.max(
            MIN_LEFT_RAIL_WIDTH,
            Math.min(maxBound, rawWidth)
          );
          if (!railExpanded) {
            setRailExpanded(true);
          }
          setLeftRailWidth(clamped);
        }
      } else if (activeDragHandle === 'right') {
        const rawWidth = window.innerWidth - 8 - e.clientX;
        const currentRailWidth = railExpanded
          ? leftRailWidth
          : COLLAPSED_LEFT_RAIL_WIDTH;
        const totalChrome = 32;
        const maxAvailableForRight =
          window.innerWidth -
          totalChrome -
          MIN_CENTRAL_WORKSPACE_WIDTH -
          currentRailWidth;
        const maxBound = Math.min(
          MAX_RIGHT_AI_WIDTH,
          Math.max(MIN_RIGHT_AI_WIDTH, maxAvailableForRight)
        );
        const clamped = Math.max(
          MIN_RIGHT_AI_WIDTH,
          Math.min(maxBound, rawWidth)
        );
        setRightAiPanelWidth(clamped);
      }
    };

    const handleMouseUp = () => {
      setActiveDragHandle(null);
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [
    activeDragHandle,
    railExpanded,
    aiPanelOpen,
    isAiPanelFullscreen,
    leftRailWidth,
    rightAiPanelWidth,
    setRailExpanded,
    setLeftRailWidth,
    setRightAiPanelWidth,
    setIsDragging
  ]);

  return (
    <div
      data-testid="app-shell"
      className={`h-screen w-screen p-2 bg-[#000000] flex gap-2 overflow-hidden select-none ${
        activeDragHandle ? 'cursor-col-resize' : ''
      }`}
    >
      <LeftRail />

      {!isAiPanelFullscreen && (
        <ResizeHandle
          id="left"
          isDragging={activeDragHandle === 'left'}
          onMouseDown={(e) => handleStartDrag('left', e)}
          onDoubleClick={resetLeftRailWidth}
        />
      )}

      {!isAiPanelFullscreen && <CentralWorkspace>{children}</CentralWorkspace>}

      {aiPanelOpen && !isAiPanelFullscreen && (
        <ResizeHandle
          id="right"
          isDragging={activeDragHandle === 'right'}
          onMouseDown={(e) => handleStartDrag('right', e)}
          onDoubleClick={resetRightAiPanelWidth}
        />
      )}

      <RightAiPanel />
    </div>
  );
};
