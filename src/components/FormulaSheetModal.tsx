import React, { useState } from 'react';
import { X, BookOpen, Sparkles, AlertTriangle, Lightbulb, Search, Loader2 } from 'lucide-react';
import { Subject, ChapterFormula } from '../types';
import { getAiChapterFormulaSheet } from '../services/geminiService';
import { MathRenderer } from './MathRenderer';

interface FormulaSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApiKeyModal?: () => void;
}

const PRESET_FORMULA_SHEETS: Record<string, ChapterFormula> = {
  'Rotational Dynamics': {
    subject: 'physics',
    chapter: 'Rotational Dynamics',
    keyConcepts: [
      'Moment of inertia is the rotational analog of mass.',
      'Torque equation: $\\vec{\\tau} = I\\vec{\\alpha} = \\frac{d\\vec{L}}{dt}$.',
      'Condition for pure rolling: $v_{cm} = \\omega R$, $a_{cm} = \\alpha R$.',
    ],
    formulas: [
      {
        title: 'Parallel Axes Theorem',
        latex: 'I = I_{cm} + M d^2',
        explanation: 'Valid for any rigid body where $d$ is perpendicular distance from CM axis.',
        caution: 'Axis through CM must be strictly parallel to target axis.',
      },
      {
        title: 'Acceleration in Pure Rolling on Incline',
        latex: 'a_{cm} = \\frac{g \\sin\\theta}{1 + \\frac{I_{cm}}{MR^2}}',
        explanation: 'Friction is static and does zero net work.',
        caution: 'Ensure $\\mu_s \\ge \\frac{\\tan\\theta}{1 + \\frac{MR^2}{I_{cm}}}$ to prevent slipping.',
      },
      {
        title: 'Total Kinetic Energy of Rolling Body',
        latex: 'K_{\\text{total}} = \\frac{1}{2} M v_{cm}^2 + \\frac{1}{2} I_{cm} \\omega^2 = \\frac{1}{2} M v_{cm}^2 \\left(1 + \\frac{K^2}{R^2}\\right)',
        explanation: 'Sum of translational and rotational kinetic energy.',
      },
    ],
    highYieldTips: [
      'Take torque about the instantaneous axis of rotation (IAOR) to eliminate unknown normal/friction reactions.',
      'Remember angular momentum conservation applies when external torque about that specific point is zero.',
    ],
    commonTraps: [
      'Do not use $W = f_s \\cdot s$ for static friction in pure rolling; point of contact is at instantaneous rest!',
      'Perpendicular axes theorem $I_z = I_x + I_y$ is ONLY valid for planar (2D laminar) bodies.',
    ],
  },
  'Chemical Equilibrium': {
    subject: 'chemistry',
    chapter: 'Chemical Equilibrium',
    keyConcepts: [
      'Dynamic balance where forward rate equals backward rate.',
      'Equilibrium constant $K$ depends strictly on temperature only.',
      'Le Chatelier principle dictates the direction of shift on perturbation.',
    ],
    formulas: [
      {
        title: 'Relation between Kp and Kc',
        latex: 'K_p = K_c (RT)^{\\Delta n_g}',
        explanation: '$\\Delta n_g = \\sum n_{\\text{gaseous products}} - \\sum n_{\\text{gaseous reactants}}$.',
        caution: 'Count ONLY gaseous species; ignore pure liquids and solids.',
      },
      {
        title: 'van \'t Hoff Equation (Temperature Dependence)',
        latex: '\\ln\\left(\\frac{K_2}{K_1}\\right) = \\frac{\\Delta H^\\circ}{R}\\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right)',
        explanation: 'For endothermic ($\\Delta H > 0$), $K$ increases with temperature.',
      },
      {
        title: 'Reaction Quotient Criterion',
        latex: 'Q < K \\implies \\text{Forward}; \\quad Q > K \\implies \\text{Backward}',
        explanation: 'Predicts the instantaneous direction of reaction.',
      },
    ],
    highYieldTips: [
      'Addition of inert gas at constant volume has ZERO effect on equilibrium position.',
      'Addition of inert gas at constant pressure shifts reaction toward greater number of moles.',
    ],
    commonTraps: [
      'Do not include concentrations of pure solids ($[s] = 1$) or solvents in the $K_c$ expression.',
    ],
  },
  'Definite Integrals': {
    subject: 'mathematics',
    chapter: 'Definite Integrals',
    keyConcepts: [
      'Fundamental Theorem of Calculus: $\\frac{d}{dx}\\int_a^x f(t)dt = f(x)$.',
      'King Property is the single most tested property in JEE Main & Advanced.',
      'Leibniz Rule for differentiation under the integral sign.',
    ],
    formulas: [
      {
        title: 'King\'s Property',
        latex: '\\int_a^b f(x)dx = \\int_a^b f(a + b - x)dx',
        explanation: 'Add the two integrals to eliminate transcendental terms or symmetry.',
      },
      {
        title: 'Newton-Leibniz Rule',
        latex: '\\frac{d}{dx}\\left[\\int_{u(x)}^{v(x)} f(t)dt\\right] = f(v(x)) v\'(x) - f(u(x)) u\'(x)',
        explanation: 'Used for solving limit questions with indeterminate $\\frac{0}{0}$ forms.',
      },
      {
        title: 'Even & Odd Functions Integration',
        latex: '\\int_{-a}^{a} f(x)dx = \\begin{cases} 2\\int_0^a f(x)dx & \\text{if } f(-x) = f(x) \\\\ 0 & \\text{if } f(-x) = -f(x) \\end{cases}',
        explanation: 'Always test parity before lengthy substitutions.',
      },
    ],
    highYieldTips: [
      'For periodic functions: $\\int_0^{nT} f(x)dx = n \\int_0^T f(x)dx$.',
      'Use King Property whenever you see $\\sin x / (\\sin x + \\cos x)$ or $1 / (1 + e^{\\tan x})$.',
    ],
    commonTraps: [
      'When substituting $u = g(x)$, always update the upper and lower limits of integration!',
    ],
  },
};

