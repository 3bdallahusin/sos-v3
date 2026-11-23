import React, { useEffect, useState } from 'react';
import {
  Clock,
  AlertTriangle,
  Flag,
  Check,
  X,
  CheckCircle2,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useLearningStore } from '../../stores/learning-store.js';

export const LearningExamView: React.FC = () => {
  const {
    examSession,
    examQuestions,
    currentExamIndex,
    examAnswers,
    examFlagged,
    examRemainingSeconds,
    examIntegrityScore,
    isExamSubmitted,
    examLoading,
    fetchExamSession,
    recordExamIntegrityViolation,
    selectExamAnswer,
    toggleExamFlag,
    goToExamQuestion,
    nextExamQuestion,
    prevExamQuestion,
    tickExamTimer,
    submitExam
  } = useLearningStore();

  const [violationToast, setViolationToast] = useState<string | null>(null);

  useEffect(() => {
    fetchExamSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exam Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      tickExamTimer();
    }, 1000);
    return () => clearInterval(timer);
  }, [tickExamTimer]);

  // Strict Browser Focus Lock & Integrity Listeners
  useEffect(() => {
    if (isExamSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordExamIntegrityViolation('visibility_change', 'Tab switch or browser minimized');
        setViolationToast('Warning: Tab switch or background state detected. Integrity event logged.');
        setTimeout(() => setViolationToast(null), 5000);
      }
    };

    const handleWindowBlur = () => {
      recordExamIntegrityViolation('window_blur', 'Window focus lost / application switch');
      setViolationToast('Integrity Alert: Window focus lost. Exam proctor recorded this event.');
      setTimeout(() => setViolationToast(null), 5000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isExamSubmitted, recordExamIntegrityViolation]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentQ = examQuestions[currentExamIndex];
  const totalQuestions = examQuestions.length || 40;

  if (examLoading && !currentQ) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0A] text-[#71717A] text-xs font-mono">
        Connecting to proctor session & initializing cryptographic token...
      </div>
    );
  }

  const isCurrentFlagged = currentQ ? Boolean(examFlagged[String(currentExamIndex + 1)]) : false;
  const answeredCount = Object.keys(examAnswers).length;

  return (
    <div
      data-testid="learning-exam-view"
      className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0A0A] px-6 py-6 flex flex-col items-center justify-start select-none relative"
    >
      {/* Violation Toast Notification */}
      {violationToast && (
        <div
          data-testid="exam-violation-toast"
          className="fixed top-14 z-50 px-4 py-2.5 rounded-xl bg-[#261012] border border-[#6B1F26] text-xs font-mono text-[#FCA5A5] flex items-center gap-2 shadow-2xl animate-bounce"
        >
          <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
          <span>{violationToast}</span>
        </div>
      )}

      <div className="w-full max-w-[760px] flex flex-col gap-0">

        {/* 1. Encapsulated Top Tracker Card (Exact same max-w-[760px] width, #111114, 12px rounded, 16px 24px pad, mb-4) */}
        <div className="w-full p-[16px_24px] rounded-xl bg-[#111114] border border-[#1F1F23] flex flex-col gap-3 shadow-sm select-none mb-4">
          {/* Top Status Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#F4F4F5]">
                Question {String(currentExamIndex + 1).padStart(2, '0')} of {totalQuestions}
              </span>
              <span className="text-xs text-[#A1A1AA]">•</span>
              <span className="text-xs text-[#A1A1AA]">
                Module: Synaptic Transmission
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Standalone Score Badge */}
              <div className="px-2.5 py-1 rounded-md bg-[#18181B] border border-[#27272A] font-mono text-xs flex items-center gap-1.5 shadow-sm">
                <span className="text-[#A1A1AA]">Score:</span>
                <span className="font-medium text-[#FAFAFA]">{answeredCount} / {totalQuestions}</span>
              </div>
              {/* Standalone Timer Pill */}
              <div className="px-2.5 py-1 rounded-md bg-[#18181B] border border-[#27272A] font-mono text-xs text-[#E4E4E7] flex items-center gap-1.5 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="tabular-nums font-medium">{formatTimer(examRemainingSeconds)}</span>
              </div>
              {/* Integrity status indicator */}
              <div className="px-2.5 py-1 rounded-md bg-[#18181B] border border-[#27272A] font-mono text-xs text-[#E4E4E7] flex items-center gap-1.5 shadow-sm">
                <span className="text-[#A1A1AA]">Integrity:</span>
                <span className="font-medium text-[#10B981]">{examIntegrityScore}%</span>
              </div>
              <button
                type="button"
                onClick={submitExam}
                className="px-3 py-1 rounded-md bg-[#1E1E22] hover:bg-[#27272D] border border-[#323238] text-xs text-[#FAFAFA] font-medium transition-colors ml-1 cursor-pointer"
              >
                Finish Exam
              </button>
            </div>
          </div>

          {/* Bottom Row: Symmetrical 2 Rows x 20 Cols Centered Question Grid */}
          <div
            className="w-full grid gap-1.5 justify-center items-center"
            style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}
          >
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const qNum = idx + 1;
              const isCurrent = idx === currentExamIndex;
              const isAnswered = Boolean(examAnswers[String(qNum)]);
              const isFlagged = Boolean(examFlagged[String(qNum)]);

              let pillClass = 'bg-[#141417] border border-[#1F1F23] font-mono text-[10px] text-[#52525B] hover:text-[#71717A]';
              if (isCurrent) {
                pillClass = 'bg-[#F4F4F5] text-[#09090B] font-mono text-[10px] font-bold shadow-sm ring-1 ring-white';
              } else if (isAnswered) {
                pillClass = 'bg-[#18181B] border border-[#27272A] font-mono text-[10px] text-[#FAFAFA]';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  data-testid={`exam-question-pill-${qNum}`}
                  onClick={() => goToExamQuestion(idx)}
                  className={`w-full h-6 rounded flex items-center justify-center transition-colors cursor-pointer relative ${pillClass}`}
                >
                  <span>{qNum}</span>
                  {isFlagged && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card Container */}
        {currentQ && (
          <div className="w-full p-7 md:p-8 rounded-2xl bg-[#111114] border border-[#1F1F23] flex flex-col shadow-sm">
            
            {/* Vignette Text */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-[#71717A] tracking-wider">
                  Clinical & Mechanistic Vignette
                </span>
                <span className="text-[11px] font-mono text-[#71717A]">
                  Session: <span className="text-[#FAFAFA] font-bold">{examSession?.sessionToken || '8F2A-94B1-CC03'}</span>
                </span>
              </div>
              <p className="text-[15px] font-normal text-[#F4F4F5] leading-relaxed mt-2.5 mb-0">
                {currentQ.question}
              </p>
            </div>

            {/* 4 Interactive Option Rows */}
            <div id="exam-options-group" className="flex flex-col gap-2.5">
              {(currentQ.options || []).map((opt: any) => {
                const selectedKey = examAnswers[String(currentExamIndex + 1)];
                const isSelected = selectedKey === opt.key;
                const isCorrectOption = currentQ.correctOption
                  ? opt.key.toUpperCase() === currentQ.correctOption.toUpperCase()
                  : false;

                let rowClass = 'exam-option p-3.5 rounded-xl border border-[#222226] bg-[#141417] hover:border-[#38383E] flex items-center gap-3.5 cursor-pointer transition-all group';
                let pillClass = 'option-pill w-6 h-6 rounded-full border border-[#3F3F46] group-hover:border-[#71717A] flex items-center justify-center font-mono text-xs text-[#A1A1AA] shrink-0 transition-colors';
                let textClass = 'text-xs text-[#D4D4D8] leading-normal';

                if (isExamSubmitted) {
                  if (isCorrectOption) {
                    rowClass = 'exam-option p-3.5 rounded-xl border border-[#1E3A2A] bg-[#0D1912] flex items-center gap-3.5 cursor-pointer transition-all shadow-sm';
                    pillClass = 'option-pill w-6 h-6 rounded-full bg-[#1E3A2A] text-[#86EFAC] flex items-center justify-center font-mono text-xs font-bold shrink-0';
                    textClass = 'text-xs text-[#FAFAFA] font-medium leading-normal';
                  } else if (isSelected && !isCorrectOption) {
                    rowClass = 'exam-option p-3.5 rounded-xl border border-[#3F1D22] bg-[#1C1012] flex items-center gap-3.5 cursor-pointer transition-all shadow-sm';
                    pillClass = 'option-pill w-6 h-6 rounded-full bg-[#3F1D22] text-[#F87171] flex items-center justify-center font-mono text-xs font-bold shrink-0';
                    textClass = 'text-xs text-[#E4E4E7] leading-normal';
                  }
                } else if (isSelected) {
                  rowClass = 'exam-option p-3.5 rounded-xl border border-[#3B82F6] bg-[#141824] flex items-center gap-3.5 cursor-pointer transition-all';
                  pillClass = 'option-pill w-6 h-6 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0';
                  textClass = 'text-xs text-[#FAFAFA] font-medium leading-normal';
                }

                return (
                  <div
                    key={opt.key}
                    data-testid={`exam-option-${opt.key}`}
                    onClick={() => {
                      if (!isExamSubmitted) {
                        selectExamAnswer(currentExamIndex + 1, opt.key);
                      }
                    }}
                    className={rowClass}
                  >
                    <div className={pillClass}>
                      {isExamSubmitted && isCorrectOption ? (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : isExamSubmitted && isSelected && !isCorrectOption ? (
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        opt.key
                      )}
                    </div>
                    <span className={textClass}>
                      {opt.text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Explanation Box (shown after exam submitted) */}
            {isExamSubmitted && currentQ.explanation && (
              <div id="exam-explanation-box" className="mt-5 pt-4 border-t border-[#1F1F23] flex flex-col">
                <span className="text-[12px] font-mono uppercase tracking-wider text-[#86EFAC] mb-1.5 flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC]" />
                  <span>Explanation</span>
                </span>
                <p className="text-[13px] text-[#A1A1AA] leading-relaxed m-0">
                  {currentQ.explanation}
                </p>
              </div>
            )}

          </div>
        )}

        {/* Docked Action Controls Directly Below the Question Card (Full-Width Equal 3-Column Grid) */}
        <div
          className="w-full grid grid-cols-3 gap-3 pt-1 pb-4 select-none"
          style={{ marginTop: '16px' }}
        >
          {/* Column 1: Previous Question */}
          <button
            type="button"
            data-testid="exam-prev-btn"
            onClick={prevExamQuestion}
            className="h-[44px] rounded-[10px] bg-[#111114] hover:bg-[#18181B] border border-[#1F1F23] hover:border-[#27272A] text-[13px] text-[#F4F4F5] font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#A1A1AA]" />
            <span>Previous Question</span>
          </button>

          {/* Column 2: Flag for Review */}
          <button
            type="button"
            data-testid="exam-flag-btn"
            onClick={() => toggleExamFlag(currentExamIndex + 1)}
            className={`h-[44px] rounded-[10px] bg-[#111114] hover:bg-[#18181B] border border-[#1F1F23] hover:border-[#27272A] text-[13px] font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm cursor-pointer ${
              isCurrentFlagged ? 'text-[#FBBF24] border-[#5E3B10]' : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
            }`}
          >
            <Flag className={`w-4 h-4 ${isCurrentFlagged ? 'fill-current text-[#FBBF24]' : 'text-[#A1A1AA]'}`} />
            <span>{isCurrentFlagged ? 'Flagged for Review' : 'Flag for Review'}</span>
          </button>

          {/* Column 3: Next Question Primary */}
          <button
            type="button"
            data-testid="exam-next-btn"
            onClick={nextExamQuestion}
            className="h-[44px] rounded-[10px] bg-[#F4F4F5] hover:bg-[#E4E4E7] border border-[#F4F4F5] text-[13px] text-[#09090B] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <span>Next Question</span>
            <ArrowRight className="w-4 h-4 text-[#09090B]" />
          </button>
        </div>

      </div>
    </div>
  );
};
