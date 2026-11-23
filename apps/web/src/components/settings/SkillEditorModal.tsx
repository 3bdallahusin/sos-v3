import React, { useState, useEffect } from 'react';
import { X, Terminal } from 'lucide-react';
import type { SkillItem } from '@sos/domain';
import { useSettingsStore } from '../../stores/settings-store.js';
import { SOSCard } from '../ui/SOSCard.js';

export const SkillEditorModal: React.FC = () => {
  const {
    skillEditorModal,
    closeSkillEditor,
    saveSkill,
    deleteSkill,
    isSaving
  } = useSettingsStore();

  const { isOpen, skill } = skillEditorModal;

  const [command, setCommand] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  useEffect(() => {
    if (skill) {
      setCommand(skill.command);
      setDescription(skill.description);
      setSystemPrompt(skill.systemPrompt);
    } else {
      setCommand('/');
      setDescription('');
      setSystemPrompt('');
    }
  }, [skill]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        closeSkillEditor();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (command.trim() && description.trim() && systemPrompt.trim()) {
          saveSkill({
            id: skill?.id,
            command: command.trim(),
            description: description.trim(),
            systemPrompt: systemPrompt.trim()
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, command, description, systemPrompt, skill, closeSkillEditor, saveSkill]);

  if (!isOpen) return null;

  const isEditMode = Boolean(skill && skill.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !description.trim() || !systemPrompt.trim()) return;

    await saveSkill({
      id: skill?.id,
      command: command.trim(),
      description: description.trim(),
      systemPrompt: systemPrompt.trim()
    });
  };

  const handleDelete = async () => {
    if (!skill?.id) return;
    await deleteSkill(skill.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={closeSkillEditor}
    >
      <SOSCard
        interactive={false}
        className="w-full max-w-[500px] p-6 shadow-2xl flex flex-col gap-4 text-xs animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E1E22] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#18181C] border border-[#27272A] flex items-center justify-center text-white">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-white tracking-tight font-mono">
              {isEditMode ? 'Edit Skill' : 'New Skill'}
            </h2>
          </div>

          <button
            type="button"
            onClick={closeSkillEditor}
            className="w-7 h-7 rounded-lg bg-[#18181C] hover:bg-[#222226] border border-[#27272A] flex items-center justify-center text-[#71717A] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Slash Command */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#A1A1AA]">
              Slash Command
            </label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="/feynman"
              className="h-9 px-3 rounded-lg bg-[#09090B] border border-[#222226] text-xs text-white font-mono focus:outline-none focus:border-[#3F3F46] transition-colors"
            />
          </div>

          {/* Short Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#A1A1AA]">
              Short Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain complex topics simply and spot gaps in my reasoning"
              className="h-9 px-3 rounded-lg bg-[#09090B] border border-[#222226] text-xs text-white focus:outline-none focus:border-[#3F3F46] transition-colors"
            />
          </div>

          {/* Skill Instructions (System Prompt) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#A1A1AA]">
              Skill Instructions (System Prompt)
            </label>
            <textarea
              rows={5}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="1. Ask me to explain the concept in simple words.&#10;2. Point out logical leaps.&#10;3. Guide me back to the source."
              className="w-full rounded-lg bg-[#09090B] border border-[#222226] p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-[#3F3F46] transition-colors resize-none font-sans"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#1E1E22]">
            {isEditMode && !skill?.isBuiltIn ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs text-[#F87171] hover:text-[#EF4444] transition-colors cursor-pointer"
              >
                Delete Skill
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeSkillEditor}
                className="h-8 px-3.5 rounded-full text-xs font-medium text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !command.trim() || !description.trim() || !systemPrompt.trim()}
                className="h-8 px-4 rounded-full bg-white hover:bg-[#E4E4E7] text-xs font-semibold text-black transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Skill
              </button>
            </div>
          </div>
        </form>
      </SOSCard>
    </div>
  );
};
