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
  Trash2,
  ShieldCheck,
  FileDown,
  ArrowLeft,
  Check,
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

  // Filter questions for the in-session review
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
                Official Mock Performance Report
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {session.title}
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">
              Marks have been automatically recorded into your Test Arsenal and Supabase cloud ledger. You can download your test paper with step-by-step solutions below before leaving.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              className={`px-4 py-2.5 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2 ${
                isPdfDownloaded
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isPdfDownloaded ? <Check size={16} /> : <FileDown size={16} />}
              <span>{isPdfDownloaded ? 'Downloaded Paper Again' : 'Download Paper & Solutions (PDF)'}</span>
            </button>

            <button
              onClick={onFinishAndPurge}
              className="px-5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <span>Return to Test Arsenal</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* ================= PRIMARY SCORE TILES ================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Score</span>
              <Trophy size={16} className="text-amber-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {analytics.totalScore}
              <span className="text-sm font-semibold text-slate-400">/{analytics.maxScore}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{analytics.percentage.toFixed(1)}% Marks</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Percentile</span>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {analytics.predictedPercentile.toFixed(2)}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Estimated NTA Standing</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Accuracy</span>
              <Zap size={16} className="text-blue-500" />
            </div>
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
              {analytics.accuracy.toFixed(0)}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {analytics.totalCorrect} Correct, {analytics.totalIncorrect} Incorrect
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Time Spent</span>
              <Clock size={16} className="text-purple-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {Math.floor(analytics.timeSpentSeconds / 60)}m
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ~{Math.round(analytics.timeSpentSeconds / (session.questions.length || 1))}s per question
            </p>
          </div>
        </div>

        {/* ================= QUESTION REVIEW & SOLUTIONS ================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Question-by-Question Diagnostic Review
              </h3>
              <p className="text-xs text-slate-500">
                Inspect step-by-step derivations and compare your answers with authentic solutions.
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
              }

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border transition ${
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
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {q.chapter}
                      </span>
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

                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4 bg-white dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <MathRenderer latex={q.text} />
                  </div>

                  {/* Solutions block */}
                  <div className="bg-slate-100 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      📖 Step-by-Step Derivation
                    </span>
                    <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono">
                      <MathRenderer latex={q.solution} />
                    </div>
                    {q.formula && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2">
                        <span>Governing Formula:</span>
                        <MathRenderer latex={`$${q.formula}$`} />
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
