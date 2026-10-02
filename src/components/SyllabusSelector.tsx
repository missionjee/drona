import React, { useState, useEffect } from 'react';
import {
  Check,
  ChevronRight,
  BookOpen,
  Sparkles,
  RotateCcw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Subject, ExamType, CustomSyllabusConfig, StreamType, PersistentPerformanceRecord } from '../types';
import { NCERT_SYLLABUS } from '../data/ncertSyllabus';
import { getWeeklyTestQuota } from '../utils/testLimit';

interface SyllabusSelectorProps {
  onGenerateTest: (config: CustomSyllabusConfig) => void;
  isGenerating: boolean;
  userStream?: StreamType;
  pastRecords?: PersistentPerformanceRecord[];
}

export const SyllabusSelector: React.FC<SyllabusSelectorProps> = ({
  onGenerateTest,
  isGenerating,
  userStream = 'jee',
  pastRecords = [],
}) => {
  const quota = getWeeklyTestQuota(pastRecords);
  const isNeet = userStream === 'neet';

  // Allowed subjects based on user stream
  const availableSubjects: Subject[] = isNeet
    ? ['physics', 'chemistry', 'biology']
    : ['physics', 'chemistry', 'mathematics'];

  const [examType, setExamType] = useState<ExamType>(isNeet ? 'neet' : 'jee_main');
  const [activeSubject, setActiveSubject] = useState<Subject>('physics');

  // Selected chapters dictionary
  const [selectedChapters, setSelectedChapters] = useState<Record<Subject, string[]>>({
    physics: [
      'Units and Measurements',
      'Laws of Motion',
      'System of Particles and Rotational Motion',
      'Thermodynamics',
      'Current Electricity',
      'Ray Optics and Optical Instruments',
    ],
    chemistry: [
      'Chemical Bonding and Molecular Structure',
      'Chemical Thermodynamics',
      'Equilibrium',
      'Solutions',
      'Coordination Compounds',
      'Aldehydes, Ketones and Carboxylic Acids',
    ],
    mathematics: [
      'Complex Numbers and Quadratic Equations',
      'Limits and Derivatives',
      'Matrices',
      'Integrals',
      'Differential Equations',
      'Vector Algebra',
    ],
    biology: [
      'Cell: The Unit of Life',
      'Photosynthesis in Higher Plants',
      'Chemical Coordination and Integration',
      'Principles of Inheritance and Variation',
      'Biotechnology: Principles and Processes',
      'Ecosystem',
    ],
  });

  // Default test configs based on Exam Type
  // JEE Main: 25 questions per subject (or 25/75 total), 180 mins
  // JEE Advanced: 180 mins, dynamic pattern
  // NEET: 200 mins
  const [totalQuestions, setTotalQuestions] = useState<number>(() => (isNeet ? 45 : 25));
  const [durationMinutes, setDurationMinutes] = useState<number>(() => (isNeet ? 200 : 180));
  const [pyqStartYear, setPyqStartYear] = useState<number>(2015);
  const [pyqEndYear, setPyqEndYear] = useState<number>(2026);

  useEffect(() => {
    if (isNeet) {
      setExamType('neet');
      setTotalQuestions(45);
      setDurationMinutes(200);
      if (activeSubject === 'mathematics') setActiveSubject('biology');
    } else {
      setExamType('jee_main');
      setTotalQuestions(25);
      setDurationMinutes(180);
      if (activeSubject === 'biology') setActiveSubject('mathematics');
    }
  }, [userStream, isNeet]);

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

  const handleLaunch = () => {
    if (!quota.canCreate) {
      alert(`Weekly limit reached (${quota.testsCreatedThisWeek}/3 mock tests created this week).\n\nTo ensure in-depth concept retention and proper revision of errors, test generation is capped at 3 tests per week.\n\nYour weekly quota will reset on ${quota.resetsOn}.`);
      return;
    }

    if (totalSelectedCount === 0) {
      alert('Please select at least 1 NCERT chapter to generate an authentic test.');
      return;
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
        startYear: pyqStartYear,
        endYear: pyqEndYear,
      },
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden font-sans">
      {/* ================= TOP CLEAN CONTROLS ================= */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              NCERT Custom Syllabus Test Architect
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build unrepeated, proctored mock tests grounded in authentic PYQs (2015–2026) and NCERT textbooks.
          </p>
        </div>

        {/* Minimal Pill Segmented Exam Switch */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          {!isNeet ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setExamType('jee_main');
                  setTotalQuestions(25);
                  setDurationMinutes(180);
                }}
                className={`px-3.5 py-1.5 rounded-lg transition ${
                  examType === 'jee_main'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                JEE Main (25 Qs / 3h)
              </button>
              <button
                type="button"
                onClick={() => {
                  setExamType('jee_advanced');
                  setTotalQuestions(20);
                  setDurationMinutes(180);
                }}
                className={`px-3.5 py-1.5 rounded-lg transition ${
                  examType === 'jee_advanced'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                JEE Advanced (IIT Dynamic / 3h)
              </button>
            </>
          ) : (
            <button
              type="button"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold shadow-sm"
            >
              NEET-UG (Medical / 3h 20m)
            </button>
          )}
        </div>
      </div>

      {/* ================= PYQ YEAR BENCHMARK SELECTOR (2015 - 2026) ================= */}
      <div className="px-5 sm:px-6 py-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-[11px] shrink-0">
            PYQ 2015–2026
          </span>
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              Authentic PYQ Pattern Range ({pyqStartYear} – {pyqEndYear})
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                {pyqEndYear - pyqStartYear + 1} Years Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Synthesizes problems matching real NTA & IIT JEE questions from 2015 through 2026.
            </p>
          </div>
        </div>

        {/* Year Range Presets and Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => { setPyqStartYear(2015); setPyqEndYear(2026); }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                pyqStartYear === 2015 && pyqEndYear === 2026
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All (2015–2026)
            </button>
            <button
              type="button"
              onClick={() => { setPyqStartYear(2021); setPyqEndYear(2026); }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                pyqStartYear === 2021 && pyqEndYear === 2026
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Recent CBT (2021–2026)
            </button>
            <button
              type="button"
              onClick={() => { setPyqStartYear(2024); setPyqEndYear(2026); }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                pyqStartYear === 2024 && pyqEndYear === 2026
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Latest (2024–2026)
            </button>
            <button
              type="button"
              onClick={() => { setPyqStartYear(2015); setPyqEndYear(2020); }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                pyqStartYear === 2015 && pyqEndYear === 2020
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Classic (2015–2020)
            </button>
          </div>

          {/* Custom Year Dropdowns */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 shadow-2xs">
            <span className="text-[11px] text-slate-400 font-mono">From</span>
            <select
              value={pyqStartYear}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPyqStartYear(val);
                if (val > pyqEndYear) setPyqEndYear(val);
              }}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold text-[11px] focus:outline-hidden cursor-pointer"
            >
              {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((yr) => (
                <option key={`start-${yr}`} value={yr} className="dark:bg-slate-900">
                  {yr}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 font-mono">To</span>
            <select
              value={pyqEndYear}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPyqEndYear(val);
                if (val < pyqStartYear) setPyqStartYear(val);
              }}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold text-[11px] focus:outline-hidden cursor-pointer"
            >
              {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((yr) => (
                <option key={`end-${yr}`} value={yr} className="dark:bg-slate-900">
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================= SUBJECT NAVIGATION & ACTIONS ================= */}
      <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Subject Tabs */}
        <div className="flex items-center gap-1.5">
          {availableSubjects.map((sub) => {
            const count = selectedChapters[sub]?.length || 0;
            const isActive = activeSubject === sub;

            return (
              <button
                key={sub}
                type="button"
                onClick={() => setActiveSubject(sub)}
                className={`px-3.5 py-1.5 rounded-lg font-semibold capitalize transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <span>{sub}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium text-xs">
          <button
            type="button"
            onClick={selectEntireSyllabus}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            Select All Chapters
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => clearCurrentSubject(activeSubject)}
            className="hover:text-red-600 dark:hover:text-red-400 transition"
          >
            Clear {activeSubject}
          </button>
        </div>
      </div>

      {/* ================= CLEAN 2-COLUMN NCERT CHECKLIST ================= */}
      <div className="p-5 sm:p-6 grid md:grid-cols-2 gap-6 sm:gap-8 max-h-[460px] overflow-y-auto">
        {/* Class 11 Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Class 11 NCERT Textbook
              </h3>
            </div>
            <button
              type="button"
              onClick={() => toggleAllClass(activeSubject, 11)}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Toggle All
            </button>
          </div>

          <div className="space-y-1">
            {currentSubjectList.class11.map((ch) => {
              const isChecked = selectedChapters[activeSubject]?.includes(ch.name);

              return (
                <div
                  key={ch.id}
                  onClick={() => toggleChapter(activeSubject, ch.name)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer text-xs transition select-none ${
                    isChecked
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 font-medium border border-blue-200 dark:border-blue-900/60'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                      isChecked
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>

                  <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px] w-6 shrink-0">
                    {ch.chapterNumber < 10 ? `0${ch.chapterNumber}` : ch.chapterNumber}
                  </span>

                  <span className="flex-1">{ch.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Class 12 Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Class 12 NCERT Textbook
              </h3>
            </div>
            <button
              type="button"
              onClick={() => toggleAllClass(activeSubject, 12)}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Toggle All
            </button>
          </div>

          <div className="space-y-1">
            {currentSubjectList.class12.map((ch) => {
              const isChecked = selectedChapters[activeSubject]?.includes(ch.name);

              return (
                <div
                  key={ch.id}
                  onClick={() => toggleChapter(activeSubject, ch.name)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer text-xs transition select-none ${
                    isChecked
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 font-medium border border-blue-200 dark:border-blue-900/60'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                      isChecked
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>

                  <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px] w-6 shrink-0">
                    {ch.chapterNumber < 10 ? `0${ch.chapterNumber}` : ch.chapterNumber}
                  </span>

                  <span className="flex-1">{ch.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= CLEAN BOTTOM STATUS & LAUNCH DOCK ================= */}
      <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Selection Stats */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="font-bold text-slate-900 dark:text-white">
              {totalSelectedCount} Selected
            </span>
            <span className="text-slate-600 dark:text-slate-400 ml-1.5">
              (!isNeet ? `(P: ${selectedChapters.physics.length}, C: ${selectedChapters.chemistry.length}, M: ${selectedChapters.mathematics.length})` : `(P: ${selectedChapters.physics.length}, C: ${selectedChapters.chemistry.length}, B: ${selectedChapters.biology.length})`)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Questions:</span>
            <select
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100"
            >
              {isNeet ? (
                <>
                  <option value={20}>20 Qs (Speed Practice)</option>
                  <option value={45}>45 Qs (Single Subject Mock)</option>
                  <option value={90}>90 Qs (Half Mock)</option>
                  <option value={180}>180 Qs (Full NEET Mock)</option>
                </>
              ) : (
                <>
                  <option value={10}>10 Qs (Quick Drill)</option>
                  <option value={25}>25 Qs (NTA 1 Subject Full)</option>
                  <option value={50}>50 Qs (2 Subjects Mock)</option>
                  <option value={75}>75 Qs (Full JEE Main Mock)</option>
                </>
              )}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-500" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Timer:</span>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100"
            >
              <option value={30}>30 mins</option>
              <option value={60}>60 mins (1 hr)</option>
              <option value={180}>180 mins (3 hrs Standard)</option>
              <option value={200}>200 mins (3h 20m NEET)</option>
            </select>
          </div>

          {/* Weekly Quota Counter */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${
              quota.canCreate
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300'
                : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
            }`}
          >
            <span>Quota:</span>
            <span className="font-bold">{quota.testsCreatedThisWeek}/3 used this week</span>
            <span className="text-[10px] opacity-75">
              ({quota.remainingTests} left • Resets {quota.resetsOn})
            </span>
          </div>
        </div>

        {/* Generate Button or Limit Warning */}
        <div className="flex items-center gap-3">
          {!quota.canCreate && (
            <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
              Weekly cap of 3 tests reached. Resets {quota.resetsOn}.
            </span>
          )}

          <button
            type="button"
            onClick={handleLaunch}
            disabled={isGenerating || totalSelectedCount === 0 || !quota.canCreate}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 shrink-0"
          >
            <Sparkles size={14} />
            <span>Generate Authentic Test</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
