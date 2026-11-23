import React from 'react';
import type { LibraryViewMode, LibrarySizeMode } from '../../stores/library-store.js';

interface LibrarySkeletonViewProps {
  view: LibraryViewMode;
  size: LibrarySizeMode;
}

export const LibrarySkeletonView: React.FC<LibrarySkeletonViewProps> = ({ view, size }) => {
  const gridColClass = {
    S: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
    M: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    L: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
  }[size];

  const galleryColClass = {
    S: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    M: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    L: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
  }[size];

  const galleryCoverHeight = {
    S: 'h-24',
    M: 'h-32',
    L: 'h-44'
  }[size];

  const rowHeightClass = {
    S: 'h-9 py-1',
    M: 'h-12 py-2.5',
    L: 'h-[60px] py-3.5'
  }[size];

  if (view === 'grid') {
    return (
      <div
        data-testid="library-skeleton-grid"
        className={`grid gap-4 w-full ${gridColClass}`}
      >
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="h-[148px] rounded-xl bg-[#121214] border border-[#1E1E22] p-4 flex flex-col justify-between animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-[#18181B]" />
              <div className="w-5 h-5 rounded bg-[#18181B]/50" />
            </div>
            <div>
              <div className="h-4 w-3/4 rounded bg-[#18181B] mb-2" />
              <div className="h-3 w-1/2 rounded bg-[#18181B]/50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (view === 'gallery') {
    return (
      <div
        data-testid="library-skeleton-gallery"
        className={`grid gap-4 w-full ${galleryColClass}`}
      >
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-[#121214] border border-[#1E1E22] overflow-hidden animate-pulse flex flex-col"
          >
            <div className={`w-full ${galleryCoverHeight} bg-[#18181B]`} />
            <div className="p-3">
              <div className="h-4 w-3/4 rounded bg-[#18181B] mb-2" />
              <div className="h-3 w-1/3 rounded bg-[#18181B]/50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="library-skeleton-list" className="flex flex-col gap-1.5 w-full">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div
          key={idx}
          className={`${rowHeightClass} rounded-lg bg-[#121214] border border-[#1E1E22] px-4 flex items-center justify-between animate-pulse`}
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#18181B]" />
            <div className="h-4 w-48 rounded bg-[#18181B]" />
          </div>
          <div className="flex items-center gap-6">
            <div className="h-3 w-16 rounded bg-[#18181B]/50" />
            <div className="h-3 w-20 rounded bg-[#18181B]/50" />
          </div>
        </div>
      ))}
    </div>
  );
};
