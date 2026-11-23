import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import {
  Share2,
  Pencil,
  MapPin,
  Calendar,
  GraduationCap,
  Clock,
  Flame,
  Gauge,
  Check
} from 'lucide-react';
import { AnnualActivityHeatmap } from '../components/tracking/AnnualActivityHeatmap.js';
import { useSettingsStore } from '../stores/settings-store.js';
import type { UserProfile } from '@sos/domain';
import type { ProfileTelemetryResponseContract } from '@sos/contracts';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop';
const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida/ALJJyrBE6EhsHOqBp174KlEE0XrgpcMjQmblnn2X7vXwDJVOKYPKb7yDZ06Vw_NqRcsrxOTsrvWRxDQX_0hgDLbZ2XZM7agGIy8rbv8bYGWpaF2d30oXkxqAisUNXabuoiebdVqFtSLIzj8vaZjVK-aSHuO3rGxN6TKHDCpJKjXzUfwMEsiIP42arHCi1DVwgFwpbkHrHihNRxcMxFhP6g71n-Ej2xAqvNVjJ8X9dDARkQt3DmGe0NVBhLB-3fYriiCAu3BiIg';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, loadSettings } = useSettingsStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [telemetry, setTelemetry] = useState<ProfileTelemetryResponseContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch profile identity & telemetry in parallel
      const [profileRes, telemetryRes] = await Promise.all([
        fetch('/api/profile').catch(() => null),
        fetch('/api/profile/telemetry').catch(() => null)
      ]);

      if (profileRes && profileRes.ok) {
        const profileData: UserProfile = await profileRes.json();
        setProfile(profileData);
      } else {
        // Fallback to store settings
        const acc = settings.account;
        setProfile({
          id: 'default-user',
          name: acc.name || 'Abdalla Husin',
          handle: acc.username || '@abdalla7usin',
          isAuthenticated: true,
          bio: acc.bio || 'Computer Science undergraduate exploring distributed consensus, compiler design, and how human memory consolidates complex ideas.',
          location: acc.location || 'Mansoura, Egypt',
          education: acc.education || 'Mansoura University',
          coverImage: acc.coverImage || DEFAULT_COVER,
          avatarUrl: acc.avatarUrl || DEFAULT_AVATAR,
          joinedDate: acc.joinedDate || 'November 2026'
        });
      }

      if (telemetryRes && telemetryRes.ok) {
        const telemetryData: ProfileTelemetryResponseContract = await telemetryRes.json();
        setTelemetry(telemetryData);
      } else {
        // Fallback default empty telemetry
        setTelemetry({
          totalStudyTimeHours: 0,
          totalStudyTimeFormatted: '0 Hours',
          currentStreakDays: 0,
          currentStreakFormatted: '0 Days',
          dailyAverageHours: 0,
          dailyAverageFormatted: '0 Hours',
          startDate: '2025-11-23',
          endDate: '2026-11-23',
          dateRangeLabel: 'Dec 2025 - Nov 2026',
          weeks: []
        });
      }
    } catch (err) {
      console.warn('Failed to load profile data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [settings.account]);

  useEffect(() => {
    loadSettings();
    fetchProfileData();
  }, [loadSettings, fetchProfileData]);

  // Handle Share Click: Copy URL and trigger toast
  const handleShareClick = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setToastMessage('Profile link copied to clipboard');
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Loading skeleton state
  if (isLoading && !profile) {
    return (
      <div data-testid="profile-loading" className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0A0A] w-full">
        <div className="max-w-[1060px] mx-auto px-6 py-6 flex flex-col gap-4 w-full">
          {/* Skeleton Header Card */}
          <div className="bg-[#121214] border border-white/[0.08] rounded-2xl overflow-hidden h-[340px] animate-pulse relative" />
          {/* Skeleton Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-8 bg-[#121214] border border-white/[0.08] rounded-2xl h-[240px] animate-pulse" />
            <div className="lg:col-span-4 flex flex-col justify-between gap-3 h-[240px]">
              <div className="bg-[#121214] border border-white/[0.08] rounded-2xl flex-1 animate-pulse" />
              <div className="bg-[#121214] border border-white/[0.08] rounded-2xl flex-1 animate-pulse" />
              <div className="bg-[#121214] border border-white/[0.08] rounded-2xl flex-1 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeProfile = profile || {
    id: 'default-user',
    name: settings.account.name || 'Abdalla Husin',
    handle: settings.account.username || '@abdalla7usin',
    isAuthenticated: true,
    bio: settings.account.bio || 'Computer Science undergraduate exploring distributed consensus, compiler design, and how human memory consolidates complex ideas.',
    location: settings.account.location || 'Mansoura, Egypt',
    education: settings.account.education || 'Mansoura University',
    coverImage: settings.account.coverImage || DEFAULT_COVER,
    avatarUrl: settings.account.avatarUrl || DEFAULT_AVATAR,
    joinedDate: settings.account.joinedDate || 'November 2026'
  };

  return (
    <div
      data-testid="profile-page"
      className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0A0A] w-full select-text"
    >
      <div className="max-w-[1060px] mx-auto px-6 py-6 flex flex-col gap-4 w-full select-text">

        {/* 1. CENTERED IDENTITY HEADER CARD */}
        <section
          data-testid="profile-identity-card"
          className="bg-[#121214] border border-white/[0.08] rounded-2xl overflow-hidden relative w-full select-text"
        >
          {/* Monochrome Cover Banner */}
          <div className="relative h-[180px] w-full bg-[#161619] overflow-hidden pointer-events-none">
            <img
              src={activeProfile.coverImage || DEFAULT_COVER}
              alt="Profile cover banner"
              className="w-full h-full object-cover object-center opacity-70 grayscale contrast-110 select-none pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/35 to-black/25 pointer-events-none" />

            {/* Top-Right Side-by-Side Frosted Action Buttons */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={handleShareClick}
                title="Share Profile"
                aria-label="Share Profile"
                data-testid="profile-share-button"
                className="w-[34px] h-[34px] rounded-[8px] bg-[#121214]/75 backdrop-blur-[8px] border border-white/[0.1] hover:border-white/[0.22] text-[#E4E4E7] hover:text-[#FFFFFF] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Share2 className="w-[15px] h-[15px]" />
              </button>
              <Link
                to="/settings"
                title="Edit Profile"
                aria-label="Edit Profile"
                data-testid="profile-edit-button"
                className="w-[34px] h-[34px] rounded-[8px] bg-[#121214]/75 backdrop-blur-[8px] border border-white/[0.1] hover:border-white/[0.22] text-[#E4E4E7] hover:text-[#FFFFFF] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Pencil className="w-[15px] h-[15px]" />
              </Link>
            </div>
          </div>

          {/* Centered Overlapping Avatar + Identity Stack */}
          <div className="px-6 pb-7 -mt-10 relative z-10 flex flex-col items-center text-center">
            {/* Centered Circular Avatar (80px) with 2px #0A0A0A border ring */}
            <div className="w-[80px] h-[80px] rounded-full border-2 border-[#0A0A0A] ring-1 ring-white/[0.12] overflow-hidden bg-[#121214] shadow-xl shrink-0">
              <img
                src={activeProfile.avatarUrl || DEFAULT_AVATAR}
                alt={activeProfile.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Centered Display Name (22px bold white) */}
            <h2 data-testid="profile-name" className="mt-3.5 text-[22px] font-bold text-[#FAFAFA] tracking-tight leading-tight">
              {activeProfile.name}
            </h2>

            {/* Centered Username (monospace muted gray) */}
            <p data-testid="profile-username" className="mt-1 font-mono text-[13px] text-[#8E8E93]">
              {activeProfile.handle.startsWith('@') ? activeProfile.handle : `@${activeProfile.handle}`}
            </p>

            {/* Centered Bio (max-width 600px, #A1A1AA) */}
            <p data-testid="profile-bio" className="mt-3 text-[13.5px] text-[#A1A1AA] leading-[1.6] max-w-[600px]">
              {activeProfile.bio || 'Computer Science undergraduate exploring distributed consensus, compiler design, and how human memory consolidates complex ideas.'}
            </p>

            {/* Centered Metadata Row below Bio */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-[#8E8E93]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8E8E93]" />
                <span>{activeProfile.location || 'Mansoura, Egypt'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#8E8E93]" />
                <span>Joined {activeProfile.joinedDate || 'November 2026'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#8E8E93]" />
                <span>{activeProfile.education || activeProfile.institution || 'Mansoura University'}</span>
              </span>
            </div>
          </div>
        </section>

        {/* 2. BENTO TELEMETRY SECTION: 2/3 ANNUAL ACTIVITY HEATMAP + 1/3 STACKED TELEMETRY CARDS */}
        <section
          data-testid="profile-bento-grid"
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch pb-4 w-full"
        >
          {/* Left Side — 2/3 Width (lg:col-span-8): Annual Activity Heatmap filling full height */}
          <div data-testid="profile-heatmap-section" className="lg:col-span-8 h-full flex flex-col">
            <AnnualActivityHeatmap
              variant="profile"
              className="h-full flex flex-col justify-between"
              data={
                telemetry
                  ? {
                      weeks: telemetry.weeks,
                      startDate: telemetry.startDate,
                      endDate: telemetry.endDate,
                      dateRangeLabel: telemetry.dateRangeLabel,
                      totalHours: telemetry.totalStudyTimeHours,
                      currentStreak: telemetry.currentStreakDays
                    }
                  : undefined
              }
            />
          </div>

          {/* Right Side — 1/3 Width (lg:col-span-4): Vertical stack of 3 equal-height telemetry cards */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3 h-full">
            {/* Card 1: Total Study Time */}
            <article
              data-testid="profile-total-study-time-card"
              className="bg-[#121214] border border-white/[0.08] rounded-2xl p-4 flex-1 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8E8E93]">
                  TOTAL STUDY TIME
                </span>
                <Clock className="w-4 h-4 text-[#8E8E93]" />
              </div>
              <div className="text-[22px] font-semibold text-[#FFFFFF] tracking-tight tabular-nums pt-1">
                {telemetry?.totalStudyTimeFormatted ?? '0 Hours'}
              </div>
            </article>

            {/* Card 2: Current Streak */}
            <article
              data-testid="profile-current-streak-card"
              className="bg-[#121214] border border-white/[0.08] rounded-2xl p-4 flex-1 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8E8E93]">
                  CURRENT STREAK
                </span>
                <Flame className="w-4 h-4 text-[#8E8E93]" />
              </div>
              <div className="text-[22px] font-semibold text-[#FFFFFF] tracking-tight tabular-nums pt-1">
                {telemetry?.currentStreakFormatted ?? '0 Days'}
              </div>
            </article>

            {/* Card 3: Daily Average */}
            <article
              data-testid="profile-daily-average-card"
              className="bg-[#121214] border border-white/[0.08] rounded-2xl p-4 flex-1 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8E8E93]">
                  DAILY AVERAGE
                </span>
                <Gauge className="w-4 h-4 text-[#8E8E93]" />
              </div>
              <div className="text-[22px] font-semibold text-[#FFFFFF] tracking-tight tabular-nums pt-1">
                {telemetry?.dailyAverageFormatted ?? '0 Hours'}
              </div>
            </article>
          </div>
        </section>

      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          data-testid="profile-toast"
          className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-[#18181B] border border-white/[0.12] text-xs font-medium text-white shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none"
        >
          <Check className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
