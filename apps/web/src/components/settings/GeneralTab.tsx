import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store.js';
import { CustomDropdown } from '../ui/CustomDropdown.js';
import { SOSCard } from '../ui/SOSCard.js';

export const GeneralTab: React.FC = () => {
  const { settings, updateGeneral } = useSettingsStore();
  const { general } = settings;

  const handleLanguageChange = (lang: string) => {
    updateGeneral({ appLanguage: lang });
  };

  const handleMilestoneNameChange = (name: string) => {
    updateGeneral({
      horizonBar: {
        ...general.horizonBar,
        milestoneName: name
      }
    });
  };

  const handleStartDateChange = (startDate: string) => {
    updateGeneral({
      horizonBar: {
        ...general.horizonBar,
        startDate
      }
    });
  };

  const handleEndDateChange = (endDate: string) => {
    updateGeneral({
      horizonBar: {
        ...general.horizonBar,
        endDate
      }
    });
  };

  const handlePresetChange = (preset: 'current_year' | 'semester' | 'custom') => {
    let startDate = general.horizonBar.startDate;
    let endDate = general.horizonBar.endDate;
    const now = new Date();
    const currentYear = now.getFullYear();

    if (preset === 'current_year') {
      startDate = `${currentYear}-01-01`;
      endDate = `${currentYear}-12-31`;
    } else if (preset === 'semester') {
      startDate = `${currentYear}-09-01`;
      endDate = `${currentYear + 1}-01-31`;
    }

    updateGeneral({
      horizonBar: {
        ...general.horizonBar,
        preset,
        startDate,
        endDate
      }
    });
  };

  const handleToggleAutoTracking = () => {
    updateGeneral({
      focusTracking: {
        ...general.focusTracking,
        automaticStudyTracking: !general.focusTracking.automaticStudyTracking
      }
    });
  };

  const currentFocusMinutes = general.focusTracking.focusMinutes ?? (
    general.focusTracking.defaultPomodoroInterval ? parseInt(general.focusTracking.defaultPomodoroInterval, 10) : 50
  );
  const currentBreakMinutes = general.focusTracking.breakMinutes ?? 10;

  const [focusDraft, setFocusDraft] = useState<string>(String(currentFocusMinutes));
  const [breakDraft, setBreakDraft] = useState<string>(String(currentBreakMinutes));

  useEffect(() => {
    setFocusDraft(String(currentFocusMinutes));
  }, [currentFocusMinutes]);

  useEffect(() => {
    setBreakDraft(String(currentBreakMinutes));
  }, [currentBreakMinutes]);

  const handleFocusChange = (valStr: string) => {
    setFocusDraft(valStr);
    const num = parseInt(valStr, 10);
    if (!isNaN(num) && num >= 1 && num <= 180) {
      const currentFt = useSettingsStore.getState().settings.general.focusTracking;
      const bMins = currentFt.breakMinutes ?? 10;
      updateGeneral({
        focusTracking: {
          ...currentFt,
          focusMinutes: num,
          breakMinutes: bMins,
          defaultPomodoroInterval: `${num}m / ${bMins}m`
        }
      });
    }
  };

  const handleFocusBlur = () => {
    let num = parseInt(focusDraft, 10);
    if (isNaN(num) || num < 1) num = 1;
    if (num > 180) num = 180;
    setFocusDraft(String(num));
    const currentFt = useSettingsStore.getState().settings.general.focusTracking;
    const bMins = currentFt.breakMinutes ?? 10;
    updateGeneral({
      focusTracking: {
        ...currentFt,
        focusMinutes: num,
        breakMinutes: bMins,
        defaultPomodoroInterval: `${num}m / ${bMins}m`
      }
    });
  };

  const handleBreakChange = (valStr: string) => {
    setBreakDraft(valStr);
    const num = parseInt(valStr, 10);
    if (!isNaN(num) && num >= 1 && num <= 60) {
      const currentFt = useSettingsStore.getState().settings.general.focusTracking;
      const fMins = currentFt.focusMinutes ?? 50;
      updateGeneral({
        focusTracking: {
          ...currentFt,
          focusMinutes: fMins,
          breakMinutes: num,
          defaultPomodoroInterval: `${fMins}m / ${num}m`
        }
      });
    }
  };

  const handleBreakBlur = () => {
    let num = parseInt(breakDraft, 10);
    if (isNaN(num) || num < 1) num = 1;
    if (num > 60) num = 60;
    setBreakDraft(String(num));
    const currentFt = useSettingsStore.getState().settings.general.focusTracking;
    const fMins = currentFt.focusMinutes ?? 50;
    updateGeneral({
      focusTracking: {
        ...currentFt,
        focusMinutes: fMins,
        breakMinutes: num,
        defaultPomodoroInterval: `${fMins}m / ${num}m`
      }
    });
  };

  const handleToggleChimes = () => {
    updateGeneral({
      soundMotion: {
        ...general.soundMotion,
        sessionCompletionChimes: !general.soundMotion.sessionCompletionChimes
      }
    });
  };

  const handleReducedMotionChange = (val: string) => {
    updateGeneral({
      soundMotion: {
        ...general.soundMotion,
        reducedMotion: val as 'os_default' | 'enabled' | 'disabled'
      }
    });
  };

  const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'العربية', label: 'العربية (Arabic)' },
    { value: 'Español', label: 'Español' },
    { value: 'Français', label: 'Français' }
  ];

  const motionOptions = [
    { value: 'os_default', label: 'OS Default' },
    { value: 'enabled', label: 'Enabled' },
    { value: 'disabled', label: 'Disabled' }
  ];

  return (
    <div data-testid="settings-general-tab" className="w-full flex flex-col gap-6">
      {/* Header & Subtitle */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[20px] font-semibold text-[#F4F4F5] tracking-tight">
          General
        </h1>
        <p className="text-[13px] text-[#8E8E93]">
          Customize language, timer, and app preferences
        </p>
      </div>

      {/* Card 1 — Interface & Controls */}
      <SOSCard className="flex flex-col shadow-sm">
        <div className="px-5 py-3.5 border-b border-[#1E1E22] bg-[#0C0C0E] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#F4F4F5] tracking-wide">
            Interface & Controls
          </span>
        </div>

        <div className="p-5 flex items-center justify-between text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-[#F4F4F5]">App Language</span>
            <span className="text-[11px] text-[#8E8E93]">
              Choose the language for menus and controls
            </span>
          </div>

          <CustomDropdown
            value={general.appLanguage}
            options={languageOptions}
            onChange={handleLanguageChange}
            minWidth="min-w-[168px]"
          />
        </div>

        <div className="p-5 flex items-center justify-between text-xs border-t border-[#1E1E22]">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-[#F4F4F5]">Week Starts On</span>
            <span className="text-[11px] text-[#8E8E93]">
              Choose whether calendar and tracking weeks start on Saturday or Monday
            </span>
          </div>

          <CustomDropdown
            value={general.weekStartDay || 'saturday'}
            options={[
              { value: 'saturday', label: 'Saturday (Default)' },
              { value: 'monday', label: 'Monday' }
            ]}
            onChange={(val) => updateGeneral({ weekStartDay: val as 'saturday' | 'monday' })}
            minWidth="min-w-[168px]"
          />
        </div>
      </SOSCard>

      {/* Card 2 — Horizon Bar with Presets in Header Right */}
      <SOSCard className="flex flex-col shadow-sm">
        <div className="px-5 py-3.5 border-b border-[#1E1E22] bg-[#0C0C0E] flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-[#F4F4F5] tracking-wide">
              Horizon Bar
            </span>
            <span className="text-[11px] text-[#8E8E93]">
              Define the active timeframe tracked on your Home screen.
            </span>
          </div>

          {/* Preset Segmented Pills in Card Header Right */}
          <div className="flex items-center gap-1 bg-[#141417] p-1 rounded-full border border-[#222226]">
            <button
              type="button"
              onClick={() => handlePresetChange('current_year')}
              className={`h-6 px-2.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                general.horizonBar.preset === 'current_year'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Current Year
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('semester')}
              className={`h-6 px-2.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                general.horizonBar.preset === 'semester'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Semester
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('custom')}
              className={`h-6 px-2.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                general.horizonBar.preset === 'custom'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* 3-Column Grid for Period Name, Start Date, End Date */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Milestone / Period Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-[#A1A1AA] text-[11px]">
              Period Name
            </label>
            <input
              type="text"
              value={general.horizonBar.milestoneName}
              onChange={(e) => handleMilestoneNameChange(e.target.value)}
              placeholder="e.g. Fall Semester 2026"
              className="h-9 px-3.5 rounded-lg bg-[#09090B] border border-[#222226] text-xs text-white focus:outline-none focus:border-[#3F3F46] transition-colors"
            />
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-[#A1A1AA] text-[11px]">
              Start Date
            </label>
            <div className="h-9 px-3 rounded-lg bg-[#09090B] border border-[#222226] flex items-center gap-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
              <input
                type="date"
                value={general.horizonBar.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="bg-transparent border-0 text-xs text-white p-0 focus:outline-none font-mono w-full"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-[#A1A1AA] text-[11px]">
              End Date
            </label>
            <div className="h-9 px-3 rounded-lg bg-[#09090B] border border-[#222226] flex items-center gap-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
              <input
                type="date"
                value={general.horizonBar.endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="bg-transparent border-0 text-xs text-white p-0 focus:outline-none font-mono w-full"
              />
            </div>
          </div>
        </div>
      </SOSCard>

      {/* Card 3 — Focus & Tracking Engine */}
      <SOSCard className="flex flex-col shadow-sm">
        <div className="px-5 py-3.5 border-b border-[#1E1E22] bg-[#0C0C0E] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#F4F4F5] tracking-wide">
            Focus & Tracking Engine
          </span>
        </div>

        <div className="divide-y divide-[#1E1E22] text-xs">
          {/* Automatic Background Study Tracking with #60A5FA Toggle */}
          <div className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[#F4F4F5]">
                Automatic Background Study Tracking
              </span>
              <span className="text-[11px] text-[#8E8E93]">
                Log active reading and viewing sessions automatically
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={general.focusTracking.automaticStudyTracking}
              onClick={handleToggleAutoTracking}
              className={`w-9 h-5 rounded-full transition-colors duration-150 ease-out relative cursor-pointer ${
                general.focusTracking.automaticStudyTracking ? 'bg-[#60A5FA]' : 'bg-[#27272A]'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full transition-transform duration-150 ease-out absolute top-[3px] ${
                  general.focusTracking.automaticStudyTracking
                    ? 'left-[19px] bg-white shadow-sm'
                    : 'left-[3px] bg-[#71717A]'
                }`}
              />
            </button>
          </div>

          {/* Default Pomodoro Interval with Dual Numeric Inputs */}
          <div className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[#F4F4F5]">
                Default Pomodoro Interval
              </span>
              <span className="text-[11px] text-[#8E8E93]">
                Standard deep-work session length
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Focus Input */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-[#A1A1AA]">Focus</span>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={focusDraft}
                    onChange={(e) => handleFocusChange(e.target.value)}
                    onBlur={handleFocusBlur}
                    data-testid="focus-minutes-input"
                    aria-label="Focus duration in minutes"
                    className="w-16 h-8 pl-2.5 pr-6 rounded-lg bg-[#141417] border border-[#222226] focus:border-[#3F3F46] hover:border-[#323238] text-xs text-[#FAFAFA] font-mono tabular-nums outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-2 text-[11px] font-mono text-[#71717A] pointer-events-none select-none">
                    m
                  </span>
                </div>
              </div>

              {/* Separator */}
              <span className="text-[#52525B] font-mono text-xs select-none">/</span>

              {/* Break Input */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-[#A1A1AA]">Break</span>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={breakDraft}
                    onChange={(e) => handleBreakChange(e.target.value)}
                    onBlur={handleBreakBlur}
                    data-testid="break-minutes-input"
                    aria-label="Break duration in minutes"
                    className="w-16 h-8 pl-2.5 pr-6 rounded-lg bg-[#141417] border border-[#222226] focus:border-[#3F3F46] hover:border-[#323238] text-xs text-[#FAFAFA] font-mono tabular-nums outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-2 text-[11px] font-mono text-[#71717A] pointer-events-none select-none">
                    m
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SOSCard>

      {/* Card 4 — Sound & Motion */}
      <SOSCard className="flex flex-col shadow-sm">
        <div className="px-5 py-3.5 border-b border-[#1E1E22] bg-[#0C0C0E] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#F4F4F5] tracking-wide">
            Sound & Motion
          </span>
        </div>

        <div className="divide-y divide-[#1E1E22] text-xs">
          {/* Session Completion Chimes with #60A5FA Toggle */}
          <div className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[#F4F4F5]">
                Session Completion Chimes
              </span>
              <span className="text-[11px] text-[#8E8E93]">
                Subtle auditory cue when a focus timer ends
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={general.soundMotion.sessionCompletionChimes}
              onClick={handleToggleChimes}
              className={`w-9 h-5 rounded-full transition-colors duration-150 ease-out relative cursor-pointer ${
                general.soundMotion.sessionCompletionChimes ? 'bg-[#60A5FA]' : 'bg-[#27272A]'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full transition-transform duration-150 ease-out absolute top-[3px] ${
                  general.soundMotion.sessionCompletionChimes
                    ? 'left-[19px] bg-white shadow-sm'
                    : 'left-[3px] bg-[#71717A]'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion with Custom OLED Dropdown */}
          <div className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[#F4F4F5]">Reduced Motion</span>
              <span className="text-[11px] text-[#8E8E93]">
                Minimize transitions for zero-distraction study
              </span>
            </div>

            <CustomDropdown
              value={general.soundMotion.reducedMotion}
              options={motionOptions}
              onChange={handleReducedMotionChange}
              minWidth="min-w-[168px]"
            />
          </div>
        </div>
      </SOSCard>
    </div>
  );
};
