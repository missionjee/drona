import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Calculator,
  Edit3,
  FileText,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  User,
  X,
  BookOpen,
  ShieldAlert,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Question,
  StudentResponse,
  Subject,
  EphemeralTestSession,
  QuestionStatus,
  ExamType,
} from '../types';
import { MathRenderer } from './MathRenderer';
import { ScientificCalculator } from './ScientificCalculator';
import { ScratchpadModal } from './ScratchpadModal';

interface CbtExamViewProps {
  session: EphemeralTestSession;
  onUpdateResponses: (responses: Record<string, StudentResponse>) => void;
  onSubmitTest: (proctorAutoSubmitted?: boolean) => void;
  onExitTest: () => void;
}

export const CbtExamView: React.FC<CbtExamViewProps> = ({
  session,
  onUpdateResponses,
  onSubmitTest,
  onExitTest,
}) => {
  const [currentSubject, setCurrentSubject] = useState<Subject>(
    session.questions[0]?.subject || 'physics'
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, StudentResponse>>(session.responses);

  // Tools modal states
  const [showCalculator, setShowCalculator] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ================= ANTI-CHEATING PROCTORING SYSTEM =================
  const [proctorStrikes, setProctorStrikes] = useState(0);
  const [showProctorWarning, setShowProctorWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(10);
  const warningTimerRef = useRef<any>(null);

  // Enforce fullscreen on exam entrance
  useEffect(() => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {}

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && !session.isCompleted) {
        triggerProctorViolation('Exited Fullscreen Examination Mode');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !session.isCompleted) {
        triggerProctorViolation('Switched Browser Tab or Minimized Window');
      }
    };

    const handleWindowBlur = () => {
      if (!session.isCompleted) {
        triggerProctorViolation('Exam Window Lost Focus (Alt+Tab or external app)');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F11, Escape, Ctrl+W, Ctrl+T, Ctrl+N, Alt+Tab
      if (
        e.key === 'F11' ||
        (e.ctrlKey && ['w', 't', 'n', 'r', 'p'].includes(e.key.toLowerCase())) ||
        (e.altKey && e.key === 'Tab')
      ) {
        e.preventDefault();
        triggerProctorViolation('Blocked Unauthorized Keyboard Shortcut');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [session.isCompleted]);

  const triggerProctorViolation = (reason: string) => {
    setProctorStrikes((prev) => {
      const nextStrikes = prev + 1;
      if (nextStrikes >= 3) {
        onSubmitTest(true);
      } else {
        setShowProctorWarning(true);
        setWarningCountdown(10);
      }
      return nextStrikes;
    });
  };

  // Warning countdown timer
  useEffect(() => {
    if (showProctorWarning) {
      warningTimerRef.current = setInterval(() => {
        setWarningCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(warningTimerRef.current);
            triggerProctorViolation('Failed to return within grace window');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    }
    return () => {
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    };
  }, [showProctorWarning]);

  const handleResumeFromWarning = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {}
    setShowProctorWarning(false);
  };

  // Filter questions by current subject
  const subjectQuestions = session.questions.filter((q) => q.subject === currentSubject);

  // Available sections within current subject
  const availableSections = Array.from(
    new Set(
      subjectQuestions.map((q) => {
        if (q.section) return q.section;
        return q.type === 'numerical' || q.type === 'integer'
          ? 'Section B (Numerical Value)'
          : 'Section A (Multiple Choice)';
      })
    )
  );

  const currentQuestion: Question | undefined = subjectQuestions[currentQuestionIndex];
  const activeSection =
    currentQuestion?.section ||
    (currentQuestion?.type === 'numerical' || currentQuestion?.type === 'integer'
      ? 'Section B (Numerical Value)'
      : 'Section A (Multiple Choice)');

  // Live countdown timer in seconds
  const totalSeconds = session.durationMinutes * 60;
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(totalSeconds);
  const questionStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onSubmitTest(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onSubmitTest]);

  // When changing question, update visit status
  useEffect(() => {
    if (!currentQuestion) return;

    questionStartTimeRef.current = Date.now();

    setResponses((prev) => {
      const existing = prev[currentQuestion.id];
      if (!existing || existing.status === 'not_visited') {
        const updated: Record<string, StudentResponse> = {
          ...prev,
          [currentQuestion.id]: {
            status: 'not_answered',
            timeSpentSeconds: existing?.timeSpentSeconds || 0,
            visitedCount: (existing?.visitedCount || 0) + 1,
            selectedOption: existing?.selectedOption,
            selectedOptions: existing?.selectedOptions,
            numericalValue: existing?.numericalValue,
            matrixSelections: existing?.matrixSelections,
          },
        };
        onUpdateResponses(updated);
        return updated;
      }
      return prev;
    });
  }, [currentQuestionIndex, currentSubject, currentQuestion?.id]);

  const saveCurrentQuestionTime = () => {
    if (!currentQuestion) return;
    const elapsed = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    setResponses((prev) => {
      const existing = prev[currentQuestion.id];
      if (!existing) return prev;
      return {
        ...prev,
        [currentQuestion.id]: {
          ...existing,
          timeSpentSeconds: (existing.timeSpentSeconds || 0) + elapsed,
        },
      };
    });
    questionStartTimeRef.current = Date.now();
  };

  // Option selection handlers
  const handleSingleChoiceSelect = (optionId: string) => {
    if (!currentQuestion) return;
    setResponses((prev) => {
      const existing = prev[currentQuestion.id];
      const updated: Record<string, StudentResponse> = {
        ...prev,
        [currentQuestion.id]: {
          status: existing?.status || 'not_answered',
          timeSpentSeconds: existing?.timeSpentSeconds || 0,
          visitedCount: existing?.visitedCount || 1,
          selectedOption: optionId,
        },
      };
      onUpdateResponses(updated);
      return updated;
    });
  };

  const handleMultipleChoiceSelect = (optId: string) => {
    if (!currentQuestion) return;
    setResponses((prev) => {
      const existing = prev[currentQuestion.id];
      const currentSelected = existing?.selectedOptions || [];
      const nextSelected = currentSelected.includes(optId)
        ? currentSelected.filter((id) => id !== optId)
        : [...currentSelected, optId];

      const updated: Record<string, StudentResponse> = {
        ...prev,
        [currentQuestion.id]: {
          status: existing?.status || 'not_answered',
          timeSpentSeconds: existing?.timeSpentSeconds || 0,
          visitedCount: existing?.visitedCount || 1,
          selectedOptions: nextSelected,
        },
      };
      onUpdateResponses(updated);
      return updated;
    });
  };

  const handleNumericalInput = (val: string) => {
    if (!currentQuestion) return;
    setResponses((prev) => {
      const existing = prev[currentQuestion.id];
      const updated: Record<string, StudentResponse> = {
        ...prev,
        [currentQuestion.id]: {
          status: existing?.status || 'not_answered',
          timeSpentSeconds: existing?.timeSpentSeconds || 0,
          visitedCount: existing?.visitedCount || 1,
          numericalValue: val,
        },
      };
      onUpdateResponses(updated);
      return updated;
    });
  };

  // NTA Action: Save & Next
  const handleSaveAndNext = () => {
    if (!currentQuestion) return;
    saveCurrentQuestionTime();

    const resp = responses[currentQuestion.id];
    const hasSelection =
      resp?.selectedOption !== undefined ||
      (resp?.selectedOptions && resp.selectedOptions.length > 0) ||
      (resp?.numericalValue !== undefined && resp.numericalValue.trim() !== '') ||
      (resp?.matrixSelections && Object.keys(resp.matrixSelections).length > 0);

    const newStatus: QuestionStatus = hasSelection ? 'answered' : 'not_answered';

    const updated: Record<string, StudentResponse> = {
      ...responses,
      [currentQuestion.id]: {
        ...resp,
        status: newStatus,
        timeSpentSeconds: resp?.timeSpentSeconds || 0,
        visitedCount: resp?.visitedCount || 1,
      },
    };

    setResponses(updated);
    onUpdateResponses(updated);
    goToNextQuestion();
  };

  // NTA Action: Save & Mark for Review
  const handleSaveAndMarkForReview = () => {
    if (!currentQuestion) return;
    saveCurrentQuestionTime();

    const resp = responses[currentQuestion.id];
    const hasSelection =
      resp?.selectedOption !== undefined ||
      (resp?.selectedOptions && resp.selectedOptions.length > 0) ||
      (resp?.numericalValue !== undefined && resp.numericalValue.trim() !== '');

    const newStatus: QuestionStatus = hasSelection ? 'answered_and_marked' : 'marked_for_review';

    const updated: Record<string, StudentResponse> = {
      ...responses,
      [currentQuestion.id]: {
        ...resp,
        status: newStatus,
        timeSpentSeconds: resp?.timeSpentSeconds || 0,
        visitedCount: resp?.visitedCount || 1,
      },
    };

    setResponses(updated);
    onUpdateResponses(updated);
    goToNextQuestion();
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    setResponses((prev) => {
      const existing = prev[currentQuestion.id];
      const updated: Record<string, StudentResponse> = {
        ...prev,
        [currentQuestion.id]: {
          ...existing,
          status: 'not_answered',
          selectedOption: undefined,
          selectedOptions: [],
          numericalValue: undefined,
          matrixSelections: undefined,
        },
      };
      onUpdateResponses(updated);
      return updated;
    });
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < subjectQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const subjects: Subject[] = Array.from(new Set(session.questions.map((q) => q.subject)));
      const nextSubIdx = subjects.indexOf(currentSubject) + 1;
      if (nextSubIdx < subjects.length) {
        setCurrentSubject(subjects[nextSubIdx]);
        setCurrentQuestionIndex(0);
      }
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handlePaletteQuestionClick = (idx: number) => {
    saveCurrentQuestionTime();
    setCurrentQuestionIndex(idx);
  };

  const handleSubjectSwitch = (sub: Subject) => {
    saveCurrentQuestionTime();
    setCurrentSubject(sub);
    setCurrentQuestionIndex(0);
  };

  const handleSectionSwitch = (secName: string) => {
    saveCurrentQuestionTime();
    const firstIdx = subjectQuestions.findIndex(
      (q) =>
        (q.section ||
          (q.type === 'numerical' || q.type === 'integer'
            ? 'Section B (Numerical Value)'
            : 'Section A (Multiple Choice)')) === secName
    );
    if (firstIdx !== -1) {
      setCurrentQuestionIndex(firstIdx);
    }
  };

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  };

  const availableSubjects: Subject[] = Array.from(
    new Set(session.questions.map((q) => q.subject))
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none overflow-hidden font-sans">
      {/* ================= 1. TOP NTA PROCTOR HEADER ================= */}
      <header className="h-14 bg-slate-900 text-white px-4 flex items-center justify-between border-b border-slate-800 shadow-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-extrabold text-xs tracking-wider uppercase bg-blue-900/80 px-2.5 py-1 rounded border border-blue-600">
              {session.examType === 'jee_advanced'
                ? 'JEE ADVANCED CBT'
                : session.examType === 'neet'
                ? 'NEET-UG CBT'
                : 'JEE MAIN NTA CBT'}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-semibold truncate max-w-xs md:max-w-md hidden sm:inline text-slate-200">
            {session.title}
          </span>
        </div>

        {/* Tools, Anti-Cheat Status & Timer */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400">
            <ShieldAlert size={14} /> Fullscreen Proctor Active (Strikes: {proctorStrikes}/3)
          </div>

          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
            title="Scientific Calculator"
          >
            <Calculator size={15} className="text-yellow-400" />
            <span className="hidden md:inline">Calculator</span>
          </button>

          <button
            onClick={() => setShowScratchpad(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
            title="Rough Sheet"
          >
            <Edit3 size={15} className="text-emerald-400" />
            <span className="hidden md:inline">Rough Sheet</span>
          </button>

          {/* Countdown Clock */}
          <div
            className={`px-3 py-1 rounded-lg font-mono font-bold text-sm tracking-widest flex items-center gap-2 border shadow-inner ${
              timeLeftSeconds < 300
                ? 'bg-red-950/90 text-red-400 border-red-500 animate-pulse'
                : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            <Clock size={16} className={timeLeftSeconds < 300 ? 'text-red-400' : 'text-blue-400'} />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm transition"
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* ================= 2. SUBJECT TABS ================= */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          {availableSubjects.map((sub) => {
            const isActive = currentSubject === sub;
            const count = session.questions.filter((q) => q.subject === sub).length;

            return (
              <button
                key={sub}
                onClick={() => handleSubjectSwitch(sub)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{sub}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden md:block">
          Question {currentQuestionIndex + 1} of {subjectQuestions.length} ({currentSubject.toUpperCase()})
        </div>
      </div>

      {/* ================= 3. SECTION SUB-TABS (NTA SECTION A / SECTION B) ================= */}
      <div className="bg-slate-100 dark:bg-slate-925 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mr-2 flex items-center gap-1">
            <Layers size={13} className="text-blue-600" /> Sections:
          </span>
          {availableSections.map((sec) => {
            const isActive = activeSection === sec;
            const count = subjectQuestions.filter((q) => {
              const qSec =
                q.section ||
                (q.type === 'numerical' || q.type === 'integer'
                  ? 'Section B (Numerical Value)'
                  : 'Section A (Multiple Choice)');
              return qSec === sec;
            }).length;

            return (
              <button
                key={sec}
                onClick={() => handleSectionSwitch(sec)}
                className={`px-3.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border border-blue-500 shadow-xs'
                    : 'bg-white/60 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <span>{sec}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {count} Qs
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hidden sm:block">
          {activeSection.includes('Numerical')
            ? 'Section B: Numerical Value (+4.0 / -1.0)'
            : 'Section A: Multiple Choice (+4.0 / -1.0)'}
        </div>
      </div>

      {/* ================= 4. MAIN SPLIT: QUESTION AREA + PALETTE ================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Question Viewport */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden border-r border-slate-200 dark:border-slate-800">
          {/* Question Sub-header */}
          <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                Question No. {currentQuestionIndex + 1}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200">
                {currentQuestion?.type.replace('_', ' ').toUpperCase()}
              </span>

              {/* Source Badge (HCV, Irodov, PYQ) */}
              {currentQuestion?.source && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                  {currentQuestion.source === 'HCV'
                    ? 'HC Verma'
                    : currentQuestion.source === 'Irodov'
                    ? 'I.E. Irodov'
                    : currentQuestion.source === 'PYQ'
                    ? 'Official PYQ'
                    : 'NTA Exam Prototype'}
                </span>
              )}

              {currentQuestion?.pyqReference && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hidden sm:inline">
                  {currentQuestion.pyqReference}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                +4.0 Marks
              </span>
              <span className="text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900">
                -1.0 Negative
              </span>
            </div>
          </div>

          {/* Question Statement, Diagram & Options */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {currentQuestion ? (
              <div className="space-y-6 max-w-4xl">
                {/* Chapter tag */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase">
                    Chapter:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {currentQuestion.chapter || currentQuestion.topic}
                  </span>
                </div>

                {/* Inline SVG Diagram if available */}
                {currentQuestion.diagramSvg && (
                  <div
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-xs"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.diagramSvg }}
                  />
                )}

                {/* Question Statement */}
                <div className="text-sm sm:text-base leading-relaxed text-slate-900 dark:text-slate-100 font-medium bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <MathRenderer latex={currentQuestion.text} />
                </div>

                {/* MCQ Options */}
                {currentQuestion.options && currentQuestion.options.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {currentQuestion.options.map((opt) => {
                      const isMulti = currentQuestion.type === 'multiple_choice';
                      const isSelected = isMulti
                        ? responses[currentQuestion.id]?.selectedOptions?.includes(opt.id)
                        : responses[currentQuestion.id]?.selectedOption === opt.id;

                      return (
                        <div
                          key={opt.id}
                          onClick={() =>
                            isMulti
                              ? handleMultipleChoiceSelect(opt.id)
                              : handleSingleChoiceSelect(opt.id)
                          }
                          className={`p-4 rounded-xl border cursor-pointer transition flex items-center gap-3 text-sm select-none ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-950 dark:text-blue-100 font-semibold shadow-xs ring-1 ring-blue-500'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 transition ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {opt.id}
                          </div>
                          <div className="flex-1 text-slate-900 dark:text-slate-100">
                            <MathRenderer latex={opt.text} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Numerical Input */}
                {(currentQuestion.type === 'numerical' || currentQuestion.type === 'integer') && (
                  <div className="pt-4 space-y-3 max-w-sm bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                      Enter Final Numerical Value:
                    </label>
                    <input
                      type="text"
                      value={responses[currentQuestion.id]?.numericalValue || ''}
                      onChange={(e) => handleNumericalInput(e.target.value)}
                      placeholder="Type your final answer..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <p className="text-[11px] text-slate-500">
                      Standard decimal or integer format. Use minus sign (-) for negative numbers.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-400 text-sm">No question loaded.</div>
            )}
          </div>

          {/* Bottom Action Controls */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveAndNext}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Save & Next
              </button>
              <button
                onClick={handleSaveAndMarkForReview}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Save & Mark for Review
              </button>
              <button
                onClick={handleClearResponse}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition"
              >
                Clear Response
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs rounded-xl transition flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                onClick={goToNextQuestion}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs rounded-xl transition flex items-center gap-1"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Palette (Section-Partitioned NTA Layout) */}
        <div className="w-full lg:w-80 bg-white dark:bg-slate-900 flex flex-col shrink-0 border-l border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* User profile banner */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
              DS
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">Divesh Sah</div>
              <div className="text-[11px] text-slate-500">Roll No: JEE-2026-NTA</div>
            </div>
          </div>

          {/* Palette Questions partitioned by sections */}
          <div className="p-4 flex-1 overflow-y-auto space-y-5">
            {availableSections.map((secName) => {
              const secQuestions = subjectQuestions.filter((q) => {
                const qSec =
                  q.section ||
                  (q.type === 'numerical' || q.type === 'integer'
                    ? 'Section B (Numerical Value)'
                    : 'Section A (Multiple Choice)');
                return qSec === secName;
              });

              return (
                <div key={secName} className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                    <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {secName}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {secQuestions.length} Questions
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {secQuestions.map((q) => {
                      const idx = subjectQuestions.indexOf(q);
                      const st = responses[q.id]?.status || 'not_visited';
                      const isCurrent = idx === currentQuestionIndex;

                      let btnStyle =
                        'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
                      if (st === 'answered') {
                        btnStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                      } else if (st === 'not_answered') {
                        btnStyle = 'bg-red-500 text-white border-red-500 font-bold';
                      } else if (st === 'marked_for_review') {
                        btnStyle = 'bg-purple-600 text-white border-purple-600 font-bold';
                      } else if (st === 'answered_and_marked') {
                        btnStyle =
                          'bg-purple-700 text-white border-purple-400 ring-2 ring-emerald-400 font-bold';
                      }

                      return (
                        <button
                          key={q.id}
                          onClick={() => handlePaletteQuestionClick(idx)}
                          className={`h-9 rounded-lg text-xs font-semibold border flex items-center justify-center transition select-none ${btnStyle} ${
                            isCurrent ? 'ring-2 ring-blue-500 scale-105' : ''
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600"></span> Answered
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-red-500"></span> Not Answered
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-purple-600"></span> Marked Review
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-700"></span> Not Visited
            </div>
          </div>
        </div>
      </div>

      {/* ================= PROCTORING VIOLATION ALERT MODAL ================= */}
      {showProctorWarning && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-red-500 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={36} />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-red-600 dark:text-red-400">
                PROCTORING VIOLATION DETECTED!
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                You switched away from the examination window or exited full screen mode.
              </p>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 text-xs font-bold text-red-700 dark:text-red-300">
              STRIKE {proctorStrikes} OF 3
            </div>

            <p className="text-[11px] text-slate-500">
              Exam will automatically submit with malpractice penalties if you do not resume in{' '}
              <span className="font-bold text-red-600 font-mono text-sm">{warningCountdown}s</span>.
            </p>

            <button
              onClick={handleResumeFromWarning}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              Resume Examination in Fullscreen Now
            </button>
          </div>
        </div>
      )}

      {/* Scientific Calculator Modal */}
      <ScientificCalculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
      />

      {/* Scratchpad Modal */}
      <ScratchpadModal
        isOpen={showScratchpad}
        onClose={() => setShowScratchpad(false)}
      />

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Submit Examination?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to finish and submit your exam? Your results will be calculated and automatically uploaded to your Test Arsenal and Supabase cloud history.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
              >
                Return to Exam
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  onSubmitTest(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Yes, Final Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
