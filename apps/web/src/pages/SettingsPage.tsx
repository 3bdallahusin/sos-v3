import React, { useEffect } from 'react';
import { SettingsLayout } from '../components/settings/SettingsLayout.js';
import { useSettingsStore } from '../stores/settings-store.js';

export const SettingsPage: React.FC = () => {
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <div data-testid="settings-page" className="flex-1 flex flex-col h-full overflow-hidden bg-[#080808]">
      <SettingsLayout />
    </div>
  );
};
