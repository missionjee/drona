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
  PieChart,
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
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

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
  const chronological = [...pastRecords].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const graphWidth = 720;
  const graphHeight = 230;
  const padX = 45;
  const padY = 28;
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
      ? `M ${points[0].x - 50} ${points[0].y} L ${points[0].x + 50} ${points[0].y}`
      : '';

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${padY + usableHeight} L ${
          points[0].x
        } ${padY + usableHeight} Z`
      : '';

  // ================= SUBJECT BALANCE CIRCLE (DONUT) CHART =================
  // Calculate relative practice weight of each subject
  const subjectMasteryData = subjects.map((sub) => {
    const m = getSubjectMastery(sub);
    return { subject: sub, ...m };
  });

  const totalMasterySum = subjectMasteryData.reduce(
    (acc, s) => acc + (s.pct > 0 ? s.pct : 33),
    0
  );

  const colors: Record<string, string> = {
    physics: '#3b82f6', // blue
    chemistry: '#10b981', // emerald
    mathematics: '#8b5cf6', // purple
    biology: '#ec4899', // pink
  };

  const donutR = 48;
  const donutC = 2 * Math.PI * donutR; // ~301.59
  let accumulatedOffset = 0;

  const donutSlices = subjectMasteryData.map((s) => {
    const share = ((s.pct > 0 ? s.pct : 33) / totalMasterySum) * 100;
    const strokeDash = (share / 100) * donutC;
    const offset = -accumulatedOffset;
    accumulatedOffset += strokeDash;
    return {
      subject: s.subject,
      share: Math.round(share),
      strokeDash,
      offset,
      color: colors[s.subject] || '#3b82f6',
      pct: s.pct,
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* ================= 1. TOP METRIC CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mocks Attempted</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
              <Trophy size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalTests}</div>
          <p className="text-[11px] text-slate-500 mt-1">Permanent Test Ledger</p>
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
          <p className="text-[11px] text-slate-500 mt-1">Across all attempted mocks</p>
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
          <p className="text-[11px] text-slate-500 mt-1">Projected Rank Tier</p>
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

      {/* ================= 2. MODERN SLEEK SCORE TRAJECTORY GRAPH ================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 size={18} className="text-blue-600" />
              Score Trajectory & Percentile Curve
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous examination progress trajectory plotted against the 85% AIR cutoff.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Score Percentage
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-500"></span> 85% Target Zone
            </div>
          </div>
        </div>

        {pastRecords.length > 0 ? (
          <div className="relative overflow-x-auto pt-2">
            <svg
              viewBox={`0 0 ${graphWidth} ${graphHeight}`}
              className="w-full h-60 min-w-[580px]"
            >
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid Lines */}
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
                      strokeWidth="0.8"
                      strokeDasharray="4,4"
                      strokeOpacity="0.25"
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

              {/* 85% Benchmark Line */}
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
                      strokeDasharray="5,5"
                    />
                    <rect
                      x={graphWidth - padX - 110}
                      y={targetY - 14}
                      width="110"
                      height="14"
                      rx="4"
                      fill="#10b981"
                      fillOpacity="0.15"
                    />
                    <text
                      x={graphWidth - padX - 5}
                      y={targetY - 3.5}
                      fontSize="8.5"
                      fontWeight="bold"
                      fill="#10b981"
                      textAnchor="end"
                    >
                      AIR &lt; 1000 Zone (85%)
                    </text>
                  </g>
                );
              })()}

              {/* Gradient Area */}
              {areaD && <path d={areaD} fill="url(#curveGradient)" />}

              {/* Smooth Glowing Path */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
              )}

              {/* Data points */}
              {points.map((pt, idx) => {
                const isHovered = hoveredPoint === idx;
                return (
                  <g
                    key={pt.rec.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => setSelectedRecordForDetail(pt.rec)}
                  >
                    {/* Outer ring */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 8 : 5.5}
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth={isHovered ? 3.5 : 2.5}
                      className="transition-all duration-200"
                    />

                    {/* Score badge above marker */}
                    <rect
                      x={pt.x - 18}
                      y={pt.y - 23}
                      width="36"
                      height="16"
                      rx="5"
                      fill="#0f172a"
                      className="drop-shadow-xs"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 12}
                      fontSize="9"
                      fontWeight="black"
                      fill="#ffffff"
                      textAnchor="middle"
                    >
                      {pt.rec.percentage.toFixed(0)}%
                    </text>

                    {/* Date label on X axis */}
                    <text
                      x={pt.x}
                      y={padY + usableHeight + 16}
                      fontSize="8.5"
                      fontWeight="bold"
                      fill="#64748b"
                      textAnchor="middle"
                    >
                      M{idx + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="py-14 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 mx-auto flex items-center justify-center font-bold">
              📈
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No Test Data Recorded Yet
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Attempt your first mock test in the Test Series tab to begin generating your score curve.
            </p>
          </div>
        )}
      </div>

      {/* ================= 3. SUBJECT MASTERY & CIRCLE GRAPH (SUBJECT BALANCE) ================= */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Subject Mastery Progress Bars */}
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

        {/* ================= CIRCLE GRAPH (SUBJECT BALANCE DONUT) ================= */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <PieChart size={15} className="text-blue-600" /> Subject Balance Ratio
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              Optimal 1:1:1
            </span>
          </div>

          {/* SVG Donut Center */}
          <div className="flex items-center justify-center py-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={donutR}
                  fill="transparent"
                  stroke="#e2e8f0"
                  className="dark:stroke-slate-800"
                  strokeWidth="14"
                />

                {/* Slices */}
                {donutSlices.map((sl) => (
                  <circle
                    key={sl.subject}
                    cx="60"
                    cy="60"
                    r={donutR}
                    fill="transparent"
                    stroke={sl.color}
                    strokeWidth="14"
                    strokeDasharray={`${sl.strokeDash} ${donutC}`}
                    strokeDashoffset={sl.offset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                ))}
              </svg>

              {/* Center Metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Balance
                </span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {totalTests > 0 ? `${Math.round(avgAccuracy)}%` : '100%'}
                </span>
                <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Harmonized
                </span>
              </div>
            </div>
          </div>

          {/* Subject Pills */}
          <div className="space-y-1.5 pt-1">
            {donutSlices.map((sl) => (
              <div
                key={sl.subject}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-850"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: sl.color }}
                  ></span>
                  <span className="font-bold capitalize text-slate-800 dark:text-slate-200">
                    {sl.subject}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {sl.share}%
                </span>
              </div>
            ))}
          </div>
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
                Generate your first mock test in the Test Series tab. Marks will automatically appear here once completed.
              </p>
            </div>
            <button
              onClick={onNavigateToSeries}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
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
