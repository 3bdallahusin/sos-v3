import React, { useEffect } from 'react';
import { LeftRail } from './LeftRail.js';
import { CentralWorkspace } from './CentralWorkspace.js';
import { RightAiPanel } from './RightAiPanel.js';
import { useShellStore } from '../../stores/shell-store.js';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { toggleAiPanel, toggleRail, isAiPanelFullscreen } = useShellStore();

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

  return (
    <div
      data-testid="app-shell"
      className="h-screen w-screen p-2 bg-[#000000] flex gap-2 overflow-hidden select-none"
    >
      <LeftRail />
      {!isAiPanelFullscreen && <CentralWorkspace>{children}</CentralWorkspace>}
      <RightAiPanel />
    </div>
  );
};
