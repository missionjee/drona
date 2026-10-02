import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Sun,
  Moon,
  Cloud,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { UserProfile, StreamType } from '../types';
import {
  registerWithPhoneAndPassword,
  loginWithPhoneAndPassword,
  setUserLoggedIn,
} from '../services/supabaseService';

interface LoginViewProps {
  initialProfile: UserProfile;
  onLoginSuccess: (profile: UserProfile) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  initialProfile,
  onLoginSuccess,
  darkMode,
  onToggleDarkMode,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState(initialProfile.name && initialProfile.name !== 'JEE Aspirant' ? initialProfile.name : '');
  const [phoneNumber, setPhoneNumber] = useState(initialProfile.phoneNumber || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stream, setStream] = useState<StreamType>(initialProfile.stream || 'jee');
  const [classLevel, setClassLevel] = useState<'11' | '12' | 'dropper'>(initialProfile.classLevel || '12');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Switch tabs
  const handleTabSwitch = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Submit Handler for Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').trim();
    if (cleanPhone.replace(/[^0-9]/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithPhoneAndPassword(cleanPhone, password);
      if (res.success && res.profile) {
        setSuccessMsg('Login successful! Launching Drona Command Center...');
        setTimeout(() => {
          onLoginSuccess(res.profile!);
        }, 300);
      } else {
        setErrorMsg(res.error || 'Login failed. Please verify your phone number and password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Handler for Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please provide your full name.');
      return;
    }

    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').trim();
    if (cleanPhone.replace(/[^0-9]/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-type your password confirmation.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerWithPhoneAndPassword(
        name.trim(),
        cleanPhone,
        password,
        stream,
        classLevel
      );

      if (res.success && res.profile) {
        setSuccessMsg('Account registered successfully! Welcome to Drona.');
        setTimeout(() => {
          onLoginSuccess(res.profile!);
        }, 400);
      } else {
        setErrorMsg(res.error || 'Registration could not be completed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Instant Guest / Offline Practice Mode
  const handleGuestLogin = () => {
    const guestProfile: UserProfile = {
      ...initialProfile,
      name: 'Guest Aspirant',
      email: 'guest@missionjee.org',
      phoneNumber: '',
      stream: 'jee',
      classLevel: '12',
      targetCollege: 'IIT Bombay',
      targetRank: 'AIR < 1000',
      syncEnabled: false,
    };
    setUserLoggedIn(true);
    onLoginSuccess(guestProfile);
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
            <span>Supabase Auth</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Theme toggle */}
          <button
            onClick={onToggleDarkMode}
            title="Toggle Light / Dark Mode"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer"
          >
            {darkMode ? <Sun size={17} className="text-yellow-400" /> : <Moon size={17} className="text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="max-w-md w-full mx-auto px-4 py-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
          
          {/* Card Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold">
              <Sparkles size={13} />
              <span>Aspirant Authentication</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {authMode === 'login' ? 'Log In to DRONA' : 'Create Aspirant Account'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {authMode === 'login'
                ? 'Enter your mobile number and password to access your CBT test records.'
                : 'Register on Supabase to start taking verified JEE & NEET mock tests.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogIn size={14} />
              <span>Log In</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('register')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus size={14} />
              <span>Register</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 text-xs space-y-1 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle size={15} className="text-red-600 shrink-0" />
                <span>Authentication Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-red-800 dark:text-red-300">
                {errorMsg}
              </p>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= LOGIN FORM ================= */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Mobile Phone Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Phone size={14} className="text-blue-500" />
                    <span>+91</span>
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="98765 43210"
                    required
                    className="w-full pl-16 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Password
                  </label>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <Lock size={14} className="text-blue-500" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{isLoading ? 'Authenticating with Supabase...' : 'Log In to Drona'}</span>
                <ArrowRight size={14} />
              </button>

              <div className="pt-1 text-center">
                <p className="text-xs text-slate-500">
                  New aspirant?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('register')}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Register account here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ================= REGISTRATION FORM ================= */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Aspirant Full Name
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <User size={14} className="text-blue-500" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Mobile Phone Number (Login ID)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Phone size={14} className="text-blue-500" />
                    <span>+91</span>
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="98765 43210"
                    required
                    className="w-full pl-16 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Create Password (min. 6 characters)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <Lock size={14} className="text-blue-500" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <Lock size={14} className="text-blue-500" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your password"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{isLoading ? 'Registering on Supabase...' : 'Create Aspirant Account'}</span>
                <ArrowRight size={14} />
              </button>

              <div className="pt-1 text-center">
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('login')}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Log in here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Quick Practice Mode (Guest) */}
          <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
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
