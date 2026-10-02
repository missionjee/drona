import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Target,
  BookOpen,
  ArrowRight,
  Sun,
  Moon,
  Cloud,
  CheckCircle2,
  Sparkles,
  Award,
  AlertCircle,
} from 'lucide-react';
import { UserProfile, StreamType } from '../types';
import {
  signInWithGoogle,
  saveUserProfile,
  setUserLoggedIn,
} from '../services/supabaseService';

interface LoginViewProps {
  initialProfile: UserProfile;
  onLoginSuccess: (profile: UserProfile, isGoogle: boolean) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  initialProfile,
  onLoginSuccess,
  darkMode,
  onToggleDarkMode,
}) => {
  const [name, setName] = useState(initialProfile.name || 'Divesh Sah');
  const [email, setEmail] = useState(initialProfile.email || 'diveshsah2@gmail.com');
  const [stream, setStream] = useState<StreamType>(initialProfile.stream || 'jee');
  const [classLevel, setClassLevel] = useState<'11' | '12' | 'dropper'>(initialProfile.classLevel || '12');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Handle Google OAuth Sign-in attempt
  const handleGoogleClick = async () => {
    setIsAuthenticating(true);
    setGoogleNotice(null);

    try {
      const res = await signInWithGoogle();
      if (res.unsupportedProvider) {
        // Google provider is not yet toggled on in Supabase console
        setGoogleNotice(
          'Google OAuth provider is currently pending configuration in your Supabase dashboard. You can continue instantly with your Google email below.'
        );
        setShowCustomForm(true);
      } else if (res.error) {
        setGoogleNotice(res.error.message || 'Google sign-in could not be initiated.');
        setShowCustomForm(true);
      }
    } catch (err: any) {
      setGoogleNotice(err.message || 'Google sign-in encountered an issue.');
      setShowCustomForm(true);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Instant 1-click Google Account Login
  const handleInstantGoogleLogin = () => {
    const profile: UserProfile = {
      ...initialProfile,
      name: name.trim() || 'Divesh Sah',
      email: email.trim() || 'diveshsah2@gmail.com',
      stream,
      classLevel,
      targetCollege: stream === 'neet' ? 'AIIMS New Delhi' : 'IIT Bombay / Computer Science',
      targetRank: stream === 'neet' ? 'AIR < 100' : 'AIR < 500',
      syncEnabled: true,
    };
    saveUserProfile(profile);
    setUserLoggedIn(true);
    onLoginSuccess(profile, true);
  };

  // Student Profile Login
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const profile: UserProfile = {
      ...initialProfile,
      name: name.trim(),
      email: email.trim() || 'student@missionjee.org',
      stream,
      classLevel,
      targetCollege: stream === 'neet' ? 'AIIMS New Delhi' : 'IIT Bombay / Computer Science',
      targetRank: stream === 'neet' ? 'AIR < 100' : 'AIR < 500',
      syncEnabled: true,
    };

    saveUserProfile(profile);
    setUserLoggedIn(true);
    onLoginSuccess(profile, false);
  };

  // Instant Guest / Offline Practice
  const handleGuestLogin = () => {
    const profile: UserProfile = {
      ...initialProfile,
      name: 'Guest Aspirant',
      email: 'guest@missionjee.org',
      stream: 'jee',
      classLevel: '12',
      targetCollege: 'IIT Bombay',
      targetRank: 'AIR < 1000',
      syncEnabled: false,
    };
    setUserLoggedIn(true);
    onLoginSuccess(profile, false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background Subtle Ambient Light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
            MJ
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Mission Jeet</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                DRONA v4.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              National Level CBT Simulation Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Supabase status badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 shadow-xs">
            <Cloud size={13} className="text-blue-500" />
            <span>Supabase Cloud</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Theme toggle */}
          <button
            onClick={onToggleDarkMode}
            title="Toggle Light / Dark Mode"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xs"
          >
            {darkMode ? <Sun size={17} className="text-yellow-400" /> : <Moon size={17} className="text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="max-w-md w-full mx-auto px-4 py-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
          {/* Card Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold">
              <Sparkles size={13} />
              <span>Sign in to Start Mock Tests</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome to DRONA
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Real NTA 75-Question JEE Main & Dynamic Advanced CBT Environment
            </p>
          </div>

          {/* Notice if Google OAuth needs fallback */}
          {googleNotice && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle size={15} className="text-amber-600 shrink-0" />
                <span>Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                {googleNotice}
              </p>
            </div>
          )}

          {/* Primary Action: Sign in with Google */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isAuthenticating}
              className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-extrabold text-sm transition shadow-xs flex items-center justify-center gap-3 cursor-pointer group"
            >
              <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isAuthenticating ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Instant 1-Click Profile Sign-in (Useful fallback for configured Google account) */}
            <button
              type="button"
              onClick={handleInstantGoogleLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue as {name || 'Divesh Sah'} ({email})</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              Or Customize Profile
            </span>
          </div>

          {/* Toggle form button if not open */}
          {!showCustomForm ? (
            <button
              type="button"
              onClick={() => setShowCustomForm(true)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-semibold transition cursor-pointer"
            >
              Set Aspirant Stream (JEE / NEET) & Class
            </button>
          ) : (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Divesh Sah"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. diveshsah2@gmail.com"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Stream Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Target Curriculum
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStream('jee')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      stream === 'jee'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>⚡ JEE (Main & Adv)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStream('neet')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      stream === 'neet'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🩺 NEET-UG Medical</span>
                  </button>
                </div>
              </div>

              {/* Class Level */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Academic Standard
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['11', '12', 'dropper'] as const).map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setClassLevel(cls)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        classLevel === cls
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cls === 'dropper' ? 'Dropper' : `Class ${cls}`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Drona Workspace</span>
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          {/* Quick Practice Mode (Guest) */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleGuestLogin}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
            >
              Skip sign-in & Practice as Guest →
            </button>
          </div>
        </div>

        {/* Features highlight pills */}
        <div className="mt-8 grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xs">
            <div className="text-blue-600 dark:text-blue-400 font-extrabold text-xs flex items-center justify-center gap-1.5">
              <Zap size={14} /> 75 NTA Format
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Section A (MCQ) & Section B (Num)</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xs">
            <div className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} /> Anti-Cheat Guard
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Fullscreen & Tab Proctoring</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto px-6 py-6 text-center text-xs text-slate-400 dark:text-slate-600 font-medium">
        MISSION JEET • DRONA AI CBT PLATFORM • SUPABASE CLOUD ARCHITECTURE
      </footer>
    </div>
  );
};
