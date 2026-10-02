import React, { useState } from 'react';
import { X, Sparkles, BrainCircuit, Clock, BookOpen, Layers, Check, Loader2 } from 'lucide-react';
import { ExamType, Subject, Difficulty, Question, MockTestConfig } from '../types';
import { generateCustomJEEQuestions, isApiKeyConfigured } from '../services/geminiService';

interface AiTestGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCustomTest: (testConfig: MockTestConfig, questions: Question[]) => void;
  onOpenApiKeyModal: () => void;
}

const JEE_CHAPTERS: Record<Subject, string[]> = {
  physics: [
    'Rotational Dynamics & Moment of Inertia',
    'Electromagnetic Induction & AC Circuits',
    'Thermodynamics & Kinetic Theory of Gases',
    'Modern Physics & Photoelectric Effect',
    'Ray & Wave Optics',
    'Current Electricity & Potentiometer',
    'Electrostatics & Capacitance',
    'Work, Energy and Power',
  ],
  chemistry: [
    'Chemical & Ionic Equilibrium',
    'Organic Chemistry (Aldehydes, Ketones & Amines)',
    'Coordination Compounds & Crystal Field Theory',
    'Chemical Kinetics & Nuclear Chemistry',
    'Electrochemistry & Nernst Equation',
    'Thermodynamics & Thermochemistry',
    'Chemical Bonding & Molecular Orbitals',
    'p-Block and d-Block Elements',
  ],
  mathematics: [
    'Calculus (Definite Integrals & Area)',
    'Vectors and 3D Geometry',
    'Coordinate Geometry (Parabola, Ellipse & Hyperbola)',
    'Matrices, Determinants & System of Equations',
    'Probability & Bayes Theorem',
    'Differential Equations',
    'Complex Numbers & Quadratic Equations',
    'Permutations, Combinations & Binomial Theorem',
  ],
  biology: [
    'Cell: The Unit of Life & Division',
    'Principles of Inheritance & Genetics',
    'Human & Plant Physiology',
    'Biotechnology & Applications',
    'Ecology & Biodiversity',
  ],
};

export const AiTestGeneratorModal: React.FC<AiTestGeneratorModalProps> = ({
  isOpen,
  onClose,
  onStartCustomTest,
  onOpenApiKeyModal,
}) => {
  const [examType, setExamType] = useState<ExamType>('jee_main');
  const [subject, setSubject] = useState<Subject>('physics');
  const [selectedTopic, setSelectedTopic] = useState(JEE_CHAPTERS.physics[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [count, setCount] = useState<number>(5);
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubjectChange = (newSub: Subject) => {
    setSubject(newSub);
    setSelectedTopic(JEE_CHAPTERS[newSub][0]);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const questions = await generateCustomJEEQuestions({
        examType,
        subject,
        topic: selectedTopic,
        count,
        difficulty,
      });

      const config: MockTestConfig = {
        id: `custom-ai-${Date.now()}`,
        title: `AI Sprint: ${selectedTopic}`,
        subtitle: `${examType === 'jee_advanced' ? 'JEE Advanced' : 'JEE Main'} • ${difficulty.toUpperCase()} • ${count} Questions`,
        examType,
        durationMinutes,
        totalMarks: count * 4,
        questionCount: questions.length,
        description: `Custom AI-crafted adaptive mock test targeting ${selectedTopic} with detailed step-by-step LaTeX solutions.`,
        difficulty: difficulty === 'hard' ? 'Advanced Benchmark' : difficulty === 'medium' ? 'Balanced' : 'Speed Focus',
        subjectsIncluded: [subject],
      };

      onStartCustomTest(config, questions);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error generating questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <BrainCircuit size={24} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                AI Custom Mock Test Generator
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">
                  Gemini 3.8
                </span>
              </h3>
              <p className="text-xs text-blue-100">
                Craft a tailored JEE test targeting your exact weak topics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Target Exam */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Target Exam
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExamType('jee_main')}
                className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-between transition ${
                  examType === 'jee_main'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>JEE Main 2025</span>
                {examType === 'jee_main' && <Check size={16} className="text-blue-600" />}
              </button>

              <button
                type="button"
                onClick={() => setExamType('jee_advanced')}
                className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-between transition ${
                  examType === 'jee_advanced'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>JEE Advanced 2025</span>
                {examType === 'jee_advanced' && <Check size={16} className="text-purple-600" />}
              </button>
            </div>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Select Subject
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['physics', 'chemistry', 'mathematics'] as Subject[]).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleSubjectChange(sub)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize text-center transition ${
                    subject === sub
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Chapter / Topic Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Target Chapter / Topic
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {JEE_CHAPTERS[subject].map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty & Question Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium capitalize text-center transition ${
                      difficulty === d
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Questions & Time
              </label>
              <div className="flex gap-2">
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>

                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <option value={10}>10 Mins</option>
                  <option value={20}>20 Mins</option>
                  <option value={30}>30 Mins</option>
                </select>
              </div>
            </div>
          </div>

          {!isApiKeyConfigured() && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
              <span>⚡ Using smart curated bank. Add Gemini Key for unlimited real-time generation.</span>
              <button
                type="button"
                onClick={onOpenApiKeyModal}
                className="underline font-bold hover:text-amber-700 ml-2 shrink-0"
              >
                Add Key
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-5 py-3.5 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Synthesizing Test...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate & Launch CBT Test
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
