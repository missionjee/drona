import React, { useState } from 'react';
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
  Clock,
  AlertTriangle,
  Target,
  BarChart2,
  Eye,
  X,
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
}) => {
  const isNeet = userProfile.stream === 'neet';
  const subjects: Subject[] = isNeet
    ? ['physics', 'chemistry', 'biology']
    : ['physics', 'chemistry', 'mathematics'];

  const [selectedRecordForDetail, setSelectedRecordForDetail] =
    useState<PersistentPerformanceRecord | null>(null);

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
      ? pastRecords.reduce(
          (acc, r) =>
            acc + (r.percentage || (r.totalScore / (r.maxScore || 1)) * 100),
          0
        ) / totalTests
      : 0;

  // Aggregate weak & strong chapters
  const allWeak = Array.from(new Set(pastRecords.flatMap((r) => r.weakChapters || [])));
  const allStrong = Array.from(new Set(pastRecords.flatMap((r) => r.strongChapters || [])));

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

    if (totalMax === 0) return { pct: 0, count: 0, avgMarks: 0 };
    return {
      pct: Math.round((totalScore / totalMax) * 100),
      count,
      avgMarks: Math.round(totalScore / count),
    };
  };

  // Trajectory graph coordinates calculation
  // We sort records chronologically (oldest to newest)
  const chronological = [...pastRecords].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const graphWidth = 700;
  const graphHeight = 220;
  const padX = 50;
  const padY = 30;
  const usableWidth = graphWidth - padX * 2;
  const usableHeight = graphHeight - padY * 2;

  const points = chronological.map((rec, i) => {
    const x =
      chronological.length === 1
        ? padX + usableWidth / 2
        : padX + (i / (chronological.length - 1)) * usableWidth;
    const pct = Math.min(100, Math.max(0, rec.percentage));
    const y = padY + usableHeight - (pct / 100) * usableHeight;
    return { x, y, rec };
  });

  const pathD =
    points.length > 1
      ? points.reduce((acc, p, idx) => {
          if (idx === 0) return `M ${p.x} ${p.y}`;
          const prev = points[idx - 1];
          const cpX1 = prev.x + (p.x - prev.x) / 2;
          const cpY1 = prev.y;
          const cpX2 = prev.x + (p.x - prev.x) / 2;
          const cpY2 = p.y;
          return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
        }, '')
      : points.length === 1
      ? `M ${points[0].x - 40} ${points[0].y} L ${points[0].x + 40} ${points[0].y}`
      : '';

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${padY + usableHeight} L ${
          points[0].x
        } ${padY + usableHeight} Z`
      : '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* ================= 1. TOP COMMAND METRICS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mocks Attempted</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
              <Trophy size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalTests}</div>
          <p className="text-[11px] text-slate-500 mt-1">Permanent Supabase Ledger</p>
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
          <p className="text-[11px] text-slate-500 mt-1">Projected All India Rank</p>
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
          <p className="text-[11px] text-slate-500 mt-1">Negative Trap Resistance</p>
        </div>
      </div>

      {/* ================= 2. INTERACTIVE SCORE TRAJECTORY GRAPH ================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 size={18} className="text-blue-600" />
              Score Trajectory & Percentile Momentum
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological progress curve across simulated NTA & IIT papers with 85% AIR cutoff.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Your Score %
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-1 border-t-2 border-dashed border-emerald-500"></span> 85% Target Line
            </div>
          </div>
        </div>

        {pastRecords.length > 0 ? (
          <div className="relative overflow-x-auto">
            <svg
              viewBox={`0 0 ${graphWidth} ${graphHeight}`}
              className="w-full h-56 min-w-[550px] drop-shadow-xs"
            >
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 25, 50, 75, 100].map((val) => {
                const yPos = padY + usableHeight - (val / 100) * usableHeight;
                return (
                  <g key={val}>
                    <line
                      x1={padX}
                      y1={yPos}
                      x2={graphWidth - padX}
                      y2={yPos}
                      stroke="#94a3b8"
                      strokeWidth="0.75"
                      strokeDasharray="3,3"
                      strokeOpacity="0.3"
                    />
                    <text
                      x={padX - 8}
                      y={yPos + 3.5}
                      fontSize="9"
                      fontWeight="bold"
                      fill="#94a3b8"
                      textAnchor="end"
                    >
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* 85% Benchmark Target Line */}
              {(() => {
                const targetY = padY + usableHeight - (85 / 100) * usableHeight;
                return (
                  <g>
                    <line
                      x1={padX}
                      y1={targetY}
                      x2={graphWidth - padX}
                      y2={targetY}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                    <text
                      x={graphWidth - padX}
                      y={targetY - 5}
                      fontSize="9"
                      fontWeight="bold"
                      fill="#10b981"
                      textAnchor="end"
                    >
                      AIR &lt; 1000 Zone (85%)
                    </text>
                  </g>
                );
              })()}

              {/* Area Gradient Fill */}
              {areaD && <path d={areaD} fill="url(#scoreGradient)" />}

              {/* Trajectory Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {points.map((pt, idx) => (
                <g
                  key={pt.rec.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedRecordForDetail(pt.rec)}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    className="transition group-hover:r-7"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    fontSize="9.5"
                    fontWeight="bold"
                    fill="#1e293b"
                    className="dark:fill-slate-100"
                    textAnchor="middle"
                  >
                    {pt.rec.percentage.toFixed(0)}%
                  </text>
                  <text
                    x={pt.x}
                    y={padY + usableHeight + 16}
                    fontSize="8.5"
                    fontWeight="bold"
                    fill="#64748b"
                    textAnchor="middle"
                  >
                    T{idx + 1} ({new Date(pt.rec.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' })})
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 mx-auto flex items-center justify-center font-bold">
              📈
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No Trend Data Available
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Complete your first CBT Mock Test in the Test Series tab to view your score trajectory graph.
            </p>
          </div>
        )}
      </div>

      {/* ================= 3. SUBJECT MASTERY & QUICK LAUNCH ================= */}
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
              const { pct, count, avgMarks } = getSubjectMastery(sub);

              return (
                <div key={sub} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold capitalize text-slate-800 dark:text-slate-200">
                      {sub}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500">
                        {count > 0 ? `${count} mocks evaluated • Avg ${avgMarks} marks` : 'No mocks evaluated'}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {pct > 0 ? `${pct}%` : '--'}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 75
                          ? 'bg-emerald-500'
                          : pct >= 50
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
              {isNeet ? 'NEET' : 'JEE Main & Advanced'} paper grounded in authentic PYQs (2015-2026), HCV, and Irodov.
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

      {/* ================= 4. AI COGNITIVE DIAGNOSTIC RECOMMENDATIONS ================= */}
      {totalTests > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BrainCircuit size={16} className="text-purple-600" />
              AI Cognitive Diagnostic Synthesis
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              Personalized AIR Roadmap
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-red-800 dark:text-red-300">
                <AlertTriangle size={15} /> Focus Chapters Requiring Revision:
              </div>
              {allWeak.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {allWeak.slice(0, 6).map((ch, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 text-[11px] font-semibold text-red-700 dark:text-red-300"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  No critical chapter leakages identified across recent tests.
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={15} /> High-Scoring Fortress Chapters:
              </div>
              {allStrong.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {allStrong.slice(0, 6).map((ch, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Keep taking chapter mocks to build your verified mastery matrix.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. IMMUTABLE TEST HISTORY TABLE (NO DELETE) ================= */}
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
                  <th className="p-3">Date Attempted</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pastRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-850 transition"
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
                    <td className="p-3 font-mono text-slate-500">
                      {new Date(rec.timestamp).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedRecordForDetail(rec)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-bold text-[11px] inline-flex items-center gap-1 transition"
                      >
                        <Eye size={12} /> Inspect
                      </button>
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

      {/* ================= 6. TEST RECORD INSPECTION MODAL ================= */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {selectedRecordForDetail.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attempted on {new Date(selectedRecordForDetail.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Score</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedRecordForDetail.totalScore}/{selectedRecordForDetail.maxScore}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Accuracy</span>
                <span className="text-lg font-black text-emerald-600">
                  {selectedRecordForDetail.accuracy.toFixed(0)}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Percentile</span>
                <span className="text-lg font-black text-blue-600">
                  {selectedRecordForDetail.predictedPercentile.toFixed(2)}%
                </span>
              </div>
            </div>

            {selectedRecordForDetail.subjectScores && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Subject Breakdown
                </span>
                <div className="space-y-1.5">
                  {Object.entries(selectedRecordForDetail.subjectScores).map(([sub, scoreObj]) => (
                    <div
                      key={sub}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
                    >
                      <span className="font-bold capitalize text-slate-800 dark:text-slate-200">
                        {sub}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {scoreObj.score} / {scoreObj.maxScore} ({scoreObj.accuracy.toFixed(0)}% acc)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedRecordForDetail(null)}
              className="w-full py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs transition"
            >
              Close Ledger Entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
