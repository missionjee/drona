import React from 'react';
import { Menu, Moon, Sun, ShieldCheck, Phone, Sparkles } from 'lucide-react';
import { ActiveNavTab } from './Sidebar';
import { UserProfile } from '../types';
import { isApiKeyConfigured } from '../services/geminiService';

interface TopbarProps {
  activeTab: ActiveNavTab;
  onOpenMobile: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  userProfile: UserProfile;
  onOpenProfile: () => void;
  onOpenApiKeyModal?: () => void;
  onSignOut?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  onOpenMobile,
  darkMode,
  onToggleDarkMode,
  userProfile,
  onOpenProfile,
  onOpenApiKeyModal,
}) => {
  const getTabTitle = (tab: ActiveNavTab) => {
    switch (tab) {
      case 'arsenal':
        return { title: 'Test Arsenal', subtitle: 'Interactive Graphs, Score Trajectory & Immutable Ledger' };
      case 'series':
        return { title: 'CBT Test Series Engine', subtitle: 'NTA & IIT Chapter-Specific Mock Generator' };
      case 'library':
        return { title: 'Study Library & Vault', subtitle: 'Class 11, Class 12, HC Verma & Irodov Master Archive' };
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
          className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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

        {/* User Phone Badge */}
        {userProfile.phoneNumber && (
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[11px] font-mono font-bold">
            <Phone size={11} />
            <span>{userProfile.phoneNumber}</span>
          </div>
        )}

        {/* Gemini AI Engine Status / Config Button */}
        {onOpenApiKeyModal && (
          <button
            onClick={onOpenApiKeyModal}
            title={
              isApiKeyConfigured()
                ? 'Google Gemini 2.5 Flash Active - Click to configure or view API key'
                : 'Offline PYQ Engine Active - Click to configure Google Gemini API key'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isApiKeyConfigured()
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isApiKeyConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <Sparkles
              size={13}
              className={
                isApiKeyConfigured()
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-amber-600 dark:text-amber-400'
              }
            />
            <span className="hidden sm:inline">
              {isApiKeyConfigured() ? 'Gemini 2.5 Active' : 'Setup Gemini AI'}
            </span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          title="Toggle High-Contrast Light / Dark Mode"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer"
        >
          {darkMode ? <Sun size={17} className="text-yellow-400" /> : <Moon size={17} className="text-slate-700" />}
        </button>

        {/* Profile Avatar Button */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-blue-500 transition text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
        >
          {userProfile.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
              {userProfile.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <span className="hidden sm:inline">{userProfile.name}</span>
        </button>
      </div>
    </header>
  );
};
