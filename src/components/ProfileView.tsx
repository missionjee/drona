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
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  onUpdateProfile,
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
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-sm">
            {formData.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {formData.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {formData.email} • Class {formData.classLevel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      {/* ================= CLOUD SYNC STATUS (MINIMAL & KEY-FREE) ================= */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <Cloud size={16} className="text-blue-600" />
          <span className="font-bold text-slate-800 dark:text-slate-200">Supabase Cloud Sync</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active & Connected</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">ukoxijpkxmdckamcmczz</span>
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
