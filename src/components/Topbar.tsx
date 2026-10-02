import React from 'react';
import { Menu, Moon, Sun, ShieldCheck } from 'lucide-react';
import { ActiveNavTab } from './Sidebar';
import { UserProfile } from '../types';

interface TopbarProps {
  activeTab: ActiveNavTab;
  onOpenMobile: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  userProfile: UserProfile;
  onOpenProfile: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  onOpenMobile,
  darkMode,
  onToggleDarkMode,
  userProfile,
  onOpenProfile,
}) => {
  const getTabTitle = (tab: ActiveNavTab) => {
    switch (tab) {
      case 'arsenal':
        return { title: 'Test Arsenal', subtitle: 'Continuous Performance Tracker & Automated History' };
      case 'series':
        return { title: 'CBT Test Series Engine', subtitle: 'Unrepeated NTA & IIT Mock Test Synthesizer' };
      case 'library':
        return { title: 'Study Library & Vault', subtitle: 'Class 11, Class 12, HC Verma & Irodov Master Archive' };
      case 'analytics':
        return { title: 'AI Cognitive Analytics', subtitle: 'Weak Chapter Diagnostics & AIR Percentile Predictor' };
      case 'profile':
        return { title: 'Profile & Stream Setup', subtitle: 'Identity, Aspirant Track & Supabase Cloud Sync' };
    }
  };

  const { title, subtitle } = getTabTitle(activeTab);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 font-sans shadow-xs transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu size={20} />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>Anti-Cheat Guard Active</span>
        </div>

        {/* Theme Toggle (Flawless High-Contrast Support) */}
        <button
          onClick={onToggleDarkMode}
          title="Toggle High-Contrast Light / Dark Mode"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition"
        >
          {darkMode ? <Sun size={17} className="text-yellow-400" /> : <Moon size={17} className="text-slate-700" />}
        </button>

        {/* Profile Avatar Button */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-blue-500 transition text-xs font-bold text-slate-800 dark:text-slate-200"
        >
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
            {userProfile.name.substring(0, 2).toUpperCase()}
          </div>
          <span className="hidden sm:inline">{userProfile.name}</span>
        </button>
      </div>
    </header>
  );
};
