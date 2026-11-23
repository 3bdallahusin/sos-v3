import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Bookmark,
  Search,
  Download,
  Radio,
  Captions
} from 'lucide-react';
import { useLearningStore } from '../../stores/learning-store.js';

interface AudiosViewProps {
  mediaId?: string;
}

export const LearningAudiosView: React.FC<AudiosViewProps> = ({ mediaId = 'media-huberman-audio' }) => {
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeTranscriptRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [bookmarkToast, setBookmarkToast] = useState(false);
  const [downloadToast, setDownloadToast] = useState(false);

  useEffect(() => {
    fetchMediaItem(mediaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    seekToTime(newTime);
  };

  const formatTimestamp = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const duration = activeMedia?.durationSeconds || 2300;

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
      title: `Podcast Insight: ${activeMedia?.title || 'Audio'} [${formatTimestamp(currentTime)}]`,
      content: `Bookmarked quote at ${formatTimestamp(currentTime)} in ${activeMedia?.title || 'Audio'}. Dissociation between synaptic marking and sleep consolidation.`,
      sourceContext: `Audio [${formatTimestamp(currentTime)}]`,
      tags: ['Audio Bookmark', 'Sleep', 'Memory Consolidation']
    });
    setBookmarkToast(true);
    setTimeout(() => setBookmarkToast(false), 2500);
  };

  const handleDownload = () => {
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 2500);
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
  };

  // Generate 48 waveform bar heights matching Stitch design
  const waveformHeights = [
    20, 32, 16, 40, 28, 48, 24, 36, 44, 20, 52, 32, 40, 24, 44, 28,
    36, 48, 16, 32, 40, 24, 44, 20, 32, 48, 28, 40, 16, 36, 44, 24,
    32, 20, 40, 28, 48, 16, 32, 24, 40, 20, 48, 28, 36, 24, 44, 32
  ];

  const progressFraction = currentTime / duration;
  const activeBarIndex = Math.floor(progressFraction * waveformHeights.length);

  // Filter transcript segments
  const filteredTranscript = activeTranscript.filter((seg) =>
    transcriptSearchQuery
      ? seg.text.toLowerCase().includes(transcriptSearchQuery.toLowerCase()) ||
        seg.formattedTime.includes(transcriptSearchQuery)
      : true
  );

  return (
    <div
      data-testid="learning-audios-view"
      className="flex-1 flex flex-col overflow-hidden w-full h-full relative bg-[#0A0A0A] text-[#FAFAFA] select-none"
    >
      <audio
        ref={audioRef}
        src={activeMedia?.mediaUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlaying(false)}
      />

      {/* Toast Notifications */}
      {bookmarkToast && (
        <div className="absolute top-4 right-4 z-50 px-3.5 py-2 rounded-xl bg-[#0D1D14] border border-[#1D4A2F] text-xs font-mono text-[#86EFAC] flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <Bookmark className="w-3.5 h-3.5 fill-current text-[#86EFAC]" />
          <span>Timestamp [{formatTimestamp(currentTime)}] saved to Notes!</span>
        </div>
      )}

      {downloadToast && (
        <div className="absolute top-4 right-4 z-50 px-3.5 py-2 rounded-xl bg-[#0E1524] border border-[#1E3258] text-xs font-mono text-[#93C5FD] flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <Download className="w-3.5 h-3.5 text-[#93C5FD]" />
          <span>Downloading high-fidelity podcast MP3 offline...</span>
        </div>
      )}

      {/* Full-Width Audio Player Hero Section */}
      <div className="w-full bg-[#09090B] border-b border-[#1E1E22] p-6 flex flex-col gap-4 shrink-0 shadow-sm">
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
          {/* Podcast / Audio Meta Info Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[14px] bg-[#18181B] border border-[#3F3F46] flex items-center justify-center text-[#F4F4F5] shadow-sm">
                <Radio className="w-6 h-6 text-[#F4F4F5]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  {activeMedia?.title || 'Huberman Lab Podcast • Episode 12'}
                </h2>
                <p className="text-xs text-[#A1A1AA]">
                  {activeMedia?.subtitle || 'Optimizing Memory, Brain Plasticity & Sleep Cycles for Accelerated Learning'}
                </p>
              </div>
            </div>
          </div>

          {/* Sleek Full-Width Audio Waveform Visualization */}
          <div
            data-testid="audio-waveform-container"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              handleSeek(Math.floor(pos * duration));
            }}
            className="w-full h-16 bg-[#14141A] rounded-[18px] border border-[#27272A] p-2.5 flex items-center justify-between gap-1 relative overflow-hidden cursor-pointer group"
          >
            {/* Playhead indicator overlay */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-[#F4F4F5]/10 border-r-2 border-[#F4F4F5] transition-all pointer-events-none"
              style={{ width: `${Math.min(100, Math.max(0, progressFraction * 100))}%` }}
            />

            {/* 48 Dynamic Waveform Bars */}
            <div className="w-full h-full flex items-center justify-between gap-0.5 z-10">
              {waveformHeights.map((h, i) => {
                const isPlayed = i <= activeBarIndex;
                return (
                  <div
                    key={i}
                    style={{ height: `${h}px` }}
                    className={`w-1.5 rounded-full transition-colors ${
                      isPlayed ? 'bg-[#F4F4F5]' : 'bg-[#A1A1AA]/30 group-hover:bg-[#A1A1AA]/50'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Audio Player Controls Row */}
          <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
            {/* Left Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                data-testid="audio-play-toggle-btn"
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-[#18181B] text-[#F4F4F5] border border-[#3F3F46] flex items-center justify-center hover:bg-[#202024] active:scale-95 transition-all shadow-sm cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                data-testid="audio-skip-back-btn"
                onClick={() => handleSeek(Math.max(0, currentTime - 15))}
                className="hover:text-[#F4F4F5] transition-colors cursor-pointer"
                title="Skip -15s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                data-testid="audio-skip-forward-btn"
                onClick={() => handleSeek(Math.min(duration, currentTime + 15))}
                className="hover:text-[#F4F4F5] transition-colors cursor-pointer"
                title="Skip +15s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 font-mono text-xs text-[#F4F4F5] pl-2 tabular-nums">
                <span>{formatTimestamp(currentTime)}</span>
                <span className="text-[#71717A]">/</span>
                <span className="text-[#71717A]">{formatTimestamp(duration)}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2.5">
              {/* Pin Timestamp */}
              <button
                type="button"
                data-testid="audio-bookmark-btn"
                onClick={handleBookmark}
                className="w-7 h-7 rounded-[10px] flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/10 transition-colors cursor-pointer"
                title="Pin Timestamp to Notes"
              >
                <Bookmark className="w-[15px] h-[15px]" />
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

              {/* Volume */}
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="hover:text-[#F4F4F5] transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-[#EF4444]" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Download */}
              <button
                type="button"
                onClick={handleDownload}
                className="hover:text-[#F4F4F5] transition-colors cursor-pointer"
                title="Download Audio"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Live Auto-Scrolling Transcript Section */}
      <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative">
        {/* Transcript Header Bar */}
        <div className="h-12 border-b border-[#1E1E22] px-6 flex items-center justify-between shrink-0 bg-[#09090B]">
          <div className="flex items-center gap-2.5">
            <Captions className="w-4 h-4 text-[#F4F4F5]" />
            <span className="text-xs font-semibold text-[#F4F4F5] tracking-tight">
              Audio Synchronized Transcript
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
            <input
              type="text"
              placeholder="Search transcript..."
              value={transcriptSearchQuery}
              onChange={(e) => setTranscriptSearchQuery(e.target.value)}
              className="h-7 w-44 bg-[#18181B] rounded-[10px] border border-[#1E1E22] px-2.5 text-xs text-[#F4F4F5] placeholder-[#71717A] focus:ring-0 focus:outline-none focus:border-[#3F3F46]"
            />
          </div>
        </div>

        {/* Full-Width Horizontal Timestamped Bars */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2">
          {filteredTranscript.map((seg) => {
            const isActive = currentTime >= seg.startTime && currentTime <= seg.endTime;

            return (
              <div
                key={seg.id}
                data-testid={`audio-transcript-segment-${seg.id}`}
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
