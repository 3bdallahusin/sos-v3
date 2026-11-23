import React from 'react';
import { Image as ImageIcon, Plus } from 'lucide-react';
import type { UserPost } from '@sos/domain';
import { SOSCard } from '../ui/SOSCard.js';

export interface ProfileMediaTabProps {
  posts: UserPost[];
  onNavigateToPosts?: () => void;
}

export const ProfileMediaTab: React.FC<ProfileMediaTabProps> = ({
  posts,
  onNavigateToPosts
}) => {
  const mediaPosts = posts.filter((p) => Boolean(p.mediaUrl));

  if (mediaPosts.length === 0) {
    return (
      <SOSCard
        tier={2}
        className="py-12 px-6 text-center w-full"
        innerClassName="flex flex-col items-center justify-center gap-2.5"
      >
        <div className="w-10 h-10 rounded-full bg-[#161619] border border-[#242428] flex items-center justify-center text-[#A1A1AA]">
          <ImageIcon className="w-4 h-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xs font-semibold text-white">No media shared yet</h3>
          <p className="text-[11px] text-[#8E8E93] max-w-sm">
            Whiteboard recaps, diagrams, and lecture photos attached to your study posts will be curated here.
          </p>
        </div>
        {onNavigateToPosts && (
          <button
            type="button"
            onClick={onNavigateToPosts}
            className="mt-1 h-7 px-3.5 rounded-full bg-[#161619] hover:bg-[#1E1E22] border border-[#242428] text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" />
            <span>Create your first post</span>
          </button>
        )}
      </SOSCard>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Balanced, well-proportioned 2-to-3 column gallery grid with clean 16:10 frames */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
        {mediaPosts.map((post) => (
          <SOSCard
            key={post.id}
            tier={2}
            className="group cursor-pointer shadow-sm"
            innerClassName="flex flex-col"
          >
            {/* 16:10 Aspect Ratio Image Frame */}
            <div className="w-full aspect-[16/10] overflow-hidden bg-zinc-950 relative">
              <img
                src={post.mediaUrl}
                alt={post.content.slice(0, 40)}
                className="w-full h-full object-cover transition-all duration-150 ease-out group-hover:scale-[1.015] group-hover:opacity-95"
              />
            </div>

            {/* Subtle Metadata Footer below the image */}
            <div className="p-3 flex flex-col gap-1 border-t border-[#1F1F23]">
              <p className="text-[11.5px] text-[#D4D4D8] line-clamp-2 leading-relaxed">
                {post.content}
              </p>
              <div className="flex items-center justify-between text-[10.5px] text-[#8E8E93] font-mono pt-1">
                <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>{post.likesCount} Likes</span>
              </div>
            </div>
          </SOSCard>
        ))}
      </div>
    </div>
  );
};
