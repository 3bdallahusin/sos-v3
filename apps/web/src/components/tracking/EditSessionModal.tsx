import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { useTrackingStore } from '../../stores/tracking-store.js';
import { loadLibraryFolders } from '@sos/persistence';
import type { LibraryFolder } from '@sos/domain';
import { CreatableDomainTopicCombobox } from '../ui/CreatableDomainTopicCombobox.js';

export const EditSessionModal: React.FC = () => {
  const {
    editModalSession,
    setEditModalSession,
    updateSession
  } = useTrackingStore();

  const [title, setTitle] = useState('');
  const [field, setField] = useState('');
  const [subject, setSubject] = useState('');
  const [durationMins, setDurationMins] = useState(25);
  const [notes, setNotes] = useState('');
  const [folders, setFolders] = useState<LibraryFolder[]>([]);

  useEffect(() => {
    if (editModalSession) {
      setTitle(editModalSession.title);
      setField(editModalSession.fieldName || 'General');
      setSubject(editModalSession.subjectName || editModalSession.subtitle || '');
      const mins =
        editModalSession.durationMinutes ||
        Math.max(1, Math.round((editModalSession.durationSeconds ?? 0) / 60));
      setDurationMins(mins);
      setNotes(editModalSession.notes || '');
    }
  }, [editModalSession]);

  useEffect(() => {
    loadLibraryFolders()
      .then((all) => setFolders(all.filter((f) => f.id !== 'library-root')))
      .catch(() => {});
  }, []);

  if (!editModalSession) return null;

  const handleSave = async () => {
    const durationSeconds = durationMins * 60;
    await updateSession(editModalSession.id, {
      title: title.trim() || 'Focus Session',
      domainName: field,
      fieldName: field,
      topicName: subject.trim() || undefined,
      subjectName: subject.trim() || undefined,
      subtitle: subject.trim() || undefined,
      durationMinutes: durationMins,
      durationSeconds,
      actualFocusSeconds: durationSeconds,
      notes: notes.trim()
    });
    setEditModalSession(null);
  };

  return (
    <div
      data-testid="edit-session-modal"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="w-full max-w-md bg-[#111113] border border-[#27272A] rounded-[12px] p-6 flex flex-col gap-4 shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E1E22] pb-3">
          <h3 className="text-sm font-semibold text-[#FAFAFA] tracking-tight">
            Edit Session
          </h3>
          <button
            type="button"
            onClick={() => setEditModalSession(null)}
            className="text-[#71717A] hover:text-[#FAFAFA] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-3.5 text-xs">
          <div>
            <label className="block text-[#A1A1AA] font-medium mb-1">Session Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1C1C21] border border-[#27272A] focus:border-[#3F3F46] rounded-xl px-3 py-2 text-[#FAFAFA] focus:outline-none transition-colors"
            />
          </div>

          <CreatableDomainTopicCombobox
            selectedDomainName={field}
            selectedTopicName={subject}
            onSelectDomain={(_id, name) => setField(name)}
            onSelectTopic={(_id, name) => setSubject(name)}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#A1A1AA] font-medium">Duration (minutes)</label>
              <span className="text-[11px] font-mono text-[#EDEDED] bg-[#1C1C21] border border-[#27272A] px-2 py-0.5 rounded-full tabular-nums">
                Duration: {Math.floor(durationMins / 60) > 0 ? (durationMins % 60 > 0 ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m` : `${Math.floor(durationMins / 60)}h`) : `${durationMins}m`}
              </span>
            </div>
            <input
              type="number"
              min="1"
              max="720"
              value={durationMins}
              onChange={(e) => setDurationMins(Math.max(1, Number(e.target.value)))}
              style={{ colorScheme: 'dark' }}
              className="w-full bg-[#1C1C21] border border-[#27272A] focus:border-[#3F3F46] rounded-xl px-3 py-2 text-[#FAFAFA] font-mono focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[#A1A1AA] font-medium mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#1C1C21] border border-[#27272A] focus:border-[#3F3F46] rounded-xl px-3 py-2 text-[#FAFAFA] focus:outline-none resize-none transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222226]">
          <button
            type="button"
            onClick={() => setEditModalSession(null)}
            className="px-4 py-2 rounded-xl bg-[#1C1C21] text-[#71717A] hover:text-[#FAFAFA] text-xs font-medium cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#FAFAFA] text-[#09090B] font-semibold text-xs hover:bg-[#E4E4E7] shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
