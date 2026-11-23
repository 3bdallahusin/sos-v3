import React from 'react';
import {
  MapPin,
  Calendar,
  Link as LinkIcon,
  Pencil,
  Share2,
  BadgeCheck
} from 'lucide-react';
import type { UserProfile, ProfileTab } from '@sos/domain';
import { SOSCard } from '../ui/SOSCard.js';

export interface ProfileHeaderCardProps {
  profile: UserProfile;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  onEditProfile: () => void;
  counts?: {
    posts?: number;
    media?: number;
    resources?: number;
    communities?: number;
  };
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  profile,
  activeTab,
  onTabChange,
  onEditProfile,
  counts
}) => {
  const followersCount = profile.stats?.followersCount ?? 0;
  const followingCount = profile.stats?.followingCount ?? 0;

  const postsCount = counts?.posts ?? 0;
  const mediaCount = counts?.media ?? 0;
  const resourcesCount = counts?.resources ?? 0;
  const communitiesCount = counts?.communities ?? 0;

  return (
    <SOSCard
      tier={1}
      className="w-full mb-4 shadow-sm"
      innerClassName="flex flex-col"
    >
      {/* 1. Cover Banner with Dark Scholarly Aesthetics */}
      <div className="w-full h-36 relative border-b border-[#1E1E22] overflow-hidden bg-zinc-950">
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
          alt="Cover Banner"
          className="w-full h-full object-cover brightness-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-transparent to-transparent pointer-events-none" />

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[#71717A] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Share Profile"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Profile Details & Actions */}
      <div className="px-6 pb-5 pt-0 flex flex-col gap-3 relative">
        {/* Avatar & Action Button Row */}
        <div className="flex items-end justify-between -mt-10 mb-2">
          {/* Portrait Avatar with 4px #111113 ring */}
          <div className="w-20 h-20 rounded-full border-4 border-[#111113] ring-1 ring-white/10 overflow-hidden shadow-2xl shrink-0 z-10 bg-[#161619] flex items-center justify-center">
            <img
              src={profile.avatarUrl || '/avatars/abdalla.jpg'}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Action Button: Single Restrained Dark Pill matching Stitch */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEditProfile}
              className="h-8 px-4 rounded-full bg-[#161619] hover:bg-[#1E1E22] border border-[#242428] text-xs font-semibold text-[#D4D4D8] hover:text-[#FAFAFA] flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Name, Handle, and Verified Badge */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight">
              {profile.name}
            </h1>
            <span className="text-xs text-[#A1A1AA] font-mono">
              {profile.handle}
            </span>
            <BadgeCheck className="w-4 h-4 text-[#FAFAFA]" />
          </div>

          {profile.bio && (
            <p className="text-xs text-[#A1A1AA] leading-relaxed pt-1">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Single-line merged metadata row (Clean, no stray divider above) */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-xs pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white font-mono">
              {followersCount.toLocaleString()}
            </span>
            <span className="text-[#8E8E93]">Followers</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white font-mono">
              {followingCount.toLocaleString()}
            </span>
            <span className="text-[#8E8E93]">Following</span>
          </div>

          {profile.location && (
            <div className="flex items-center gap-1.5 text-[#A1A1AA]">
              <MapPin className="w-3.5 h-3.5 text-[#8E8E93]" />
              <span>{profile.location}</span>
            </div>
          )}

          {profile.website && (
            <div className="flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-[#8E8E93]" />
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="text-[#D4D4D8] hover:text-white hover:underline transition-colors font-mono"
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          {profile.joinedDate && (
            <div className="flex items-center gap-1.5 text-[#A1A1AA]">
              <Calendar className="w-3.5 h-3.5 text-[#8E8E93]" />
              <span>Joined {profile.joinedDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. The 5 Stitch Authoritative Tabs: Posts | Media | Resources | Communities | Activity */}
      <div className="flex items-center gap-8 px-6 border-t border-[#1E1E22] text-xs font-semibold overflow-x-auto select-none custom-scrollbar">
        <button
          type="button"
          onClick={() => onTabChange('posts')}
          className={`py-3 transition-colors relative cursor-pointer ${
            activeTab === 'posts'
              ? 'text-white border-b-2 border-white tracking-tight'
              : 'text-[#8E8E93] hover:text-[#D4D4D8]'
          }`}
        >
          Posts ({postsCount})
        </button>

        <button
          type="button"
          onClick={() => onTabChange('media')}
          className={`py-3 transition-colors relative cursor-pointer ${
            activeTab === 'media'
              ? 'text-white border-b-2 border-white tracking-tight'
              : 'text-[#8E8E93] hover:text-[#D4D4D8]'
          }`}
        >
          Media ({mediaCount})
        </button>

        <button
          type="button"
          onClick={() => onTabChange('resources')}
          className={`py-3 transition-colors relative cursor-pointer ${
            activeTab === 'resources'
              ? 'text-white border-b-2 border-white tracking-tight'
              : 'text-[#8E8E93] hover:text-[#D4D4D8]'
          }`}
        >
          Resources ({resourcesCount})
        </button>

        <button
          type="button"
          onClick={() => onTabChange('communities')}
          className={`py-3 transition-colors relative cursor-pointer ${
            activeTab === 'communities'
              ? 'text-white border-b-2 border-white tracking-tight'
              : 'text-[#8E8E93] hover:text-[#D4D4D8]'
          }`}
        >
          Communities ({communitiesCount})
        </button>

        <button
          type="button"
          onClick={() => onTabChange('activity')}
          className={`py-3 transition-colors relative cursor-pointer ${
            activeTab === 'activity'
              ? 'text-white border-b-2 border-white tracking-tight'
              : 'text-[#8E8E93] hover:text-[#D4D4D8]'
          }`}
        >
          Activity
        </button>
      </div>
    </SOSCard>
  );
};
