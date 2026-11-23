import React, { useState, useEffect, useRef } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store.js';
import { UndoToast } from '../home/UndoToast.js';
import { SOSCard } from '../ui/SOSCard.js';

export const MemoryTab: React.FC = () => {
  const {
    settings,
    updateMemory,
    deleteLearnedMemory,
    restoreLearnedMemory,
    undoMemory,
    clearUndoMemory,
    isSaving
  } = useSettingsStore();

  const { memory } = settings;

  const [whoIAm, setWhoIAm] = useState(memory.whoIAm || '');
  const [whatIAmLearning, setWhatIAmLearning] = useState(memory.whatIAmLearning || '');
  const [howIPreferToLearn, setHowIPreferToLearn] = useState(memory.howIPreferToLearn || '');

  // Auto-saved status indicator
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setWhoIAm(memory.whoIAm || '');
    setWhatIAmLearning(memory.whatIAmLearning || '');
    setHowIPreferToLearn(memory.howIPreferToLearn || '');
  }, [memory.whoIAm, memory.whatIAmLearning, memory.howIPreferToLearn]);

  // Debounced auto-save
  const triggerAutoSave = (patch: Partial<typeof memory>) => {
    setSaveStatus('saving');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(async () => {
      await updateMemory(patch);
      setSaveStatus('saved');
    }, 600);
  };

  const handleToggleMemory = () => {
    updateMemory({ enabled: !memory.enabled });
  };

  const handleWhoChange = (val: string) => {
    if (val.length <= 1500) {
      setWhoIAm(val);
      triggerAutoSave({ whoIAm: val });
    }
  };

  const handleWhatChange = (val: string) => {
    if (val.length <= 1500) {
      setWhatIAmLearning(val);
      triggerAutoSave({ whatIAmLearning: val });
    }
  };

  const handleHowChange = (val: string) => {
    if (val.length <= 1500) {
      setHowIPreferToLearn(val);
      triggerAutoSave({ howIPreferToLearn: val });
    }
  };

  const learnedMemories = memory.learnedMemories || [];

  return (
    <div data-testid="settings-memory-tab" className="w-full flex flex-col gap-6">
      {/* Header & Subtitle with Auto-saved Pill */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[20px] font-semibold text-[#F4F4F5] tracking-tight">
            Memory
          </h1>
          <p className="text-[13px] text-[#8E8E93]">
            Tell SOS how you learn best
          </p>
        </div>

        {/* Auto-saved badge with #60A5FA check icon */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141417] border border-[#222226] text-xs font-mono transition-all duration-200">
          {saveStatus === 'saving' || isSaving ? (
            <span className="text-[#8E8E93] animate-pulse">Saving...</span>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span className="text-[#D4D4D8]">Auto-saved</span>
            </>
          )}
        </div>
      </div>

      {/* Top Toggle Card — Enable Study Memory with #60A5FA Track */}
      <SOSCard className="flex flex-col shadow-sm">
        <div className="p-5 flex items-center justify-between text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-[#F4F4F5]">
              Enable Study Memory
            </span>
            <span className="text-[11px] text-[#8E8E93]">
              Allow SOS to remember your mastered concepts and weak spots across sessions
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={memory.enabled}
            onClick={handleToggleMemory}
            className={`w-9 h-5 rounded-full transition-colors duration-150 ease-out relative cursor-pointer ${
              memory.enabled ? 'bg-[#60A5FA]' : 'bg-[#27272A]'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full transition-transform duration-150 ease-out absolute top-[3px] ${
                memory.enabled ? 'left-[19px] bg-white shadow-sm' : 'left-[3px] bg-[#71717A]'
              }`}
            />
          </button>
        </div>
      </SOSCard>

      {/* Section 1: Who I am */}
      <div className="flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <label className="font-medium text-[#F4F4F5] text-xs">
            Who I am
          </label>
          <span className="font-mono text-[11px] text-[#71717A] tnum">
            {whoIAm.length} / 1,500
          </span>
        </div>
        <textarea
          rows={3}
          value={whoIAm}
          onChange={(e) => handleWhoChange(e.target.value)}
          placeholder="e.g., Undergraduate studying Computer Science and Economics, preparing for research and technical interviews..."
          className="w-full rounded-[12px] bg-[#111113] border border-[#1E1E22] p-3.5 text-xs text-[#E4E4E7] placeholder-[#63636B] focus:outline-none focus:border-[#323238] leading-relaxed transition-colors shadow-sm resize-none font-sans"
        />
      </div>

      {/* Section 2: What I am learning */}
      <div className="flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <label className="font-medium text-[#F4F4F5] text-xs">
            What I am learning
          </label>
          <span className="font-mono text-[11px] text-[#71717A] tnum">
            {whatIAmLearning.length} / 1,500
          </span>
        </div>
        <textarea
          rows={3}
          value={whatIAmLearning}
          onChange={(e) => handleWhatChange(e.target.value)}
          placeholder="e.g., Distributed systems, causal inference, and neuroscience foundations..."
          className="w-full rounded-[12px] bg-[#111113] border border-[#1E1E22] p-3.5 text-xs text-[#E4E4E7] placeholder-[#63636B] focus:outline-none focus:border-[#323238] leading-relaxed transition-colors shadow-sm resize-none font-sans"
        />
      </div>

      {/* Section 3: How I prefer to learn */}
      <div className="flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <label className="font-medium text-[#F4F4F5] text-xs">
            How I prefer to learn
          </label>
          <span className="font-mono text-[11px] text-[#71717A] tnum">
            {howIPreferToLearn.length} / 1,500
          </span>
        </div>
        <textarea
          rows={3}
          value={howIPreferToLearn}
          onChange={(e) => handleHowChange(e.target.value)}
          placeholder="e.g., Socratic dialogue, first-principles derivations, minimal jargon, concrete visual analogies..."
          className="w-full rounded-[12px] bg-[#111113] border border-[#1E1E22] p-3.5 text-xs text-[#E4E4E7] placeholder-[#63636B] focus:outline-none focus:border-[#323238] leading-relaxed transition-colors shadow-sm resize-none font-sans"
        />
      </div>

      {/* Section 4: What has SOS learned about me? */}
      <div className="flex flex-col gap-2 text-xs">
        <label className="font-medium text-[#F4F4F5] text-xs">
          What has SOS learned about me?
        </label>
        <SOSCard className="w-full shadow-sm">
          {learnedMemories.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#71717A]">
              No learned insights yet.
            </div>
          ) : (
            <div className="divide-y divide-[#1E1E22] text-xs">
              {learnedMemories.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.015] transition-colors group"
                >
                  <span className="text-[#E4E4E7] font-normal min-w-0 pr-4 truncate">
                    {item.text}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[11px] text-[#71717A]">
                      {item.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteLearnedMemory(item.id)}
                      title="Delete memory"
                      className="p-1 rounded text-[#71717A] hover:text-[#F87171] hover:bg-[#2A1215] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SOSCard>
      </div>

      {/* Undo Toast Notification */}
      <UndoToast
        isOpen={Boolean(undoMemory)}
        message="Memory insight removed"
        onUndo={restoreLearnedMemory}
        onDismiss={clearUndoMemory}
      />
    </div>
  );
};
