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
  onGoogleSignIn?: () => void;
  onSignOut?: () => void;
  isGoogleAuthenticated?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  onOpenMobile,
  darkMode,
  onToggleDarkMode,
  userProfile,
  onOpenProfile,
  onGoogleSignIn,
  onSignOut,
  isGoogleAuthenticated = false,
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

        {/* Google Sign In / Account Status */}
        {!isGoogleAuthenticated && onGoogleSignIn ? (
          <button
            type="button"
            onClick={onGoogleSignIn}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="hidden sm:inline">Sign in with Google</span>
            <span className="sm:hidden">Sign In</span>
          </button>
        ) : null}

        {/* Theme Toggle */}
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
