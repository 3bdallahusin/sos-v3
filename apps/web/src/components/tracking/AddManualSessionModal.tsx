import React, { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { useTrackingStore } from '../../stores/tracking-store.js';
import { CreatableDomainTopicCombobox } from '../ui/CreatableDomainTopicCombobox.js';
import { SOSModalShell } from '../ui/SOSModalShell.js';
import { getTodayDateString } from '@sos/domain';

export const AddManualSessionModal: React.FC = () => {
  const {
    manualModalOpen,
    setManualModalOpen,
    createManualSession
  } = useTrackingStore();

  const now = new Date();
  const defaultDateStr = getTodayDateString();
  const defaultStartStr = `${String(Math.max(0, now.getHours() - 1)).padStart(2, '0')}:00`;
  const defaultEndStr = `${String(now.getHours()).padStart(2, '0')}:00`;

  const [title, setTitle] = useState('');
  const [domainId, setDomainId] = useState<string | null>(null);
  const [domainName, setDomainName] = useState('General');
  const [topicName, setTopicName] = useState('');
  const [dateStr, setDateStr] = useState(defaultDateStr);
  const [startTimeStr, setStartTimeStr] = useState(defaultStartStr);
  const [endTimeStr, setEndTimeStr] = useState(defaultEndStr);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!manualModalOpen) return null;

  const todayStr = getTodayDateString();

  const calculateDuration = (start: string, end: string): string => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return '0m';
    let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMins < 0) diffMins += 24 * 60;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    if (h > 0) {
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${m}m`;
  };

  const isFuture = () => {
    if (dateStr > todayStr) return true;
    if (dateStr === todayStr) {
      const [endH, endM] = endTimeStr.split(':').map(Number);
      const nowH = now.getHours();
      const nowM = now.getMinutes();
      if (endH > nowH || (endH === nowH && endM > nowM)) {
        return true;
      }
    }
    return false;
  };

  const handleSave = async () => {
    setError(null);

    if (isFuture()) {
      setError('Cannot log historical sessions in the future.');
      return;
    }

    if (startTimeStr >= endTimeStr) {
      setError('End time must be after start time.');
      return;
    }

    try {
      await createManualSession({
        title: title.trim() || 'Historical Focus Session',
        domainName,
        domainId,
        topicName: topicName.trim() || undefined,
        dateStr,
        startTimeStr,
        endTimeStr,
        notes: notes.trim()
      });
      setManualModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save historical session');
    }
  };

  return (
    <SOSModalShell
      isOpen={manualModalOpen}
      onClose={() => setManualModalOpen(false)}
      title="Add Historical Session"
      description="Manually record a completed study session from the past"
      maxWidth="max-w-md"
      footer={
        <>
          <button
            type="button"
            onClick={() => setManualModalOpen(false)}
            className="h-8 px-4 rounded-xl text-xs font-medium text-[#8E8E93] hover:text-white hover:bg-[#1E1E22] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isFuture()}
            className="h-8 px-5 rounded-xl text-xs font-semibold bg-[#FAFAFA] text-[#080808] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Historical Session</span>
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-xs">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5 font-sans">
            Session Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Distributed Consensus Drill"
            className="w-full h-9 px-3 rounded-xl bg-[#141416] border border-[#222226] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#60A5FA] transition-colors"
          />
        </div>

        {/* Domain & Topic */}
        <CreatableDomainTopicCombobox
          selectedDomainName={domainName}
          selectedTopicName={topicName}
          onSelectDomain={(id, name) => {
            setDomainId(id);
            setDomainName(name);
          }}
          onSelectTopic={(_id, name) => {
            setTopicName(name);
          }}
        />

        {/* 3-column Date, Start Time, End Time row */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5 font-sans">
              Date
            </label>
            <input
              type="date"
              max={todayStr}
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="w-full h-9 bg-[#141416] border border-[#222226] rounded-xl px-2 text-[12px] font-medium text-[#EDEDED] font-mono focus:outline-none focus:border-[#60A5FA] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5 font-sans">
              Start Time
            </label>
            <input
              type="time"
              value={startTimeStr}
              onChange={(e) => setStartTimeStr(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="w-full h-9 bg-[#141416] border border-[#222226] rounded-xl px-2 text-[12px] font-medium text-[#EDEDED] font-mono focus:outline-none focus:border-[#60A5FA] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5 font-sans">
              End Time
            </label>
            <input
              type="time"
              value={endTimeStr}
              onChange={(e) => setEndTimeStr(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="w-full h-9 bg-[#141416] border border-[#222226] rounded-xl px-2 text-[12px] font-medium text-[#EDEDED] font-mono focus:outline-none focus:border-[#60A5FA] transition-colors"
            />
          </div>
        </div>

        {/* Live Duration Pill */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-[#71717A]">Computed Duration:</span>
          <span className="text-[11px] font-mono text-[#FAFAFA] bg-[#141416] border border-[#222226] px-3 py-0.5 rounded-full tabular-nums">
            {calculateDuration(startTimeStr, endTimeStr)}
          </span>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5 font-sans">
            Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What was covered in this session?"
            className="w-full bg-[#141416] border border-[#222226] rounded-xl p-2.5 text-xs font-medium text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#60A5FA] resize-none transition-colors"
          />
        </div>
      </div>
    </SOSModalShell>
  );
};
