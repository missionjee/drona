import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  Sparkles,
  Save,
  GraduationCap,
  Target,
} from 'lucide-react';
import { UserProfile, StreamType } from '../types';
import { saveUserProfile } from '../services/supabaseService';

interface ProfileViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onGoogleSignIn?: () => void;
  onSignOut?: () => void;
  isGoogleAuthenticated?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  onUpdateProfile,
  onGoogleSignIn,
  onSignOut,
  isGoogleAuthenticated = false,
}) => {
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleStreamChange = (newStream: StreamType) => {
    setFormData((prev) => ({
      ...prev,
      stream: newStream,
      targetCollege: newStream === 'neet' ? 'AIIMS New Delhi' : 'IIT Bombay / Computer Science',
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveUserProfile(formData);
    onUpdateProfile(formData);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      {/* ================= PROFILE IDENTITY CARD ================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {formData.avatarUrl ? (
            <img
              src={formData.avatarUrl}
              alt={formData.name}
              className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-sm">
              {formData.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {formData.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {formData.email} • Class {formData.classLevel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
            {formData.stream === 'neet' ? 'NEET Track' : 'JEE Track'}
          </span>
        </div>
      </div>

      {/* ================= TARGET STREAM SELECTION (JEE VS NEET) ================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Target size={16} className="text-blue-600" /> Target Stream
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Select your primary curriculum</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* JEE Option */}
          <div
            onClick={() => handleStreamChange('jee')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition select-none flex items-center justify-between ${
              formData.stream === 'jee'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  JEE (Main & Advanced)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500">Physics, Chemistry, Mathematics</p>
            </div>
            {formData.stream === 'jee' && <CheckCircle2 size={18} className="text-blue-600 shrink-0" />}
          </div>

          {/* NEET Option */}
          <div
            onClick={() => handleStreamChange('neet')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition select-none flex items-center justify-between ${
              formData.stream === 'neet'
                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🩺</span>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  NEET-UG (Medical)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500">Physics, Chemistry, Biology</p>
            </div>
            {formData.stream === 'neet' && <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />}
          </div>
        </div>
      </div>

      {/* ================= PERSONAL IDENTITY & GOALS ================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <GraduationCap size={16} className="text-blue-600" /> Academic Details
        </h3>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Candidate Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Registered Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Class Standing:</label>
            <select
              value={formData.classLevel}
              onChange={(e) => setFormData({ ...formData, classLevel: e.target.value as any })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
              <option value="dropper">Repeater / Dropper</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Target College / Aim:</label>
            <input
              type="text"
              value={formData.targetCollege}
              onChange={(e) => setFormData({ ...formData, targetCollege: e.target.value })}
              placeholder="e.g. IIT Bombay / AIIMS Delhi"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* ================= GOOGLE AUTHENTICATION & SUPABASE CLOUD SYNC ================= */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white">
                Google Authentication
              </h4>
              <p className="text-[11px] text-slate-500">
                {isGoogleAuthenticated
                  ? `Authenticated as ${formData.email}`
                  : 'Link your Google account for cross-device cloud persistence.'}
              </p>
            </div>
          </div>

          <div>
            {isGoogleAuthenticated && onSignOut ? (
              <button
                type="button"
                onClick={onSignOut}
                className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 transition text-xs cursor-pointer"
              >
                Sign Out
              </button>
            ) : onGoogleSignIn ? (
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition text-xs shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Login with Google</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-2">
            <Cloud size={14} className="text-blue-600" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Supabase Cloud Sync</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ready</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">ukoxijpkxmdckamcmczz</span>
        </div>
      </div>

      {/* ================= SAVE ACTION ================= */}
      <div className="flex items-center justify-between pt-1">
        {saveSuccess ? (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={16} /> Preferences updated successfully!
          </span>
        ) : <div />}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-2 ml-auto"
        >
          <Save size={14} />
          <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>
    </div>
  );
};