export const FormulaSheetModal: React.FC<FormulaSheetModalProps> = ({
  isOpen,
  onClose,
  onOpenApiKeyModal,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject>('physics');
  const [activeChapter, setActiveChapter] = useState('Rotational Dynamics');
  const [customChapterInput, setCustomChapterInput] = useState('');
  const [formulaData, setFormulaData] = useState<ChapterFormula>(PRESET_FORMULA_SHEETS['Rotational Dynamics']);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (name: string) => {
    setActiveChapter(name);
    setFormulaData(PRESET_FORMULA_SHEETS[name]);
  };

  const handleGenerateAiSheet = async () => {
    const chapter = customChapterInput.trim() || activeChapter;
    if (!chapter || loading) return;

    setLoading(true);
    try {
      const result = await getAiChapterFormulaSheet(selectedSubject, chapter);
      setFormulaData(result);
      setActiveChapter(chapter);
      setCustomChapterInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl h-[750px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <BookOpen size={22} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                JEE Formula & Rapid Revision Vault
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                  AI Grounded
                </span>
              </h3>
              <p className="text-xs text-blue-100">
                High-yield equations, edge cases, and exam traps
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

        {/* Navigation & Chapter Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-2">
            {Object.keys(PRESET_FORMULA_SHEETS).map((name) => (
              <button
                key={name}
                onClick={() => handleSelectPreset(name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeChapter === name
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* AI Generator on the fly */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <input
              type="text"
              value={customChapterInput}
              onChange={(e) => setCustomChapterInput(e.target.value)}
              placeholder="Any chapter (e.g. Modern Physics)..."
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleGenerateAiSheet}
              disabled={loading}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm shrink-0 disabled:opacity-50"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              AI Sheet
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
          {/* Chapter Title Badge */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {formulaData.subject.toUpperCase()} FORMULA MASTER
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {formulaData.chapter}
              </h2>
            </div>
            <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full font-semibold border border-blue-200 dark:border-blue-900">
              IIT JEE High-Yield
            </span>
          </div>

          {/* Core Formulas Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {formulaData.formulas.map((f: { title: string; latex: string; explanation: string; caution?: string }, i: number) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3 hover:border-blue-500 transition"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>{f.title}</span>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                      Formula #{i + 1}
                    </span>
                  </h4>
                  <div className="my-2 p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-100 dark:border-slate-800 text-center font-mono">
                    <MathRenderer content={`$$${f.latex}$$`} />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {f.explanation}
                  </p>
                </div>

                {f.caution && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>{f.caution}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* High Yield Tips & Traps Row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Tips */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4">
              <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-2.5">
                <Lightbulb size={16} /> Exam Shortcuts & High-Yield Tips
              </h4>
              <ul className="space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
                {formulaData.highYieldTips.map((tip: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <MathRenderer content={tip} inline />
                  </li>
                ))}
              </ul>
            </div>

            {/* Traps */}
            <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4">
              <h4 className="font-bold text-sm text-rose-800 dark:text-rose-300 flex items-center gap-1.5 mb-2.5">
                <AlertTriangle size={16} /> Classic JEE Negative Mark Traps
              </h4>
              <ul className="space-y-2 text-xs text-rose-900 dark:text-rose-200">
                {formulaData.commonTraps.map((trap: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-600 dark:text-rose-400 font-bold">•</span>
                    <MathRenderer content={trap} inline />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
