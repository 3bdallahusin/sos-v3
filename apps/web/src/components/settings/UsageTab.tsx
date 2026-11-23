import React, { useState } from 'react';
import { Check, Sparkles, X, Zap } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store.js';
import { SOSCard } from '../ui/SOSCard.js';

export const UsageTab: React.FC = () => {
  const { settings, updateAccount } = useSettingsStore();
  const { usage, account } = settings;

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Real calculations
  const aiCreditsUsed = usage.aiCreditsUsed;
  const aiCreditsLimit = usage.aiCreditsLimit || 500;
  const aiCreditsAvailable = Math.max(0, aiCreditsLimit - aiCreditsUsed);
  const aiCreditsRemainingPct = Math.round((aiCreditsAvailable / aiCreditsLimit) * 100);
  const aiCreditsUsedPct = Math.min(100, Math.round((aiCreditsUsed / aiCreditsLimit) * 100));

  const storageUsedBytes = usage.storageBytesUsed || 0;
  const storageLimitBytes = usage.storageBytesLimit || 5 * 1024 * 1024 * 1024;
  const storageUsedGB = (storageUsedBytes / (1024 * 1024 * 1024)).toFixed(1);
  const storageLimitGB = (storageLimitBytes / (1024 * 1024 * 1024)).toFixed(1);
  const storageAvailableGB = Math.max(0, (storageLimitBytes - storageUsedBytes) / (1024 * 1024 * 1024)).toFixed(1);
  const storageCapacityPct = Math.min(100, Math.round((storageUsedBytes / storageLimitBytes) * 100));

  const handleSelectPlan = async (plan: 'Free' | 'Pro') => {
    await updateAccount({ plan });
    setUpgradeModalOpen(false);
  };

  return (
    <div data-testid="settings-usage-tab" className="w-full flex flex-col gap-6">
      {/* Header & Subtitle */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[20px] font-semibold text-[#F4F4F5] tracking-tight">
          Usage
        </h1>
        <p className="text-[13px] text-[#8E8E93]">
          Check your plan limits and storage usage
        </p>
      </div>

      {/* Card 1 — Your Plan */}
      <SOSCard className="flex flex-col shadow-sm">
        <div className="px-5 py-3.5 border-b border-[#1E1E22] bg-[#0C0C0E] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#F4F4F5] tracking-wide">
            Your Plan
          </span>
        </div>

        <div className="p-5 flex items-center justify-between text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-white tracking-tight">
              {account.plan === 'Pro' ? 'SOS Scholar Pro' : usage.planName}
            </span>
            <span className="text-[11px] text-[#8E8E93]">
              {account.plan === 'Pro' ? '$8 / month • 10,000 AI Credits & 50 GB storage' : `${usage.planPrice} • ${usage.planDescription}`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setUpgradeModalOpen(true)}
            className="h-8 px-4 rounded-lg bg-white text-black font-semibold text-xs hover:bg-[#E4E4E7] active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            Upgrade Plan
          </button>
        </div>
      </SOSCard>

      {/* Card 2 — Resource Limits */}
      <SOSCard className="flex flex-col shadow-sm">
        <div className="px-5 py-3.5 border-b border-[#1E1E22] bg-[#0C0C0E] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#F4F4F5] tracking-wide">
            Resource Limits
          </span>
        </div>

        <div className="p-5 flex flex-col gap-6 text-xs">
          {/* Row 1: Monthly AI Grounding & Tutor Credits */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-[#F4F4F5]">
                  Monthly AI Grounding & Tutor Credits
                </span>
                <span className="text-[11px] text-[#8E8E93] font-mono">
                  Resets in {usage.aiCreditsResetDays}d {usage.aiCreditsResetHours}h
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-white tnum">
                {aiCreditsRemainingPct}% remaining
              </span>
            </div>

            {/* Progress Bar with #60A5FA Fill */}
            <div className="w-full h-2 rounded-full bg-[#18181C] border border-[#27272A] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#60A5FA] transition-all duration-300 ease-out"
                style={{ width: `${aiCreditsUsedPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#8E8E93] font-mono">
              <span>{aiCreditsUsed} / {aiCreditsLimit} Credits used</span>
              <span>{aiCreditsAvailable} Available</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[#1F1F23]" />

          {/* Row 2: Library Cloud Storage */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-[#F4F4F5]">
                  Library Cloud Storage
                </span>
                <span className="text-[11px] text-[#8E8E93]">
                  PDFs, lectures, and audio files
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-white tnum">
                {storageUsedGB} GB / {storageLimitGB} GB used
              </span>
            </div>

            {/* Progress Bar with #60A5FA Fill */}
            <div className="w-full h-2 rounded-full bg-[#18181C] border border-[#27272A] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#60A5FA] transition-all duration-300 ease-out"
                style={{ width: `${storageCapacityPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#8E8E93] font-mono">
              <span>{storageCapacityPct}% capacity</span>
              <span>{storageAvailableGB} GB Available</span>
            </div>
          </div>
        </div>
      </SOSCard>

      {/* Card 3 — Usage Reset Activity */}
      <SOSCard className="flex flex-col shadow-sm">
        <div className="px-5 py-3.5 border-b border-[#1E1E22] bg-[#0C0C0E] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#F4F4F5] tracking-wide">
            Usage Reset Activity
          </span>
        </div>

        <div className="p-5 flex items-center justify-between text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-[#F4F4F5]">
              Available Resets: {usage.availableResets}
            </span>
            <span className="text-[11px] text-[#8E8E93]">
              No banked reset activity in the past 30 days
            </span>
          </div>

          <span className="font-mono text-[11px] text-[#71717A]">
            Monthly schedule active
          </span>
        </div>
      </SOSCard>

      {/* Upgrade Plan Modal */}
      {upgradeModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setUpgradeModalOpen(false)}
        >
          <SOSCard
            interactive={false}
            className="w-full max-w-[640px] p-6 shadow-2xl flex flex-col gap-5 text-xs animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E1E22] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#18181C] border border-[#27272A] flex items-center justify-center text-[#60A5FA]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Upgrade Study Plan</h3>
                  <p className="text-[11px] text-[#8E8E93]">Expand your AI credits and cloud library storage</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close Upgrade Plan"
                onClick={() => setUpgradeModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#18181C] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Free Tier */}
              <SOSCard
                className={`p-4 flex flex-col justify-between gap-3 ${
                  account.plan === 'Free' ? '!bg-[#18181C] !border-[#3F3F46]' : ''
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">SOS Free</span>
                    {account.plan === 'Free' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#27272A] text-[10px] text-[#A1A1AA] font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-bold text-white font-mono">$0<span className="text-xs font-normal text-[#8E8E93]"> / mo</span></span>
                  <ul className="flex flex-col gap-1.5 mt-2 text-[11px] text-[#A1A1AA]">
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#60A5FA]" /> 500 Monthly AI Credits</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#60A5FA]" /> 5.0 GB Local Cloud Storage</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#60A5FA]" /> Offline Spaced Repetition</li>
                  </ul>
                </div>
                {account.plan !== 'Free' && (
                  <button
                    type="button"
                    onClick={() => handleSelectPlan('Free')}
                    className="w-full h-8 rounded-lg bg-[#1E1E22] hover:bg-[#27272A] text-white font-medium transition-colors"
                  >
                    Downgrade to Free
                  </button>
                )}
              </SOSCard>

              {/* Scholar Pro Tier */}
              <SOSCard
                className={`p-4 flex flex-col justify-between gap-3 ${
                  account.plan === 'Pro' ? '!bg-[#18181C] !border-[#60A5FA]' : '!border-[#2E3B52]'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#60A5FA] flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Scholar Pro
                    </span>
                    {account.plan === 'Pro' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#1E293B] text-[10px] text-[#60A5FA] font-medium border border-[#3B82F6]/30">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-bold text-white font-mono">$8<span className="text-xs font-normal text-[#8E8E93]"> / mo</span></span>
                  <ul className="flex flex-col gap-1.5 mt-2 text-[11px] text-[#D4D4D8]">
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#60A5FA]" /> 10,000 Monthly AI Credits</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#60A5FA]" /> 50.0 GB Cloud Storage</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#60A5FA]" /> Claude 3.7 Sonnet & Extended Thinking</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#60A5FA]" /> Real-time cross-device sync</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectPlan('Pro')}
                  className="w-full h-8 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] text-black font-semibold transition-colors shadow-sm"
                >
                  {account.plan === 'Pro' ? 'Manage Subscription' : 'Upgrade to Scholar Pro'}
                </button>
              </SOSCard>
            </div>
          </SOSCard>
        </div>
      )}
    </div>
  );
};
