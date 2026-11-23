import React, { useState } from 'react';
import { X, Check, Trash2, Clock, Coffee } from 'lucide-react';
import { useTrackingStore } from '../../stores/tracking-store.js';
import { formatCompoundDuration } from '@sos/domain';

export const EndSessionSummaryModal: React.FC = () => {
  const {
    endSummaryModalOpen,
    summarySession,
    sessionTitle,
    fieldName,
    subjectName,
    startTime,
    currentPauseStart,
    focusIntervals,
    breakIntervals,
    discardSession,
    saveFinishedSession
  } = useTrackingStore();

  const [notes, setNotes] = useState('');

  if (!endSummaryModalOpen) return null;

  const now = currentPauseStart ?? Date.now();
  const sessionStart = summarySession?.startTime ?? startTime ?? now;
  const sessionEnd = summarySession?.endTime ?? now;

  let focusSeconds = summarySession?.actualFocusSeconds;
  let breakSeconds = summarySession?.actualBreakSeconds ?? 0;

  if (focusSeconds === undefined) {
    let actualFocusMs = 0;
    for (const f of focusIntervals) {
      const end = f.endedAt ?? now;
      actualFocusMs += Math.max(0, end - f.startedAt);
    }
    let actualBreakMs = 0;
    for (const b of breakIntervals) {
      const end = b.endedAt ?? now;
      actualBreakMs += Math.max(0, end - b.startedAt);
    }
    focusSeconds = Math.max(1, Math.floor(actualFocusMs / 1000));
    breakSeconds = Math.floor(actualBreakMs / 1000);
  }

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const displayTitle = summarySession?.title || sessionTitle;
  const displayField = summarySession?.fieldName || fieldName;
  const displaySubject = summarySession?.subjectName || summarySession?.subtitle || subjectName;

  return (
    <div
      data-testid="end-session-summary-modal"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="w-full max-w-md bg-[#111113] border border-[#27272A] rounded-[12px] p-6 flex flex-col gap-4 shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E1E22] pb-3">
          <h3 className="text-sm font-semibold text-[#FAFAFA] tracking-tight">
            End Session Summary
          </h3>
          <button
            type="button"
            onClick={discardSession}
            className="text-[#71717A] hover:text-[#FAFAFA] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title and context */}
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold text-[#FAFAFA]">{displayTitle}</span>
          <span className="text-xs text-[#71717A]">
            {displayField}
            {displaySubject ? ` • ${displaySubject}` : ''}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-[#1C1C21] border border-[#27272A] flex flex-col gap-1">
            <span className="text-[10px] uppercase font-mono text-[#71717A] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#60A5FA]" />
              Focus Time
            </span>
            <span className="text-base font-mono font-bold text-white tabular-nums">
              {formatCompoundDuration(focusSeconds)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#1C1C21] border border-[#27272A] flex flex-col gap-1">
            <span className="text-[10px] uppercase font-mono text-[#71717A] flex items-center gap-1">
              <Coffee className="w-3 h-3 text-[#A1A1AA]" />
              Break Time
            </span>
            <span className="text-base font-mono font-bold text-white tabular-nums">
              {formatCompoundDuration(breakSeconds)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#1C1C21] border border-[#27272A] flex flex-col gap-1">
            <span className="text-[10px] uppercase font-mono text-[#71717A]">Window</span>
            <span className="text-xs font-mono font-semibold text-[#A1A1AA] pt-1">
              {formatTime(sessionStart)} - {formatTime(sessionEnd)}
            </span>
          </div>
        </div>

        {/* Notes Input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#A1A1AA] font-medium">Session Notes & Takeaways</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add quick notes or key takeaways from this focus block..."
            className="w-full bg-[#1C1C21] border border-[#27272A] focus:border-[#3F3F46] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] placeholder-[#71717A] focus:outline-none resize-none transition-colors"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-[#222226]">
          <button
            type="button"
            onClick={discardSession}
            className="px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard</span>
          </button>

          <button
            type="button"
            data-testid="save-session-btn"
            onClick={() => saveFinishedSession(notes)}
            className="px-5 py-2 rounded-xl bg-[#FAFAFA] text-[#09090B] font-semibold text-xs hover:bg-[#E4E4E7] shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
