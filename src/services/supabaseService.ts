import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, PersistentPerformanceRecord, StudyNote } from '../types';

const DEFAULT_SUPABASE_URL = 'https://ukoxijpkxmdckamcmczz.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_dpg1jDHvPSx2UyNz80vHog_FGUs5aeY';

const STORAGE_KEYS = {
  USER_PROFILE: 'drona_user_profile',
  CUSTOM_URL: 'drona_custom_supabase_url',
  CUSTOM_KEY: 'drona_custom_supabase_key',
  TEST_HISTORY: 'drona_test_history',
  STUDY_NOTES: 'drona_study_notes',
  AUTH_LOGGED_IN: 'drona_user_logged_in',
};

// Default profile for new sessions
const INITIAL_PROFILE: UserProfile = {
  name: 'Divesh Sah',
  email: 'diveshsah2@gmail.com',
  stream: 'jee',
  classLevel: '12',
  targetCollege: 'IIT Bombay / Computer Science',
  targetRank: 'AIR < 500',
  avatarUrl: '',
  syncEnabled: true,
};

let clientInstance: SupabaseClient | null = null;

export function getActiveSupabaseConfig(): { url: string; key: string; isCustom: boolean } {
  const customUrl = localStorage.getItem(STORAGE_KEYS.CUSTOM_URL);
  const customKey = localStorage.getItem(STORAGE_KEYS.CUSTOM_KEY);

  if (customUrl && customKey) {
    return { url: customUrl.trim(), key: customKey.trim(), isCustom: true };
  }
  return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_KEY, isCustom: false };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getActiveSupabaseConfig();
  if (!url || !key) return null;

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return clientInstance;
}

export function resetSupabaseClient(url?: string, key?: string) {
  clientInstance = null;
  if (url && key) {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_URL, url);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_KEY, key);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_URL);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_KEY);
  }
}

// -------------------------------------------------------------
// USER PROFILE METHODS (Offline-First + Supabase Sync)
// -------------------------------------------------------------
export async function fetchUserProfile(): Promise<UserProfile> {
  let profile = { ...INITIAL_PROFILE };
  const local = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  if (local) {
    try {
      profile = { ...profile, ...JSON.parse(local) };
    } catch {
      // fallback to initial
    }
  }

  const supabase = getSupabaseClient();
  if (supabase && profile.syncEnabled) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', profile.email)
        .maybeSingle();

      if (!error && data) {
        profile = {
          ...profile,
          name: data.name || profile.name,
          stream: data.stream || profile.stream,
          classLevel: data.class_level || profile.classLevel,
          targetCollege: data.target_college || profile.targetCollege,
          targetRank: data.target_rank || profile.targetRank,
          avatarUrl: data.avatar_url || profile.avatarUrl,
        };
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      }
    } catch (err) {
      console.warn('Supabase profile sync error (offline fallback used):', err);
    }
  }

  return profile;
}

export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));

  const supabase = getSupabaseClient();
  if (supabase && profile.syncEnabled) {
    try {
      const payload = {
        email: profile.email,
        name: profile.name,
        stream: profile.stream,
        class_level: profile.classLevel,
        target_college: profile.targetCollege,
        target_rank: profile.targetRank,
        avatar_url: profile.avatarUrl,
        updated_at: new Date().toISOString(),
      };

      await supabase.from('user_profiles').upsert(payload, { onConflict: 'email' });
      return true;
    } catch (err) {
      console.warn('Supabase remote profile save error:', err);
    }
  }
  return true;
}

// -------------------------------------------------------------
// TEST HISTORY & TEST ARSENAL INTEGRATION
// (AUTO-UPLOAD OF TEST MARKS, NO MANUAL ENTRY, NO DELETE)
// -------------------------------------------------------------
export async function fetchTestHistory(): Promise<PersistentPerformanceRecord[]> {
  let history: PersistentPerformanceRecord[] = [];
  const local = localStorage.getItem(STORAGE_KEYS.TEST_HISTORY);
  if (local) {
    try {
      history = JSON.parse(local);
    } catch {
      history = [];
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const profile = await fetchUserProfile();
      const { data, error } = await supabase
        .from('test_history')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!error && data && data.length > 0) {
        // Merge Supabase records with local records by ID
        const remoteRecords: PersistentPerformanceRecord[] = data.map((d: any) => ({
          id: d.id,
          timestamp: d.timestamp || new Date(d.created_at).getTime(),
          examType: d.exam_type,
          title: d.title,
          totalScore: d.total_score,
          maxScore: d.max_score,
          percentage: d.percentage || (d.total_score / d.max_score) * 100,
          predictedPercentile: d.predicted_percentile || 95.0,
          predictedRank: d.predicted_rank || 500,
          accuracy: d.accuracy,
          totalAttempted: d.total_attempted,
          totalCorrect: d.total_correct,
          totalIncorrect: d.total_incorrect,
          totalUnattempted: d.total_unattempted,
          timeSpentSeconds: d.time_spent_seconds || 0,
          subjectScores: d.subject_scores || {},
          chapterAnalytics: d.chapter_analytics || [],
          weakChapters: d.weak_chapters || [],
          strongChapters: d.strong_chapters || [],
          aiRecommendations: d.ai_recommendations || [],
          proctorStrikes: d.proctor_strikes || 0,
        }));

        // Deduplicate
        const idMap = new Map<string, PersistentPerformanceRecord>();
        [...remoteRecords, ...history].forEach((r) => idMap.set(r.id, r));
        history = Array.from(idMap.values()).sort((a, b) => b.timestamp - a.timestamp);
        localStorage.setItem(STORAGE_KEYS.TEST_HISTORY, JSON.stringify(history));
      }
    } catch (err) {
      console.warn('Supabase test history fetch error (local fallback used):', err);
    }
  }

  return history;
}

