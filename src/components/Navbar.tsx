import React from 'react';
import {
  Flame,
  BrainCircuit,
  BookOpen,
  Moon,
  Sun,
  Layers,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'exam' | 'results';
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onGoToDashboard: () => void;
  onOpenAiGenerator: () => void;
  onOpenFormulaVault: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  darkMode,
  onToggleDarkMode,
  onGoToDashboard,
  onOpenAiGenerator,
  onOpenFormulaVault,
}) => {

  // If in active CBT exam, show minimal distraction-free top bar instead of full navbar
  if (currentView === 'exam') return null;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={onGoToDashboard}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition transform">
            <Flame size={22} className="text-yellow-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                JEE <span className="text-blue-600 dark:text-blue-400">AI</span> Test Series
              </span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold px-1.5 py-0.5 rounded uppercase">
                Pro
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">NTA CBT Simulator & AI Guru</p>
          </div>
        </div>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
          <button
            onClick={onGoToDashboard}
            className={`px-3.5 py-2 rounded-xl transition ${
              currentView === 'dashboard'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={onOpenAiGenerator}
            className="px-3.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-purple-600 dark:text-purple-400"
          >
            <Sparkles size={14} /> AI Mock Generator
          </button>

          <button
            onClick={onOpenFormulaVault}
            className="px-3.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-teal-600 dark:text-teal-400"
          >
            <BookOpen size={14} /> Formula Vault
          </button>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Toggle theme"
          >
            {darkMode ? <Sun size={17} className="text-yellow-400" /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </nav>
  );
};
