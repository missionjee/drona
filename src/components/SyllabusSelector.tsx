import React, { useState, useEffect } from 'react';
import {
  Check,
  ChevronRight,
  BookOpen,
  Sparkles,
  RotateCcw,
  Clock,
  ShieldCheck,
  Trophy,
  Layers,
  Play,
  Flame,
  Award,
  BarChart3,
  Sliders,
  CheckCircle2,
  Zap,
  Target,
  ArrowRight,
} from 'lucide-react';
import { Subject, ExamType, CustomSyllabusConfig, StreamType, PersistentPerformanceRecord } from '../types';
import { NCERT_SYLLABUS } from '../data/ncertSyllabus';
import { getWeeklyTestQuota } from '../utils/testLimit';
import {
  JEE_MAIN_TEST_SERIES,
  JEE_ADVANCED_TEST_SERIES,
  CuratedTestPackage,
} from '../data/curatedTestSeries';

interface SyllabusSelectorProps {
  onGenerateTest: (config: CustomSyllabusConfig) => void;
  onStartCuratedTest?: (pkg: CuratedTestPackage) => void;
  onResetQuota?: () => void;
  isGenerating: boolean;
  userStream?: StreamType;
  pastRecords?: PersistentPerformanceRecord[];
}

export const SyllabusSelector: React.FC<SyllabusSelectorProps> = ({
  onGenerateTest,
  onStartCuratedTest,
  onResetQuota,
  isGenerating,
  userStream = 'jee',
  pastRecords = [],
}) => {
  const quota = getWeeklyTestQuota(pastRecords);
  const isNeet = userStream === 'neet';

  // Primary navigation: TWO FORMS ONLY ('jee_main' vs 'jee_advanced')
  const [selectedSeriesTrack, setSelectedSeriesTrack] = useState<'jee_main' | 'jee_advanced'>('jee_main');
  const [showCustomBuilder, setShowCustomBuilder] = useState<boolean>(false);

  // Allowed subjects based on user stream
  const availableSubjects: Subject[] = isNeet
    ? ['physics', 'chemistry', 'biology']
    : ['physics', 'chemistry', 'mathematics'];

  const [examType, setExamType] = useState<ExamType>(isNeet ? 'neet' : 'jee_main');
  const [activeSubject, setActiveSubject] = useState<Subject>('physics');

  // Selected chapters dictionary for custom builder
  const [selectedChapters, setSelectedChapters] = useState<Record<Subject, string[]>>({
    physics: [],
    chemistry: [],
    mathematics: [],
    biology: [],
  });

  const [totalQuestions, setTotalQuestions] = useState<number>(() => (isNeet ? 180 : 75));
  const [durationMinutes, setDurationMinutes] = useState<number>(() => (isNeet ? 200 : 180));

  useEffect(() => {
    if (isNeet) {
      setExamType('neet');
      setTotalQuestions(180);
      setDurationMinutes(200);
      if (activeSubject === 'mathematics') setActiveSubject('biology');
    } else {
      setExamType(selectedSeriesTrack === 'jee_advanced' ? 'jee_advanced' : 'jee_main');
      setTotalQuestions(selectedSeriesTrack === 'jee_advanced' ? 54 : 75);
      setDurationMinutes(180);
      if (activeSubject === 'biology') setActiveSubject('mathematics');
    }
  }, [userStream, isNeet, selectedSeriesTrack]);

  const toggleChapter = (subject: Subject, chapterName: string) => {
    setSelectedChapters((prev) => {
      const current = prev[subject] || [];
      const updated = current.includes(chapterName)
        ? current.filter((c) => c !== chapterName)
        : [...current, chapterName];
      return { ...prev, [subject]: updated };
    });
  };

  const toggleAllClass = (subject: Subject, classLevel: 11 | 12) => {
    const list = NCERT_SYLLABUS[subject];
    if (!list) return;

    const classChapters =
      classLevel === 11
        ? list.class11.map((c) => c.name)
        : list.class12.map((c) => c.name);

    setSelectedChapters((prev) => {
      const current = prev[subject] || [];
      const allSelected = classChapters.every((c) => current.includes(c));
      const updated = allSelected
        ? current.filter((c) => !classChapters.includes(c))
        : Array.from(new Set([...current, ...classChapters]));
      return { ...prev, [subject]: updated };
    });
  };

  const selectEntireSyllabus = () => {
    const updated: Record<Subject, string[]> = {
      physics: [
        ...NCERT_SYLLABUS.physics.class11.map((c) => c.name),
        ...NCERT_SYLLABUS.physics.class12.map((c) => c.name),
      ],
      chemistry: [
        ...NCERT_SYLLABUS.chemistry.class11.map((c) => c.name),
        ...NCERT_SYLLABUS.chemistry.class12.map((c) => c.name),
      ],
      mathematics: [
        ...NCERT_SYLLABUS.mathematics.class11.map((c) => c.name),
        ...NCERT_SYLLABUS.mathematics.class12.map((c) => c.name),
      ],
      biology: [
        ...NCERT_SYLLABUS.biology.class11.map((c) => c.name),
        ...NCERT_SYLLABUS.biology.class12.map((c) => c.name),
      ],
    };
    setSelectedChapters(updated);
  };

  const clearCurrentSubject = (subject: Subject) => {
    setSelectedChapters((prev) => ({ ...prev, [subject]: [] }));
  };

  const totalSelectedCount = availableSubjects.reduce(
    (acc, sub) => acc + (selectedChapters[sub]?.length || 0),
    0
  );

  const currentSubjectList = NCERT_SYLLABUS[activeSubject] || { class11: [], class12: [] };

  const handleLaunchCustom = () => {
    if (totalSelectedCount === 0) {
      alert('Please select at least 1 chapter from the syllabus below to generate and start your examination.');
      return;
    }

    if (!quota.canCreate) {
      const confirmReset = confirm(
        `Weekly limit reached (${quota.testsCreatedThisWeek}/3 mock tests created this week).\n\nReset your test quota now for unlimited practice?`
      );
      if (confirmReset && onResetQuota) {
        onResetQuota();
      } else if (!confirmReset) {
        return;
      }
    }

    onGenerateTest({
      examType,
      selectedChapters,
      totalQuestions,
      durationMinutes,
      difficultyDistribution: {
        medium: Math.floor(totalQuestions * 0.5),
        hard: Math.ceil(totalQuestions * 0.5),
      },
      pyqYearRange: {
        startYear: 2015,
        endYear: 2026,
      },
    });
  };

  const currentSeriesPackages =
    selectedSeriesTrack === 'jee_main' ? JEE_MAIN_TEST_SERIES : JEE_ADVANCED_TEST_SERIES;

  return (
    <div className="space-y-6 font-sans">
      {/* ================= TWO FORMS ONLY: PRIMARY TEST SERIES SWITCHER ================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Two Series Tabs */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => {
              setSelectedSeriesTrack('jee_main');
              setShowCustomBuilder(false);
            }}
            className={`flex-1 md:flex-none px-6 py-3.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2.5 cursor-pointer ${
              selectedSeriesTrack === 'jee_main' && !showCustomBuilder
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Target size={18} />
            <span className="text-sm">JEE Mains Test Series</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                selectedSeriesTrack === 'jee_main' && !showCustomBuilder
                  ? 'bg-blue-800 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              5 Mocks
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedSeriesTrack('jee_advanced');
              setShowCustomBuilder(false);
            }}
            className={`flex-1 md:flex-none px-6 py-3.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2.5 cursor-pointer ${
              selectedSeriesTrack === 'jee_advanced' && !showCustomBuilder
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 ring-2 ring-purple-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Zap size={18} />
            <span className="text-sm">JEE Advanced Test Series</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                selectedSeriesTrack === 'jee_advanced' && !showCustomBuilder
                  ? 'bg-purple-800 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              3 Papers
            </span>
          </button>
        </div>

        {/* Custom Builder Sub-Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowCustomBuilder(!showCustomBuilder)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              showCustomBuilder
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Sliders size={14} />
            <span>{showCustomBuilder ? 'Back to Test Series' : 'Custom Chapter Builder'}</span>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>NTA PYQ 100% Pre-Loaded</span>
          </div>
        </div>
      </div>

      {/* ================= ACTIVE SERIES BANNER ================= */}
      {!showCustomBuilder && (
        <div
          className={`p-6 rounded-2xl border text-white shadow-md relative overflow-hidden ${
            selectedSeriesTrack === 'jee_main'
              ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border-blue-500/30'
              : 'bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border-purple-500/30'
          }`}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {selectedSeriesTrack === 'jee_main' ? 'All-India Grand Test Series' : 'National IIT-JEE Benchmark Series'}
                </span>
                <span className="text-xs text-blue-200 font-medium">
                  {selectedSeriesTrack === 'jee_main' ? '300 Marks • 180 Mins • Exact NTA Section A/B' : '180 Marks • 180 Mins • Multi-Correct (+4, -2)'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {selectedSeriesTrack === 'jee_main'
                  ? 'JEE Mains Official Pattern Mock Test Series'
                  : 'IIT-JEE Advanced National Benchmark Papers'}
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {selectedSeriesTrack === 'jee_main'
                  ? 'Complete test series containing 5 full-scale mocks covering full syllabus, Class 11th & 12th benchmarks, and high-yield NTA PYQs with full step-by-step KaTeX solutions.'
                  : 'Rigorous multi-concept examination series designed after official IIT Bombay / Madras papers with multi-correct questions, partial markings, and high-difficulty numericals.'}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 self-start md:self-auto shrink-0">
              <div className="text-center px-2">
                <div className="text-[10px] uppercase font-bold text-slate-300">Total Tests</div>
                <div className="text-base font-black text-white mt-0.5">
                  {selectedSeriesTrack === 'jee_main' ? '5 Mocks' : '3 Papers'}
                </div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center px-2">
                <div className="text-[10px] uppercase font-bold text-slate-300">Per Test Marks</div>
                <div className="text-base font-black text-white mt-0.5">
                  {selectedSeriesTrack === 'jee_main' ? '300 M' : '180 M'}
                </div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center px-2">
                <div className="text-[10px] uppercase font-bold text-slate-300">Launch Mode</div>
                <div className="text-base font-black text-emerald-400 mt-0.5">Instant</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 1: CURATED SERIES MOCK LIST ================= */}
      {!showCustomBuilder && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {currentSeriesPackages.map((pkg) => {
            const { config, questions } = pkg;
            const isAdvanced = config.seriesCategory === 'jee_advanced';
            const phyCount = questions.filter((q) => q.subject === 'physics').length;
            const chemCount = questions.filter((q) => q.subject === 'chemistry').length;
            const mathCount = questions.filter((q) => q.subject === 'mathematics').length;

            return (
              <div
                key={config.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-md font-black tracking-wider uppercase ${
                          isAdvanced
                            ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                            : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                        }`}
                      >
                        {config.badge || `Mock ${config.testNumber}`}
                      </span>

                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {config.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} />
                      <span>100% Pre-Loaded</span>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                    {config.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-1">
                    {config.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                    {config.description}
                  </p>

                  {/* Exam Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 py-3.5 my-3.5 border-y border-slate-100 dark:border-slate-800/80 text-center">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Questions</div>
                      <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                        {config.questionCount} Qs
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Duration</div>
                      <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                        {config.durationMinutes} Mins
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total Marks</div>
                      <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                        {config.totalMarks} Marks
                      </div>
                    </div>
                  </div>

                  {/* Subject Breakdown Pills */}
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-4">
                    <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md">
                      Physics: {phyCount} Qs
                    </span>
                    <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-md">
                      Chemistry: {chemCount} Qs
                    </span>
                    <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-md">
                      Math: {mathCount} Qs
                    </span>
                  </div>

                  {/* Tag Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-5">
                    {config.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 1-Click Launch Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onStartCuratedTest) {
                      onStartCuratedTest(pkg);
                    }
                  }}
                  className={`w-full py-3 rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                    isAdvanced
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                  }`}
                >
                  <Play size={14} className="fill-white" />
                  <span>Start Test Now (Instant Launch)</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= VIEW 2: CUSTOM CHAPTER BUILDER ================= */}
      {showCustomBuilder && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Custom Test
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select chapters from Class 11 and 12 to generate a custom practice paper.
              </p>
            </div>

            {/* Pill Segmented Exam Switch */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto border border-slate-200 dark:border-slate-700">
              {!isNeet ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setExamType('jee_main');
                      setTotalQuestions(75);
                      setDurationMinutes(180);
                    }}
                    className={`px-4 py-1.5 rounded-lg transition ${
                      examType === 'jee_main'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    JEE Main
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExamType('jee_advanced');
                      setTotalQuestions(54);
                      setDurationMinutes(180);
                    }}
                    className={`px-4 py-1.5 rounded-lg transition ${
                      examType === 'jee_advanced'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    JEE Advanced
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold shadow-xs"
                >
                  NEET-UG
                </button>
              )}
            </div>
          </div>

          {/* Subject Tabs */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
              <div className="flex items-center gap-2">
                {availableSubjects.map((sub) => {
                  const isSelected = activeSubject === sub;
                  const count = selectedChapters[sub]?.length || 0;

                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setActiveSubject(sub)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center gap-2 select-none cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{sub}</span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isSelected
                              ? 'bg-blue-700 text-white'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={selectEntireSyllabus}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
                >
                  Select All Syllabus
                </button>
                <button
                  type="button"
                  onClick={() => clearCurrentSubject(activeSubject)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  Clear Subject
                </button>
              </div>
            </div>
          </div>

          {/* Chapter Selection Columns (Class 11 & Class 12) */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
            {/* Class 11 */}
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Class 11 NCERT
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    ({currentSubjectList.class11.length} Chapters)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAllClass(activeSubject, 11)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Toggle All
                </button>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2">
                {currentSubjectList.class11.map((ch) => {
                  const isChecked = selectedChapters[activeSubject]?.includes(ch.name);
                  return (
                    <div
                      key={ch.name}
                      onClick={() => toggleChapter(activeSubject, ch.name)}
                      className={`p-3 rounded-xl border text-xs font-semibold transition flex items-center justify-between gap-3 cursor-pointer select-none ${
                        isChecked
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="leading-snug">{ch.name}</span>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Class 12 */}
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Class 12 NCERT
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    ({currentSubjectList.class12.length} Chapters)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAllClass(activeSubject, 12)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Toggle All
                </button>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2">
                {currentSubjectList.class12.map((ch) => {
                  const isChecked = selectedChapters[activeSubject]?.includes(ch.name);
                  return (
                    <div
                      key={ch.name}
                      onClick={() => toggleChapter(activeSubject, ch.name)}
                      className={`p-3 rounded-xl border text-xs font-semibold transition flex items-center justify-between gap-3 cursor-pointer select-none ${
                        isChecked
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="leading-snug">{ch.name}</span>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Launch Bar */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{totalSelectedCount} Chapters Selected</span>
                  {totalSelectedCount === 0 && (
                    <span className="text-[10px] text-amber-500 font-normal">
                      (select chapters above to activate test)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>Weekly Quota: {quota.testsCreatedThisWeek}/3 mocks</span>
                  {quota.testsCreatedThisWeek >= 3 && onResetQuota && (
                    <button
                      type="button"
                      onClick={onResetQuota}
                      className="text-blue-600 dark:text-blue-400 font-bold underline hover:text-blue-700 cursor-pointer"
                    >
                      Reset Quota
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleLaunchCustom}
              disabled={isGenerating}
              className="px-8 py-3 rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>
                {isGenerating
                  ? 'Synthesizing Examination Paper...'
                  : totalSelectedCount === 0
                  ? 'Start Test (Select Chapters)'
                  : 'Start Test'}
              </span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
