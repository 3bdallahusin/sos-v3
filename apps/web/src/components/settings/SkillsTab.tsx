import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store.js';
import type { SkillItem } from '@sos/domain';
import { SOSCard } from '../ui/SOSCard.js';

export const SkillsTab: React.FC = () => {
  const { settings, toggleSkill, openSkillEditor, deleteSkill } = useSettingsStore();
  const { skills } = settings;

  const builtInSkills = skills.filter((s) => s.isBuiltIn);
  const customSkills = skills.filter((s) => !s.isBuiltIn);

  return (
    <div data-testid="settings-skills-tab" className="w-full flex flex-col gap-6">
      {/* Header & Subtitle */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[20px] font-semibold text-[#F4F4F5] tracking-tight">
          Skills
        </h1>
        <p className="text-[13px] text-[#8E8E93]">
          Manage built-in and custom /skills for your AI tutor
        </p>
      </div>

      {/* Section 1: Built-in SOS Skills */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-[#F4F4F5] tracking-wide">
          Built-in SOS Skills
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 [grid-auto-rows:1fr]">
          {builtInSkills.map((skill) => (
            <SOSCard
              key={skill.id}
              className="p-4 flex flex-col justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-[#18181C] border border-[#27272A] font-mono text-xs font-semibold text-white">
                  {skill.command}
                </span>

                <button
                  type="button"
                  role="switch"
                  aria-checked={skill.enabled}
                  onClick={() => toggleSkill(skill.id)}
                  className={`w-9 h-5 rounded-full transition-colors duration-150 ease-out relative cursor-pointer ${
                    skill.enabled ? 'bg-[#60A5FA]' : 'bg-[#27272A]'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full transition-transform duration-150 ease-out absolute top-[3px] ${
                      skill.enabled ? 'left-[19px] bg-white shadow-sm' : 'left-[3px] bg-[#71717A]'
                    }`}
                  />
                </button>
              </div>

              <p className="text-[11.5px] text-[#8E8E93] leading-relaxed">
                {skill.description}
              </p>
            </SOSCard>
          ))}
        </div>
      </div>

      {/* Section 2: Custom Skills */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[#F4F4F5] tracking-wide">
            Custom Skills
          </h2>

          <button
            type="button"
            onClick={() => openSkillEditor()}
            className="h-7 px-3 rounded-full bg-[#18181C] hover:bg-[#222226] border border-[#27272A] text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-3 h-3" />
            <span>New Skill</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 [grid-auto-rows:1fr]">
          {customSkills.map((skill) => (
            <SOSCard
              key={skill.id}
              className="p-4 flex flex-col justify-between gap-3 shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-[#18181C] border border-[#27272A] font-mono text-xs font-semibold text-white group-hover:border-[#3F3F46] transition-colors">
                  {skill.command}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openSkillEditor(skill)}
                    title="Edit Skill"
                    className="p-1 rounded text-[#71717A] hover:text-white hover:bg-[#1E1E22] transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteSkill(skill.id)}
                    title="Delete Skill"
                    className="p-1 rounded text-[#71717A] hover:text-[#F87171] hover:bg-[#2A1215] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={skill.enabled}
                    onClick={() => toggleSkill(skill.id)}
                    className={`w-9 h-5 rounded-full transition-colors duration-150 ease-out relative cursor-pointer ${
                      skill.enabled ? 'bg-[#60A5FA]' : 'bg-[#27272A]'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full transition-transform duration-150 ease-out absolute top-[3px] ${
                        skill.enabled ? 'left-[19px] bg-white shadow-sm' : 'left-[3px] bg-[#71717A]'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <p className="text-[11.5px] text-[#8E8E93] leading-relaxed">
                {skill.description}
              </p>
            </SOSCard>
          ))}
        </div>
      </div>
    </div>
  );
};
