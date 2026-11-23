import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { useTrackingStore } from '../../stores/tracking-store.js';
import { useSettingsStore } from '../../stores/settings-store.js';
import { CreatableDomainTopicCombobox } from '../ui/CreatableDomainTopicCombobox.js';
import { SOSModalShell } from '../ui/SOSModalShell.js';

export const NewSessionSetupModal: React.FC = () => {
  const {
    setupModalOpen,
    sessionTitle,
    domainName,
    fieldName,
    topicName,
    subjectName,
    domainId,
    mode,
    targetDurationSeconds,
    breakDurationSeconds,
    calendarEventId,
    setSetupModalOpen,
    setLinkPlanModalOpen,
    setSessionTitle,
    setDomainAndTopic,
    setFieldAndSubject,
    setMode,
    setTargetMinutes,
    setBreakMinutes
  } = useTrackingStore();

  const focusTracking = useSettingsStore((s) => s.settings.general.focusTracking);
  const defaultFocusMins = focusTracking.focusMinutes ?? (
    focusTracking.defaultPomodoroInterval ? parseInt(focusTracking.defaultPomodoroInterval, 10) : 50
  );
  const defaultBreakMins = focusTracking.breakMinutes ?? 10;

  const [title, setTitle] = useState(sessionTitle);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(domainId);
  const [selectedDomain, setSelectedDomain] = useState(domainName || fieldName || 'General');
  const [selectedTopic, setSelectedTopic] = useState(topicName || subjectName || '');
  const [timerMode, setTimerMode] = useState(mode);
  const [focusMins, setFocusMins] = useState(
    targetDurationSeconds ? Math.round(targetDurationSeconds / 60) : defaultFocusMins
  );
  const [breakMins, setBreakMins] = useState(
    breakDurationSeconds ? Math.round(breakDurationSeconds / 60) : defaultBreakMins
  );

  useEffect(() => {
    if (setupModalOpen) {
      setTitle(sessionTitle);
      setSelectedDomainId(domainId);
      setSelectedDomain(domainName || fieldName || 'General');
      setSelectedTopic(topicName || subjectName || '');
      setTimerMode(mode);
      setFocusMins(targetDurationSeconds ? Math.round(targetDurationSeconds / 60) : defaultFocusMins);
      setBreakMins(breakDurationSeconds ? Math.round(breakDurationSeconds / 60) : defaultBreakMins);
    }
  }, [setupModalOpen, sessionTitle, domainName, fieldName, topicName, subjectName, domainId, mode, targetDurationSeconds, breakDurationSeconds, defaultFocusMins, defaultBreakMins]);

  if (!setupModalOpen) return null;

  const handleSave = () => {
    const trimmedTitle = title.trim() || 'Focus Session';
    setSessionTitle(trimmedTitle);
    setDomainAndTopic(selectedDomainId, selectedDomain, selectedTopic.trim() || undefined);
    setFieldAndSubject(selectedDomainId, selectedDomain, selectedTopic.trim() || undefined);
    setMode(timerMode);
    setTargetMinutes(focusMins);
    setBreakMinutes(breakMins);
    setSetupModalOpen(false);
  };

  return (
    <SOSModalShell
      isOpen={setupModalOpen}
      onClose={() => setSetupModalOpen(false)}
      title="Session Settings"
      description="Customize timer parameters, focus duration, and domain"
      maxWidth="max-w-md"
      footer={
        <>
          <button
            type="button"
            onClick={() => setSetupModalOpen(false)}
            className="h-8 px-4 rounded-xl text-xs font-medium text-[#8E8E93] hover:text-white hover:bg-[#1E1E22] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-8 px-5 rounded-xl text-xs font-semibold bg-[#FAFAFA] text-[#080808] hover:bg-white transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            Save Settings
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Title Input */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5 font-sans">
            Session Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Focus Session Title"
            className="w-full h-9 px-3 rounded-xl bg-[#141416] border border-[#222226] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#60A5FA] transition-colors"
          />
        </div>

        {/* Creatable Domain & Topic Combobox */}
        <CreatableDomainTopicCombobox
          selectedDomainName={selectedDomain}
          selectedTopicName={selectedTopic}
          onSelectDomain={(id, name) => {
            setSelectedDomainId(id);
            setSelectedDomain(name);
          }}
          onSelectTopic={(_id, name) => {
            setSelectedTopic(name);
          }}
        />

        {/* Mode Selector Segmented Control */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5 font-sans">
            Timer Mode
          </label>
          <div className="grid grid-cols-2 p-1 bg-[#141416] rounded-xl border border-[#222226] gap-1">
            <button
              type="button"
              onClick={() => setTimerMode('countdown')}
              className={`h-7 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                timerMode === 'countdown'
                  ? 'bg-[#1C1C1F] text-[#FAFAFA] shadow-xs'
                  : 'text-[#8E8E93] hover:text-[#FAFAFA]'
              }`}
            >
              Countdown
            </button>
            <button
              type="button"
              onClick={() => setTimerMode('stopwatch')}
              className={`h-7 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                timerMode === 'stopwatch'
                  ? 'bg-[#1C1C1F] text-[#FAFAFA] shadow-xs'
                  : 'text-[#8E8E93] hover:text-[#FAFAFA]'
              }`}
            >
              Stopwatch
            </button>
          </div>
        </div>

        {/* Duration Controls */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5 font-sans">
              Focus Duration
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFocusMins((prev) => Math.max(5, prev - 5))}
                className="w-8 h-8 rounded-lg bg-[#141416] border border-[#222226] hover:border-[#383840] text-[#FAFAFA] flex items-center justify-center text-xs font-semibold cursor-pointer active:scale-95"
              >
                -
              </button>
              <div className="flex-1 h-8 rounded-lg bg-[#141416] border border-[#222226] flex items-center justify-center font-mono text-xs font-medium text-[#FAFAFA]">
                {focusMins}m
              </div>
              <button
                type="button"
                onClick={() => setFocusMins((prev) => Math.min(180, prev + 5))}
                className="w-8 h-8 rounded-lg bg-[#141416] border border-[#222226] hover:border-[#383840] text-[#FAFAFA] flex items-center justify-center text-xs font-semibold cursor-pointer active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5 font-sans">
              Break Duration
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setBreakMins((prev) => Math.max(1, prev - 5))}
                className="w-8 h-8 rounded-lg bg-[#141416] border border-[#222226] hover:border-[#383840] text-[#FAFAFA] flex items-center justify-center text-xs font-semibold cursor-pointer active:scale-95"
              >
                -
              </button>
              <div className="flex-1 h-8 rounded-lg bg-[#141416] border border-[#222226] flex items-center justify-center font-mono text-xs font-medium text-[#FAFAFA]">
                {breakMins}m
              </div>
              <button
                type="button"
                onClick={() => setBreakMins((prev) => Math.min(60, prev + 5))}
                className="w-8 h-8 rounded-lg bg-[#141416] border border-[#222226] hover:border-[#383840] text-[#FAFAFA] flex items-center justify-center text-xs font-semibold cursor-pointer active:scale-95"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Link Calendar Block */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5 font-sans">
            Link Calendar Block (Optional)
          </label>
          <button
            type="button"
            onClick={() => {
              setSetupModalOpen(false);
              setLinkPlanModalOpen(true);
            }}
            className="w-full flex items-center justify-between h-9 px-3 rounded-xl bg-[#141416] border border-[#222226] hover:border-[#383840] text-[#8E8E93] hover:text-[#FAFAFA] transition-colors cursor-pointer text-xs"
          >
            <div className="flex items-center gap-2 truncate">
              <Calendar className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
              <span className="truncate">
                {calendarEventId ? 'Linked to Planned Event' : 'Choose scheduled study event...'}
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
          </button>
        </div>
      </div>
    </SOSModalShell>
  );
};
