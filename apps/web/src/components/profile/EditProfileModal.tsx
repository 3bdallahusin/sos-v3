import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { UserProfile } from '@sos/domain';
import { SOSCard } from '../ui/SOSCard.js';

export interface EditProfileModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: UserProfile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [institution, setInstitution] = useState(profile.institution || '');
  const [learningFocus, setLearningFocus] = useState(profile.learningFocus || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const updated: UserProfile = {
        ...profile,
        name: name.trim(),
        handle: handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`,
        institution: institution.trim() || undefined,
        learningFocus: learningFocus.trim() || undefined,
        bio: bio.trim() || undefined,
        website: website.trim() || undefined
      };
      onSave(updated);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <SOSCard
        interactive={false}
        className="w-full max-w-[500px] p-6 shadow-2xl flex flex-col gap-4 text-xs animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E1E22] pb-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Edit Student Profile
            </h2>
            <span className="text-[11px] text-[#71717A]">
              Update your personal academic details and scholar presence
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#18181C] hover:bg-[#222226] border border-[#27272A] flex items-center justify-center text-[#71717A] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#A1A1AA]">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full h-8 px-2.5 rounded-lg bg-[#09090B] border border-[#27272A] focus:border-[#3F3F46] text-xs text-white placeholder-[#71717A] outline-none transition-colors"
                placeholder="e.g. Abdalla Husin"
              />
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#A1A1AA]">
                Handle
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                required
                className="w-full h-8 px-2.5 rounded-lg bg-[#09090B] border border-[#27272A] focus:border-[#3F3F46] text-xs text-white placeholder-[#71717A] font-mono outline-none transition-colors"
                placeholder="@handle"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[#A1A1AA]">
              Academic Institution / Affiliation
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-[#09090B] border border-[#27272A] focus:border-[#3F3F46] text-xs text-white placeholder-[#71717A] outline-none transition-colors"
              placeholder="e.g. Stanford University / Self-Directed Scholar"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[#A1A1AA]">
              Learning Focus &amp; Major
            </label>
            <input
              type="text"
              value={learningFocus}
              onChange={(e) => setLearningFocus(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-[#09090B] border border-[#27272A] focus:border-[#3F3F46] text-xs text-white placeholder-[#71717A] outline-none transition-colors"
              placeholder="e.g. Computer Science & Cognitive Systems"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[#A1A1AA]">
              Scholarly Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#09090B] border border-[#27272A] focus:border-[#3F3F46] text-xs text-white placeholder-[#71717A] outline-none transition-colors resize-none"
              placeholder="Tell others what you are studying and researching..."
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[#A1A1AA]">
              Personal Academic Website / Link
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-[#09090B] border border-[#27272A] focus:border-[#3F3F46] text-xs text-white placeholder-[#71717A] outline-none transition-colors"
              placeholder="https://..."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F1F23]">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3.5 rounded-lg bg-[#18181C] hover:bg-[#222226] border border-[#27272A] text-xs text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-8 px-4 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </SOSCard>
    </div>
  );
};
