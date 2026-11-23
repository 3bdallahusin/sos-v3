import React from 'react';
import { User, BarChart2, Sliders, Brain, Terminal } from 'lucide-react';
import type { SettingsTab } from '@sos/domain';
import { useSettingsStore } from '../../stores/settings-store.js';
import { AccountTab } from './AccountTab.js';
import { UsageTab } from './UsageTab.js';
import { GeneralTab } from './GeneralTab.js';
import { MemoryTab } from './MemoryTab.js';
import { SkillsTab } from './SkillsTab.js';
import { SkillEditorModal } from './SkillEditorModal.js';

interface NavItem {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SETTINGS_NAV_ITEMS: NavItem[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'usage', label: 'Usage', icon: BarChart2 },
  { id: 'general', label: 'General', icon: Sliders },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'skills', label: 'Skills', icon: Terminal }
];

export const SettingsLayout: React.FC = () => {
  const { activeTab, setActiveTab } = useSettingsStore();

  return (
    <div
      data-testid="settings-layout"
      className="flex-1 flex flex-row overflow-hidden w-full h-full relative"
    >
      {/* 1. Left Secondary Settings Rail (220px width, 1px border-r #1F1F23) */}
      <nav
        aria-label="Settings Secondary Navigation"
        className="w-[220px] border-r border-[#1F1F23] p-3 flex flex-col gap-1 text-xs shrink-0 bg-[#09090B] select-none"
      >
        {SETTINGS_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`settings-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`h-8 px-2.5 rounded-lg font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left w-full ${
                isActive
                  ? 'bg-[#1A1A1E] text-[#F4F4F5]'
                  : 'hover:bg-[#151518] text-[#8E8E93] hover:text-[#F4F4F5]'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-[#F4F4F5]' : 'text-[#71717A]'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 2. Settings Content Right */}
      <div
        data-testid="settings-content-pane"
        className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 md:px-8 md:py-6 flex flex-col items-center bg-[#080808]"
      >
        <div
          data-testid="settings-content-container"
          className="w-full max-w-4xl mx-auto flex flex-col gap-4 animate-tier-1"
        >
          {activeTab === 'account' && <AccountTab />}
          {activeTab === 'usage' && <UsageTab />}
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'memory' && <MemoryTab />}
          {activeTab === 'skills' && <SkillsTab />}

          <div className="h-10 shrink-0" />
        </div>
      </div>

      {/* Modal for creating / editing skills */}
      <SkillEditorModal />
    </div>
  );
};
