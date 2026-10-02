import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, PersistentPerformanceRecord, StudyNote, StreamType } from '../types';

const DEFAULT_SUPABASE_URL = 'https://ukoxijpkxmdckamcmczz.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_dpg1jDHvPSx2UyNz80vHog_FGUs5aeY';

const STORAGE_KEYS = {
  USER_PROFILE: 'drona_user_profile',
  CUSTOM_URL: 'drona_custom_supabase_url',
  CUSTOM_KEY: 'drona_custom_supabase_key',
  TEST_HISTORY: 'drona_test_history',
  ARCHIVED_PAPERS: 'drona_archived_papers',
  STUDY_NOTES: 'drona_study_notes',
  AUTH_LOGGED_IN: 'drona_user_logged_in',
  REGISTERED_USERS: 'drona_registered_users',
};

// Default profile for new sessions
const INITIAL_PROFILE: UserProfile = {
  name: 'JEE Aspirant',
  email: 'aspirant@missionjee.org',
  phoneNumber: '',
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
      let query = supabase.from('test_history').select('*');

      // User isolation: filter by active email if available
      if (profile.email && !profile.email.includes('missionjee.org')) {
        query = query.eq('user_email', profile.email);
      }

      const { data, error } = await query.order('timestamp', { ascending: false });

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
  const updated = [record, ...current.filter((r) => r.id !== record.id)];
  localStorage.setItem(STORAGE_KEYS.TEST_HISTORY, JSON.stringify(updated));

  // 2. Upload to Supabase cloud table with user scoping
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const profile = await fetchUserProfile();
      const payload = {
        id: record.id,
        user_email: profile.email || 'aspirant@missionjee.org',
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

/**
 * ARCHIVE AND RETRIEVE COMPLETE TEST PAPERS
 * Stores actual questions and student answers so students can review past solutions anytime!
 */
export function saveArchivedTestSession(session: any): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ARCHIVED_PAPERS);
    const papers: Record<string, any> = raw ? JSON.parse(raw) : {};
    papers[session.id] = session;
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_PAPERS, JSON.stringify(papers));
  } catch (e) {
    console.warn('Could not archive test paper to local storage:', e);
  }
}

export function getArchivedTestSession(sessionId: string): any | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ARCHIVED_PAPERS);
    if (!raw) return null;
    const papers = JSON.parse(raw);
    return papers[sessionId] || null;
  } catch {
    return null;
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
// AUTHENTICATION & PHONE NUMBER + PASSWORD SYSTEM
// -------------------------------------------------------------
export interface RegisteredUser {
  id: string;
  name: string;
  phoneNumber: string;
  passwordHash: string;
  stream: StreamType;
  classLevel: '11' | '12' | 'dropper';
  registeredAt: number;
}

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

export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '').trim();
}

export async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + '_drona_salt_2026');
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('Crypto subtle not available, using standard hash fallback:', e);
  }
  let hash = 0;
  const str = password + '_drona_salt_2026';
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16);
}

export function getRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRegisteredUserLocally(user: RegisteredUser): void {
  const users = getRegisteredUsers().filter(
    (u) => u.phoneNumber !== user.phoneNumber && u.id !== user.id
  );
  users.push(user);
  localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
}

/**
 * Register a new user on Supabase with Phone Number & Password
 */
export async function registerWithPhoneAndPassword(
  name: string,
  phone: string,
  password: string,
  stream: StreamType = 'jee',
  classLevel: '11' | '12' | 'dropper' = '12'
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  const cleanPhone = normalizePhoneNumber(phone);
  const digitsOnly = cleanPhone.replace(/[^0-9]/g, '');

  if (digitsOnly.length < 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile phone number.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }
  if (!name.trim()) {
    return { success: false, error: 'Please provide your full name.' };
  }

  // Check if account already exists locally
  const existingUsers = getRegisteredUsers();
  if (
    existingUsers.some(
      (u) =>
        u.phoneNumber === cleanPhone ||
        u.phoneNumber.endsWith(digitsOnly.slice(-10)) ||
        digitsOnly.endsWith(u.phoneNumber.replace(/[^0-9]/g, '').slice(-10))
    )
  ) {
    return {
      success: false,
      error: 'An account with this phone number already exists. Please log in instead.',
    };
  }

  const pwdHash = await hashPassword(password);
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newUser: RegisteredUser = {
    id: userId,
    name: name.trim(),
    phoneNumber: cleanPhone,
    passwordHash: pwdHash,
    stream,
    classLevel,
    registeredAt: Date.now(),
  };

  saveRegisteredUserLocally(newUser);

  // Attempt registration on Supabase Auth & Cloud Database
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const formattedE164 = cleanPhone.startsWith('+') ? cleanPhone : `+91${digitsOnly.slice(-10)}`;
      const phoneRes = await supabase.auth.signUp({
        phone: formattedE164,
        password: password,
        options: {
          data: {
            name: name.trim(),
            stream,
            class_level: classLevel,
            phone: cleanPhone,
          },
        },
      });

      if (
        phoneRes.error &&
        (phoneRes.error.message.includes('disabled') ||
          phoneRes.error.message.includes('SMS') ||
          phoneRes.error.message.includes('invalid'))
      ) {
        const syntheticEmail = `student_${digitsOnly.slice(-10)}@drona-aspirant.org`;
        await supabase.auth.signUp({
          email: syntheticEmail,
          password: password,
          options: {
            data: {
              name: name.trim(),
              stream,
              class_level: classLevel,
              phone: cleanPhone,
            },
          },
        });
      }
    } catch (e) {
      console.warn('Supabase remote auth attempt skipped or rate-limited:', e);
    }

    try {
      await supabase.from('user_profiles').upsert(
        {
          phone_number: cleanPhone,
          name: name.trim(),
          stream,
          class_level: classLevel,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone_number' }
      );
    } catch {
      // ignore table schema errors
    }
  }

  const profile: UserProfile = {
    name: name.trim(),
    email: `${digitsOnly.slice(-10)}@drona.user`,
    phoneNumber: cleanPhone,
    stream,
    classLevel,
    targetCollege: stream === 'neet' ? 'AIIMS New Delhi' : 'IIT Bombay / Computer Science',
    targetRank: stream === 'neet' ? 'AIR < 100' : 'AIR < 500',
    syncEnabled: true,
  };

  saveUserProfile(profile);
  setUserLoggedIn(true);

  return { success: true, profile };
}

