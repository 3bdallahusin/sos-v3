import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, Check } from 'lucide-react';
import { useTrackingStore } from '../../stores/tracking-store.js';
import { loadCalendarEvents } from '@sos/persistence';
import type { CalendarEvent } from '@sos/domain';

export const LinkCalendarPlanModal: React.FC = () => {
  const {
    linkPlanModalOpen,
    calendarEventId,
    setLinkPlanModalOpen,
    setSetupModalOpen,
    linkCalendarEvent
  } = useTrackingStore();

  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (linkPlanModalOpen) {
      loadCalendarEvents().then(setEvents).catch(() => {});
    }
  }, [linkPlanModalOpen]);

  if (!linkPlanModalOpen) return null;

  const handleSelectEvent = (event: CalendarEvent) => {
    const s = new Date(event.startTime);
    const e = new Date(event.endTime);
    const durationMinutes = Math.max(15, Math.round((e.getTime() - s.getTime()) / 60000));

    linkCalendarEvent(event.id, event.title, durationMinutes);
    setLinkPlanModalOpen(false);
    setSetupModalOpen(true);
  };

  const handleRemoveLink = () => {
    linkCalendarEvent(null);
    setLinkPlanModalOpen(false);
    setSetupModalOpen(true);
  };

  return (
    <div
      data-testid="link-calendar-modal"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="w-full max-w-md bg-[#111113] border border-[#27272A] rounded-[12px] p-6 flex flex-col gap-4 shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E1E22] pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#A1A1AA]" />
            <h3 className="text-sm font-semibold text-[#FAFAFA] tracking-tight">
              Link Calendar Plan
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setLinkPlanModalOpen(false);
              setSetupModalOpen(true);
            }}
            className="text-[#71717A] hover:text-[#FAFAFA] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto custom-scrollbar">
          {events.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#71717A]">
              No planned calendar events found. Create one in Calendar first.
            </div>
          ) : (
            events.map((ev) => {
              const isSelected = calendarEventId === ev.id;
              const s = new Date(ev.startTime);
              const e = new Date(ev.endTime);
              const timeStr = `${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')} - ${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}`;

              return (
                <div
                  key={ev.id}
                  onClick={() => handleSelectEvent(ev)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1C1C21] border-[#60A5FA]/60 text-white'
                      : 'bg-[#18181B] border-[#27272A] hover:border-[#3F3F46] text-[#FAFAFA]'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-medium truncate">{ev.title}</span>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#71717A] mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{timeStr}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#60A5FA]/20 text-[#60A5FA] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#222226]">
          {calendarEventId ? (
            <button
              type="button"
              onClick={handleRemoveLink}
              className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              Remove Link
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={() => {
              setLinkPlanModalOpen(false);
              setSetupModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#1C1C21] text-[#A1A1AA] hover:text-white text-xs font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
