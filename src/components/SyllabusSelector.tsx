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

  // Selected chapters dictionary — starts EMPTY by default as requested
  const [selectedChapters, setSelectedChapters] = useState<Record<Subject, string[]>>({
    physics: [],
    chemistry: [],
    mathematics: [],
    biology: [],
  });

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
      alert(
        `Weekly limit reached (${quota.testsCreatedThisWeek}/3 mock tests created this week).\n\nYour weekly quota will reset on ${quota.resetsOn}.`
      );
      return;
    }

    if (totalSelectedCount === 0) {
      alert('Please select at least 1 chapter from the syllabus to generate your test.');
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden font-sans">
      {/* ================= SIMPLE CLEAN HEADER ================= */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Custom Test
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select chapters from Class 11 and 12 to generate a fresh, unrepeated examination paper.
          </p>
        </div>

        {/* Clean Pill Segmented Exam Switch (NO question counts displayed) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          {!isNeet ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setExamType('jee_main');
                  setTotalQuestions(25);
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
                  setTotalQuestions(20);
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

      {/* ================= PYQ ARCHIVE RANGE (2015 - 2026) ================= */}
      <div className="px-5 sm:px-6 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>PYQ Reference Range:</span>
          <span className="text-blue-600 dark:text-blue-400 font-mono">
            {pyqStartYear} — {pyqEndYear}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">From:</span>
            <select
              value={pyqStartYear}
              onChange={(e) => setPyqStartYear(Number(e.target.value))}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-200"
            >
              {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">To:</span>
            <select
              value={pyqEndYear}
              onChange={(e) => setPyqEndYear(Number(e.target.value))}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-200"
            >
              {[2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================= SUBJECT TABS ================= */}
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center gap-2 select-none ${
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

          {/* Quick select shortcuts */}
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <button
              type="button"
              onClick={selectEntireSyllabus}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => clearCurrentSubject(activeSubject)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-500 hover:text-red-500"
            >
              Clear {activeSubject}
            </button>
          </div>
        </div>
      </div>

      {/* ================= CHAPTERS MATRIX ================= */}
      <div className="p-4 sm:p-6 grid md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-950/40">
        {/* Class 11 Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Class 11 Syllabus
            </span>
            <button
              type="button"
              onClick={() => toggleAllClass(activeSubject, 11)}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Toggle Class 11
            </button>
          </div>

          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {currentSubjectList.class11.map((ch) => {
              const isChecked = selectedChapters[activeSubject]?.includes(ch.name);

              return (
                <div
                  key={ch.id}
                  onClick={() => toggleChapter(activeSubject, ch.name)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition select-none flex items-center justify-between gap-3 ${
                    isChecked
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 text-blue-950 dark:text-blue-100 font-semibold shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200'
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

        {/* Class 12 Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Class 12 Syllabus
            </span>
            <button
              type="button"
              onClick={() => toggleAllClass(activeSubject, 12)}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Toggle Class 12
            </button>
          </div>

          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {currentSubjectList.class12.map((ch) => {
              const isChecked = selectedChapters[activeSubject]?.includes(ch.name);

              return (
                <div
                  key={ch.id}
                  onClick={() => toggleChapter(activeSubject, ch.name)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition select-none flex items-center justify-between gap-3 ${
                    isChecked
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 text-blue-950 dark:text-blue-100 font-semibold shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200'
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

      {/* ================= FOOTER LAUNCH BAR ================= */}
      <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {totalSelectedCount} Chapters Selected
            </div>
            <div className="text-[11px] text-slate-500">
              Weekly Quota: {quota.testsCreatedThisWeek}/3 mocks generated
            </div>
          </div>
        </div>

        <button
          onClick={handleLaunch}
          disabled={isGenerating || !quota.canCreate}
          className={`px-8 py-3 rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 ${
            !quota.canCreate
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
          }`}
        >
          <span>{isGenerating ? 'Synthesizing Examination Paper...' : 'Generate Test Paper'}</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
