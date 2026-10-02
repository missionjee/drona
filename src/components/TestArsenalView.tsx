import React from 'react';
import {
  Trophy,
  TrendingUp,
  BrainCircuit,
  Zap,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { PersistentPerformanceRecord, UserProfile, Subject } from '../types';

interface TestArsenalViewProps {
  pastRecords: PersistentPerformanceRecord[];
  userProfile: UserProfile;
  onNavigateToSeries: () => void;
  onSelectTestRecord?: (record: PersistentPerformanceRecord) => void;
}

export const TestArsenalView: React.FC<TestArsenalViewProps> = ({
  pastRecords,
  userProfile,
  onNavigateToSeries,
  onSelectTestRecord,
}) => {
  const isNeet = userProfile.stream === 'neet';
  const subjects: Subject[] = isNeet
    ? ['physics', 'chemistry', 'biology']
    : ['physics', 'chemistry', 'mathematics'];

  const totalTests = pastRecords.length;
  const bestPercentile = pastRecords.reduce(
    (max, r) => Math.max(max, r.predictedPercentile || 0),
    0
  );
  const avgAccuracy =
    totalTests > 0
      ? pastRecords.reduce((acc, r) => acc + (r.accuracy || 0), 0) / totalTests
      : 0;
  const avgScorePct =
    totalTests > 0
      ? pastRecords.reduce((acc, r) => acc + (r.percentage || (r.totalScore / (r.maxScore || 1)) * 100), 0) / totalTests
      : 0;

  // Calculate subject mastery
  const getSubjectMastery = (sub: Subject) => {
    let totalScore = 0;
    let totalMax = 0;
    let count = 0;

    pastRecords.forEach((r) => {
      const s = r.subjectScores?.[sub];
      if (s) {
        totalScore += s.score || 0;
        totalMax += s.maxScore || 100;
        count++;
      }
    });

    if (totalMax === 0) return { pct: 0, count: 0 };
    return { pct: Math.round((totalScore / totalMax) * 100), count };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* ================= TOP COMMAND STATS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mocks Attempted</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
              <Trophy size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalTests}</div>
          <p className="text-[11px] text-slate-500 mt-1">Auto-synced to Supabase</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Average Score</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalTests > 0 ? `${avgScorePct.toFixed(1)}%` : '--'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across all attempted papers</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Peak Percentile</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
              <BrainCircuit size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {bestPercentile > 0 ? `${bestPercentile.toFixed(2)}%` : '--'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Best NTA projected rank</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Accuracy</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
              <Zap size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalTests > 0 ? `${avgAccuracy.toFixed(1)}%` : '--'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Precision without negative traps</p>
        </div>
      </div>

      {/* ================= SUBJECT MASTERY & QUICK LAUNCH ================= */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Subject Mastery Breakdown */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers size={16} className="text-blue-600" /> Subject Balance & Cognitive Mastery
            </h3>
            <span className="text-xs text-slate-500">Target: {userProfile.targetCollege}</span>
          </div>

          <div className="space-y-4 pt-1">
            {subjects.map((sub) => {
              const { pct, count } = getSubjectMastery(sub);

              return (
                <div key={sub} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold capitalize text-slate-800 dark:text-slate-200">
                      {sub}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">
                        {count > 0 ? `${count} tests evaluated` : 'No tests yet'}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {pct > 0 ? `${pct}%` : '--'}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 70
                          ? 'bg-emerald-500'
                          : pct >= 40
                          ? 'bg-blue-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Card: Synthesize New Mock */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white flex flex-col justify-between shadow-md">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300 uppercase tracking-wider">
              <Sparkles size={14} /> CBT Mock Simulator
            </div>
            <h3 className="text-lg font-black tracking-tight">
              Ready to Test Your Combat Readiness?
            </h3>
            <p className="text-xs text-blue-200 leading-relaxed">
              Launch our 8-stage self-healing engine to generate a fresh, unrepeated{' '}
              {isNeet ? 'NEET' : 'JEE Main & Advanced'} paper grounded in authentic PYQs.
            </p>
          </div>

          <button
            onClick={onNavigateToSeries}
            className="mt-6 w-full py-2.5 bg-white hover:bg-blue-50 text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <span>Architect Custom Test</span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>

      {/* ================= RESTRUCTURED TEST HISTORY (NO DELETE) ================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" /> Official Test History & Score Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified test attempts auto-uploaded from CBT Simulator. Data policy: scores preserved, question papers wiped.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={14} /> Immutable Ledger (No Deletions Allowed)
          </div>
        </div>

        {pastRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Test Title</th>
                  <th className="p-3">Pattern</th>
                  <th className="p-3">Score Obtained</th>
                  <th className="p-3">Accuracy</th>
                  <th className="p-3">Projected Percentile</th>
                  <th className="p-3 text-right">Date Attempted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pastRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => onSelectTestRecord && onSelectTestRecord(rec)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-850 cursor-pointer transition"
                  >
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {rec.title}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {rec.examType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      {rec.totalScore} / {rec.maxScore}
                      <span className="text-[11px] text-slate-400 ml-1 font-normal">
                        ({rec.percentage.toFixed(0)}%)
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {rec.accuracy.toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                      {rec.predictedPercentile.toFixed(2)}%
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {new Date(rec.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 mx-auto flex items-center justify-center font-bold">
              🧪
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                No Tests Recorded Yet
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate your first NCERT mock test in the Test Series tab. Marks will automatically appear here once completed.
              </p>
            </div>
            <button
              onClick={onNavigateToSeries}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              Start First Mock Test
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
