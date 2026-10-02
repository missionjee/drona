import React from 'react';
import {
  Trophy,
  TrendingUp,
  BrainCircuit,
  Layers,
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { PersistentPerformanceRecord, CustomSyllabusConfig } from '../types';
import { SyllabusSelector } from './SyllabusSelector';

interface DashboardProps {
  pastRecords: PersistentPerformanceRecord[];
  onGenerateCustomTest: (config: CustomSyllabusConfig) => void;
  isGenerating: boolean;
  onOpenFormulaVault: () => void;
  onOpenApiKeyModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  pastRecords,
  onGenerateCustomTest,
  isGenerating,
  onOpenFormulaVault,
  onOpenApiKeyModal,
}) => {
  const totalTests = pastRecords.length;
  const bestPercentile = pastRecords.reduce(
    (max, r) => Math.max(max, r.predictedPercentile),
    0
  );
  const avgAccuracy =
    totalTests > 0
      ? pastRecords.reduce((acc, r) => acc + r.accuracy, 0) / totalTests
      : 0;

  const allWeakChapters = Array.from(
    new Set(pastRecords.flatMap((r) => r.weakChapters))
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 font-sans">
      {/* ================= MINIMAL CLEAN HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              JEE AI Test Series • NCERT Grounded
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Custom Syllabus Mock Test Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Select textbook chapters from NCERT Class 11 & 12. Every test is synthesized on demand with zero static question banks, multi-agent dual-pass validation, and complete privacy.
          </p>
        </div>

        {/* Minimal Badges */}
        <div className="flex items-center gap-2 self-start md:self-auto text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" /> Ephemeral Data
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <Zap size={14} className="text-amber-500" /> Dual-Pass Solver
          </span>
        </div>
      </div>

      {/* ================= REFINED STATS ROW ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
            <Trophy size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">Tests Taken</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{totalTests}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">Peak Percentile</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {bestPercentile > 0 ? `${bestPercentile.toFixed(2)}%` : '--'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-lg">
            <BrainCircuit size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">Avg Accuracy</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {totalTests > 0 ? `${avgAccuracy.toFixed(1)}%` : '--'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-lg">
            <Layers size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">Weak Chapters</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {allWeakChapters.length}
            </p>
          </div>
        </div>
      </div>

      {/* ================= NCERT SYLLABUS SELECTOR ================= */}
      <SyllabusSelector
        onGenerateTest={onGenerateCustomTest}
        isGenerating={isGenerating}
      />

      {/* ================= PAST PERFORMANCE HISTORY ================= */}
      {pastRecords.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" /> Past Performance Snapshots
            </h3>
            <span className="text-xs text-slate-500">{pastRecords.length} completed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Test Title</th>
                  <th className="p-3">Pattern</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Percentile</th>
                  <th className="p-3">Accuracy</th>
                  <th className="p-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pastRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {rec.title}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {rec.examType === 'jee_advanced' ? 'Advanced' : 'Main'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {rec.totalScore}/{rec.maxScore}
                    </td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {rec.predictedPercentile.toFixed(2)}%
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                      {rec.accuracy.toFixed(0)}%
                    </td>
                    <td className="p-3 text-right text-slate-400 font-mono">
                      {new Date(rec.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