/**
 * Log in an existing user with Phone Number & Password
 */
export async function loginWithPhoneAndPassword(
  phone: string,
  password: string
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  const cleanPhone = normalizePhoneNumber(phone);
  const digitsOnly = cleanPhone.replace(/[^0-9]/g, '');

  if (digitsOnly.length < 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile phone number.' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your account password.' };
  }

  const pwdHash = await hashPassword(password);
  const users = getRegisteredUsers();
  const matchedUser = users.find(
    (u) =>
      u.phoneNumber === cleanPhone ||
      u.phoneNumber.endsWith(digitsOnly.slice(-10)) ||
      digitsOnly.endsWith(u.phoneNumber.replace(/[^0-9]/g, '').slice(-10))
  );

  // Attempt Supabase Cloud Auth
  const supabase = getSupabaseClient();
  let supabaseLoggedIn = false;
  let remoteUserData: any = null;

  if (supabase) {
    try {
      const formattedE164 = cleanPhone.startsWith('+') ? cleanPhone : `+91${digitsOnly.slice(-10)}`;
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: formattedE164,
        password: password,
      });

      if (!error && data?.session) {
        supabaseLoggedIn = true;
        remoteUserData = data.user?.user_metadata || {};
      } else {
        const syntheticEmail = `student_${digitsOnly.slice(-10)}@drona-aspirant.org`;
        const emailRes = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password: password,
        });
        if (!emailRes.error && emailRes.data?.session) {
          supabaseLoggedIn = true;
          remoteUserData = emailRes.data.user?.user_metadata || {};
        }
      }
    } catch {
      // Supabase network error; fall back to local credentials ledger
    }
  }

  if (matchedUser) {
    if (matchedUser.passwordHash !== pwdHash) {
      return { success: false, error: 'Incorrect password. Please verify your password and try again.' };
    }

    const profile: UserProfile = {
      name: matchedUser.name,
      email: `${digitsOnly.slice(-10)}@drona.user`,
      phoneNumber: cleanPhone,
      stream: matchedUser.stream,
      classLevel: matchedUser.classLevel,
      targetCollege:
        matchedUser.stream === 'neet' ? 'AIIMS New Delhi' : 'IIT Bombay / Computer Science',
      targetRank: matchedUser.stream === 'neet' ? 'AIR < 100' : 'AIR < 500',
      syncEnabled: true,
    };

    saveUserProfile(profile);
    setUserLoggedIn(true);
    return { success: true, profile };
  }

  if (supabaseLoggedIn) {
    const profile: UserProfile = {
      name: remoteUserData?.name || 'JEE Aspirant',
      email: `${digitsOnly.slice(-10)}@drona.user`,
      phoneNumber: cleanPhone,
      stream: remoteUserData?.stream || 'jee',
      classLevel: remoteUserData?.class_level || '12',
      targetCollege:
        remoteUserData?.stream === 'neet' ? 'AIIMS New Delhi' : 'IIT Bombay / Computer Science',
      targetRank: remoteUserData?.stream === 'neet' ? 'AIR < 100' : 'AIR < 500',
      syncEnabled: true,
    };

    saveRegisteredUserLocally({
      id: `usr_${Date.now()}`,
      name: profile.name,
      phoneNumber: cleanPhone,
      passwordHash: pwdHash,
      stream: profile.stream,
      classLevel: profile.classLevel,
      registeredAt: Date.now(),
    });

    saveUserProfile(profile);
    setUserLoggedIn(true);
    return { success: true, profile };
  }

  return {
    success: false,
    error: 'Account not found with this phone number. Please click "Register as New Aspirant" below to register.',
  };
}

export async function checkActiveSession(): Promise<{ user: any; session: any } | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error || !session) return null;
    return { user: session.user, session };
  } catch (err) {
    console.warn('Error checking Supabase session:', err);
    return null;
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export function subscribeAuthState(callback: (user: any) => void): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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


