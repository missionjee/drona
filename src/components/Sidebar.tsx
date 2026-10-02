import React from 'react';
import {
  FlaskConical,
  Zap,
  BookOpen,
  BarChart3,
  UserCheck,
  Cloud,
  CheckCircle,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { UserProfile } from '../types';

export type ActiveNavTab = 'arsenal' | 'series' | 'library' | 'profile';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  userProfile: UserProfile;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  supabaseConnected: boolean;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userProfile,
  isOpenMobile,
  onCloseMobile,
  supabaseConnected,
  onSignOut,
}) => {
  const navItems = [
    { id: 'arsenal' as ActiveNavTab, label: 'Test Arsenal', icon: FlaskConical, badge: 'Graphs & History' },
    { id: 'series' as ActiveNavTab, label: 'Test Series', icon: Zap, badge: 'CBT AI' },
    { id: 'library' as ActiveNavTab, label: 'Study Library', icon: BookOpen, badge: 'NCERT + HCV' },
    { id: 'profile' as ActiveNavTab, label: 'Profile & Stream', icon: UserCheck, badge: userProfile.stream.toUpperCase() },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out font-sans ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Identity */}
        <div>
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                MJ
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Mission Jeet
                </h1>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  DRONA Command Center
                </p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Status Capsule */}
          <div
            onClick={() => {
              onSelectTab('profile');
              onCloseMobile();
            }}
            className="m-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt="User"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  userProfile.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {userProfile.name}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>
                    Class {userProfile.classLevel} • {userProfile.stream === 'neet' ? 'NEET-UG' : 'IIT-JEE'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} className={isActive ? 'text-white' : 'text-slate-500'} />
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer & Supabase Connection Status */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Cloud size={13} className="text-blue-500" />
                <span>Supabase Sync</span>
              </div>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
              {userProfile.email}
            </p>
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900/60 dark:hover:text-red-400 transition flex items-center justify-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-800/40"
            >
              <LogOut size={12} />
              <span>Sign Out / Switch Profile</span>
            </button>
          )}

          <div className="text-center text-[10px] text-slate-400 font-mono tracking-wider">
            MISSION JEET v4.0 • DRONA
          </div>
        </div>
      </aside>
    </>
  );
};
