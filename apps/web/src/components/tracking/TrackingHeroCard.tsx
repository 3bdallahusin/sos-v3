import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Sliders, Coffee, Check, Square, X } from 'lucide-react';
import { useTrackingStore } from '../../stores/tracking-store.js';
import { SOSCard } from '../ui/SOSCard.js';

export const TrackingHeroCard: React.FC = () => {
  const {
    status,
    mode,
    sessionTitle,
    domainName,
    fieldName,
    topicName,
    subjectName,
    targetDurationSeconds,
    breakDurationSeconds,
    elapsedSeconds,
    remainingSeconds,
    breakRemainingSeconds,
    startSession,
    pauseSession,
    resumeSession,
    takeBreak,
    pauseBreak,
    resumeBreak,
    finishSession,
    abortSession,
    discardSession,
    resetSession,
    setSessionTitle,
    setSetupModalOpen
  } = useTrackingStore();

  const [confirmStopOpen, setConfirmStopOpen] = useState(false);

  // Format time digits (HH:mm:ss or mm:ss)
  const formatDigits = (totalSec: number): string => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const activeDisplayTime =
    status === 'break_running' || status === 'break_paused'
      ? formatDigits(breakRemainingSeconds)
      : status === 'completed'
      ? '00:00'
      : mode === 'countdown'
      ? formatDigits(remainingSeconds)
      : formatDigits(elapsedSeconds);

  // 190px Circular SVG progress calculations
  const CIRCUMFERENCE = 502.65;
  let strokeDashoffset = CIRCUMFERENCE;

  if (status === 'idle') {
    strokeDashoffset = CIRCUMFERENCE;
  } else if (status === 'break_running' || status === 'break_paused') {
    const frac = breakDurationSeconds > 0 ? breakRemainingSeconds / breakDurationSeconds : 0;
    strokeDashoffset = CIRCUMFERENCE * (1 - frac);
  } else if (mode === 'countdown') {
    const frac = targetDurationSeconds > 0 ? remainingSeconds / targetDurationSeconds : 0;
    strokeDashoffset = CIRCUMFERENCE * (1 - frac);
  } else {
    const frac = (elapsedSeconds % 3600) / 3600;
    strokeDashoffset = CIRCUMFERENCE * (1 - frac);
  }

  const breakMins = Math.round(breakDurationSeconds / 60);

  const handleStopClick = () => {
    if (elapsedSeconds < 60) {
      // 0-minute abort rule: If less than 1 minute, abort immediately without polluting stats
      abortSession();
      setConfirmStopOpen(false);
      return;
    }
    setConfirmStopOpen(true);
  };

  const handleFinishAndLog = async () => {
    setConfirmStopOpen(false);
    await finishSession();
  };

  const handleDiscard = async () => {
    setConfirmStopOpen(false);
    await discardSession();
  };

  return (
    <SOSCard
      tier={1}
      data-testid="focus-timer-card"
      className="w-full h-[340px] p-5 shadow-sm overflow-visible z-30"
      innerClassName="justify-between items-center h-full overflow-visible"
    >
      {/* 1. TOP HEADER: Centered Title + Domain • Topic Subtitle */}
      <div className="w-full flex flex-col items-center justify-center min-w-0 px-4 pt-0.5 relative z-40">
        <div className="w-full text-center flex items-center justify-center">
          <input
            type="text"
            data-testid="session-title-input"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            placeholder="Focus Session"
            className="w-[88%] mx-auto bg-transparent border-none outline-none ring-0 focus:ring-0 p-0 m-0 text-lg font-semibold text-zinc-100 text-center cursor-text hover:text-white transition-colors placeholder:text-zinc-500"
          />
        </div>

        {/* Subtitle: Domain • Topic */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-[#A1A1AA] text-center mt-1 font-normal tracking-normal max-w-full truncate px-2">
          <span className="truncate">{domainName || fieldName || 'General'}</span>
          <span className="text-[#52525B] select-none">•</span>
          <span className="truncate">{topicName || subjectName || 'Study'}</span>
        </div>
      </div>

      {/* 2. CENTER: 190px Circular SVG Progress Ring with Centered Text */}
      <div className="relative w-[190px] h-[190px] flex items-center justify-center my-auto">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 190 190">
          <circle
            cx="95"
            cy="95"
            r="80"
            fill="transparent"
            stroke="#1E1E22"
            strokeWidth="6"
          />
          {status !== 'idle' && (
            <circle
              cx="95"
              cy="95"
              r="80"
              fill="transparent"
              stroke="#60A5FA"
              strokeWidth="6"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          )}
        </svg>

        {/* Center Text Layout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#71717A] mb-0.5 font-medium">
            {status === 'break_running' || status === 'break_paused' ? 'BREAK' : mode === 'stopwatch' ? 'STOPWATCH' : 'FOCUS'}
          </span>
          <span
            data-testid="timer-display-digits"
            className="text-[32px] leading-tight font-bold font-mono text-[#EDEDED] tracking-tight tabular-nums"
          >
            {activeDisplayTime}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#161619] text-xs font-mono text-[#A1A1AA] border border-[#222226] mt-1.5 shadow-2xs">
            Break: {breakMins}m
          </span>
        </div>
      </div>

      {/* 3. BOTTOM ACTIONS: Equal-height side-by-side buttons */}
      <div className="w-full relative pt-1">
        {confirmStopOpen ? (
          <div className="w-full flex items-center justify-between gap-2 p-1 bg-[#141416] border border-[#222226] rounded-xl animate-in fade-in duration-150">
            <span className="text-[11px] text-[#A1A1AA] pl-2 font-medium">End session?</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleFinishAndLog}
                className="h-7 px-2.5 rounded-lg bg-[#60A5FA] text-black font-semibold text-xs hover:bg-[#7DB5FA] transition-colors cursor-pointer"
              >
                Finish & Log
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="h-7 px-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-medium text-xs hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => setConfirmStopOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1E1E22] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full grid grid-cols-2 gap-2.5">
            {status === 'idle' && (
              <>
                <button
                  type="button"
                  data-testid="start-timer-btn"
                  onClick={() => startSession()}
                  className="h-9 px-4 rounded-xl bg-[#EDEDED] hover:bg-white text-[#080808] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-[#080808]" />
                  <span>Start Focus</span>
                </button>
                <button
                  type="button"
                  data-testid="timer-settings-btn"
                  onClick={() => setSetupModalOpen(true)}
                  className="h-9 px-4 rounded-xl bg-[#161619] hover:bg-[#222226] border border-[#222226] text-[#EDEDED] font-medium text-xs flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>Settings</span>
                </button>
              </>
            )}

            {status === 'running' && (
              <>
                <button
                  type="button"
                  data-testid="pause-timer-btn"
                  onClick={pauseSession}
                  className="h-9 px-4 rounded-xl bg-[#EDEDED] hover:bg-white text-[#080808] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-[#080808]" />
                  <span>Pause</span>
                </button>
                <button
                  type="button"
                  data-testid="finish-timer-btn"
                  onClick={handleStopClick}
                  className="h-9 px-4 rounded-xl bg-[#161619] hover:bg-[#222226] border border-[#222226] text-[#EDEDED] font-medium text-xs flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              </>
            )}

            {status === 'paused' && (
              <>
                <button
                  type="button"
                  data-testid="resume-timer-btn"
                  onClick={resumeSession}
                  className="h-9 px-4 rounded-xl bg-[#EDEDED] hover:bg-white text-[#080808] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-[#080808]" />
                  <span>Resume</span>
                </button>
                <button
                  type="button"
                  data-testid="finish-timer-btn"
                  onClick={handleStopClick}
                  className="h-9 px-4 rounded-xl bg-[#161619] hover:bg-[#222226] border border-[#222226] text-[#EDEDED] font-medium text-xs flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              </>
            )}

            {status === 'completed' && (
              <>
                <button
                  type="button"
                  onClick={() => takeBreak()}
                  className="h-9 px-4 rounded-xl bg-[#EDEDED] hover:bg-white text-[#080808] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Start Break</span>
                </button>
                <button
                  type="button"
                  data-testid="finish-timer-btn"
                  onClick={finishSession}
                  className="h-9 px-4 rounded-xl bg-[#161619] hover:bg-[#222226] border border-[#222226] text-[#EDEDED] font-medium text-xs flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Finish & Log</span>
                </button>
              </>
            )}

            {status === 'break_running' && (
              <>
                <button
                  type="button"
                  onClick={pauseBreak}
                  className="h-9 px-4 rounded-xl bg-[#EDEDED] hover:bg-white text-[#080808] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-[#080808]" />
                  <span>Pause Break</span>
                </button>
                <button
                  type="button"
                  onClick={resetSession}
                  className="h-9 px-4 rounded-xl bg-[#161619] hover:bg-[#222226] border border-[#222226] text-[#EDEDED] font-medium text-xs flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>End Break</span>
                </button>
              </>
            )}

            {status === 'break_paused' && (
              <>
                <button
                  type="button"
                  onClick={resumeBreak}
                  className="h-9 px-4 rounded-xl bg-[#EDEDED] hover:bg-white text-[#080808] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-[#080808]" />
                  <span>Resume Break</span>
                </button>
                <button
                  type="button"
                  onClick={resetSession}
                  className="h-9 px-4 rounded-xl bg-[#161619] hover:bg-[#222226] border border-[#222226] text-[#EDEDED] font-medium text-xs flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>End Break</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </SOSCard>
  );
};
