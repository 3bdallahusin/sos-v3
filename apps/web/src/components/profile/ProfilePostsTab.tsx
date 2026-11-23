import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Repeat,
  Share2,
  Pin,
  Layers,
  GitFork,
  BookOpen,
  MoreHorizontal,
  Send,
  Sparkles,
  PenSquare
} from 'lucide-react';
import type { UserPost, UserProfile } from '@sos/domain';
import { SOSCard } from '../ui/SOSCard.js';

export interface ProfilePostsTabProps {
  posts: UserPost[];
  profile: UserProfile;
  isOwnProfile?: boolean;
  onLikePost: (postId: string) => void;
  onCreatePost: (content: string) => void;
}

export const ProfilePostsTab: React.FC<ProfilePostsTabProps> = ({
  posts,
  profile,
  isOwnProfile = true,
  onLikePost,
  onCreatePost
}) => {
  const [newPostContent, setNewPostContent] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    onCreatePost(newPostContent.trim());
    setNewPostContent('');
    setIsComposing(false);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Quick Post Composer Box */}
      <SOSCard
        tier={2}
        className="p-4 shadow-sm"
        innerClassName="flex flex-col gap-3"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#242428] bg-[#161619]">
            <img
              src={profile.avatarUrl || '/avatars/abdalla.jpg'}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-2">
            <textarea
              rows={isComposing ? 3 : 1}
              value={newPostContent}
              onFocus={() => setIsComposing(true)}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share a study update, whiteboard recap, or paper insight..."
              className="w-full bg-transparent resize-none border-0 p-0 text-xs text-[#F4F4F5] placeholder-[#8E8E93] focus:ring-0 focus:outline-none leading-relaxed"
            />

            {isComposing && (
              <div className="flex items-center justify-between pt-2 border-t border-[#1E1E22]">
                <span className="text-[11px] text-[#8E8E93] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#A1A1AA]" />
                  <span>Public to SOS Scholar Community</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewPostContent('');
                      setIsComposing(false);
                    }}
                    className="h-7 px-3 rounded-full text-xs text-[#8E8E93] hover:text-[#D4D4D8] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newPostContent.trim()}
                    className="h-7 px-3.5 rounded-full bg-white hover:bg-[#E4E4E7] text-black text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-95"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </SOSCard>

      {/* 2. Posts Stream / Linear-Grade Empty State */}
      {posts.length === 0 ? (
        <SOSCard
          tier={2}
          className="py-12 px-6 text-center"
          innerClassName="flex flex-col items-center justify-center gap-2.5"
        >
          <div className="w-10 h-10 rounded-full bg-[#161619] border border-[#242428] flex items-center justify-center text-[#A1A1AA]">
            <PenSquare className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-xs font-semibold text-white">No study posts yet</h3>
            <p className="text-[11px] text-[#8E8E93] max-w-sm">
              Document your learning journey, whiteboard notes, and research discoveries.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsComposing(true)}
            className="mt-1 h-7 px-3.5 rounded-full bg-[#161619] hover:bg-[#1E1E22] border border-[#242428] text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors cursor-pointer"
          >
            Create your first post
          </button>
        </SOSCard>
      ) : (
        posts.map((post) => (
          <SOSCard
            key={post.id}
            tier={2}
            className="p-4 shadow-sm"
            innerClassName="flex flex-col gap-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={post.authorAvatarUrl || profile.avatarUrl || '/avatars/abdalla.jpg'}
                  alt={post.authorName}
                  className="w-6 h-6 rounded-full object-cover border border-[#27272A]"
                />
                <span className="text-xs font-semibold text-white">
                  {post.authorName}
                </span>
                <span className="text-xs text-[#8E8E93] font-mono">
                  {post.authorHandle} •{' '}
                  {post.pinned ? 'Pinned' : new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {post.pinned ? (
                <span className="text-[11px] font-mono text-[#A1A1AA] flex items-center gap-1">
                  <Pin className="w-3 h-3 text-[#FAFAFA]" />
                  <span>Pinned</span>
                </span>
              ) : (
                <button
                  type="button"
                  className="text-[#8E8E93] hover:text-white transition-colors"
                  title="More actions"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Content text */}
            <p className="text-xs text-[#D4D4D8] leading-relaxed">
              {post.content}
            </p>

            {/* Media Attachment (Lecture/Whiteboard Photo) */}
            {post.mediaUrl && (
              <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-[#222226] relative bg-zinc-950">
                <img
                  src={post.mediaUrl}
                  alt="Post Attachment"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Deck Attachment (Own Profile: "Open in Learning"; Other: "Fork to Library") */}
            {post.deck && (
              <div className="p-3 rounded-lg bg-[#161619] border border-[#242428] flex items-center justify-between gap-4 shadow-inner group/card hover:border-[#38383E] transition-colors">
                <div className="flex items-start gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-[#111113] border border-[#242428] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col gap-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white tracking-tight truncate">
                        {post.deck.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[#161619] border border-[#242428] text-[9.5px] font-mono text-white font-medium">
                        {post.deck.tag}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10.5px] text-[#8E8E93] font-mono">
                      <span>{post.deck.cardCount} Cards</span>
                      <span>•</span>
                      <span>{post.deck.algorithm}</span>
                      <span>•</span>
                      <span>{post.deck.forksCount} Forks</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="h-7 px-3 rounded-lg bg-[#18181B] hover:bg-[#222226] border border-[#27272A] text-xs font-semibold text-white flex items-center gap-1.5 shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer"
                  title={isOwnProfile ? "Open in Learning" : "Fork into your SOS Library"}
                  onClick={() => {
                    if (isOwnProfile) {
                      window.location.href = '/learning';
                    } else {
                      alert('Deck forked into your Library!');
                    }
                  }}
                >
                  {isOwnProfile ? (
                    <>
                      <BookOpen className="w-3.5 h-3.5 text-[#D4D4D8]" />
                      <span>Open in Learning</span>
                    </>
                  ) : (
                    <>
                      <GitFork className="w-3.5 h-3.5 text-white" />
                      <span>Fork to Library</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Left-Aligned Social Action Bar */}
            <div className="flex items-center gap-6 text-[#8E8E93] text-xs pt-0.5 px-0.5 select-none">
              <button
                type="button"
                onClick={() => onLikePost(post.id)}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                  post.isLiked ? 'text-rose-400' : 'hover:text-rose-400'
                }`}
                title="Like"
              >
                <Heart
                  className={`w-4 h-4 ${post.isLiked ? 'fill-rose-400 stroke-rose-400' : ''}`}
                />
                <span className="text-[11px] font-mono">{post.likesCount}</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                title="Comment"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-[11px] font-mono">{post.commentsCount}</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
                title="Repost"
              >
                <Repeat className="w-4 h-4" />
                <span className="text-[11px] font-mono">{post.repostsCount}</span>
              </button>

              <button
                type="button"
                className="hover:text-white transition-colors cursor-pointer"
                title="Share"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </SOSCard>
        ))
      )}
    </div>
  );
};