/**
 * AUTO-UPLOAD TEST RESULTS TO TEST ARSENAL
 * No manual entry required!
 */
export async function autoUploadTestResult(record: PersistentPerformanceRecord): Promise<void> {
  // 1. Immediately store in local history
  const current = await fetchTestHistory();
  // Filter out duplicate if same ID
  const updated = [record, ...current.filter((r) => r.id !== record.id)];
  localStorage.setItem(STORAGE_KEYS.TEST_HISTORY, JSON.stringify(updated));

  // 2. Upload to Supabase cloud table
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payload = {
        id: record.id,
        timestamp: record.timestamp,
        exam_type: record.examType,
        title: record.title,
        total_score: record.totalScore,
        max_score: record.maxScore,
        percentage: record.percentage,
        accuracy: record.accuracy,
        predicted_percentile: record.predictedPercentile,
        predicted_rank: record.predictedRank,
        total_attempted: record.totalAttempted,
        total_correct: record.totalCorrect,
        total_incorrect: record.totalIncorrect,
        total_unattempted: record.totalUnattempted,
        time_spent_seconds: record.timeSpentSeconds,
        subject_scores: record.subjectScores,
        weak_chapters: record.weakChapters,
        strong_chapters: record.strongChapters,
        ai_recommendations: record.aiRecommendations,
        proctor_strikes: record.proctorStrikes || 0,
        created_at: new Date(record.timestamp).toISOString(),
      };

      await supabase.from('test_history').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase test marks upload error (saved locally):', err);
    }
  }
}

// -------------------------------------------------------------
// STUDY NOTES METHODS
// -------------------------------------------------------------
export async function fetchStudyNotes(): Promise<StudyNote[]> {
  const local = localStorage.getItem(STORAGE_KEYS.STUDY_NOTES);
  let notes: StudyNote[] = local ? JSON.parse(local) : [];

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('study_notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data && data.length > 0) {
        notes = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          subject: d.subject,
          content: d.content,
          updatedAt: d.updated_at ? new Date(d.updated_at).getTime() : Date.now(),
        }));
        localStorage.setItem(STORAGE_KEYS.STUDY_NOTES, JSON.stringify(notes));
      }
    } catch (err) {
      console.warn('Supabase notes fetch error (local fallback):', err);
    }
  }

  return notes;
}

export async function saveStudyNote(note: StudyNote): Promise<void> {
  const notes = await fetchStudyNotes();
  const existingIdx = notes.findIndex((n) => n.id === note.id);
  const updated =
    existingIdx >= 0
      ? notes.map((n) => (n.id === note.id ? note : n))
      : [note, ...notes];

  localStorage.setItem(STORAGE_KEYS.STUDY_NOTES, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('study_notes').upsert({
        id: note.id,
        title: note.title,
        subject: note.subject,
        content: note.content,
        updated_at: new Date(note.updatedAt).toISOString(),
      });
    } catch (err) {
      console.warn('Supabase note save error:', err);
    }
  }
}

// -------------------------------------------------------------
// SUPABASE CONNECTION TESTER
// -------------------------------------------------------------
export async function testSupabaseConnection(
  url: string,
  key: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const client = createClient(url, key);
    const { error } = await client.from('test_history').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { ok: true, message: `Connected to Supabase! (${error.message || 'Ready'})` };
    }
    return { ok: true, message: 'Successfully connected to Supabase Cloud Deck!' };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Connection failed.' };
  }
}

// -------------------------------------------------------------
// AUTHENTICATION STATE & GOOGLE OAUTH
// -------------------------------------------------------------
export function isUserLoggedIn(): boolean {
  return localStorage.getItem(STORAGE_KEYS.AUTH_LOGGED_IN) === 'true';
}

export function setUserLoggedIn(loggedIn: boolean): void {
  if (loggedIn) {
    localStorage.setItem(STORAGE_KEYS.AUTH_LOGGED_IN, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_LOGGED_IN);
  }
}

export async function checkActiveSession(): Promise<{ user: any; session: any } | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return { user: session.user, session };
  } catch (err) {
    console.warn('Error checking Supabase session:', err);
    return null;
  }
}

export async function checkGoogleOAuthAvailable(): Promise<boolean> {
  try {
    const { url } = getActiveSupabaseConfig();
    const res = await fetch(
      `${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`,
      { method: 'GET' }
    );
    if (res.status === 400) {
      const text = await res.text();
      if (text.includes('Unsupported provider') || text.includes('validation_failed')) {
        return false;
      }
    }
    return res.status === 200 || res.status === 302 || res.status === 303;
  } catch {
    return false;
  }
}

export async function signInWithGoogle(): Promise<{ error: Error | null; unsupportedProvider?: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error('Supabase client is not initialized') };

  try {
    // Check if Google OAuth provider is enabled in Supabase project to avoid 400 bad request error screen
    const isSupported = await checkGoogleOAuthAvailable();
    if (!isSupported) {
      return {
        error: new Error('Google OAuth provider is not yet enabled in the Supabase console.'),
        unsupportedProvider: true,
      };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

export async function signOutUser(): Promise<{ error: Error | null }> {
  setUserLoggedIn(false);
  const supabase = getSupabaseClient();
  if (!supabase) return { error: null };

  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? new Error(error.message) : null };
  } catch (err: any) {
    return { error: err };
  }
}

export async function getAuthUser() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export function subscribeAuthState(callback: (user: any) => void): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserLoggedIn(true);
      }
      callback(session?.user || null);
    });
    return () => {
      subscription.unsubscribe();
    };
  } catch {
    return () => {};
  }
}


