import React, { useEffect, useState } from 'react';
import {
  Clock,
  Check,
  X,
  CheckCircle2,
  Flag,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useLearningStore } from '../../stores/learning-store.js';

interface QuizzesViewProps {
  quizId?: string;
}

export const LearningQuizzesView: React.FC<QuizzesViewProps> = ({ quizId = 'quiz-neurophys' }) => {
  const {
    activeQuiz,
    quizQuestions,
    currentQuizIndex,
    selectedQuizAnswers,
    evaluatedQuestions,
    flaggedQuestions,
    quizzesLoading,
    loadQuiz,
    answerQuestion,
    toggleQuestionFlag,
    goToQuizQuestion,
    nextQuizQuestion,
    prevQuizQuestion,
    finishQuiz
  } = useLearningStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(84);

  useEffect(() => {
    loadQuiz(quizId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // Timer counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentQ = quizQuestions[currentQuizIndex];
  const totalQuestions = quizQuestions.length || 20;

  // Calculate score
  const correctCount = Object.values(evaluatedQuestions).filter((res) => res.correct).length;
  const answeredCount = Object.keys(selectedQuizAnswers).length;

  if (quizzesLoading && !currentQ) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0A] text-[#71717A] text-xs font-mono">
        Loading diagnostic practice questions from database...
      </div>
    );
  }

  const evaluation = currentQ ? evaluatedQuestions[currentQ.id] : undefined;
  const isCurrentFlagged = currentQ ? flaggedQuestions[currentQ.id] : false;

  // Safe JSON distractor rationales parsing
  let distractorRationales: Record<string, string> | null = null;
  if (evaluation?.distractorRationales) {
    if (typeof evaluation.distractorRationales === 'string') {
      try {
        distractorRationales = JSON.parse(evaluation.distractorRationales);
      } catch {
        distractorRationales = null;
      }
    } else if (typeof evaluation.distractorRationales === 'object') {
      distractorRationales = evaluation.distractorRationales;
    }
  }

  return (
    <div
      data-testid="learning-quizzes-view"
      className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar flex flex-col items-center justify-start bg-[#0A0A0A] select-none"
    >
      <div className="w-full max-w-[760px] flex flex-col gap-0">

        {/* 1. Encapsulated Top Tracker Card (Exact same max-w-[760px] width, #111114, 12px rounded, 16px 24px pad, mb-4) */}
        <div className="w-full p-[16px_24px] rounded-xl bg-[#111114] border border-[#1F1F23] flex flex-col gap-3 shadow-sm select-none mb-4">
          {/* Top Status Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#F4F4F5]">
                Question {String(currentQuizIndex + 1).padStart(2, '0')} of {totalQuestions}
              </span>
              <span className="text-xs text-[#A1A1AA]">•</span>
              <span className="text-xs text-[#A1A1AA]">
                Module: {activeQuiz?.module || 'Neurophysiology'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Standalone Score Badge */}
              <div className="px-2.5 py-1 rounded-md bg-[#18181B] border border-[#27272A] font-mono text-xs flex items-center gap-1.5 shadow-sm">
                <span className="text-[#A1A1AA]">Score:</span>
                <span className="font-medium text-[#FAFAFA]">
                  {correctCount} / {answeredCount || 4}
                </span>
              </div>
              {/* Standalone Timer Pill */}
              <div className="px-2.5 py-1 rounded-md bg-[#18181B] border border-[#27272A] font-mono text-xs text-[#E4E4E7] flex items-center gap-1.5 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="tabular-nums font-medium">{formatTime(elapsedSeconds)}</span>
              </div>
              <button
                type="button"
                onClick={finishQuiz}
                className="px-3 py-1 rounded-md bg-[#1E1E22] hover:bg-[#27272D] border border-[#323238] text-xs text-[#FAFAFA] font-medium transition-colors ml-1 cursor-pointer"
              >
                Finish Quiz
              </button>
            </div>
          </div>

          {/* Bottom Row: Symmetrical 1 Row x 20 Cols Centered Question Grid */}
          <div
            className="w-full grid gap-1.5 justify-center items-center"
            style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}
          >
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const q = quizQuestions[idx];
              const isCurrent = idx === currentQuizIndex;
              const isAnswered = q && Boolean(selectedQuizAnswers[q.id]);
              const isCorrect = q && evaluatedQuestions[q.id]?.correct;
              const isFlagged = q && flaggedQuestions[q.id];

              let pillClass = 'bg-[#141417] border border-[#1F1F23] font-mono text-[10px] text-[#52525B] hover:text-[#71717A]';
              if (isCurrent) {
                pillClass = 'bg-[#F4F4F5] text-[#09090B] font-mono text-[10px] font-bold shadow-sm ring-1 ring-white';
              } else if (isAnswered) {
                pillClass = isCorrect
                  ? 'bg-[#0D1912] border border-[#1E3A2A] font-mono text-[10px] text-[#86EFAC]'
                  : 'bg-[#1C1012] border border-[#3F1D22] font-mono text-[10px] text-[#F87171]';
              } else {
                pillClass = 'bg-[#18181B] hover:bg-[#222226] border border-[#27272A] font-mono text-[10px] text-[#A1A1AA]';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  data-testid={`question-nav-pill-${idx + 1}`}
                  onClick={() => goToQuizQuestion(idx)}
                  className={`w-full h-6 rounded flex items-center justify-center transition-colors cursor-pointer relative ${pillClass}`}
                >
                  <span>{idx + 1}</span>
                  {isFlagged && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clean, Compact Question Card */}
        {currentQ && (
          <div className="w-full bg-[#111114] border border-[#1F1F23] rounded-2xl p-7 md:p-8 shadow-sm flex flex-col gap-6">
            
            {/* Question Stem */}
            <h2 className="text-[17px] text-[#F4F4F5] font-semibold leading-[1.5]">
              {currentQ.question}
            </h2>

            {/* 4 Interactive Option Rows */}
            <div id="quiz-options-group" className="flex flex-col gap-2.5">
              {(currentQ.options || []).map((opt: any) => {
                const isSelected = selectedQuizAnswers[currentQ.id] === opt.key;
                const isEvaluated = Boolean(evaluation);
                const isCorrectOption = opt.key.toUpperCase() === currentQ.correctOption.toUpperCase();

                let rowClass = 'quiz-option flex items-center px-4 py-3 rounded-xl border border-[#222226] bg-[#141417] hover:border-[#38383E] cursor-pointer transition-all group';
                let pillClass = 'option-pill w-6 h-6 rounded-full border border-[#3F3F46] flex items-center justify-center font-mono text-[12px] font-medium text-[#71717A] group-hover:text-[#F4F4F5] group-hover:border-[#71717A] mr-3 shrink-0 transition-colors';
                let textClass = 'text-[13.5px] text-[#D4D4D8] leading-normal truncate';

                if (isEvaluated) {
                  if (isCorrectOption) {
                    rowClass = 'quiz-option flex items-center px-4 py-3 rounded-xl border border-[#1E3A2A] bg-[#0D1912] cursor-pointer transition-all shadow-sm';
                    pillClass = 'option-pill w-6 h-6 rounded-full bg-[#1E3A2A] text-[#86EFAC] flex items-center justify-center font-mono text-[12px] font-bold mr-3 shrink-0';
                    textClass = 'text-[13.5px] text-[#FAFAFA] font-medium leading-normal truncate';
                  } else if (isSelected && !evaluation?.correct) {
                    rowClass = 'quiz-option flex items-center px-4 py-3 rounded-xl border border-[#3F1D22] bg-[#1C1012] cursor-pointer transition-all shadow-sm';
                    pillClass = 'option-pill w-6 h-6 rounded-full bg-[#3F1D22] text-[#F87171] flex items-center justify-center font-mono text-[12px] font-bold mr-3 shrink-0';
                    textClass = 'text-[13.5px] text-[#D4D4D8] leading-normal truncate';
                  } else {
                    rowClass = 'quiz-option flex items-center px-4 py-3 rounded-xl border border-[#222226] bg-[#141417] opacity-60 cursor-pointer transition-all';
                    pillClass = 'option-pill w-6 h-6 rounded-full border border-[#2B2B33] flex items-center justify-center font-mono text-[12px] text-[#52525B] mr-3 shrink-0';
                  }
                } else if (isSelected) {
                  rowClass = 'quiz-option flex items-center px-4 py-3 rounded-xl border border-[#3B82F6] bg-[#141824] cursor-pointer transition-all';
                  pillClass = 'option-pill w-6 h-6 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-mono text-[12px] font-bold mr-3 shrink-0';
                  textClass = 'text-[13.5px] text-[#FAFAFA] font-medium leading-normal truncate';
                }

                return (
                  <div
                    key={opt.key}
                    data-testid={`quiz-option-${opt.key}`}
                    onClick={() => {
                      if (!isEvaluated) {
                        answerQuestion(currentQ.id, opt.key);
                      }
                    }}
                    className={rowClass}
                  >
                    <span className={pillClass}>
                      {isEvaluated && isCorrectOption ? (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : isEvaluated && isSelected && !evaluation?.correct ? (
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        opt.key
                      )}
                    </span>
                    <span className={textClass}>
                      {opt.text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Explanation Box (Muted Dark Forest Tint Header) */}
            {evaluation && (
              <div
                id="quiz-explanation-box"
                data-testid="quiz-explanation-box"
                className="mt-4 pt-4 border-t border-[#1F1F23] flex flex-col"
              >
                <span className="text-[12px] font-mono uppercase tracking-wider text-[#86EFAC] mb-1.5 flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC]" />
                  <span>Verified Mechanism Explanation</span>
                </span>
                <p className="text-[13px] text-[#A1A1AA] leading-[1.55] m-0">
                  {evaluation.explanation}
                </p>

                {distractorRationales && (
                  <div className="mt-3 pt-3 border-t border-[#1F1F23]/60 flex flex-col gap-1.5">
                    <span className="text-[11px] font-mono text-[#71717A] uppercase tracking-wider">
                      Distractor Traps Analysis:
                    </span>
                    {Object.entries(distractorRationales).map(([k, text]) => (
                      <div key={k} className="text-[12px] text-[#A1A1AA] leading-relaxed">
                        <span className="font-mono text-[#D4D4D8] font-semibold">Option {k}: </span>
                        {String(text)}
                      </div>
                    ))}
                  </div>
                )}
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
            data-testid="prev-question-btn"
            onClick={prevQuizQuestion}
            className="h-[44px] rounded-[10px] bg-[#111114] hover:bg-[#18181B] border border-[#1F1F23] hover:border-[#27272A] text-[13px] text-[#F4F4F5] font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#A1A1AA]" />
            <span>Previous Question</span>
          </button>

          {/* Column 2: Flag for Review */}
          <button
            type="button"
            data-testid="flag-question-btn"
            onClick={() => currentQ && toggleQuestionFlag(currentQ.id)}
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
            data-testid="next-question-btn"
            onClick={nextQuizQuestion}
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
