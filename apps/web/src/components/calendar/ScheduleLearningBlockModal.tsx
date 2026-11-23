import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { LearningBlock } from '@sos/domain';
import {
  getTodayDateString,
  isoToEuro,
  euroToIso,
  parseTimeTo24h,
  format12HourTime,
  isValidCalendarDate
} from '@sos/domain';
import { useCalendarStore } from '../../stores/calendar-store.js';
import { SOSModalShell } from '../ui/SOSModalShell.js';
import { CreatableDomainTopicCombobox } from '../ui/CreatableDomainTopicCombobox.js';

interface ScheduleLearningBlockModalProps {
  editingBlock: LearningBlock | null;
  initialSlot?: { date: string; startTime: string; endTime: string };
  onClose: () => void;
  onSave: (params: {
    title: string;
    domain: string;
    topic?: string;
    date: string;
    startTime: string;
    endTime: string;
    recurrenceRule?: {
      frequency: 'daily' | 'weekly';
      daysOfWeek?: number[];
      endDate?: string;
    };
    scope?: 'single' | 'following';
  }) => Promise<void>;
}

export const ScheduleLearningBlockModal: React.FC<ScheduleLearningBlockModalProps> = ({
  editingBlock,
  initialSlot,
  onClose,
  onSave
}) => {
  const { blocks } = useCalendarStore();

  const [title, setTitle] = useState(editingBlock?.title || '');
  const [domain, setDomain] = useState(editingBlock?.domain || 'Computer Science');
  const [topic, setTopic] = useState(editingBlock?.topic || '');
  const [dateDisplay, setDateDisplay] = useState(
    isoToEuro(editingBlock?.date || initialSlot?.date || getTodayDateString())
  );
  const [startTimeDisplay, setStartTimeDisplay] = useState(
    format12HourTime(editingBlock?.startTime || initialSlot?.startTime || '09:00')
  );
  const [endTimeDisplay, setEndTimeDisplay] = useState(
    format12HourTime(editingBlock?.endTime || initialSlot?.endTime || '10:30')
  );

  // Recurrence for new blocks
  const [recurrenceFreq, setRecurrenceFreq] = useState<'none' | 'daily' | 'weekly'>('none');

  // Edit scope for recurring blocks
  const [editScope, setEditScope] = useState<'single' | 'following'>('single');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingBlock) {
      setTitle(editingBlock.title);
      setDomain(editingBlock.domain);
      setTopic(editingBlock.topic || '');
      setDateDisplay(isoToEuro(editingBlock.date));
      setStartTimeDisplay(format12HourTime(editingBlock.startTime));
      setEndTimeDisplay(format12HourTime(editingBlock.endTime));
    } else if (initialSlot) {
      setDateDisplay(isoToEuro(initialSlot.date));
      setStartTimeDisplay(format12HourTime(initialSlot.startTime));
      setEndTimeDisplay(format12HourTime(initialSlot.endTime));
    }
  }, [editingBlock, initialSlot]);

  // Derived ISO date and 24h times
  const isoDate = useMemo(() => euroToIso(dateDisplay), [dateDisplay]);
  const start24 = useMemo(() => parseTimeTo24h(startTimeDisplay), [startTimeDisplay]);
  const end24 = useMemo(() => parseTimeTo24h(endTimeDisplay), [endTimeDisplay]);

  // Overlap detection
  const collidingBlock = useMemo(() => {
    if (!isoDate || !start24 || !end24 || start24 >= end24) return null;
    return (
      blocks.find(
        (b) =>
          b.id !== editingBlock?.id &&
          b.date === isoDate &&
          start24 < b.endTime &&
          end24 > b.startTime
      ) || null
    );
  }, [blocks, editingBlock, isoDate, start24, end24]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!domain.trim()) {
      setError('Domain is required');
      return;
    }

    const [d, m, y] = dateDisplay.split('/').map(Number);
    if (!isValidCalendarDate(y, m, d)) {
      setError('Please enter a valid date in DD/MM/YYYY format');
      return;
    }

    if (start24 >= end24) {
      setError('End time must be after start time');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let recurrenceRule:
        | { frequency: 'daily' | 'weekly'; daysOfWeek?: number[]; endDate?: string }
        | undefined = undefined;

      if (!editingBlock && recurrenceFreq !== 'none') {
        const [sy, sm, sd] = isoDate.split('-').map(Number);
        const dateObj = new Date(sy, sm - 1, sd);
        const dayOfWeek = dateObj.getDay();

        recurrenceRule = {
          frequency: recurrenceFreq,
          daysOfWeek: recurrenceFreq === 'weekly' ? [dayOfWeek] : undefined
        };
      }

      await onSave({
        title: title.trim(),
        domain: domain.trim(),
        topic: topic.trim() || undefined,
        date: isoDate,
        startTime: start24,
        endTime: end24,
        recurrenceRule,
        scope: editingBlock?.seriesId ? editScope : 'single'
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save block';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SOSModalShell
      isOpen={true}
      onClose={onClose}
      title={editingBlock ? 'Edit Learning Block' : 'Schedule Learning Block'}
      maxWidth="max-w-[480px]"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        {error && (
          <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-mono text-center">
            {error}
          </div>
        )}

        {/* Live Overlap Warning */}
        {collidingBlock && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Collides with existing block: <strong>{collidingBlock.title}</strong> (
              {collidingBlock.startTime} – {collidingBlock.endTime})
            </span>
          </div>
        )}

        {/* Session Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10.5px] font-mono uppercase tracking-wider text-[#A1A1AA] font-medium">
            Session Title
          </label>
          <input
            type="text"
            data-testid="event-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Distributed Consensus: Raft Protocol Proofs"
            required
            className="w-full bg-[#161619] border border-[#222226] hover:border-[#2C2C34] focus:border-[#60A5FA] rounded-lg px-3.5 py-2 text-xs font-medium text-[#FAFAFA] focus:outline-none transition-colors placeholder-[#52525B]"
          />
        </div>

        {/* Domain & Topic Combobox */}
        <CreatableDomainTopicCombobox
          selectedDomainName={domain}
          selectedTopicName={topic}
          onSelectDomain={(_id, name) => setDomain(name)}
          onSelectTopic={(_id, name) => setTopic(name)}
        />

        {/* Date, Start Time, End Time */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] font-mono uppercase tracking-wider text-[#A1A1AA] font-medium text-center">
              Date (DD/MM/YYYY)
            </label>
            <input
              type="text"
              data-testid="event-date-input"
              value={dateDisplay}
              onChange={(e) => setDateDisplay(e.target.value)}
              placeholder="19/11/2026"
              maxLength={10}
              className="w-full bg-[#161619] border border-[#222226] hover:border-[#2C2C34] focus:border-[#60A5FA] rounded-lg px-2 py-2 text-xs font-mono text-[#FAFAFA] focus:outline-none text-center transition-colors placeholder-[#52525B]"
            />
          </div>

          {/* Start Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] font-mono uppercase tracking-wider text-[#A1A1AA] font-medium text-center">
              Start Time
            </label>
            <input
              type="text"
              data-testid="event-start-time-input"
              value={startTimeDisplay}
              onChange={(e) => setStartTimeDisplay(e.target.value)}
              placeholder="09:00 AM"
              maxLength={10}
              className="w-full bg-[#161619] border border-[#222226] hover:border-[#2C2C34] focus:border-[#60A5FA] rounded-lg px-2 py-2 text-xs font-mono text-[#FAFAFA] focus:outline-none text-center transition-colors placeholder-[#52525B]"
            />
          </div>

          {/* End Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] font-mono uppercase tracking-wider text-[#A1A1AA] font-medium text-center">
              End Time
            </label>
            <input
              type="text"
              data-testid="event-end-time-input"
              value={endTimeDisplay}
              onChange={(e) => setEndTimeDisplay(e.target.value)}
              placeholder="10:30 AM"
              maxLength={10}
              className="w-full bg-[#161619] border border-[#222226] hover:border-[#2C2C34] focus:border-[#60A5FA] rounded-lg px-2 py-2 text-xs font-mono text-[#FAFAFA] focus:outline-none text-center transition-colors placeholder-[#52525B]"
            />
          </div>
        </div>

        {/* Recurrence Rule for New Blocks */}
        {!editingBlock && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] font-mono uppercase tracking-wider text-[#A1A1AA] font-medium">
              Recurrence
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecurrenceFreq('none')}
                className={`py-2 px-3 rounded-lg border text-xs font-mono transition-colors ${
                  recurrenceFreq === 'none'
                    ? 'bg-[#1E1E22] border-[#FAFAFA] text-[#FAFAFA]'
                    : 'bg-[#161619] border-[#222226] text-[#A1A1AA] hover:border-[#2C2C34]'
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => setRecurrenceFreq('daily')}
                className={`py-2 px-3 rounded-lg border text-xs font-mono transition-colors ${
                  recurrenceFreq === 'daily'
                    ? 'bg-[#1E1E22] border-[#FAFAFA] text-[#FAFAFA]'
                    : 'bg-[#161619] border-[#222226] text-[#A1A1AA] hover:border-[#2C2C34]'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setRecurrenceFreq('weekly')}
                className={`py-2 px-3 rounded-lg border text-xs font-mono transition-colors ${
                  recurrenceFreq === 'weekly'
                    ? 'bg-[#1E1E22] border-[#FAFAFA] text-[#FAFAFA]'
                    : 'bg-[#161619] border-[#222226] text-[#A1A1AA] hover:border-[#2C2C34]'
                }`}
              >
                Weekly
              </button>
            </div>
          </div>
        )}

        {/* Series Edit Scope for Recurring Blocks */}
        {editingBlock?.seriesId && (
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#161619] border border-[#222226]">
            <span className="text-[11px] font-medium text-[#FAFAFA]">
              This is a recurring block. Apply changes to:
            </span>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#FAFAFA]">
                <input
                  type="radio"
                  name="editScope"
                  checked={editScope === 'single'}
                  onChange={() => setEditScope('single')}
                  className="accent-[#60A5FA]"
                />
                <span>This block only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[#FAFAFA]">
                <input
                  type="radio"
                  name="editScope"
                  checked={editScope === 'following'}
                  onChange={() => setEditScope('following')}
                  className="accent-[#60A5FA]"
                />
                <span>This and following blocks</span>
              </label>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E1E22] mt-2">
          <button
            type="button"
            data-testid="modal-cancel-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="event-save-btn"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-[#FAFAFA] hover:bg-white text-[#09090B] font-semibold text-xs transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {editingBlock ? 'Update Block' : 'Schedule Block'}
          </button>
        </div>
      </form>
    </SOSModalShell>
  );
};
