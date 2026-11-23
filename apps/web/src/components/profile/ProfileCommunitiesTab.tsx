import React from 'react';
import { Users, Check, Plus } from 'lucide-react';
import type { UserCommunity } from '@sos/domain';
import { SOSCard } from '../ui/SOSCard.js';

export interface ProfileCommunitiesTabProps {
  communities: UserCommunity[];
}

export const ProfileCommunitiesTab: React.FC<ProfileCommunitiesTabProps> = ({
  communities
}) => {
  if (communities.length === 0) {
    return (
      <SOSCard
        tier={2}
        className="py-12 px-6 text-center w-full"
        innerClassName="flex flex-col items-center justify-center gap-2.5"
      >
        <div className="w-10 h-10 rounded-full bg-[#161619] border border-[#242428] flex items-center justify-center text-[#A1A1AA]">
          <Users className="w-4 h-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xs font-semibold text-white">No communities joined</h3>
          <p className="text-[11px] text-[#8E8E93] max-w-sm">
            Discover and collaborate with research collectives, student study groups, and academic labs.
          </p>
        </div>
        <button
          type="button"
          className="mt-1 h-7 px-3.5 rounded-full bg-[#161619] hover:bg-[#1E1E22] border border-[#242428] text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors cursor-default flex items-center gap-1.5"
        >
          <Plus className="w-3 h-3" />
          <span>Explore Communities</span>
        </button>
      </SOSCard>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
      {communities.map((community) => (
        <SOSCard
          key={community.id}
          tier={2}
          className="p-3.5 shadow-sm"
          innerClassName="flex flex-col justify-between gap-3 h-full"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#161619] border border-[#242428] flex items-center justify-center text-base shrink-0 shadow-sm">
              {community.icon || '🎓'}
            </div>

            <div className="flex flex-col gap-0.5 truncate">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white tracking-tight truncate">
                  {community.name}
                </span>
                {community.role === 'moderator' && (
                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono text-indigo-300">
                    MOD
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#8E8E93] font-mono">
                {community.handle}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#A1A1AA] leading-relaxed line-clamp-2">
            {community.description}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-[#1F1F23]/60 text-xs">
            <span className="text-[11px] font-mono text-[#8E8E93]">
              {community.membersCount.toLocaleString()} Members
            </span>

            <span className="h-6 px-2.5 rounded-full bg-[#141417] border border-[#27272A] text-[11px] text-[#D4D4D8] flex items-center gap-1 font-medium select-none">
              <Check className="w-3 h-3 text-[#FAFAFA]" />
              <span>Joined</span>
            </span>
          </div>
        </SOSCard>
      ))}
    </div>
  );
};
