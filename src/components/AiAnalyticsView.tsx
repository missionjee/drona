import React from 'react';
import {
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Target,
} from 'lucide-react';
import { PersistentPerformanceRecord, UserProfile } from '../types';

interface AiAnalyticsViewProps {
  pastRecords: PersistentPerformanceRecord[];
  userProfile: UserProfile;
  onNavigateToSeries: () => void;
}

export const AiAnalyticsView: React.FC<AiAnalyticsViewProps> = ({
  pastRecords,
  userProfile,
  onNavigateToSeries,
}) => {
  const totalTests = pastRecords.length;

  // Aggregate weak and strong chapters
  const allWeak = Array.from(new Set(pastRecords.flatMap((r) => r.weakChapters || [])));
  const allStrong = Array.from(new Set(pastRecords.flatMap((r) => r.strongChapters || [])));

  const latestRecord = pastRecords[0];

  // Dynamic AI Suggestions based on performance
  const generateDynamicAiAdvice = () => {
    if (totalTests === 0) {
      return [
        'Attempt your first full-length or chapter mock test to unlock AI cognitive diagnostics.',
        'Focus on high-weightage chapters in Class 11 and Class 12 before attempting full syllabi.',
        'Target an initial accuracy threshold of >70% before optimizing for speed.',
      ];
    }

    const advice: string[] = [];
    if (latestRecord && latestRecord.accuracy < 60) {
      advice.push(
        `Your accuracy in the last mock was ${latestRecord.accuracy.toFixed(0)}%. Negative marking in JEE/NEET is causing severe mark leakage. Minimize blind guessing.`
      );
    } else {
      advice.push(
        `High precision maintained (>75% accuracy). Start attempting higher difficulty multi-concept questions in JEE Advanced.`
      );
    }

    if (allWeak.length > 0) {
      advice.push(
        `Critical review recommended for weak chapters: ${allWeak.slice(0, 3).join(', ')}. Dedicate 2 hours of revision notes to these areas.`
      );
    }

    advice.push(
      `Predicted All India Rank: ${
        latestRecord?.predictedRank ? `AIR ~${latestRecord.predictedRank}` : 'Calculating baseline'
      }. Keep a 3-mock test frequency per week for consistent rank improvement.`
    );

    return advice;
  };

  const adviceList = generateDynamicAiAdvice();

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BrainCircuit size={20} className="text-purple-600" /> AI Cognitive Diagnostics & Strategy
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Deep-learning diagnostic synthesis grounded in your attempted mock tests and speed logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs uppercase border border-purple-200 dark:border-purple-900">
            {totalTests} Tests Evaluated
          </span>
        </div>
      </div>

      {/* AI Academic Coach Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-indigo-200">
              AI Academic Coach Recommendations
            </h3>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 font-mono">
            Grounding: JEE & NEET PYQs
          </span>
        </div>

        <div className="grid gap-3 pt-1">
          {adviceList.map((tip, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3 text-xs leading-relaxed"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-slate-100 font-medium">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chapter Breakdown Matrix */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Weak Areas */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle size={16} /> Identified Weak Chapters (Critical Focus)
            </h3>
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              {allWeak.length} Needs Attention
            </span>
          </div>

          {allWeak.length > 0 ? (
            <div className="space-y-2">
              {allWeak.map((ch, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-red-950 dark:text-red-200">{ch}</span>
                  <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                    Revise formulas
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              No weak chapters identified yet. Take more mocks to pinpoint vulnerabilities.
            </p>
          )}
        </div>

        {/* Strong Areas */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} /> Mastered Chapters (High Yield)
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {allStrong.length} Mastered
            </span>
          </div>

          {allStrong.length > 0 ? (
            <div className="space-y-2">
              {allStrong.map((ch, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-emerald-950 dark:text-emerald-200">{ch}</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Combat ready
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              Mastered chapters will be populated as your mock score accuracy increases.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
