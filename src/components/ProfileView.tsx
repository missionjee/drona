import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  Sparkles,
  Save,
  RefreshCw,
  GraduationCap,
  Target,
  Layers,
  Key,
} from 'lucide-react';
import { UserProfile, StreamType } from '../types';
import {
  saveUserProfile,
  testSupabaseConnection,
  getActiveSupabaseConfig,
  resetSupabaseClient,
} from '../services/supabaseService';

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

  // Supabase connection tester state
  const [customUrl, setCustomUrl] = useState(formData.customSupabaseUrl || '');
  const [customKey, setCustomKey] = useState(formData.customSupabaseKey || '');
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const activeConfig = getActiveSupabaseConfig();

  const handleStreamChange = (newStream: StreamType) => {
    setFormData((prev) => ({
      ...prev,
      stream: newStream,
      targetCollege: newStream === 'neet' ? 'AIIMS New Delhi' : 'IIT Bombay / Computer Science',
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updated = {
      ...formData,
      customSupabaseUrl: customUrl.trim() || undefined,
      customSupabaseKey: customKey.trim() || undefined,
    };

    if (customUrl.trim() && customKey.trim()) {
      resetSupabaseClient(customUrl.trim(), customKey.trim());
    } else {
      resetSupabaseClient();
    }

    await saveUserProfile(updated);
    onUpdateProfile(updated);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    const urlToTest = customUrl.trim() || activeConfig.url;
    const keyToTest = customKey.trim() || activeConfig.key;
    const res = await testSupabaseConnection(urlToTest, keyToTest);
    setTestResult(res);
    setIsTesting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* ================= PROFILE HEADER ================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md">
            {formData.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {formData.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {formData.email} • Class {formData.classLevel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs uppercase border border-blue-200 dark:border-blue-900">
            {formData.stream === 'neet' ? 'NEET Medical Track' : 'IIT-JEE Engineering Track'}
          </span>
        </div>
      </div>

      {/* ================= TARGET STREAM SELECTION (JEE VS NEET) ================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Target size={16} className="text-blue-600" /> Target Examination Stream
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Switching your stream automatically customizes the NCERT test series syllabus, subject tabs, question blueprints, and timers.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* JEE Option */}
          <div
            onClick={() => handleStreamChange('jee')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition select-none flex flex-col justify-between ${
              formData.stream === 'jee'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">⚡</span>
                {formData.stream === 'jee' && (
                  <CheckCircle2 size={18} className="text-blue-600" />
                )}
              </div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                IIT-JEE (Main & Advanced)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Physics, Chemistry, and Mathematics. Includes 25-question NTA JEE Main mocks and multi-format IIT JEE Advanced simulators.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-bold text-blue-600 dark:text-blue-400">
              PCM Curriculum Active
            </div>
          </div>

          {/* NEET Option */}
          <div
            onClick={() => handleStreamChange('neet')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition select-none flex flex-col justify-between ${
              formData.stream === 'neet'
                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🩺</span>
                {formData.stream === 'neet' && (
                  <CheckCircle2 size={18} className="text-emerald-600" />
                )}
              </div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                NEET-UG (Medical)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Physics, Chemistry, and Biology (Botany & Zoology). Includes NTA NEET format with 45 questions per section and 200-minute timers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              PCB Curriculum Active
            </div>
          </div>
        </div>
      </div>

      {/* ================= PERSONAL IDENTITY & GOALS ================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <GraduationCap size={16} className="text-blue-600" /> Academic Profile & Targets
        </h3>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Candidate Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Registered Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Academic Standing:</label>
            <select
              value={formData.classLevel}
              onChange={(e) => setFormData({ ...formData, classLevel: e.target.value as any })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="11">Class 11 (Foundational Year)</option>
              <option value="12">Class 12 (Target Exam Year)</option>
              <option value="dropper">Repeater / Dropper (Full Revision)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Dream Target Institution:</label>
            <input
              type="text"
              value={formData.targetCollege}
              onChange={(e) => setFormData({ ...formData, targetCollege: e.target.value })}
              placeholder="e.g. IIT Bombay / AIIMS Delhi"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* ================= SUPABASE CLOUD DECK ================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Cloud size={16} className="text-blue-600" /> Supabase Cloud Backend Deck
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous persistent storage for test scores, history, notes, and profile.
            </p>
          </div>

          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sync Active
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 space-y-3 text-xs">
          <div className="flex items-center justify-between font-mono">
            <span className="text-slate-500">Active Host:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">
              {activeConfig.url}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-lg transition flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={isTesting ? 'animate-spin' : ''} />
              <span>Test Connection</span>
            </button>

            {testResult && (
              <span
                className={`font-semibold ${
                  testResult.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                }`}
              >
                {testResult.message}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ================= SAVE BUTTON ================= */}
      <div className="flex items-center justify-between pt-2">
        {saveSuccess && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={16} /> Profile and stream settings saved!
          </span>
        )}
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Save size={15} />
            <span>Save Profile & Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
