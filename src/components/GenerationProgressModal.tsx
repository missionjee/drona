import React from 'react';
import {
  BrainCircuit,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
} from 'lucide-react';
import { PipelineProgress } from '../types';

interface GenerationProgressModalProps {
  isOpen: boolean;
  progress: PipelineProgress | null;
}

const PIPELINE_STAGES = [
  { id: 1, name: 'Analyze Syllabus Matrix' },
  { id: 2, name: 'Create Exam Blueprint' },
  { id: 3, name: 'Synthesize Specifications' },
  { id: 4, name: 'Draft Questions (PYQ Patterns)' },
  { id: 5, name: 'Independent Blind Solver' },
  { id: 6, name: 'Dual-Pass Answer Verification' },
  { id: 7, name: 'Anti-Hallucination & Quality Gate' },
  { id: 8, name: 'Self-Healing & Assembly' },
];

export const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({
  isOpen,
  progress,
}) => {
  if (!isOpen || !progress) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/80 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/30 rounded-2xl border border-blue-400/30">
                <BrainCircuit size={26} className="text-yellow-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg">AI Question Generation Pipeline</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    Stage {progress.stage}/8 Active
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-0.5">
                  Multi-agent dual-pass validation & self-healing active
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black font-mono text-white">
                {progress.percentage}%
              </span>
            </div>
          </div>

          {/* Master Progress Bar */}
          <div className="w-full bg-slate-950/80 h-2.5 rounded-full overflow-hidden mt-4 border border-white/10">
            <div
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Current Stage Highlight */}
        <div className="p-6 space-y-6">
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="uppercase tracking-wider text-blue-400">
                CURRENT OPERATION:
              </span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={14} /> Dual-Pass Auditor
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Loader2 size={16} className="text-blue-400 animate-spin shrink-0" />
              <span>{progress.currentStep}</span>
            </p>
          </div>

          {/* 8-Stage Step Indicator Tracker */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {PIPELINE_STAGES.map((s) => {
              const isPast = progress.stage > s.id;
              const isCurrent = progress.stage === s.id;

              return (
                <div
                  key={s.id}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition ${
                    isPast
                      ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                      : isCurrent
                      ? 'border-blue-500/60 bg-blue-950/40 text-blue-200 shadow-sm shadow-blue-500/20'
                      : 'border-slate-800/80 bg-slate-950/30 text-slate-500'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      isPast
                        ? 'bg-emerald-500 text-slate-950'
                        : isCurrent
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 size={12} /> : s.id}
                  </div>
                  <span className="truncate font-medium">{s.name}</span>
                </div>
              );
            })}
          </div>

          {/* Pattern Diversity Verification System */}
          {progress.patternBreakdown && Object.keys(progress.patternBreakdown).length > 0 && (
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Layers size={13} className="text-purple-400" /> Pattern Diversity Verifier
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 size={11} /> NTA/IIT Pattern Verified
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(progress.patternBreakdown).map(([pattern, count]) => (
                  <div
                    key={pattern}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/60 text-[11px] text-slate-300 flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                    <span className="font-medium text-slate-300">{pattern}:</span>
                    <span className="font-bold text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pipeline Telemetry Footer */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-800">
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Target Quota
              </span>
              <span className="text-base font-extrabold text-white">
                {progress.totalNeeded} Qs
              </span>
            </div>

            <div className="bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/20">
              <span className="text-emerald-400 block text-[10px] uppercase font-bold">
                Verified Passed
              </span>
              <span className="text-base font-extrabold text-emerald-300">
                {progress.verifiedCount}
              </span>
            </div>

            <div className="bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/20">
              <span className="text-amber-400 block text-[10px] uppercase font-bold">
                Rejection & Healed
              </span>
              <span className="text-base font-extrabold text-amber-300">
                {progress.rejectedCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
