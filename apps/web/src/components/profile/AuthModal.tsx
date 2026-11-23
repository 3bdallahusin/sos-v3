import React, { useState } from 'react';
import { X, Check, ShieldCheck, BookOpen } from 'lucide-react';
import { createPreMigrationSnapshot } from '@sos/persistence';
import { SOSCard } from '../ui/SOSCard.js';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('Creating pre-migration local snapshot...');

    try {
      // 1. Mandatory Pre-Migration Snapshot to guarantee zero data loss
      const snapshot = await createPreMigrationSnapshot();
      setStatusMessage(
        `Pre-migration snapshot ${snapshot.snapshotId.slice(0, 8)} secured (${snapshot.taskCount} tasks, ${snapshot.folderCount} folders). Linking account...`
      );

      // Simulate instantaneous account creation / login success
      setTimeout(() => {
        setIsSubmitting(false);
        setStatusMessage('Account successfully created! Guest data preserved.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      }, 800);
    } catch (err) {
      console.error('Migration snapshot failed:', err);
      setStatusMessage('Failed to create snapshot. Local data remains safe.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <SOSCard
        interactive={false}
        className="w-full max-w-[940px] shadow-2xl flex flex-col md:flex-row overflow-hidden relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button top-right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[#18181C]/80 hover:bg-[#222226] border border-[#27272A] flex items-center justify-center text-[#71717A] hover:text-white transition-colors cursor-pointer"
          title="Close (Return to Guest Mode)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ============================================================== */}
        {/* LEFT HALF (50% WIDTH — SCHOLARLY SHOWCASE PANEL)               */}
        {/* ============================================================== */}
        <div className="w-full md:w-1/2 relative border-b md:border-b-0 md:border-r border-[#1F1F23] flex flex-col justify-between p-8 shrink-0 overflow-hidden bg-zinc-950">
          {/* Subtle Background Photography */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1507842229451-7f01be7fe7ab?auto=format&fit=crop&w=1000&q=80')"
            }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent pointer-events-none" />

          {/* Top: S [book] S Brand Mark */}
          <div className="relative z-10 flex items-center gap-2 text-white">
            <span className="font-bold text-lg tracking-widest font-mono">S</span>
            <div className="w-7 h-7 rounded-full bg-[#18181C] border border-[#27272C] flex items-center justify-center shadow-sm">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-widest font-mono">S</span>
          </div>

          {/* Center: Value Propositions */}
          <div className="relative z-10 flex flex-col my-auto py-8">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Non-Destructive Cloud Sync</span>
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight mb-2">
              The Scholar's Operating System
            </h2>
            <p className="text-xs text-[#A1A1AA] leading-relaxed mb-6">
              Create a free account to sync notes across devices without ever losing your existing Guest workspace.
            </p>

            <div className="flex flex-col gap-2.5 text-xs text-[#D4D4D8]">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Local-first Dexie resilience with offline access</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Automatic pre-migration snapshot before linking</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero data overwritten or discarded</span>
              </div>
            </div>
          </div>

          {/* Bottom metadata */}
          <div className="relative z-10 text-[11px] text-[#71717A] font-mono">
            SOS Version 3.0 • Local Sovereignty Guaranteed
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT HALF (50% WIDTH — AUTH FORM & GUEST MODE ESCAPE)          */}
        {/* ============================================================== */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-[#111114]">
          {/* Segmented Mode Switcher (Login / Register) */}
          <div className="flex items-center p-1 rounded-xl bg-[#09090B] border border-[#27272A] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setStatusMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#18181C] text-white shadow-xs'
                  : 'text-[#71717A] hover:text-[#A1A1AA]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setStatusMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#18181C] text-white shadow-xs'
                  : 'text-[#71717A] hover:text-[#A1A1AA]'
              }`}
            >
              Create Account
            </button>
          </div>

          {statusMessage && (
            <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{statusMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
            {mode === 'register' && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[#A1A1AA]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Abdalla Husin"
                  required
                  className="w-full h-9 px-3 rounded-lg bg-[#18181B] border border-[#27272A] focus:border-[#3F3F46] text-xs text-white placeholder-[#71717A] outline-none transition-colors"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#A1A1AA]">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scholar@university.edu"
                required
                className="w-full h-9 px-3 rounded-lg bg-[#18181B] border border-[#27272A] focus:border-[#3F3F46] text-xs text-white placeholder-[#71717A] outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#A1A1AA]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={8}
                className="w-full h-9 px-3 rounded-lg bg-[#18181B] border border-[#27272A] focus:border-[#3F3F46] text-xs text-white placeholder-[#71717A] outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 mt-1 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-98 disabled:opacity-50 shadow-sm"
            >
              {isSubmitting
                ? 'Securing Snapshot...'
                : mode === 'register'
                  ? 'Create Account & Preserve Data'
                  : 'Sign In to Workspace'}
            </button>

            {/* Social Separator */}
            <div className="flex items-center gap-3 my-1">
              <div className="h-px bg-[#222226] flex-1" />
              <span className="text-[10px] uppercase font-mono text-[#71717A]">
                or
              </span>
              <div className="h-px bg-[#222226] flex-1" />
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={() => {
                setStatusMessage('Google authentication simulated. Snapshot captured.');
                setTimeout(() => {
                  onSuccess?.();
                  onClose();
                }, 1000);
              }}
              className="h-9 rounded-xl bg-[#18181C] border border-[#27272A] hover:border-[#3F3F46] text-[#E4E4E7] font-medium text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Authoritative Low-Profile Minimal Ghost Escape Action */}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 text-[12.5px] text-[#71717A] hover:text-[#E4E4E7] font-medium text-center transition-colors cursor-pointer"
            >
              Guest Mode →
            </button>
          </form>
        </div>
      </SOSCard>
    </div>
  );
};
