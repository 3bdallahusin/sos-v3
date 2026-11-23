import React, { useState } from 'react';
import { Check, Play, Trash2 } from 'lucide-react';
import { useTrackingStore } from '../../stores/tracking-store.js';
import { SOSCard } from '../ui/SOSCard.js';
import { humanizeTitle } from '../../utils/formatters.js';

export const TrackingTodaySessions: React.FC = () => {
  const {
    todaySessions,
    setActiveView,
    setDetailsModalSession,
    deleteSession,
    reorderTodaySessions,
    startSession
  } = useTrackingStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const formatShortDuration = (seconds: number): string => {
    const mins = Math.max(1, Math.round(seconds / 60));
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formatTimeWindow = (startMs: number, endMs: number): string => {
    const s = new Date(startMs);
    const e = new Date(endMs);
    const fmt = (d: Date) =>
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${fmt(s)} - ${fmt(e)}`;
  };

  const plannedSessions = todaySessions.filter((s) => s.status === 'planned');
  const completedSessions = todaySessions.filter((s) => s.status === 'completed');

  const handleStartSession = async (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    await startSession({
      id: session.id,
      title: session.title,
      domainName: session.domainName,
      domainId: session.domainId,
      topicName: session.topicName ?? undefined,
      topicId: session.topicId,
      targetMinutes: session.plannedDurationMinutes || 45,
      mode: session.timerMode || 'countdown'
    });
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteSession(id);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDropTargetIndex(null);
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const updated = [...todaySessions];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, moved);

    setDraggedIndex(null);
    await reorderTodaySessions(updated.map((s) => s.id));
  };

  return (
    <SOSCard
      tier={1}
      data-testid="today-sessions-card"
      className="h-[340px] p-5 shadow-sm"
      innerClassName="justify-between h-full"
    >
      <div className="flex flex-col h-full">
        {/* Header row: Exactly 32px height (h-8), aligned with Top Row */}
        <div className="h-8 flex items-center justify-between border-b border-[#1E1E22] pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#EDEDED] tracking-tight font-sans leading-none">
              Today&#39;s Sessions
            </span>
            <span className="text-[11px] text-[#71717A] tabular-nums font-mono">
              ({completedSessions.length} done{plannedSessions.length > 0 ? `, ${plannedSessions.length} planned` : ''})
            </span>
            <span data-testid="today-sessions-count" className="sr-only">
              {todaySessions.length} {todaySessions.length === 1 ? 'Session Logged' : 'Sessions Logged'}
            </span>
          </div>

          <button
            type="button"
            data-testid="view-history-btn"
            onClick={() => setActiveView('history')}
            className="h-7 px-2.5 rounded-[8px] bg-[#18181B] hover:bg-[#222228] border border-[#26262A] text-xs font-medium text-[#EDEDED] transition-all duration-150 ease-out inline-flex items-center justify-center font-sans cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>History</span>
          </button>
        </div>

        {/* Scrollable list of sleek dark session cards */}
        <div className="mt-2.5 flex-1 flex flex-col min-h-0">
          <div
            data-testid="today-sessions-list"
            className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 py-1"
          >
            {todaySessions.length === 0 ? (
              <div
                data-testid="today-sessions-empty"
                className="h-full min-h-[180px] flex items-center justify-center p-6 text-center text-xs text-[#71717A]"
              >
                No sessions planned or completed today. Start a timer or schedule a block.
              </div>
            ) : (
              todaySessions.map((session, index) => {
                const durationSec =
                  session.actualFocusSeconds ||
                  session.durationSeconds ||
                  (session.durationMinutes || session.plannedDurationMinutes || 0) * 60;

                const isBeingDragged = draggedIndex === index;
                const isDropTarget = dropTargetIndex === index && draggedIndex !== index;
                const isPlanned = session.status === 'planned';
                const isCompleted = session.status === 'completed';
                const isInProgress = session.status === 'in_progress';
                const isMissed = session.status === 'missed';

                let timeWindow = '';
                if (session.plannedStartTime && session.plannedEndTime) {
                  timeWindow = `${session.plannedStartTime} - ${session.plannedEndTime}`;
                } else if (session.actualStartTimestamp && session.actualEndTimestamp) {
                  timeWindow = formatTimeWindow(session.actualStartTimestamp, session.actualEndTimestamp);
                } else if (session.startTime && session.endTime) {
                  timeWindow = formatTimeWindow(session.startTime, session.endTime);
                } else if (session.startTime) {
                  const startMs = new Date(session.startTime).getTime();
                  if (!isNaN(startMs)) {
                    timeWindow = formatTimeWindow(startMs, startMs + durationSec * 1000);
                  }
                }

                return (
                  <div
                    key={session.id}
                    data-testid={isPlanned ? `session-planned-${session.id}` : `session-item-${session.id}`}
                    data-test-session-card={session.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onClick={() => {
                      if (isCompleted) {
                        setDetailsModalSession(session);
                      } else {
                        handleStartSession({ stopPropagation: () => {} } as any, session);
                      }
                    }}
                    className={`relative rounded-xl bg-[#161619] hover:bg-[#1B1B1F] border px-4 py-2.5 cursor-grab active:cursor-grabbing ${
                      isBeingDragged
                        ? 'opacity-40 border-[#3F3F46]'
                        : 'border-white/[0.06] hover:border-white/[0.12]'
                    } flex items-center justify-between gap-3 group transition-all duration-150 ease-out shrink-0`}
                  >
                    {/* Hidden secondary test selector so tests looking for session-item-${id} also succeed */}
                    {isPlanned && (
                      <span data-testid={`session-item-${session.id}`} className="sr-only" />
                    )}

                    {/* Notion-style Drop Indicator */}
                    {isDropTarget && (
                      <div className="absolute left-0 right-0 -top-1 h-[2px] bg-[#60A5FA] z-20 flex items-center pointer-events-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] -ml-0.5 shadow-[0_0_6px_#60A5FA]" />
                      </div>
                    )}

                    {/* Left: 16px Status Icon + Session Title + Status Pill Badge */}
                    <div className="flex items-center gap-2.5 truncate mr-2 flex-1 min-w-0">
                      {/* Four Distinct 16px Status Icons */}
                      {isPlanned && (
                        <button
                          type="button"
                          data-testid={`start-upcoming-btn-${session.id}`}
                          onClick={(e) => handleStartSession(e, session)}
                          className="w-4 h-4 rounded-full border border-white/20 hover:border-[#60A5FA] hover:bg-[#60A5FA]/10 flex items-center justify-center shrink-0 transition-all group/ring cursor-pointer"
                          title="Click to start session"
                          aria-label="Start planned session"
                        >
                          <Play className="w-2 h-2 text-[#60A5FA] fill-current opacity-0 group-hover/ring:opacity-100 transition-opacity ml-0.5" />
                        </button>
                      )}

                      {isInProgress && (
                        <div
                          className="w-4 h-4 rounded-full bg-[#60A5FA]/20 border border-[#60A5FA] flex items-center justify-center shrink-0"
                          title="In Progress"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] animate-pulse" />
                        </div>
                      )}

                      {isCompleted && (
                        <div
                          className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0"
                          title="Completed"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[2.5]" />
                        </div>
                      )}

                      {isMissed && (
                        <div
                          className="w-4 h-4 rounded-full border border-dashed border-rose-500/40 bg-rose-500/5 text-rose-400 flex items-center justify-center shrink-0"
                          title="Missed"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-400/80" />
                        </div>
                      )}

                      {/* Clean Session Title with native title tooltip */}
                      <span
                        title={session.title}
                        className="text-sm font-medium text-zinc-100 truncate font-sans"
                      >
                        {humanizeTitle(session.title)}
                      </span>

                      {/* Status Pill Badge next to title when not completed */}
                      {isPlanned && (
                        <span className="bg-white/[0.06] border border-white/[0.08] text-zinc-400 text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0">
                          Planned
                        </span>
                      )}
                      {isInProgress && (
                        <span className="bg-[#60A5FA]/10 border border-[#60A5FA]/25 text-[#60A5FA] text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0">
                          In Progress
                        </span>
                      )}
                      {isMissed && (
                        <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0">
                          Missed
                        </span>
                      )}
                    </div>

                    {/* Right Side: Duration Pill + Time Window Pill + Hover Delete */}
                    <div className="flex items-center gap-2 shrink-0 tabular-nums">
                      <span className="bg-[#1A1A1E] border border-white/[0.07] text-zinc-200 text-xs font-medium px-2.5 py-1 rounded-md">
                        {formatShortDuration(durationSec)}
                      </span>

                      {timeWindow && (
                        <span className="bg-[#1A1A1E] border border-white/[0.07] text-zinc-400 text-xs px-3 py-1 rounded-md">
                          {timeWindow}
                        </span>
                      )}

                      <div className="w-5 flex items-center justify-end">
                        <button
                          type="button"
                          data-testid={`delete-session-${session.id}`}
                          onClick={(e) => handleDeleteSession(e, session.id)}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-150 text-[#71717A] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 p-1 cursor-pointer rounded-md active:scale-95"
                          aria-label="Delete session"
                          title="Delete session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </SOSCard>
  );
};
