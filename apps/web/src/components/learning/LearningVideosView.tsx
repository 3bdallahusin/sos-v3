import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Bookmark,
  Camera,
  Captions,
  Search,
  Check
} from 'lucide-react';
import { useLearningStore } from '../../stores/learning-store.js';

interface VideosViewProps {
  mediaId?: string;
}

export const LearningVideosView: React.FC<VideosViewProps> = ({ mediaId = 'media-stanford-neuro-vid' }) => {
  const {
    activeMedia,
    activeTranscript,
    currentTime,
    isPlaying,
    playbackSpeed,
    transcriptSearchQuery,
    mediaLoading,
    fetchMediaItem,
    setCurrentTime,
    togglePlay,
    setPlaying,
    setPlaybackSpeed,
    setTranscriptSearchQuery,
    seekToTime,
    saveNote
  } = useLearningStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeTranscriptRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [bookmarkToast, setBookmarkToast] = useState(false);
  const [snapToast, setSnapToast] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(true);

  useEffect(() => {
    fetchMediaItem(mediaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  // Sync HTML5 video with store state
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    seekToTime(newTime);
  };

  const formatTimestamp = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const duration = activeMedia?.durationSeconds || 2700;

  // Auto-scroll active transcript into view
  useEffect(() => {
    if (activeTranscriptRef.current) {
      activeTranscriptRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [currentTime]);

  const handleBookmark = async () => {
    await saveNote({
      title: `Timestamp Pin: ${activeMedia?.title || 'Video'} [${formatTimestamp(currentTime)}]`,
      content: `Bookmarked timestamp at ${formatTimestamp(currentTime)} in ${activeMedia?.title || 'Lecture'}. Voltage-dependent magnesium unblock and CaMKII cascade.`,
      sourceContext: `Video [${formatTimestamp(currentTime)}]`,
      tags: ['Video Timestamp', 'LTP', 'Neurobiology']
    });
    setBookmarkToast(true);
    setTimeout(() => setBookmarkToast(false), 2500);
  };

  const handleSnapSlide = async () => {
    await saveNote({
      title: `Slide Frame: ${activeMedia?.title || 'Lecture'} [${formatTimestamp(currentTime)}]`,
      content: `Captured presentation slide frame at ${formatTimestamp(currentTime)}. Visual: NMDA Receptor Coincidence and AMPA Insertion Diagram.`,
      sourceContext: `Slide Frame [${formatTimestamp(currentTime)}]`,
      tags: ['Slide Snap', 'Visual Diagram', 'CA1 Pyramidal']
    });
    setSnapToast(true);
    setTimeout(() => setSnapToast(false), 2500);
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
  };

  // Filter transcript segments
  const filteredTranscript = activeTranscript.filter((seg) =>
    transcriptSearchQuery
      ? seg.text.toLowerCase().includes(transcriptSearchQuery.toLowerCase()) ||
        seg.formattedTime.includes(transcriptSearchQuery)
      : true
  );

  return (
    <div
      data-testid="learning-videos-view"
      className="flex-1 flex flex-col overflow-hidden w-full h-full relative bg-[#0A0A0A] text-[#FAFAFA] select-none"
    >
      {/* Toast Notifications */}
      {bookmarkToast && (
        <div className="absolute top-4 right-4 z-50 px-3.5 py-2 rounded-xl bg-[#0D1D14] border border-[#1D4A2F] text-xs font-mono text-[#86EFAC] flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <Bookmark className="w-3.5 h-3.5 fill-current text-[#86EFAC]" />
          <span>Timestamp [{formatTimestamp(currentTime)}] pinned to Notes!</span>
        </div>
      )}

      {snapToast && (
        <div className="absolute top-4 right-4 z-50 px-3.5 py-2 rounded-xl bg-[#0E1524] border border-[#1E3258] text-xs font-mono text-[#93C5FD] flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <Camera className="w-3.5 h-3.5 text-[#93C5FD]" />
          <span>Slide frame at [{formatTimestamp(currentTime)}] snapped to Notes!</span>
        </div>
      )}

      {/* Top 16:9 Widescreen Video Player Section */}
      <div className="w-full bg-[#09090B] border-b border-[#1E1E22] flex flex-col justify-between shrink-0 p-4 relative group">
        <div className="w-full max-w-5xl mx-auto aspect-video max-h-[380px] bg-[#111113] rounded-[18px] border border-[#27272A] overflow-hidden relative shadow-2xl flex flex-col justify-between p-4">
          {/* HTML5 Video */}
          <video
            ref={videoRef}
            src={activeMedia?.mediaUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setPlaying(false)}
            className="absolute inset-0 w-full h-full object-cover"
            muted={isMuted}
          />

          {/* Vignette Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090B]/90 via-[#09090B]/40 to-[#09090B]/70 pointer-events-none" />

          {/* Top Video Presentation Overlay: Stanford Med • Lecture 04 */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#141417]/90 border border-[#27272A] text-xs font-mono text-[#A1A1AA] shadow-sm select-none backdrop-blur-sm">
              <span>{activeMedia?.instructor ? `${activeMedia.instructor.toUpperCase()} • LECTURE 04` : 'STANFORD MED • LECTURE 04'}</span>
            </div>
          </div>

          {/* Video Center Play / Metadata Overlay */}
          <div className="flex flex-col items-center justify-center my-auto z-10 text-center gap-2">
            <button
              type="button"
              data-testid="video-center-play-btn"
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-[#141417]/90 border border-[#27272A] backdrop-blur flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform shadow-xl group/play"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white fill-current" />
              ) : (
                <Play className="w-7 h-7 text-white fill-current ml-1 group-hover/play:text-emerald-400 transition-colors" />
              )}
            </button>
            <span className="text-sm font-semibold text-white tracking-tight drop-shadow-md">
              {activeMedia?.subtitle || 'Mechanisms of Long-Term Potentiation (LTP)'}
            </span>
            <span className="text-xs text-[#A1A1AA] font-mono drop-shadow">
              {activeMedia?.title || 'Prof. Robert Malenka • Dept. of Psychiatry & Behavioral Sciences'}
            </span>
          </div>

          {/* Bottom Video Player Controls Bar */}
          <div className="w-full flex flex-col gap-2 z-10 pt-2 bg-gradient-to-t from-black/90 to-transparent rounded-b-[18px]">
            {/* Timeline Scrub Bar with Chapter Markers */}
            <div
              className="w-full relative h-2 bg-white/20 hover:h-2.5 rounded-full cursor-pointer transition-all flex items-center"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                handleSeek(Math.floor(pos * duration));
              }}
            >
              {/* Elapsed progress */}
              <div
                className="h-full bg-[#F4F4F5] rounded-full relative"
                style={{ width: `${Math.min(100, Math.max(0, (currentTime / duration) * 100))}%` }}
              >
                <div className="w-3 h-3 rounded-full bg-white absolute right-0 top-1/2 -translate-y-1/2 shadow-md" />
              </div>

              {/* Chapter Marker Pins */}
              <div className="absolute left-[15%] w-0.5 h-3 bg-amber-400 rounded-full" title="Chapter: Induction Protocols" />
              <div className="absolute left-[38%] w-0.5 h-3 bg-[#60A5FA] rounded-full" title="Current: NMDA Receptor Coincidence" />
              <div className="absolute left-[65%] w-0.5 h-3 bg-white/60 rounded-full" title="Chapter: CaMKII Autophosphorylation" />
              <div className="absolute left-[85%] w-0.5 h-3 bg-white/60 rounded-full" title="Chapter: AMPA Receptor Insertion" />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-xs text-[#A1A1AA] pt-1">
              {/* Left Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-testid="video-play-toggle-btn"
                  onClick={togglePlay}
                  className="hover:text-[#F4F4F5] transition-colors cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <button
                  type="button"
                  data-testid="video-skip-back-btn"
                  onClick={() => handleSeek(Math.max(0, currentTime - 10))}
                  className="hover:text-[#F4F4F5] transition-colors cursor-pointer"
                  title="Skip -10s"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  data-testid="video-skip-forward-btn"
                  onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
                  className="hover:text-[#F4F4F5] transition-colors cursor-pointer"
                  title="Skip +10s"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 font-mono text-xs text-[#F4F4F5] pl-1 tabular-nums">
                  <span>{formatTimestamp(currentTime)}</span>
                  <span className="text-[#71717A]">/</span>
                  <span className="text-[#71717A]">{formatTimestamp(duration)}</span>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                {/* Pin Timestamp */}
                <button
                  type="button"
                  onClick={handleBookmark}
                  className="w-7 h-7 rounded-[10px] flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/10 transition-colors cursor-pointer"
                  title="Pin Timestamp to Notes"
                >
                  <Bookmark className="w-[15px] h-[15px]" />
                </button>

                {/* Snap Slide Frame */}
                <button
                  type="button"
                  onClick={handleSnapSlide}
                  className="w-7 h-7 rounded-[10px] flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/10 transition-colors cursor-pointer"
                  title="Snap Slide Frame to Notes"
                >
                  <Camera className="w-[15px] h-[15px]" />
                </button>

                {/* Playback Speed */}
                <button
                  type="button"
                  onClick={cycleSpeed}
                  className="px-2 py-0.5 rounded bg-[#18181B] border border-[#1E1E22] text-[11px] font-mono text-[#F4F4F5] hover:border-[#3F3F46] transition-colors cursor-pointer"
                  title="Cycle Playback Speed"
                >
                  {playbackSpeed}×
                </button>

                {/* Closed Captions Toggle */}
                <button
                  type="button"
                  onClick={() => setCcEnabled(!ccEnabled)}
                  className={`px-1.5 py-0.5 rounded font-bold text-[10px] tracking-wider shadow-sm transition-colors cursor-pointer ${
                    ccEnabled ? 'bg-[#F4F4F5] text-black' : 'bg-[#18181B] text-[#71717A] border border-[#1E1E22]'
                  }`}
                  title="Toggle Closed Captions"
                >
                  CC
                </button>

                {/* Volume Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="hover:text-[#F4F4F5] transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-[#EF4444]" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Full Screen */}
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current?.requestFullscreen) {
                      videoRef.current.requestFullscreen();
                    }
                  }}
                  className="hover:text-[#F4F4F5] transition-colors cursor-pointer"
                  title="Full Screen Video"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Live Synchronized Transcript Section */}
      <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative">
        {/* Transcript Header Bar */}
        <div className="h-12 border-b border-[#1E1E22] px-6 flex items-center justify-between shrink-0 bg-[#09090B]">
          <div className="flex items-center gap-2.5">
            <Captions className="w-4 h-4 text-[#F4F4F5]" />
            <span className="text-xs font-semibold text-[#F4F4F5] tracking-tight">
              Live Synchronized Transcript
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
            <div className="relative">
              <input
                type="text"
                data-testid="search-transcript-input"
                placeholder="Search transcript..."
                value={transcriptSearchQuery}
                onChange={(e) => setTranscriptSearchQuery(e.target.value)}
                className="h-7 w-48 bg-[#18181B] rounded-[10px] border border-[#1E1E22] px-2.5 text-xs text-[#F4F4F5] placeholder-[#71717A] focus:ring-0 focus:outline-none focus:border-[#3F3F46]"
              />
            </div>
          </div>
        </div>

        {/* Full-Width Horizontal Timestamped Bars (Auto-Scrolling in Sync) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2">
          {filteredTranscript.map((seg) => {
            const isActive = currentTime >= seg.startTime && currentTime <= seg.endTime;

            return (
              <div
                key={seg.id}
                data-testid={`transcript-segment-${seg.id}`}
                ref={isActive ? activeTranscriptRef : null}
                onClick={() => handleSeek(seg.startTime)}
                className={`w-full p-3 rounded-[18px] flex items-start gap-4 cursor-pointer transition-colors group ${
                  isActive
                    ? 'bg-[#18181F] border-2 border-[#60A5FA] ring-1 ring-[#60A5FA]/50 shadow-md'
                    : 'bg-[#111113] border border-[#1E1E22] hover:border-[#3F3F46]'
                }`}
              >
                <span
                  className={`font-mono text-xs shrink-0 mt-0.5 flex items-center gap-1.5 ${
                    isActive
                      ? 'font-bold text-[#F4F4F5]'
                      : 'font-semibold text-[#A1A1AA] group-hover:text-[#F4F4F5]'
                  }`}
                >
                  {isActive && <span className="w-2 h-2 rounded-full bg-[#60A5FA] animate-ping" />}
                  {seg.formattedTime.startsWith('[') ? seg.formattedTime : `[${seg.formattedTime}]`}
                </span>
                <div
                  className={`flex-1 text-xs leading-relaxed ${
                    isActive ? 'text-white font-medium' : 'text-[#A1A1AA] group-hover:text-[#D4D4D8]'
                  }`}
                >
                  {seg.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
