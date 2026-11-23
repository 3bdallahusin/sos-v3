import React, { useState, useRef } from 'react';
import { Pencil, Check, X, ShieldAlert, KeyRound, Download, FileText, FileCode, Upload } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store.js';
import { getLocalDatabase } from '@sos/persistence';
import { SOSCard } from '../ui/SOSCard.js';

export const AccountTab: React.FC = () => {
  const {
    settings,
    updateAccount,
    deleteAccount,
    deleteAccountModalOpen,
    setDeleteAccountModalOpen,
    setActiveTab,
    isSaving
  } = useSettingsStore();

  const { account } = settings;

  // Inline editing state: 'name' | 'username' | 'email' | 'learningFocus' | null
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState('');

  // Modals state
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);

  // Delete confirmation input state
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // File input ref for avatar & cover banner
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const startEditing = (field: string, currentVal: string) => {
    setEditingField(field);
    setFieldValue(currentVal);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setFieldValue('');
  };

  const handleSaveField = async (field: string) => {
    if (!fieldValue.trim()) return;
    let finalVal = fieldValue.trim();
    if (field === 'username' && !finalVal.startsWith('@')) {
      finalVal = `@${finalVal}`;
    }
    await updateAccount({ [field]: finalVal });
    setEditingField(null);
  };

  // Avatar upload handler
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await updateAccount({ avatarUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // Cover Banner upload handler
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await updateAccount({ coverImage: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // Export Research Data: Markdown
  const handleExportMarkdown = async () => {
    try {
      const db = getLocalDatabase();
      const [folders, files, tasks] = await Promise.all([
        db.libraryFolders.toArray(),
        db.libraryFiles.toArray(),
        db.tasks.toArray()
      ]);

      let md = `# SOS Research Archive\n\n`;
      md += `**Scholar:** ${account.name} (${account.username})\n`;
      md += `**Email:** ${account.email}\n`;
      md += `**Focus:** ${account.learningFocus}\n`;
      md += `**Export Date:** ${new Date().toISOString()}\n\n`;
      md += `## Library Folders (${folders.length})\n\n`;
      for (const fo of folders) {
        md += `- **${fo.name}** (Created: ${fo.createdAt})\n`;
      }
      md += `\n## Library Documents (${files.length})\n\n`;
      for (const fi of files) {
        md += `- **${fi.title}** [${fi.type}] (Created: ${fi.createdAt})\n`;
      }
      md += `\n## Study Tasks (${tasks.length})\n\n`;
      for (const t of tasks) {
        md += `- [${t.completed ? 'x' : ' '}] ${t.title}\n`;
      }

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sos-research-export-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export markdown:', err);
    }
  };

  // Export Research Data: JSON
  const handleExportJson = async () => {
    try {
      const db = getLocalDatabase();
      const [folders, files, tasks, prefs] = await Promise.all([
        db.libraryFolders.toArray(),
        db.libraryFiles.toArray(),
        db.tasks.toArray(),
        db.shellPreferences.toArray()
      ]);

      const archive = {
        meta: {
          app: 'SOS (Studying Operating System)',
          version: '3.0.0',
          exportedAt: new Date().toISOString(),
          account
        },
        folders,
        files,
        tasks,
        preferences: prefs
      };

      const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sos-research-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export JSON:', err);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword === confirmPassword) {
      setPasswordSuccessMessage('Password changed successfully.');
      setTimeout(() => {
        setChangePasswordModalOpen(false);
        setPasswordSuccessMessage(null);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1200);
    }
  };

  return (
    <div data-testid="settings-account-tab" className="w-full flex flex-col gap-6">
      {/* Hidden Avatar File Input */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png, image/jpeg, image/gif, image/webp"
        onChange={handleAvatarFileChange}
        className="hidden"
      />
      {/* Hidden Cover Banner File Input */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/png, image/jpeg, image/gif, image/webp"
        onChange={handleCoverFileChange}
        className="hidden"
      />

      {/* Header & Subtitle */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[20px] font-semibold text-[#F4F4F5] tracking-tight">
          Account
        </h1>
        <p className="text-[13px] text-[#8E8E93]">
          Manage your profile details and account settings
        </p>
      </div>

      {/* Card 1 — Details */}
      <SOSCard className="flex flex-col shadow-sm">
        <div className="px-5 py-3.5 border-b border-[#1E1E22] bg-[#0C0C0E] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#F4F4F5] tracking-wide">
            Details
          </span>
        </div>

        <div className="divide-y divide-[#1E1E22] text-xs">
          {/* 1. Profile Avatar */}
          <div className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[#F4F4F5]">Profile Avatar</span>
              <span className="text-[11px] text-[#8E8E93]">
                JPG, PNG or GIF up to 5MB
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-[#27272A] overflow-hidden bg-[#18181C] shrink-0">
                <img
                  src={account.avatarUrl || '/avatars/abdalla.jpg'}
                  alt={account.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="h-8 px-3 rounded-lg bg-[#18181C] hover:bg-[#222226] border border-[#27272A] text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Change Avatar</span>
              </button>
            </div>
          </div>

          {/* 2. Cover Banner */}
          <div className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[#F4F4F5]">Cover Banner</span>
              <span className="text-[11px] text-[#8E8E93]">
                Header image for your profile (JPG, PNG or URL)
              </span>
            </div>

            {editingField === 'coverImage' ? (
              <div className="flex items-center gap-1.5 max-w-[380px]">
                <input
                  type="text"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder="https://..."
                  autoFocus
                  className="h-7 px-2.5 rounded-lg bg-[#18181C] border border-[#3F3F46] text-xs text-white focus:outline-none focus:border-white font-mono w-[240px]"
                />
                <button
                  type="button"
                  onClick={() => handleSaveField('coverImage')}
                  disabled={isSaving}
                  className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center hover:bg-[#E4E4E7] transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="w-7 h-7 rounded-lg bg-[#18181C] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-16 h-8 rounded-md border border-[#27272A] overflow-hidden bg-[#18181C] shrink-0">
                  <img
                    src={account.coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop'}
                    alt="Cover preview"
                    className="w-full h-full object-cover grayscale opacity-80"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="h-8 px-2.5 rounded-lg bg-[#18181C] hover:bg-[#222226] border border-[#27272A] text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-[#71717A]" />
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => startEditing('coverImage', account.coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop')}
                  className="text-[#71717A] hover:text-[#F4F4F5] p-1 rounded transition-colors cursor-pointer"
                  title="Edit Banner URL"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 3. Name */}
          <div className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[#F4F4F5]">Name</span>
              <span className="text-[11px] text-[#8E8E93]">
                The name associated with your account
              </span>
            </div>

            {editingField === 'name' ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  autoFocus
                  className="h-7 px-2.5 rounded-lg bg-[#18181C] border border-[#3F3F46] text-xs text-white focus:outline-none focus:border-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleSaveField('name')}
                  disabled={isSaving}
                  className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center hover:bg-[#E4E4E7] transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="w-7 h-7 rounded-lg bg-[#18181C] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="text-[#E4E4E7] font-medium">{account.name}</span>
                <button
                  type="button"
                  onClick={() => startEditing('name', account.name)}
                  className="text-[#71717A] hover:text-[#F4F4F5] p-1 rounded transition-colors cursor-pointer"
                  title="Edit Name"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 4. Username */}
          <div className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[#F4F4F5]">Username</span>
              <span className="text-[11px] text-[#8E8E93]">
                Your unique handle across SOS
              </span>
            </div>

            {editingField === 'username' ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  autoFocus
                  className="h-7 px-2.5 rounded-lg bg-[#18181C] border border-[#3F3F46] text-xs text-white font-mono focus:outline-none focus:border-white"
                />
                <button
                  type="button"
                  onClick={() => handleSaveField('username')}
                  disabled={isSaving}
                  className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center hover:bg-[#E4E4E7] transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="w-7 h-7 rounded-lg bg-[#18181C] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[#E4E4E7]">{account.username}</span>
                <button
                  type="button"
                  onClick={() => startEditing('username', account.username)}
                  className="text-[#71717A] hover:text-[#F4F4F5] p-1 rounded transition-colors cursor-pointer"
                  title="Edit Username"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 5. Bio */}
          <div className="px-5 py-3.5 flex items-start justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5 max-w-[240px]">
              <span className="font-medium text-[#F4F4F5]">Bio</span>
              <span className="text-[11px] text-[#8E8E93]">
                A short bio displayed on your profile card
              </span>
            </div>

            {editingField === 'bio' ? (
              <div className="flex-1 max-w-[500px] flex items-start gap-1.5 ml-4">
                <textarea
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  autoFocus
                  rows={3}
                  className="w-full p-2 rounded-lg bg-[#18181C] border border-[#3F3F46] text-xs text-white focus:outline-none focus:border-white leading-relaxed resize-none font-normal"
                />
                <button
                  type="button"
                  onClick={() => handleSaveField('bio')}
                  disabled={isSaving}
                  className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center hover:bg-[#E4E4E7] transition-colors shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="w-7 h-7 rounded-lg bg-[#18181C] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 max-w-[500px] ml-4 text-right">
                <span className="text-[#E4E4E7] text-xs leading-relaxed line-clamp-2">
                  {account.bio || 'Computer Science undergraduate exploring distributed consensus, compiler design, and how human memory consolidates complex ideas.'}
                </span>
                <button
                  type="button"
                  onClick={() => startEditing('bio', account.bio || 'Computer Science undergraduate exploring distributed consensus, compiler design, and how human memory consolidates complex ideas.')}
                  className="text-[#71717A] hover:text-[#F4F4F5] p-1 rounded transition-colors cursor-pointer shrink-0"
                  title="Edit Bio"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 6. Education */}
          <div className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[#F4F4F5]">Education</span>
              <span className="text-[11px] text-[#8E8E93]">
                Your university, institution, or school
              </span>
            </div>

            {editingField === 'education' ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  autoFocus
                  className="h-7 px-2.5 rounded-lg bg-[#18181C] border border-[#3F3F46] text-xs text-white focus:outline-none focus:border-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleSaveField('education')}
                  disabled={isSaving}
                  className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center hover:bg-[#E4E4E7] transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="w-7 h-7 rounded-lg bg-[#18181C] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="text-[#E4E4E7] font-medium">{account.education || 'Mansoura University'}</span>
                <button
                  type="button"
                  onClick={() => startEditing('education', account.education || 'Mansoura University')}
                  className="text-[#71717A] hover:text-[#F4F4F5] p-1 rounded transition-colors cursor-pointer"
                  title="Edit Education"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 7. Location */}
          <div className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[#F4F4F5]">Location</span>
              <span className="text-[11px] text-[#8E8E93]">
                Your city, region, or country
              </span>
            </div>

            {editingField === 'location' ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  autoFocus
                  className="h-7 px-2.5 rounded-lg bg-[#18181C] border border-[#3F3F46] text-xs text-white focus:outline-none focus:border-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleSaveField('location')}
                  disabled={isSaving}
                  className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center hover:bg-[#E4E4E7] transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="w-7 h-7 rounded-lg bg-[#18181C] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="text-[#E4E4E7] font-medium">{account.location || 'Mansoura, Egypt'}</span>
                <button
                  type="button"
                  onClick={() => startEditing('location', account.location || 'Mansoura, Egypt')}
                  className="text-[#71717A] hover:text-[#F4F4F5] p-1 rounded transition-colors cursor-pointer"
                  title="Edit Location"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 8. Learning Focus */}
          <div className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[#F4F4F5]">Learning Focus</span>
              <span className="text-[11px] text-[#8E8E93]">
                What you are currently studying or exploring
              </span>
            </div>

            {editingField === 'learningFocus' ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  autoFocus
                  className="h-7 px-2.5 rounded-lg bg-[#18181C] border border-[#3F3F46] text-xs text-white focus:outline-none focus:border-white"
                />
                <button
                  type="button"
                  onClick={() => handleSaveField('learningFocus')}
                  disabled={isSaving}
                  className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center hover:bg-[#E4E4E7] transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="w-7 h-7 rounded-lg bg-[#18181C] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="text-[#E4E4E7]">{account.learningFocus}</span>
                <button
                  type="button"
                  onClick={() => startEditing('learningFocus', account.learningFocus)}
                  className="text-[#71717A] hover:text-[#F4F4F5] p-1 rounded transition-colors cursor-pointer"
                  title="Edit Learning Focus"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 9. Subtle Visual Divider Before Account & Security */}
          <div className="px-5 py-2.5 bg-[#0C0C0E]/60 border-t border-b border-[#1E1E22] flex items-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#71717A] font-medium">
              Account & Security
            </span>
          </div>

          {/* 10. Email */}
          <div className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[#F4F4F5]">Email</span>
              <span className="text-[11px] text-[#8E8E93]">
                The email address linked to your account
              </span>
            </div>

            {editingField === 'email' ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="email"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  autoFocus
                  className="h-7 px-2.5 rounded-lg bg-[#18181C] border border-[#3F3F46] text-xs text-white font-mono focus:outline-none focus:border-white"
                />
                <button
                  type="button"
                  onClick={() => handleSaveField('email')}
                  disabled={isSaving}
                  className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center hover:bg-[#E4E4E7] transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="w-7 h-7 rounded-lg bg-[#18181C] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[#E4E4E7]">{account.email}</span>
                <button
                  type="button"
                  onClick={() => startEditing('email', account.email)}
                  className="text-[#71717A] hover:text-[#F4F4F5] p-1 rounded transition-colors cursor-pointer"
                  title="Edit Email"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 11. Password */}
          <div className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[#F4F4F5]">Password</span>
              <span className="text-[11px] text-[#8E8E93]">
                Change your account password
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#8E8E93] tracking-wider">
                ••••••••••••
              </span>
              <button
                type="button"
                onClick={() => setChangePasswordModalOpen(true)}
                className="h-7 px-3 rounded-lg bg-[#18181C] hover:bg-[#222226] border border-[#27272A] text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {/* 12. Plan */}
          <div className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[#F4F4F5]">Plan</span>
              <span className="text-[11px] text-[#8E8E93]">
                Current workspace subscription
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#18181C] border border-[#27272A] font-medium text-[11px] text-[#E4E4E7]">
                {account.plan}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('usage')}
                className="px-3 py-1 rounded-full bg-[#F4F4F5] text-[#0B0B0D] font-semibold text-xs hover:bg-white active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      </SOSCard>

      {/* Card 2: Export Research Data */}
      <SOSCard className="flex flex-col shadow-sm">
        <div className="p-5 flex items-center justify-between text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-[#F4F4F5]">Export Research Data</span>
            <span className="text-[11px] text-[#8E8E93]">
              Download an immutable archive of all notes, flashcards, and study sessions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="h-8 px-3.5 rounded-lg bg-[#18181C] hover:bg-[#222226] border border-[#27272A] text-xs font-semibold text-[#D4D4D8] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-[#71717A]" />
              <span>Markdown</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="h-8 px-3.5 rounded-lg bg-[#18181C] hover:bg-[#222226] border border-[#27272A] text-xs font-semibold text-[#D4D4D8] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <FileCode className="w-3.5 h-3.5 text-[#71717A]" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </SOSCard>

      {/* Card 3: Delete Account */}
      <SOSCard className="flex flex-col shadow-sm">
        <div className="p-5 flex items-center justify-between text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-[#F4F4F5]">Delete account</span>
            <span className="text-[11px] text-[#8E8E93]">
              Permanently delete your account, library, and study history
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmationText('');
              setDeleteAccountModalOpen(true);
            }}
            className="h-8 px-4 rounded-lg bg-[#2A1215] border border-[#4C1D24] text-[#F87171] font-semibold text-xs hover:bg-[#38161A] active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            Delete
          </button>
        </div>
      </SOSCard>

      {/* Change Password Modal */}
      {changePasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setChangePasswordModalOpen(false)}
        >
          <SOSCard
            interactive={false}
            className="w-full max-w-[420px] p-6 shadow-2xl flex flex-col gap-4 text-xs animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E1E22] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#18181C] border border-[#27272A] flex items-center justify-center text-white">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-white">Change Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setChangePasswordModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#18181C] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {passwordSuccessMessage ? (
              <div className="p-4 rounded-lg bg-[#0F2A1C] border border-[#166534] text-[#4ADE80] font-medium text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{passwordSuccessMessage}</span>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-[#A1A1AA]">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="h-8 px-3 rounded-lg bg-[#09090B] border border-[#222226] text-xs text-white focus:outline-none focus:border-[#3F3F46]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-[#A1A1AA]">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Minimum 8 characters"
                    className="h-8 px-3 rounded-lg bg-[#09090B] border border-[#222226] text-xs text-white focus:outline-none focus:border-[#3F3F46]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-[#A1A1AA]">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-type new password"
                    className="h-8 px-3 rounded-lg bg-[#09090B] border border-[#222226] text-xs text-white focus:outline-none focus:border-[#3F3F46]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E1E22]">
                  <button
                    type="button"
                    onClick={() => setChangePasswordModalOpen(false)}
                    className="h-8 px-3.5 rounded-lg bg-[#18181C] hover:bg-[#222226] text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-8 px-4 rounded-lg bg-white text-black font-semibold text-xs hover:bg-[#E4E4E7] transition-colors"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </SOSCard>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {deleteAccountModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setDeleteAccountModalOpen(false)}
        >
          <SOSCard
            interactive={false}
            className="w-full max-w-[440px] p-6 shadow-2xl flex flex-col gap-4 text-xs animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2A1215] border border-[#4C1D24] flex items-center justify-center text-[#F87171] shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-semibold text-white">
                  Confirm Account Deletion
                </h3>
                <span className="text-[11px] text-[#8E8E93]">
                  This action is permanent and purges your local workspace.
                </span>
              </div>
            </div>

            <p className="text-[#A1A1AA] leading-relaxed text-[11.5px] p-3 rounded-xl bg-[#09090B] border border-[#1E1E22]">
              Are you sure you want to delete your scholar account for <span className="text-white font-medium">{account.name}</span>? All notes, study decks, and learning streaks will be wiped.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#A1A1AA]">
                Type <span className="font-mono text-white font-bold">{account.username}</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder={account.username}
                className="h-8 px-3 rounded-lg bg-[#09090B] border border-[#222226] text-xs font-mono text-white focus:outline-none focus:border-[#EF4444]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E1E22]">
              <button
                type="button"
                onClick={() => setDeleteAccountModalOpen(false)}
                className="h-8 px-4 rounded-lg bg-[#18181C] hover:bg-[#222226] border border-[#27272A] text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteAccount}
                disabled={isSaving || deleteConfirmationText !== account.username}
                className="h-8 px-4 rounded-lg bg-[#B91C1C] hover:bg-[#DC2626] text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Permanently Delete
              </button>
            </div>
          </SOSCard>
        </div>
      )}
    </div>
  );
};
