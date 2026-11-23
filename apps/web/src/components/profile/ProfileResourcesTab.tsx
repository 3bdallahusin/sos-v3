import React from 'react';
import { Layers, FileText, BookOpen, Plus } from 'lucide-react';
import type { UserSharedResource } from '@sos/domain';
import { SOSCard } from '../ui/SOSCard.js';

export interface ProfileResourcesTabProps {
  resources: UserSharedResource[];
  isOwnProfile?: boolean;
  onOpenResource?: (resourceId: string) => void;
}

export const ProfileResourcesTab: React.FC<ProfileResourcesTabProps> = ({
  resources,
  isOwnProfile = true,
  onOpenResource
}) => {
  if (resources.length === 0) {
    return (
      <SOSCard
        tier={2}
        className="py-12 px-6 text-center w-full"
        innerClassName="flex flex-col items-center justify-center gap-2.5"
      >
        <div className="w-10 h-10 rounded-full bg-[#161619] border border-[#242428] flex items-center justify-center text-[#A1A1AA]">
          <Layers className="w-4 h-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xs font-semibold text-white">No published resources</h3>
          <p className="text-[11px] text-[#8E8E93] max-w-sm">
            Publish verified spaced repetition decks, study guides, and notes from your Library for public study.
          </p>
        </div>
        <a
          href="/library"
          className="mt-1 h-7 px-3.5 rounded-full bg-[#161619] hover:bg-[#1E1E22] border border-[#242428] text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-3 h-3" />
          <span>Publish from Library</span>
        </a>
      </SOSCard>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {resources.map((resource) => (
        <SOSCard
          key={resource.id}
          tier={2}
          className="p-3.5 shadow-sm"
          innerClassName="flex items-center justify-between gap-4 w-full"
        >
          <div className="flex items-start gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-[#161619] border border-[#242428] flex items-center justify-center text-white shrink-0 shadow-sm">
              {resource.type === 'deck' ? (
                <Layers className="w-4 h-4 text-white" />
              ) : (
                <FileText className="w-4 h-4 text-[#A1A1AA]" />
              )}
            </div>

            <div className="flex flex-col gap-0.5 truncate">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white tracking-tight truncate">
                  {resource.title}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#161619] border border-[#242428] text-[9.5px] font-mono text-[#D4D4D8] uppercase">
                  {resource.type}
                </span>
              </div>

              {resource.description && (
                <p className="text-[11px] text-[#8E8E93] line-clamp-1">
                  {resource.description}
                </p>
              )}

              <div className="flex items-center gap-2.5 text-[10.5px] text-[#8E8E93] font-mono pt-0.5">
                {resource.cardsCount && (
                  <span>{resource.cardsCount} Cards • </span>
                )}
                <span>{resource.forksCount} Forks</span>
                <div className="flex items-center gap-1.5 ml-2">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.2 rounded bg-[#18181C] text-[10px] font-sans text-[#A1A1AA]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenResource) onOpenResource(resource.id);
              else window.location.href = '/learning';
            }}
            className="h-7 px-3 rounded-lg bg-[#141417] hover:bg-[#1E1E22] border border-[#27272A] text-xs font-semibold text-white flex items-center gap-1.5 shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer"
            title={isOwnProfile ? "Open in Learning" : "Fork to Library"}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#D4D4D8]" />
            <span>Open in Learning</span>
          </button>
        </SOSCard>
      ))}
    </div>
  );
};
