import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Award,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Bot,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Layers,
  BarChart2,
  ShieldCheck,
  FileDown,
  ArrowLeft,
  Check,
  BookOpen,
} from 'lucide-react';
import {
  EphemeralTestSession,
  PersistentPerformanceRecord,
  Question,
  Subject,
  UserProfile,
} from '../types';
import { MathRenderer } from './MathRenderer';
import { AiDoubtTutorModal } from './AiDoubtTutorModal';
import { generateTestPaperPdf } from '../utils/pdfExport';

interface TestResultViewProps {
  session: EphemeralTestSession;
  analytics: PersistentPerformanceRecord;
  onRetake: () => void;
  onFinishAndPurge: () => void;
  onOpenApiKeyModal: () => void;
  userProfile?: UserProfile;
}

export const TestResultView: React.FC<TestResultViewProps> = ({
  session,
  analytics,
  onRetake,
  onFinishAndPurge,
  onOpenApiKeyModal,
  userProfile,
}) => {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
  const [selectedQuestionForTutor, setSelectedQuestionForTutor] = useState<Question | null>(null);
  const [isPdfDownloaded, setIsPdfDownloaded] = useState(false);

  useEffect(() => {
    if (analytics.totalScore > 0) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  }, [analytics.totalScore]);

  const handleDownloadPdf = () => {
    generateTestPaperPdf(session, analytics, userProfile);
    setIsPdfDownloaded(true);
  };

  // Filter questions for review
  const filteredQuestions = session.questions.filter((q) => {
    const resp = session.responses[q.id];
    const isAnswered =
      resp &&
      (resp.status === 'answered' || resp.status === 'answered_and_marked') &&
      (resp.selectedOption !== undefined ||
        (resp.selectedOptions && resp.selectedOptions.length > 0) ||
        (resp.numericalValue !== undefined && resp.numericalValue.trim() !== '') ||
        (resp.matrixSelections && Object.keys(resp.matrixSelections).length > 0));

    if (filter === 'unattempted') return !isAnswered;

    let isCorrect = false;
    if (q.type === 'single_choice') {
      isCorrect =
        resp?.selectedOption?.trim().toUpperCase() ===
        String(q.correctAnswer).trim().toUpperCase();
    } else if (q.type === 'multiple_choice') {
      if (Array.isArray(q.correctAnswer) && resp?.selectedOptions) {
        const setA = new Set(q.correctAnswer);
        const setB = new Set(resp.selectedOptions);
        isCorrect = setA.size === setB.size && [...setA].every((v) => setB.has(v));
      }
    } else if (q.type === 'numerical' || q.type === 'integer') {
      const sVal = parseFloat(resp?.numericalValue || '0');
      const cVal = parseFloat(String(q.correctAnswer));
      isCorrect = Math.abs(sVal - cVal) <= (q.numericalTolerance ?? 0.05);
    } else {
      isCorrect = resp?.selectedOption === q.correctAnswer;
    }

    if (filter === 'correct') return isAnswered && isCorrect;
    if (filter === 'incorrect') return isAnswered && !isCorrect;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ================= RESULT BANNER & ACTIONS ================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Exam Evaluation Complete • Auto-Synced to Test Arsenal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {session.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Attempted by <span className="font-semibold text-slate-700 dark:text-slate-300">{userProfile?.name || 'Divesh Sah'}</span> • Data Policy: Questions & solutions will be wiped from active memory when you return to dashboard.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition ${
                isPdfDownloaded
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {isPdfDownloaded ? <Check size={16} /> : <FileDown size={16} />}
              <span>{isPdfDownloaded ? 'PDF Downloaded' : 'Download Paper & Solutions (PDF)'}</span>
            </button>

            <button
              onClick={onFinishAndPurge}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
            >
              <ArrowLeft size={16} />
              <span>Back to Test Arsenal</span>
            </button>
          </div>
        </div>

        {/* ================= SCORECARD OVERVIEW ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Score</span>
              <Trophy size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {analytics.totalScore}{' '}
              <span className="text-sm font-semibold text-slate-400">/ {analytics.maxScore}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Percentage: {analytics.percentage.toFixed(1)}%
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Accuracy Rate</span>
              <Zap size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {analytics.accuracy.toFixed(0)}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {analytics.totalCorrect} Correct • {analytics.totalIncorrect} Incorrect
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Projected Percentile</span>
              <Award size={16} className="text-blue-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {analytics.predictedPercentile.toFixed(2)}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Est. AIR: ~{analytics.predictedRank || '500-1500'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Time Invested</span>
              <Clock size={16} className="text-purple-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {Math.floor(analytics.timeSpentSeconds / 60)}m {analytics.timeSpentSeconds % 60}s
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ~{Math.round(analytics.timeSpentSeconds / (session.questions.length || 1))}s avg per question
            </p>
          </div>
        </div>

        {/* ================= QUESTION REVIEW & NOTEBOOK-STYLE SOLUTIONS ================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen size={18} className="text-blue-600" />
                Notebook-Style Step-by-Step Diagnostic Review
              </h3>
              <p className="text-xs text-slate-500">
                Detailed handwritten notebook derivations with given parameters, governing concepts, step-by-step math, and pitfall checks.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['all', 'correct', 'incorrect', 'unattempted'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-3 py-1 rounded-lg capitalize transition ${
                    filter === mode
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-6">
            {filteredQuestions.map((q, idx) => {
              const resp = session.responses[q.id];
              const isAnswered =
                resp &&
                (resp.status === 'answered' || resp.status === 'answered_and_marked') &&
                (resp.selectedOption !== undefined ||
                  (resp.selectedOptions && resp.selectedOptions.length > 0) ||
                  (resp.numericalValue !== undefined && resp.numericalValue.trim() !== ''));

              let isCorrect = false;
              let studentAnsText = 'Unattempted';

              if (q.type === 'single_choice') {
                studentAnsText = resp?.selectedOption || 'Unattempted';
                isCorrect =
                  resp?.selectedOption?.trim().toUpperCase() ===
                  String(q.correctAnswer).trim().toUpperCase();
              } else if (q.type === 'multiple_choice') {
                studentAnsText = resp?.selectedOptions?.join(', ') || 'Unattempted';
                if (Array.isArray(q.correctAnswer) && resp?.selectedOptions) {
                  const setA = new Set(q.correctAnswer);
                  const setB = new Set(resp.selectedOptions);
                  isCorrect = setA.size === setB.size && [...setA].every((v) => setB.has(v));
                }
              } else if (q.type === 'numerical' || q.type === 'integer') {
                studentAnsText = resp?.numericalValue || 'Unattempted';
                const sVal = parseFloat(resp?.numericalValue || '0');
                const cVal = parseFloat(String(q.correctAnswer));
                isCorrect = Math.abs(sVal - cVal) <= (q.numericalTolerance ?? 0.05);
              }

              return (
                <div
                  key={q.id}
                  className={`p-6 rounded-2xl border transition ${
                    !isAnswered
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                      : isCorrect
                      ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                        Q{idx + 1}.
                      </span>
                      <span className="capitalize font-bold text-blue-600 dark:text-blue-400">
                        {q.subject}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                        {q.chapter || q.topic}
                      </span>
                      {q.section && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                          {q.section}
                        </span>
                      )}
                      {q.source && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                          {q.source}
                        </span>
                      )}
                      {q.pyqReference && (
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-300 font-bold">
                          {q.pyqReference}
                        </span>
                      )}
                    </div>

                    <div>
                      {!isAnswered ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                          Unattempted (0)
                        </span>
                      ) : isCorrect ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 size={13} /> Correct (+4)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-300 font-bold text-[11px] flex items-center gap-1">
                          <XCircle size={13} /> Incorrect (-1)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Diagram if available */}
                  {q.diagramSvg && (
                    <div
                      className="p-4 my-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center max-w-md mx-auto"
                      dangerouslySetInnerHTML={{ __html: q.diagramSvg }}
                    />
                  )}

                  {/* Question Statement */}
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4 bg-white dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <MathRenderer latex={q.text} />
                  </div>

                  {/* Student vs Correct Answer */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold p-3 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                    <div>
                      <span className="text-slate-500">Your Response: </span>
                      <span
                        className={`font-bold font-mono ${
                          !isAnswered
                            ? 'text-slate-400'
                            : isCorrect
                            ? 'text-emerald-600'
                            : 'text-red-500'
                        }`}
                      >
                        {studentAnsText}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Correct Answer: </span>
                      <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {/* ================= NOTEBOOK-STYLE SOLUTION CARD ================= */}
                  <div className="bg-amber-50/40 dark:bg-slate-900/90 p-5 rounded-2xl border border-amber-200/80 dark:border-slate-700 space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-slate-800 pb-2">
                      <span className="text-xs font-extrabold text-amber-900 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        📝 Official Notebook Derivation
                      </span>
                      {q.formula && (
                        <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                          Formula: ${q.formula}$
                        </span>
                      )}
                    </div>

                    {q.notebookSolution ? (
                      <div className="space-y-3 text-xs text-slate-800 dark:text-slate-200">
                        <div className="p-2.5 bg-white/80 dark:bg-slate-800/60 rounded-xl border border-amber-100 dark:border-slate-700">
                          <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                            📌 Given Data & Boundary Conditions:
                          </span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {q.notebookSolution.given}
                          </span>
                        </div>

                        <div className="p-2.5 bg-white/80 dark:bg-slate-800/60 rounded-xl border border-amber-100 dark:border-slate-700">
                          <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                            📐 Governing Law & Core Concept:
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {q.notebookSolution.concept}
                          </span>
                        </div>

                        <div className="p-3 bg-white/90 dark:bg-slate-800/80 rounded-xl border border-amber-200 dark:border-slate-700 space-y-1.5 font-mono">
                          <span className="font-bold text-slate-900 dark:text-white block font-sans">
                            🔢 Step-by-Step Derivation:
                          </span>
                          {q.notebookSolution.steps.map((step, sIdx) => (
                            <div key={sIdx} className="text-slate-800 dark:text-slate-200">
                              <span className="font-bold text-blue-600 mr-2">[{sIdx + 1}]</span>
                              <MathRenderer latex={step} />
                            </div>
                          ))}
                        </div>

                        <div className="p-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold">
                          ✅ Conclusion: {q.notebookSolution.conclusion}
                        </div>

                        {q.notebookSolution.pitfall && (
                          <div className="p-2.5 bg-red-50/80 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 text-red-900 dark:text-red-200 text-[11px]">
                            ⚠️ Common Trap / Misconception: {q.notebookSolution.pitfall}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-line">
                        <MathRenderer latex={q.solution} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
