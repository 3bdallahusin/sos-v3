import React from 'react';
import { Clock, Coffee, Edit3, Trash2, Calendar } from 'lucide-react';
import { useTrackingStore } from '../../stores/tracking-store.js';
import { formatCompoundDuration } from '@sos/domain';
import { humanizeTitle } from '../../utils/formatters.js';

export const SessionDetailsModal: React.FC = () => {
  const {
    detailsModalSession,
    setDetailsModalSession,
    setEditModalSession,
    setDeleteModalSessionId
  } = useTrackingStore();

  if (!detailsModalSession) return null;

  const session = detailsModalSession;
  const isManual = session.isManual;
  const focusSec = session.actualFocusSeconds || session.durationSeconds || ((session.durationMinutes ?? 0) * 60);
  const breakSec = session.actualBreakSeconds || 0;
  const plannedMins = session.plannedDurationMinutes || Math.round(focusSec / 60);

  const parsedDate = (() => {
    if (session.date) {
      const parts = session.date.split('-');
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    if (session.actualStartTimestamp) return new Date(session.actualStartTimestamp);
    if (session.startTime) {
      const parsed = new Date(session.startTime);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  })();

  const dateFormatted = parsedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const timeWindow = (() => {
    if (session.plannedStartTime && session.plannedEndTime) {
      return `${session.plannedStartTime} - ${session.plannedEndTime}`;
    }
    if (session.actualStartTimestamp && session.actualEndTimestamp) {
      const s = new Date(session.actualStartTimestamp);
      const e = new Date(session.actualEndTimestamp);
      const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      return `${fmt(s)} - ${fmt(e)}`;
    }
    if (session.startTime && session.endTime) {
      const s = new Date(session.startTime);
      const e = new Date(session.endTime);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        return `${fmt(s)} - ${fmt(e)}`;
      }
    }
    return '--:--';
  })();

  return (
    <div
      data-testid="session-details-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
    >
      <div className="w-full max-w-md bg-[#111113] border border-[#1E1E22] rounded-[12px] p-6 flex flex-col gap-4 shadow-2xl animate-scale-up">
        {/* Centered Header: Session Title & Domain • Topic Subtitle (No top-right X) */}
        <div className="flex flex-col items-center justify-center text-center border-b border-[#1E1E22] pb-3 w-full">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-[#FAFAFA] font-sans text-center">{humanizeTitle(session.title)}</h3>
            {session.status === 'completed' ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Completed
              </span>
            ) : session.status === 'missed' ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Missed
              </span>
            ) : session.status === 'in_progress' ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                In Progress
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#161619] text-[#A1A1AA] border border-[#222226]">
                Planned
              </span>
            )}
            {isManual && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono bg-white/[0.04] text-[#71717A] border border-white/[0.06]">
                Manual
              </span>
            )}
          </div>
          <span className="text-xs text-[#A1A1AA] font-sans text-center">
            {session.domainName || session.fieldName || 'Computer Science'}
            {(session.topicName || session.subtitle || session.subjectName)
              ? ` • ${session.topicName || session.subtitle || session.subjectName}`
              : ''}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-lg bg-[#161619] border border-[#26262A] flex flex-col items-center justify-center text-center gap-1">
            <span className="text-[10px] uppercase font-mono text-[#71717A] flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-[#A1A1AA]" />
              Actual Focus
            </span>
            <span className="text-base font-mono font-bold text-white tabular-nums">
              {formatCompoundDuration(focusSec)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#161619] border border-[#26262A] flex flex-col items-center justify-center text-center gap-1">
            <span className="text-[10px] uppercase font-mono text-[#71717A] flex items-center justify-center gap-1">
              <Coffee className="w-3 h-3 text-[#A1A1AA]" />
              Break Time
            </span>
            <span className="text-base font-mono font-bold text-white tabular-nums">
              {formatCompoundDuration(breakSec)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#161619] border border-[#26262A] flex flex-col items-center justify-center text-center gap-1">
            <span className="text-[10px] uppercase font-mono text-[#71717A] flex items-center justify-center">
              Planned
            </span>
            <span className="text-base font-mono font-bold text-[#A1A1AA] tabular-nums">
              {formatCompoundDuration(plannedMins * 60)}
            </span>
          </div>
        </div>

        {/* Date and Window */}
        <div className="p-3 rounded-lg bg-[#161619] border border-[#26262A] flex items-center justify-between text-xs text-[#A1A1AA]">
          <div className="flex items-center gap-1.5 font-sans">
            <Calendar className="w-3.5 h-3.5 text-[#71717A]" />
            <span>{dateFormatted}</span>
          </div>
          <span className="font-mono text-[11px] text-[#FAFAFA] tabular-nums">
            {timeWindow}
          </span>
        </div>

        {/* Notes (if any) */}
        {session.notes && (
          <div className="p-3 rounded-lg bg-[#161619] border border-[#26262A] flex flex-col gap-1 text-xs">
            <span className="text-[10px] uppercase font-mono text-[#71717A]">Notes</span>
            <p className="text-[#D4D4D8] leading-relaxed font-sans">{session.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1E1E22]">
          <button
            type="button"
            onClick={() => {
              setDeleteModalSessionId(session.id);
            }}
            className="h-9 px-3.5 rounded-lg bg-[#18181C] border border-red-500/30 text-xs text-[#F87171] hover:bg-red-500/10 transition-all duration-150 ease-out flex items-center gap-1.5 cursor-pointer font-sans hover:scale-[1.02] active:scale-[0.98]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditModalSession(session);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#18181B] hover:bg-[#222226] border border-[#26262A] text-xs text-[#EDEDED] transition-all duration-150 ease-out flex items-center gap-1.5 cursor-pointer font-sans hover:scale-[1.02] active:scale-[0.98]"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setDetailsModalSession(null)}
              className="px-4 py-1.5 rounded-lg bg-[#EDEDED] text-[#0A0A0A] font-semibold text-xs hover:bg-white transition-all duration-150 ease-out cursor-pointer font-sans hover:scale-[1.02] active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
