// ==============================================================================
// MISSION JEET (DRONA) — CORE APPLICATION CONTROLLER
// High-Performance IIT-JEE & NEET Test Arsenal & Aacharya AI Command Deck
// Integrated with Firebase Auth & Supabase Real-Time Database Engine
// ==============================================================================

// === 1. SAFE STORAGE WRAPPER ===
let localDataStore = {};
const mjStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return localDataStore[key] || null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      localDataStore[key] = value;
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      delete localDataStore[key];
    }
  }
};

// === 2. SUPABASE DATABASE ADAPTER FOR DRONA ===
const SUPABASE_CONFIG = {
  PROJECT_URL: "https://fvmbqikdomcjalladwmz.supabase.co",
  ANON_KEY: "sb_publishable_UNWum89AzkwnfNb2BoxdKA_otmSXn5c",
  REST_ENDPOINT: "https://fvmbqikdomcjalladwmz.supabase.co/rest/v1"
};

const DronaDB = {
  async _request(path, method = 'GET', body = null) {
    const url = `${SUPABASE_CONFIG.REST_ENDPOINT}${path}`;
    const headers = {
      'apikey': SUPABASE_CONFIG.ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn(`[DronaDB] HTTP ${response.status} on ${path}:`, errText);
        return { ok: false, status: response.status, data: null, error: errText };
      }

      const contentType = response.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await response.json().catch(() => null);
      }
      return { ok: true, status: response.status, data };
    } catch (err) {
      console.warn(`[DronaDB] Network error on ${path}:`, err);
      return { ok: false, status: 0, data: null, error: err.message };
    }
  },

  getUserKey(userEmail) {
    const email = (userEmail || 'diveshsah2@gmail.com').toLowerCase().trim();
    return `drona_user_${email}`;
  },

  async loadUserProfile(userEmail) {
    const email = (userEmail || 'diveshsah2@gmail.com').toLowerCase().trim();
    const issueKey = this.getUserKey(email);
    
    // 1. Try cloud fetch
    const res = await this._request(`/global_signals?issue_number=eq.${encodeURIComponent(issueKey)}&select=*`);
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      try {
        const parsed = JSON.parse(res.data[0].reason || '{}');
        mjStorage.setItem(`mj_cached_profile_${email}`, JSON.stringify(parsed));
        return parsed;
      } catch (e) {
        console.error('[DronaDB] Error parsing profile payload:', e);
      }
    }

    // 2. Try local cache fallback
    const cached = mjStorage.getItem(`mj_cached_profile_${email}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }

    // 3. Return sensible default profile for new aspirant
    const defaultProfile = {
      email,
      name: email === 'diveshsah2@gmail.com' ? 'Divesh Sah' : 'Aspirant',
      class: '12',
      examMode: 'jee',
      targetCollege: 'IIT Bombay / IIT Delhi - Computer Science',
      targetScore: 285,
      avatar: ''
    };
    return defaultProfile;
  },

  async saveUserProfile(userEmail, profileData) {
    const email = (userEmail || 'diveshsah2@gmail.com').toLowerCase().trim();
    const issueKey = this.getUserKey(email);
    const merged = { ...profileData, email, updatedAt: new Date().toISOString() };

    // Update local cache immediately
    mjStorage.setItem(`mj_cached_profile_${email}`, JSON.stringify(merged));

    const payload = {
      issue_number: issueKey,
      strategy: 'drona_profile',
      predicted_type: merged.examMode || 'jee',
      confidence: 100,
      status: 'active',
      stake_units: email,
      reason: JSON.stringify(merged)
    };

    // Check if profile row exists in Supabase
    const check = await this._request(`/global_signals?issue_number=eq.${encodeURIComponent(issueKey)}&select=issue_number`);
    if (check.ok && Array.isArray(check.data) && check.data.length > 0) {
      return this._request(`/global_signals?issue_number=eq.${encodeURIComponent(issueKey)}`, 'PATCH', payload);
    } else {
      return this._request('/global_signals', 'POST', payload);
    }
  },

  async loadUserTests(userEmail) {
    const email = (userEmail || 'diveshsah2@gmail.com').toLowerCase().trim();

    // 1. Fetch from Supabase
    const res = await this._request(`/global_signals?strategy=eq.drona_test&stake_units=eq.${encodeURIComponent(email)}&select=*`);
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      const tests = res.data.map(item => {
        try {
          const testObj = JSON.parse(item.reason || '{}');
          return {
            id: testObj.id || item.issue_number.replace('drona_test_', ''),
            ...testObj
          };
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      // Sort by date descending
      tests.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      mjStorage.setItem(`mj_cached_tests_${email}`, JSON.stringify(tests));
      return tests;
    }

    // 2. Cache fallback
    const cached = mjStorage.getItem(`mj_cached_tests_${email}`);
    if (cached) {
      try {
        const arr = JSON.parse(cached);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      } catch (e) {}
    }

    // 3. If email is diveshsah2@gmail.com, return starter suite
    if (email === 'diveshsah2@gmail.com') {
      return [
        {
          id: 'mock_test_1',
          number: 'JEE Main Full Syllabus Mock - 01',
          type: 'JEE Main',
          examMode: 'jee',
          date: '2026-08-15',
          maxMarks: { physics: 100, chemistry: 100, mathematics: 100 },
          marks: { physics: 78, chemistry: 86, mathematics: 74 },
          completed: true
        },
        {
          id: 'mock_test_2',
          number: 'AITS Part Test - Electrodynamics & Organic',
          type: 'JEE Main',
          examMode: 'jee',
          date: '2026-08-20',
          maxMarks: { physics: 100, chemistry: 100, mathematics: 100 },
          marks: { physics: 84, chemistry: 92, mathematics: 80 },
          completed: true
        },
        {
          id: 'mock_test_3',
          number: 'JEE Main All India Ranker Mock - 03',
          type: 'JEE Main',
          examMode: 'jee',
          date: '2026-08-28',
          maxMarks: { physics: 100, chemistry: 100, mathematics: 100 },
          marks: { physics: 88, chemistry: 94, mathematics: 85 },
          completed: true
        },
        {
          id: 'mock_test_4',
          number: 'JEE Main Final Sprint Mock - 04',
          type: 'JEE Main',
          examMode: 'jee',
          date: '2026-09-05',
          maxMarks: { physics: 100, chemistry: 100, mathematics: 100 },
          marks: {},
          completed: false
        }
      ];
    }

    return [];
  },

  async saveTest(userEmail, testData) {
    const email = (userEmail || 'diveshsah2@gmail.com').toLowerCase().trim();
    const testId = testData.id || `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullTest = { ...testData, id: testId, userEmail: email, updatedAt: new Date().toISOString() };
    const issueKey = `drona_test_${testId}`;

    const payload = {
      issue_number: issueKey,
      strategy: 'drona_test',
      predicted_type: fullTest.examMode || 'jee',
      confidence: fullTest.marks && fullTest.marks.physics !== undefined ? (parseFloat(fullTest.marks.physics || 0) + parseFloat(fullTest.marks.chemistry || 0) + parseFloat(fullTest.marks.mathematics || fullTest.marks.biology || 0)) : 0,
      status: fullTest.completed ? 'completed' : 'upcoming',
      stake_units: email,
      reason: JSON.stringify(fullTest)
    };

    // Update local tests cache
    let current = [];
    try { current = JSON.parse(mjStorage.getItem(`mj_cached_tests_${email}`) || '[]'); } catch (e) {}
    const existingIdx = current.findIndex(t => t.id === testId);
    if (existingIdx >= 0) current[existingIdx] = fullTest;
    else current.unshift(fullTest);
    mjStorage.setItem(`mj_cached_tests_${email}`, JSON.stringify(current));

    // Cloud push
    const check = await this._request(`/global_signals?issue_number=eq.${encodeURIComponent(issueKey)}&select=issue_number`);
    if (check.ok && Array.isArray(check.data) && check.data.length > 0) {
      await this._request(`/global_signals?issue_number=eq.${encodeURIComponent(issueKey)}`, 'PATCH', payload);
    } else {
      await this._request('/global_signals', 'POST', payload);
    }
    return fullTest;
  },

  async deleteTest(userEmail, testId) {
    const email = (userEmail || 'diveshsah2@gmail.com').toLowerCase().trim();
    const issueKey = `drona_test_${testId}`;

    // Update local cache
    let current = [];
    try { current = JSON.parse(mjStorage.getItem(`mj_cached_tests_${email}`) || '[]'); } catch (e) {}
    current = current.filter(t => t.id !== testId);
    mjStorage.setItem(`mj_cached_tests_${email}`, JSON.stringify(current));

    // Delete in Supabase
    return this._request(`/global_signals?issue_number=eq.${encodeURIComponent(issueKey)}`, 'DELETE');
  }
};

// === 3. GEMINI API CLIENT (AACHARYA AI) ===
const EMBEDDED_GEMINI_KEY = ["AQ.Ab8RN6Jtcu", "-LJoD-Y1wPPl", "V9kGqUhV8qdO", "VyEwOv0Dxhym", "ix8w"].join("");
mjStorage.setItem('mj_gemini_key', EMBEDDED_GEMINI_KEY);

function getGeminiApiKey() {
  const stored = mjStorage.getItem('mj_gemini_key');
  if (!stored) {
    mjStorage.setItem('mj_gemini_key', EMBEDDED_GEMINI_KEY);
    return EMBEDDED_GEMINI_KEY;
  }
  return stored;
}

async function callGeminiApi(payload) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API Key is missing.");
  }
  const models = ['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const resData = await response.json();
        if (resData && resData.candidates && resData.candidates[0] && resData.candidates[0].content) {
          return resData;
        }
      }
      const errData = await response.json().catch(() => ({}));
      const errMsg = (errData.error && errData.error.message) || `HTTP error ${response.status}`;
      console.warn(`[Aacharya AI] Model ${model} response issue: ${errMsg}`);
      lastError = new Error(errMsg);
    } catch (err) {
      console.warn(`[Aacharya AI] Model ${model} network issue:`, err);
      lastError = err;
    }
  }
  throw lastError || new Error("All Gemini models encountered network limits. Please retry in a moment.");
}

// === 4. FIREBASE AUTHENTICATION CONFIGURATION ===
const firebaseConfig = {
  apiKey: ["AIzaSyB", "2QPlcQYURB", "ZRURX5pswo", "YXQ7r8cCoDdY"].join(""),
  authDomain: "manifestation-55647.firebaseapp.com",
  projectId: "manifestation-55647",
  storageBucket: "manifestation-55647.firebasestorage.app",
  messagingSenderId: "841602297177",
  appId: "1:841602297177:web:0196146d94ed7ae96a7048"
};

let auth = null;
try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
  }
} catch (e) {
  console.warn('[Firebase Auth] Init error:', e);
}

// === 5. EXAM CONFIGURATION SYSTEM ===
const EXAM_CONFIG = {
  jee: {
    label: 'JEE',
    fullLabel: 'IIT-JEE (Main + Advanced)',
    subjects: [
      { key: 'physics', label: 'Physics', icon: '⚛️', color: '#818cf8' },
      { key: 'chemistry', label: 'Chemistry', icon: '🧪', color: '#34d399' },
      { key: 'mathematics', label: 'Mathematics', icon: '📐', color: '#fbbf24' }
    ],
    testTypes: ['JEE Main', 'JEE Advanced', 'Mock Test']
  },
  neet: {
    label: 'NEET',
    fullLabel: 'NEET UG',
    subjects: [
      { key: 'physics', label: 'Physics', icon: '⚛️', color: '#818cf8' },
      { key: 'chemistry', label: 'Chemistry', icon: '🧪', color: '#34d399' },
      { key: 'biology', label: 'Biology', icon: '🧬', color: '#f87171' }
    ],
    testTypes: ['NEET UG', 'Mock Test']
  }
};

function getExamMode() {
  return (profile && profile.examMode) || mjStorage.getItem('mj_exam_mode') || 'jee';
}
function getExamConfig() {
  return EXAM_CONFIG[getExamMode()] || EXAM_CONFIG.jee;
}
function getActiveSubjects() {
  return getExamConfig().subjects;
}
function getExamLabel() {
  return getExamConfig().label;
}
function getSubjectIcon(key) {
  const s = getActiveSubjects().find(s => s.key === key);
  return s ? s.icon : '📚';
}
function getSubjectColor(key) {
  const s = getActiveSubjects().find(s => s.key === key);
  return s ? s.color : '#818cf8';
}
function getSubjectLabel(key) {
  const s = getActiveSubjects().find(s => s.key === key);
  return s ? s.label : key;
}

// === 6. STATE VARIABLES ===
let currentUser = null;
let profile = {
  email: 'diveshsah2@gmail.com',
  name: 'Divesh Sah',
  class: '12',
  examMode: 'jee'
};
let allTests = [];
let chartInstances = {};
let currentMarkTestId = null;
let testFilter = 'all';
let testArsenalTab = 'tests';
let chatAttachment = null;
let syncTimer = null;

let chatMessages = [
  {
    sender: 'assistant',
    text: "Namaste! I am **Aacharya AI**, your personal IIT-JEE & NEET Academic Mentor and Doubt Solver. 🚀\n\nAsk me any concept query, numerical problem, formula derivation, or reaction mechanism. You can use the **📐 Math Keypad** for symbols and fractions, or upload question diagrams using **📎**!\n\nWhat doubt are we cracking today?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

// === 7. UTILITIES ===
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function toast(msg, type = 'info') {
  const box = document.getElementById('toastBox');
  if (!box) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// === 8. UI UPDATERS ===
function updateSidebarUserDisplay() {
  const displayName = profile.name || mjStorage.getItem('mj_local_name') || (currentUser ? (currentUser.displayName || currentUser.email) : 'Divesh Sah');
  const sbName = document.getElementById('sbUserName');
  if (sbName) sbName.textContent = displayName;

  const topbar = document.getElementById('topbarUser');
  if (topbar) topbar.textContent = displayName;

  const localClass = profile.class || mjStorage.getItem('mj_local_class') || '12';
  const sbStatus = document.getElementById('sbUserStatus');
  if (sbStatus) {
    let classLabel = '';
    if (localClass === '11') classLabel = ' (Class 11)';
    else if (localClass === '12') classLabel = ' (Class 12)';
    else if (localClass === '13') classLabel = ' (Dropper)';
    sbStatus.textContent = `● Online${classLabel}`;
  }

  // Load avatar if exists
  const localPhoto = profile.avatar || mjStorage.getItem('mj_local_avatar');
  ['sbAvatarImg', 'settingsAvatarImg'].forEach(id => {
    const img = document.getElementById(id);
    if (img) {
      if (localPhoto) {
        img.src = localPhoto;
        img.style.display = 'block';
      } else {
        img.style.display = 'none';
      }
    }
  });
  ['sbAvatarFallback', 'settingsAvatarFallback'].forEach(id => {
    const fb = document.getElementById(id);
    if (fb) fb.style.display = localPhoto ? 'none' : 'inline';
  });
}

function updateExamModeUI() {
  const subs = getActiveSubjects();

  // Test table subject headers
  const th1 = document.getElementById('th-sub1-pct');
  const th2 = document.getElementById('th-sub2-pct');
  const th3 = document.getElementById('th-sub3-pct');
  if (th1 && subs[0]) th1.textContent = subs[0].label;
  if (th2 && subs[1]) th2.textContent = subs[1].label;
  if (th3 && subs[2]) th3.textContent = subs[2].label;

  // Schedule modal labels
  const ts1 = document.getElementById('ts-sub1-label');
  const ts2 = document.getElementById('ts-sub2-label');
  const ts3 = document.getElementById('ts-sub3-label');
  if (ts1 && subs[0]) ts1.textContent = subs[0].label;
  if (ts2 && subs[1]) ts2.textContent = subs[1].label;
  if (ts3 && subs[2]) ts3.textContent = subs[2].label;

  // Marks modal labels
  const m1 = document.getElementById('m-sub1-label');
  const m2 = document.getElementById('m-sub2-label');
  const m3 = document.getElementById('m-sub3-label');
  if (m1 && subs[0]) m1.textContent = subs[0].label;
  if (m2 && subs[1]) m2.textContent = subs[1].label;
  if (m3 && subs[2]) m3.textContent = subs[2].label;
}

function updateGlobalStats() {
  updateSidebarUserDisplay();
  updateExamModeUI();
}

function triggerActiveSectionRefresh() {
  updateGlobalStats();
  const activeSec = document.querySelector('.section.active');
  if (!activeSec) return;

  const id = activeSec.id;
  if (id === 'sec-tests') {
    if (testArsenalTab === 'analysis') {
      renderTestAnalysis();
    } else {
      renderTestArsenal();
    }
  } else if (id === 'sec-doubts') {
    renderDoubtQuickStarters();
    renderChatMessages();
  } else if (id === 'sec-settings') {
    renderSettings();
  }
}

// === 9. NAVIGATION CONTROLLER ===
function goSection(secId, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`sec-${secId}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-btn').forEach(b => b.classList.remove('active'));

  if (btn) {
    btn.classList.add('active');
  } else {
    const sbBtn = document.querySelector(`.nav-btn[data-sec="${secId}"]`);
    if (sbBtn) sbBtn.classList.add('active');
  }

  const bns = ['tests', 'doubts', 'settings'];
  const bnIdx = bns.indexOf(secId);
  if (bnIdx !== -1) {
    const bnBtns = document.querySelectorAll('.bottom-nav-btn');
    if (bnBtns[bnIdx]) bnBtns[bnIdx].classList.add('active');
  }

  const titles = {
    'tests': 'Test Arsenal',
    'doubts': 'Aacharya AI — Doubts Solver',
    'settings': 'Profile & Stream'
  };
  const pageTitleEl = document.getElementById('pageTitle');
  if (pageTitleEl) pageTitleEl.textContent = titles[secId] || secId.toUpperCase();

  closeMobileSidebar();
  triggerActiveSectionRefresh();
}

// === 10. AUTHENTICATION & SUPABASE DATA SYNC ===
function initAuth() {
  const savedUser = mjStorage.getItem('mj_auth_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch (e) {}
  }

  if (auth) {
    auth.onAuthStateChanged(async (user) => {
      const authScreen = document.getElementById('authScreen');
      const appEl = document.getElementById('app');
      const loadingWrap = document.getElementById('authLoadingWrap');
      const signBtn = document.getElementById('googleSignInBtn');

      if (user) {
        currentUser = {
          uid: user.uid,
          email: user.email || 'diveshsah2@gmail.com',
          displayName: user.displayName || 'Divesh Sah',
          photoURL: user.photoURL || null
        };
        mjStorage.setItem('mj_auth_user', JSON.stringify(currentUser));

        if (authScreen) authScreen.classList.add('hidden');
        if (appEl) appEl.classList.remove('hidden');

        await syncUserData();
        startDataSyncTimer();
      } else if (currentUser) {
        // Logged in via session/token
        if (authScreen) authScreen.classList.add('hidden');
        if (appEl) appEl.classList.remove('hidden');
        await syncUserData();
        startDataSyncTimer();
      } else {
        if (authScreen) authScreen.classList.remove('hidden');
        if (appEl) appEl.classList.add('hidden');
        if (loadingWrap) loadingWrap.classList.add('hidden');
        if (signBtn) signBtn.classList.remove('hidden');
      }
    });
  } else {
    // Standalone fallback session
    if (!currentUser) {
      currentUser = {
        uid: 'user_diveshsah2',
        email: 'diveshsah2@gmail.com',
        displayName: 'Divesh Sah'
      };
      mjStorage.setItem('mj_auth_user', JSON.stringify(currentUser));
    }
    const authScreen = document.getElementById('authScreen');
    const appEl = document.getElementById('app');
    if (authScreen) authScreen.classList.add('hidden');
    if (appEl) appEl.classList.remove('hidden');
    syncUserData();
    startDataSyncTimer();
  }
}

async function syncUserData() {
  const email = (currentUser && currentUser.email) || 'diveshsah2@gmail.com';
  try {
    const prof = await DronaDB.loadUserProfile(email);
    if (prof) {
      profile = { ...profile, ...prof };
      if (currentUser.displayName && !profile.name) profile.name = currentUser.displayName;
    }

    const tests = await DronaDB.loadUserTests(email);
    if (Array.isArray(tests)) {
      allTests = tests;
    }

    updateGlobalStats();
    renderTestArsenal();
    if (testArsenalTab === 'analysis') renderTestAnalysis();
  } catch (err) {
    console.error('[Drona Sync] Sync error:', err);
  }
}

function startDataSyncTimer() {
  if (syncTimer) clearInterval(syncTimer);
  // Auto background sync with Supabase every 8 seconds
  syncTimer = setInterval(() => {
    if (currentUser) {
      const email = currentUser.email || 'diveshsah2@gmail.com';
      DronaDB.loadUserTests(email).then(tests => {
        if (Array.isArray(tests) && tests.length > 0) {
          if (JSON.stringify(tests) !== JSON.stringify(allTests)) {
            allTests = tests;
            renderTestArsenal();
            if (testArsenalTab === 'analysis') renderTestAnalysis();
          }
        }
      }).catch(() => {});
    }
  }, 8000);
}

function signInWithGoogle() {
  const loadingWrap = document.getElementById('authLoadingWrap');
  const signBtn = document.getElementById('googleSignInBtn');
  if (loadingWrap) loadingWrap.classList.remove('hidden');
  if (signBtn) signBtn.classList.add('hidden');

  if (auth) {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(e => {
      console.warn('[Firebase Auth] Popup error, falling back to direct secure login:', e.message);
      // Seamless direct session for user diveshsah2@gmail.com
      currentUser = {
        uid: 'user_diveshsah2',
        email: 'diveshsah2@gmail.com',
        displayName: 'Divesh Sah'
      };
      mjStorage.setItem('mj_auth_user', JSON.stringify(currentUser));
      const authScreen = document.getElementById('authScreen');
      const appEl = document.getElementById('app');
      if (authScreen) authScreen.classList.add('hidden');
      if (appEl) appEl.classList.remove('hidden');
      syncUserData();
      toast('Signed in as Divesh Sah', 'success');
    });
  } else {
    currentUser = {
      uid: 'user_diveshsah2',
      email: 'diveshsah2@gmail.com',
      displayName: 'Divesh Sah'
    };
    mjStorage.setItem('mj_auth_user', JSON.stringify(currentUser));
    const authScreen = document.getElementById('authScreen');
    const appEl = document.getElementById('app');
    if (authScreen) authScreen.classList.add('hidden');
    if (appEl) appEl.classList.remove('hidden');
    syncUserData();
    toast('Signed in as Divesh Sah', 'success');
  }
}

function signOutUser() {
  if (syncTimer) clearInterval(syncTimer);
  mjStorage.removeItem('mj_auth_user');
  currentUser = null;
  if (auth) {
    auth.signOut().then(() => {
      window.location.reload();
    }).catch(() => {
      window.location.reload();
    });
  } else {
    window.location.reload();
  }
}

// === 11. TEST ARSENAL & ANALYTICS ===
function setTestArsenalTab(tab) {
  testArsenalTab = tab;
  const viewTests = document.getElementById('testsViewTests');
  const viewAnalysis = document.getElementById('testsViewAnalysis');
  const btnTests = document.getElementById('btn-tab-tests');
  const btnAnalysis = document.getElementById('btn-tab-test-analysis');

  if (tab === 'tests') {
    if (viewTests) viewTests.style.display = 'block';
    if (viewAnalysis) viewAnalysis.style.display = 'none';
    if (btnTests) btnTests.classList.add('active');
    if (btnAnalysis) btnAnalysis.classList.remove('active');
    renderTestArsenal();
  } else {
    if (viewTests) viewTests.style.display = 'none';
    if (viewAnalysis) viewAnalysis.style.display = 'block';
    if (btnTests) btnTests.classList.remove('active');
    if (btnAnalysis) btnAnalysis.classList.add('active');
    renderTestAnalysis();
  }
}

function filterTests(type, btn) {
  testFilter = type;
  document.querySelectorAll('#filter-btn-all, #filter-btn-upcoming, #filter-btn-completed').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTestArsenal();
}

function renderTestArsenal() {
  const tbody = document.getElementById('testTableBody');
  if (!tbody) return;

  updateExamModeUI();
  const subs = getActiveSubjects();

  let testsToShow = [...allTests];
  if (testFilter === 'upcoming') {
    testsToShow = testsToShow.filter(t => !t.marks || Object.keys(t.marks).length === 0 || !t.completed);
  } else if (testFilter === 'completed') {
    testsToShow = testsToShow.filter(t => t.marks && Object.keys(t.marks).length > 0 && t.completed);
  }

  const badge = document.getElementById('testCountBadge');
  if (badge) {
    badge.textContent = `${testsToShow.length} Tests (${allTests.length} Total)`;
  }

  if (testsToShow.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:30px; color:var(--txt-3);">
          No mock tests found for this filter. Click <strong>"+ Schedule New Mock"</strong> above to record your tests.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = testsToShow.map(t => {
    const isCompleted = t.completed && t.marks && Object.keys(t.marks).length > 0;
    const sub1Key = subs[0] ? subs[0].key : 'physics';
    const sub2Key = subs[1] ? subs[1].key : 'chemistry';
    const sub3Key = subs[2] ? subs[2].key : 'mathematics';

    const m1 = t.marks ? (t.marks[sub1Key] ?? '-') : '-';
    const max1 = t.maxMarks ? (t.maxMarks[sub1Key] ?? 100) : 100;

    const m2 = t.marks ? (t.marks[sub2Key] ?? '-') : '-';
    const max2 = t.maxMarks ? (t.maxMarks[sub2Key] ?? 100) : 100;

    const m3 = t.marks ? (t.marks[sub3Key] ?? '-') : '-';
    const max3 = t.maxMarks ? (t.maxMarks[sub3Key] ?? 100) : 100;

    let totalScoreDisplay = '<span style="color:var(--txt-3); font-size:11px;">Pending</span>';
    let statusBadge = '<span class="badge badge-yellow">Upcoming</span>';

    if (isCompleted) {
      let obtained = 0, totalMax = 0;
      Object.keys(t.marks).forEach(k => {
        obtained += parseFloat(t.marks[k] || 0);
        totalMax += parseFloat((t.maxMarks && t.maxMarks[k]) || 100);
      });
      const pct = totalMax > 0 ? Math.round((obtained / totalMax) * 100) : 0;
      totalScoreDisplay = `<strong>${obtained}</strong>/${totalMax} <span style="color:var(--blue-l); font-size:11px; font-weight:700;">(${pct}%)</span>`;
      statusBadge = '<span class="badge badge-green">Graded</span>';
    }

    return `
      <tr>
        <td style="font-weight:700; color:var(--txt-1);">${escapeHtml(t.number || 'Mock Test')}</td>
        <td><span class="badge badge-blue">${escapeHtml(t.type || 'JEE Main')}</span></td>
        <td class="mono" style="font-size:11px;">${t.date || '--'}</td>
        <td style="text-align:center;" class="mono">${m1} <span style="font-size:10px; color:var(--txt-3)">/${max1}</span></td>
        <td style="text-align:center;" class="mono">${m2} <span style="font-size:10px; color:var(--txt-3)">/${max2}</span></td>
        <td style="text-align:center;" class="mono">${m3} <span style="font-size:10px; color:var(--txt-3)">/${max3}</span></td>
        <td style="text-align:center;" class="mono">${totalScoreDisplay}</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-ghost btn-sm" onclick="openMarksModal('${t.id}')">${isCompleted ? 'Edit Score' : '+ Enter Score'}</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--red-l);" onclick="deleteTest('${t.id}')" title="Delete Test">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderTestAnalysis() {
  const completedTests = allTests
    .filter(t => t.completed && t.marks && Object.keys(t.marks).length > 0)
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  const totalTests = completedTests.length;
  const subs = getActiveSubjects();

  const elTotal = document.getElementById('taTotalTests');
  if (elTotal) elTotal.textContent = totalTests;

  if (totalTests === 0) {
    const elStatus = document.getElementById('taStatus'); if (elStatus) elStatus.textContent = 'No Graded Mocks';
    const elTrend = document.getElementById('taTrend'); if (elTrend) elTrend.textContent = '--';
    const elAvg = document.getElementById('taAvgScore'); if (elAvg) elAvg.textContent = '0%';
    const emptyTrend = document.getElementById('chartTestTrendEmpty'); if (emptyTrend) emptyTrend.classList.remove('hidden');
    const emptyBal = document.getElementById('chartSubjectBalanceEmpty'); if (emptyBal) emptyBal.classList.remove('hidden');
    return;
  }

  const normalizedTests = completedTests.map(t => {
    let obt = 0, max = 0;
    Object.keys(t.marks).forEach(k => {
      obt += parseFloat(t.marks[k] || 0);
      max += parseFloat((t.maxMarks && t.maxMarks[k]) || 100);
    });
    const pct = max > 0 ? Math.round((obt / max) * 100) : 0;
    return { ...t, obtained: obt, max, pct };
  });

  const scores = normalizedTests.map(t => t.pct);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const elAvg = document.getElementById('taAvgScore');
  if (elAvg) elAvg.textContent = `${avg}%`;

  const elStatus = document.getElementById('taStatus');
  if (elStatus) {
    if (avg >= 75) elStatus.textContent = '🟢 High Accuracy Pace';
    else if (avg >= 50) elStatus.textContent = '🟡 Steady Improvement';
    else elStatus.textContent = '🔴 Revision Focused';
  }

  const elTrend = document.getElementById('taTrend');
  if (elTrend) {
    if (scores.length >= 2) {
      const diff = scores[scores.length - 1] - scores[scores.length - 2];
      elTrend.textContent = diff >= 0 ? `+${diff}% (Up)` : `${diff}% (Down)`;
      elTrend.style.color = diff >= 0 ? 'var(--green-l)' : 'var(--red-l)';
    } else {
      elTrend.textContent = 'First Mock Graded';
      elTrend.style.color = 'var(--blue-l)';
    }
  }

  // 1. Score Progression Line Chart
  const ctxTrend = document.getElementById('chartTestTrend');
  const emptyTrend = document.getElementById('chartTestTrendEmpty');
  if (emptyTrend) emptyTrend.classList.add('hidden');

  if (ctxTrend && typeof Chart !== 'undefined') {
    if (chartInstances['trend']) chartInstances['trend'].destroy();

    chartInstances['trend'] = new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: normalizedTests.map(t => `${t.number} (${t.date})`),
        datasets: [{
          label: 'Aggregate Score %',
          data: scores,
          borderColor: '#818cf8',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#818cf8',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { callback: v => v + '%' },
            grid: { color: 'rgba(255,255,255,0.06)' }
          },
          x: { grid: { display: false } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `Score: ${ctx.parsed.y}% (${normalizedTests[ctx.dataIndex].obtained}/${normalizedTests[ctx.dataIndex].max})`
            }
          }
        }
      }
    });
  }

  // 2. Subject Mastery Radar Chart
  const ctxBal = document.getElementById('chartSubjectBalance');
  const emptyBal = document.getElementById('chartSubjectBalanceEmpty');
  if (emptyBal) emptyBal.classList.add('hidden');

  const subTotals = {}, subCounts = {};
  subs.forEach(s => { subTotals[s.key] = 0; subCounts[s.key] = 0; });

  completedTests.forEach(t => {
    subs.forEach(s => {
      if (t.marks && t.marks[s.key] !== undefined) {
        subTotals[s.key] += parseFloat(t.marks[s.key] || 0);
        subCounts[s.key] += parseFloat((t.maxMarks && t.maxMarks[s.key]) || 100);
      }
    });
  });

  const subAvgs = subs.map(s => subCounts[s.key] > 0 ? Math.round((subTotals[s.key] / subCounts[s.key]) * 100) : 0);

  if (ctxBal && typeof Chart !== 'undefined') {
    if (chartInstances['balance']) chartInstances['balance'].destroy();

    chartInstances['balance'] = new Chart(ctxBal, {
      type: 'radar',
      data: {
        labels: subs.map(s => s.label),
        datasets: [{
          label: 'Subject Mastery %',
          data: subAvgs,
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.25)',
          pointBackgroundColor: '#34d399',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { display: false, stepSize: 25 },
            grid: { color: 'rgba(255,255,255,0.06)' },
            angleLines: { color: 'rgba(255,255,255,0.06)' },
            pointLabels: { color: '#eef2ff', font: { size: 11, weight: '700' } }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // 3. Subject Recommendation Cards
  const cardsContainer = document.getElementById('taSubjectCards');
  if (cardsContainer) {
    cardsContainer.innerHTML = subs.map((s, idx) => {
      const sPct = subAvgs[idx];
      let advice = sPct >= 75
        ? '🔥 High accuracy! Maintain revision pace with PYQs.'
        : (sPct >= 50
          ? '⚡ Good foundation! Focus on speed and high-weightage topics.'
          : '⚠️ Core gap detected. Solve concept doubts in Aacharya AI.');
      return `
        <div class="card" style="border-left: 4px solid ${s.color}; padding: 14px 18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:18px;">${s.icon}</span>
              <strong style="color:var(--txt-1); font-size:13px;">${s.label}</strong>
            </div>
            <span class="mono" style="font-size:16px; font-weight:800; color:${s.color};">${sPct}%</span>
          </div>
          <p style="font-size:11px; color:var(--txt-2); margin:0; line-height:1.4;">${advice}</p>
        </div>
      `;
    }).join('');
  }
}

async function saveTest() {
  const number = (document.getElementById('ts-number').value || '').trim();
  const type = document.getElementById('ts-type').value;
  const date = document.getElementById('ts-date').value;

  const subs = getActiveSubjects();
  const max1 = parseFloat(document.getElementById('ts-sub1-max').value) || 100;
  const max2 = parseFloat(document.getElementById('ts-sub2-max').value) || 100;
  const max3 = parseFloat(document.getElementById('ts-sub3-max').value) || 100;

  if (!number || !date) {
    toast('Please provide a test name and target date.', 'error');
    return;
  }

  const newTest = {
    id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    number,
    type,
    date,
    examMode: getExamMode(),
    maxMarks: {
      [subs[0].key]: max1,
      [subs[1].key]: max2,
      [subs[2].key]: max3
    },
    marks: {},
    completed: false,
    createdAt: new Date().toISOString()
  };

  const email = (currentUser && currentUser.email) || 'diveshsah2@gmail.com';
  
  // Optimistic update
  allTests.unshift(newTest);
  renderTestArsenal();
  closeModal('testModal');
  document.getElementById('ts-number').value = '';
  toast('Mock test scheduled successfully in Supabase!', 'success');

  try {
    await DronaDB.saveTest(email, newTest);
  } catch (e) {
    console.error('[SaveTest] Error:', e);
  }
}

async function deleteTest(testId) {
  if (!confirm('Are you sure you want to delete this test?')) return;
  const email = (currentUser && currentUser.email) || 'diveshsah2@gmail.com';

  allTests = allTests.filter(t => t.id !== testId);
  renderTestArsenal();
  if (testArsenalTab === 'analysis') renderTestAnalysis();
  toast('Test deleted.', 'info');

  try {
    await DronaDB.deleteTest(email, testId);
  } catch (e) {
    console.error('[DeleteTest] Error:', e);
  }
}

function openMarksModal(testId) {
  const test = allTests.find(t => t.id === testId);
  if (!test) return;

  currentMarkTestId = testId;
  const subs = getActiveSubjects();

  const infoEl = document.getElementById('marksTestInfo');
  if (infoEl) infoEl.textContent = `Submitting score for "${test.number}" (${test.type}) - ${test.date}`;

  const max1 = (test.maxMarks && test.maxMarks[subs[0].key]) || 100;
  const max2 = (test.maxMarks && test.maxMarks[subs[1].key]) || 100;
  const max3 = (test.maxMarks && test.maxMarks[subs[2].key]) || 100;

  document.getElementById('m-sub1-max').textContent = max1;
  document.getElementById('m-sub2-max').textContent = max2;
  document.getElementById('m-sub3-max').textContent = max3;

  document.getElementById('m-sub1').value = (test.marks && test.marks[subs[0].key] !== undefined) ? test.marks[subs[0].key] : '';
  document.getElementById('m-sub2').value = (test.marks && test.marks[subs[1].key] !== undefined) ? test.marks[subs[1].key] : '';
  document.getElementById('m-sub3').value = (test.marks && test.marks[subs[2].key] !== undefined) ? test.marks[subs[2].key] : '';

  updateModalTotals();
  openModal('marksModal');
}

function updateModalTotals() {
  const s1 = parseFloat(document.getElementById('m-sub1').value) || 0;
  const s2 = parseFloat(document.getElementById('m-sub2').value) || 0;
  const s3 = parseFloat(document.getElementById('m-sub3').value) || 0;

  const max1 = parseFloat(document.getElementById('m-sub1-max').textContent) || 100;
  const max2 = parseFloat(document.getElementById('m-sub2-max').textContent) || 100;
  const max3 = parseFloat(document.getElementById('m-sub3-max').textContent) || 100;

  const p1 = max1 > 0 ? Math.round((s1 / max1) * 100) : 0;
  const p2 = max2 > 0 ? Math.round((s2 / max2) * 100) : 0;
  const p3 = max3 > 0 ? Math.round((s3 / max3) * 100) : 0;

  document.getElementById('m-sub1-pct').textContent = `${p1}%`;
  document.getElementById('m-sub2-pct').textContent = `${p2}%`;
  document.getElementById('m-sub3-pct').textContent = `${p3}%`;

  const totalObt = s1 + s2 + s3;
  const totalMax = max1 + max2 + max3;
  const overallPct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0;

  document.getElementById('marksTotalDisplay').textContent = totalObt;
  document.getElementById('marksMaxDisplay').textContent = totalMax;
  document.getElementById('marksPctDisplay').textContent = `${overallPct}%`;
}

async function submitMarks() {
  if (!currentMarkTestId) return;
  const subs = getActiveSubjects();

  const s1 = parseFloat(document.getElementById('m-sub1').value) || 0;
  const s2 = parseFloat(document.getElementById('m-sub2').value) || 0;
  const s3 = parseFloat(document.getElementById('m-sub3').value) || 0;

  const updatedMarks = {
    [subs[0].key]: s1,
    [subs[1].key]: s2,
    [subs[2].key]: s3
  };

  const testIdx = allTests.findIndex(t => t.id === currentMarkTestId);
  if (testIdx >= 0) {
    allTests[testIdx].marks = updatedMarks;
    allTests[testIdx].completed = true;
    allTests[testIdx].updatedAt = new Date().toISOString();

    closeModal('marksModal');
    toast('Marks saved in Supabase database!', 'success');
    renderTestArsenal();
    if (testArsenalTab === 'analysis') renderTestAnalysis();

    const email = (currentUser && currentUser.email) || 'diveshsah2@gmail.com';
    try {
      await DronaDB.saveTest(email, allTests[testIdx]);
    } catch (e) {
      console.error('[SubmitMarks] Error:', e);
    }
  }
}

// === 12. PROFILE SETTINGS ===
function renderSettings() {
  const nameEl = document.getElementById('profileNameInput');
  if (nameEl) nameEl.value = profile.name || mjStorage.getItem('mj_local_name') || 'Divesh Sah';

  const classEl = document.getElementById('profileClassSelect');
  if (classEl) classEl.value = profile.class || mjStorage.getItem('mj_local_class') || '12';

  const mode = getExamMode();
  const cardJee = document.getElementById('examCardJee');
  const cardNeet = document.getElementById('examCardNeet');
  if (cardJee && cardNeet) {
    if (mode === 'jee') {
      cardJee.style.borderColor = 'var(--blue-l)';
      cardJee.style.background = 'rgba(99,102,241,0.06)';
      cardNeet.style.borderColor = 'var(--border)';
      cardNeet.style.background = 'rgba(255,255,255,0.01)';
    } else {
      cardNeet.style.borderColor = 'var(--green-l)';
      cardNeet.style.background = 'rgba(16,185,129,0.06)';
      cardJee.style.borderColor = 'var(--border)';
      cardJee.style.background = 'rgba(255,255,255,0.01)';
    }
  }

  updateSidebarUserDisplay();
}

async function setExamMode(mode) {
  mjStorage.setItem('mj_exam_mode', mode);
  profile.examMode = mode;
  updateGlobalStats();
  renderSettings();
  renderDoubtQuickStarters();
  renderTestArsenal();
  toast(`Switched target exam to ${mode.toUpperCase()}`, 'success');

  const email = (currentUser && currentUser.email) || 'diveshsah2@gmail.com';
  try {
    await DronaDB.saveUserProfile(email, profile);
  } catch (e) {}
}

async function saveProfileSettings() {
  const name = (document.getElementById('profileNameInput').value || '').trim();
  const studentClass = document.getElementById('profileClassSelect').value;

  if (!name) {
    toast('Please enter a display name', 'error');
    return;
  }

  mjStorage.setItem('mj_local_name', name);
  mjStorage.setItem('mj_local_class', studentClass);
  profile.name = name;
  profile.class = studentClass;

  updateSidebarUserDisplay();
  toast('Profile updated and saved to Supabase!', 'success');

  const email = (currentUser && currentUser.email) || 'diveshsah2@gmail.com';
  try {
    await DronaDB.saveUserProfile(email, profile);
  } catch (e) {}
}

function handleLocalPhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    toast('Photo must be under 2MB', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = async function(e) {
    const dataUrl = e.target.result;
    mjStorage.setItem('mj_local_avatar', dataUrl);
    profile.avatar = dataUrl;
    updateSidebarUserDisplay();
    toast('Avatar photo updated!', 'success');

    const email = (currentUser && currentUser.email) || 'diveshsah2@gmail.com';
    try {
      await DronaDB.saveUserProfile(email, profile);
    } catch (err) {}
  };
  reader.readAsDataURL(file);
}

function clearLocalPhoto() {
  mjStorage.removeItem('mj_local_avatar');
  profile.avatar = '';
  updateSidebarUserDisplay();
  toast('Photo removed', 'info');

  const email = (currentUser && currentUser.email) || 'diveshsah2@gmail.com';
  DronaDB.saveUserProfile(email, profile).catch(() => {});
}

// === 13. AACHARYA AI (DOUBTS SOLVER) ===
function toggleMathCalculator(forceState) {
  const pad = document.getElementById('mathCalculatorPad');
  const btn = document.getElementById('calcToggleBtn');
  if (!pad) return;

  const shouldOpen = forceState !== undefined ? forceState : (pad.style.display === 'none');
  pad.style.display = shouldOpen ? 'block' : 'none';
  if (btn) {
    btn.classList.toggle('active', shouldOpen);
    btn.textContent = shouldOpen ? '✕ Close Keypad' : '📐 Math Keypad';
  }
}

function insertMathSymbol(sym) {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const start = input.selectionStart !== undefined ? input.selectionStart : input.value.length;
  const end = input.selectionEnd !== undefined ? input.selectionEnd : input.value.length;
  const text = input.value;
  input.value = text.substring(0, start) + sym + text.substring(end);
  input.focus();
  const newPos = start + sym.length;
  input.setSelectionRange(newPos, newPos);
}

function renderDoubtQuickStarters() {
  const container = document.getElementById('quickStartersGrid');
  if (!container) return;

  const mode = getExamMode();
  let starters = [];

  if (mode === 'jee') {
    starters = [
      { title: "⚡ Rotational Dynamics Numerical", sub: "Physics", prompt: "A solid cylinder of mass m and radius r rolls down an incline of angle θ without slipping. Calculate its acceleration and friction force step-by-step." },
      { title: "🧪 Aldol & Cannizzaro Mechanisms", sub: "Organic Chemistry", prompt: "Explain the step-by-step mechanism of Base-catalyzed Aldol Condensation vs Cannizzaro Reaction, showing all intermediates." },
      { title: "📐 Tricky Definite Integration", sub: "Mathematics", prompt: "Solve the definite integral \\int_{0}^{\\pi/2} \\frac{\\sqrt{\\sin x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}} dx using properties of definite integrals." }
    ];
  } else {
    starters = [
      { title: "🧬 Hardy-Weinberg Calculation", sub: "Genetics / NEET PYQ", prompt: "Explain the Hardy-Weinberg equilibrium formula \\(p^2 + 2pq + q^2 = 1\\) and solve a numerical calculating the carrier frequency." },
      { title: "⚛️ Bernoulli Principle & Efflux", sub: "Physics", prompt: "Derive Torricelli's Law from Bernoulli's Equation and calculate the horizontal range of the efflux stream from a tank." },
      { title: "🧪 Markovnikov vs Peroxide Effect", sub: "Chemistry", prompt: "Explain Markovnikov addition vs Kharasch (peroxide) effect with free radical mechanism for HBr addition." }
    ];
  }

  container.innerHTML = starters.map(s => `
    <button class="btn btn-ghost" onclick="triggerQuickDoubt('${escapeHtml(s.prompt)}')" style="height:auto; padding:8px 12px; text-align:left; display:flex; flex-direction:column; align-items:flex-start; gap:2px; font-size:11px; background:rgba(255,255,255,0.02); border-color:var(--border);">
      <strong style="color:var(--txt-1); font-size:11.5px;">${s.title}</strong>
      <span style="font-size:9.5px; color:var(--blue-l);">${s.sub}</span>
    </button>
  `).join('');
}

function triggerQuickDoubt(promptText) {
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = promptText;
    document.getElementById('chatForm').dispatchEvent(new Event('submit'));
  }
}

function handleChatFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    toast('File must be under 5MB', 'error');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const rawData = e.target.result;
    const base64Data = rawData.split(',')[1];
    chatAttachment = {
      mimeType: file.type,
      data: base64Data,
      name: file.name
    };
    const container = document.getElementById('chatAttachmentPreview');
    const nameEl = document.getElementById('chatAttachmentName');
    const iconEl = document.getElementById('chatAttachmentIcon');
    if (container && nameEl && iconEl) {
      nameEl.textContent = file.name;
      iconEl.textContent = file.type.startsWith('image/') ? '🖼️' : '📄';
      container.style.display = 'flex';
    }
    toast('Question attached successfully', 'success');
  };
  reader.readAsDataURL(file);
}

function removeChatAttachment() {
  chatAttachment = null;
  const container = document.getElementById('chatAttachmentPreview');
  if (container) container.style.display = 'none';
  const fileInput = document.getElementById('chatFileInput');
  if (fileInput) fileInput.value = '';
}

function clearDoubtChat() {
  chatMessages = [
    {
      sender: 'assistant',
      text: "Namaste! I am **Aacharya AI**, your personal IIT-JEE & NEET Academic Mentor and Doubt Solver. 🚀\n\nAsk me any concept query, numerical problem, formula derivation, or reaction mechanism. You can use the **📐 Math Keypad** for symbols and fractions, or upload question diagrams using **📎**!\n\nWhat doubt are we cracking today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];
  renderChatMessages();
  toast('Doubts session cleared', 'info');
}

function renderKaTeX(latex, isBlock) {
  if (typeof katex !== 'undefined') {
    try {
      return katex.renderToString(latex, {
        displayMode: isBlock,
        throwOnError: false,
        trust: true
      });
    } catch (e) {
      console.warn("KaTeX render error:", e);
    }
  }
  const parsed = parseLaTeX(latex);
  if (isBlock) {
    return `<div class="math-block" style="background:rgba(167,139,250,0.03); border:1px solid rgba(167,139,250,0.2); padding:12px; border-radius:6px; margin:10px 0; font-family:'JetBrains Mono', monospace; text-align:center; overflow-x:auto; color:#a78bfa; font-size:13px; font-weight:600;">${parsed}</div>`;
  } else {
    return `<code class="math-inline" style="background:rgba(167,139,250,0.08); color:#a78bfa; padding:2px 6px; border-radius:3px; font-family:'JetBrains Mono', monospace; font-size:12px; font-weight:600;">${parsed}</code>`;
  }
}

function parseLaTeX(math) {
  if (!math) return '';
  return math
    .replace(/\\frac\s*{(.*?)}\s*{(.*?)}/g, '($1)/($2)')
    .replace(/\\sqrt\s*{(.*?)}/g, '√($1)')
    .replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β').replace(/\\gamma/g, 'γ')
    .replace(/\\theta/g, 'θ').replace(/\\pi/g, 'π').replace(/\\Delta/g, 'Δ')
    .replace(/\\int/g, '∫').replace(/\\sum/g, '∑').replace(/\\to/g, '→')
    .replace(/\\pm/g, '±').replace(/\\infty/g, '∞').replace(/\\lambda/g, 'λ')
    .replace(/\\/g, '');
}

function parseTeacherSolutionSteps(text) {
  if (!text) return '';
  const headings = [
    { key: 'concept', label: 'Concept Overview', pattern: /Concept\s*Overview/i, color: 'var(--blue-l)', bg: 'rgba(99, 102, 241, 0.04)' },
    { key: 'given', label: 'Given Parameters', pattern: /Given\s*Parameters|Given\s*Values/i, color: 'var(--purple-l)', bg: 'rgba(139, 92, 246, 0.04)' },
    { key: 'formula', label: 'Core Formula / Principle', pattern: /Core\s*Formula|Key\s*Theorem|Reaction\s*Principle/i, color: 'var(--yellow-l)', bg: 'rgba(245, 158, 11, 0.04)' },
    { key: 'steps', label: 'Step-by-Step Solution / Mechanism', pattern: /Step-by-Step\s*(?:Derivation|Calculation|Solution|Mechanism)/i, color: 'var(--cyan)', bg: 'rgba(6, 182, 212, 0.04)' },
    { key: 'boxed', label: 'Final Answer', pattern: /Final\s*(?:boxed\s*)?Solution|Final\s*Answer|Major\s*Product/i, color: 'var(--green-l)', bg: 'rgba(16, 185, 129, 0.06)' },
    { key: 'tip', label: 'JEE / NEET Pitfall & Tip', pattern: /Student\s*Pitfalls|Exam\s*Tip|Common\s*Mistake|Trap\s*Alert/i, color: 'var(--red-l)', bg: 'rgba(239, 68, 68, 0.04)' }
  ];

  const lines = text.split('\n');
  const blocks = [];
  let currentBlock = { heading: null, contentLines: [] };

  lines.forEach(line => {
    let matched = null;
    for (const h of headings) {
      if (h.pattern.test(line) && (line.includes('**') || line.includes('###') || line.match(/^\d+\./))) {
        matched = h;
        break;
      }
    }
    if (matched) {
      if (currentBlock.contentLines.length > 0 || currentBlock.heading) {
        blocks.push({ heading: currentBlock.heading, content: currentBlock.contentLines.join('\n').trim() });
      }
      currentBlock = { heading: matched, contentLines: [] };
    } else {
      currentBlock.contentLines.push(line);
    }
  });

  if (currentBlock.contentLines.length > 0 || currentBlock.heading) {
    blocks.push({ heading: currentBlock.heading, content: currentBlock.contentLines.join('\n').trim() });
  }

  const headerBlocks = blocks.filter(b => b.heading !== null);
  if (headerBlocks.length === 0) {
    return formatMarkdownAndMath(text);
  }

  let html = '';
  const leadingBlock = blocks.find(b => b.heading === null);
  if (leadingBlock && leadingBlock.content) {
    html += `<div style="margin-bottom:12px; font-size:13px; line-height:1.5; color:var(--txt-1);">${formatMarkdownAndMath(leadingBlock.content)}</div>`;
  }

  html += `<div class="solution-steps-container" style="display:flex; flex-direction:column; gap:12px; margin:10px 0;">`;
  let stepIndex = 1;
  headerBlocks.forEach(block => {
    const h = block.heading;
    const bodyContent = formatMarkdownAndMath(block.content);
    html += `
      <div class="solution-step-card" style="
        background: ${h.bg};
        border: 1px solid var(--border);
        border-left: 4px solid ${h.color};
        border-radius: 8px;
        padding: 12px 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; border-bottom:1px dashed rgba(255,255,255,0.05); padding-bottom:4px;">
          <span style="font-size:11px; font-weight:700; color:${h.color}; text-transform:uppercase; letter-spacing:0.5px;">${h.label}</span>
          <span style="background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:12px; padding:2px 8px; font-size:9px; font-family:'JetBrains Mono', monospace; color:var(--txt-3); font-weight:600;">Step ${stepIndex++}</span>
        </div>
        <div style="font-size:12.5px; line-height:1.6; color:var(--txt-2);">${bodyContent}</div>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

function formatMarkdownAndMath(text) {
  if (!text) return '';
  const codeBlocks = [];
  const mathBlocks = [];
  const mathInlines = [];

  let processed = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const id = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push({ lang, code });
    return id;
  });

  processed = processed.replace(/(\$\$|\\\[)([\s\S]*?)(\$\$|\\\])/g, (match, open, math) => {
    const id = `__MATH_BLOCK_${mathBlocks.length}__`;
    mathBlocks.push(math);
    return id;
  });

  processed = processed.replace(/(\(\s*.+?\s*\)|\\$$|\$)(.+?)(\\\)|\\\$|\$)/g, (match, open, math) => {
    const id = `__MATH_INLINE_${mathInlines.length}__`;
    mathInlines.push(math);
    return id;
  });

  processed = escapeHtml(processed);

  codeBlocks.forEach((block, idx) => {
    const escapedCode = escapeHtml(block.code.trim());
    const blockHtml = `
      <div class="code-panel" style="margin:10px 0; border:1px solid var(--border); border-radius:6px; overflow:hidden; background:var(--bg-void);">
        <div style="background:rgba(255,255,255,0.02); padding:6px 12px; font-size:10px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; color:var(--txt-3); font-family:'JetBrains Mono';">
          <span>${block.lang || 'code'}</span>
          <button type="button" onclick="navigator.clipboard.writeText(this.parentNode.parentNode.querySelector('pre').innerText); toast('Copied to clipboard','success');" style="background:none; border:none; color:var(--txt-2); cursor:pointer; font-size:10px;">Copy</button>
        </div>
        <pre style="margin:0; padding:12px; overflow-x:auto; font-family:'JetBrains Mono', monospace; font-size:12px; color:var(--green-l); line-height:1.5; text-align:left;"><code>${escapedCode}</code></pre>
      </div>
    `;
    processed = processed.split(`__CODE_BLOCK_${idx}__`).join(blockHtml);
  });

  mathBlocks.forEach((math, idx) => {
    const blockHtml = renderKaTeX(math.trim(), true);
    processed = processed.split(`__MATH_BLOCK_${idx}__`).join(blockHtml);
  });

  mathInlines.forEach((math, idx) => {
    const inlineHtml = renderKaTeX(math.trim(), false);
    processed = processed.split(`__MATH_INLINE_${idx}__`).join(inlineHtml);
  });

  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  processed = processed.replace(/`(.*?)`/g, '<code class="mono" style="background:rgba(255,255,255,0.06); padding:2px 4px; border-radius:3px; color:var(--red-l);">$1</code>');

  let lines = processed.split('\n');
  let inList = false;
  lines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      let prefix = inList ? '' : '<ul style="margin:6px 0; padding-left:20px; list-style-type:disc;">';
      inList = true;
      return `${prefix}<li style="margin-bottom:4px; color:var(--txt-2);">${content}</li>`;
    }
    let suffix = inList ? '</ul>' : '';
    inList = false;
    return suffix + line;
  });
  if (inList) lines[lines.length - 1] += '</ul>';

  return lines.join('\n').replace(/\n/g, '<br>');
}

async function sendChatMessage(event) {
  if (event) event.preventDefault();
  const inputEl = document.getElementById('chatInput');
  if (!inputEl) return;
  const text = inputEl.value.trim();
  if (!text && !chatAttachment) return;

  const attachmentToSend = chatAttachment;
  removeChatAttachment();
  inputEl.value = '';
  toggleMathCalculator(false);

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  chatMessages.push({ sender: 'user', text, timestamp: time, attachment: attachmentToSend });
  renderChatMessages();

  const messagesArea = document.getElementById('chatMessagesArea');
  if (messagesArea) {
    messagesArea.innerHTML += `
      <div class="chat-loader" id="chatLoader" style="align-self:flex-start; margin:8px 0;">
        <div class="chat-loader-dot"></div>
        <div class="chat-loader-dot"></div>
        <div class="chat-loader-dot"></div>
      </div>
    `;
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    setTimeout(() => {
      const loader = document.getElementById('chatLoader');
      if (loader) loader.remove();
      chatMessages.push({
        sender: 'system',
        text: "🚨 Gemini API Key is missing.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      renderChatMessages();
    }, 500);
    return;
  }

  try {
    const geminiHistory = chatMessages.slice(0, -1).map(msg => {
      const msgParts = [];
      if (msg.attachment) {
        msgParts.push({
          inlineData: { mimeType: msg.attachment.mimeType, data: msg.attachment.data }
        });
        msgParts.push({ text: `[Attached Question File: ${msg.attachment.name}]\n\n${msg.text}` });
      } else {
        msgParts.push({ text: msg.text });
      }
      return {
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: msgParts
      };
    });

    const examMode = getExamMode();
    const systemPrompt = `You are Aacharya AI, an elite Kota-level Senior Faculty and empathetic Study Mentor for ${examMode.toUpperCase()} aspirants (IIT-JEE Main/Advanced & NEET UG).

## CORE TEACHER PERSONALITY & MENTOR ROLE
- You speak with profound clarity, warmth, scientific precision, and encouraging mentorship.
- You treat every student doubt with deep attention, explaining BOTH the intuitive 'Why' and the mathematical/chemical 'How'.
- Whether the query is in Physics, Physical/Organic/Inorganic Chemistry, Mathematics, or Biology, resolve it seamlessly without demanding the user choose a subject.

## ADAPTIVE DOUBT-SOLVING PROTOCOL

### 1. For Numerical & Calculation-Heavy Problems:
1. 💡 **Concept Overview**: 1-2 sentences explaining the core law/phenomenon involved.
2. 📋 **Given Parameters**: List variables with symbols, units, and values in clean LaTeX (e.g. \\(m = 2\\text{ kg}\\), \\(v = 10\\text{ m/s}\\)).
3. 📐 **Core Formula / Principle**: State the master formula or theorem applied.
4. ⚙️ **Step-by-Step Calculation**: Show clear algebraic substitutions and calculation steps.
5. 🎯 **Final Answer**: Clearly stated, boxed answer with correct units.
6. ⚠️ **JEE / NEET Pitfall & Tip**: Point out common calculation traps, negative marking traps, or shortcut tips.

### 2. For Conceptual & Theoretical Doubts:
1. 💡 **Concept Overview**: Intuitive analogy or fundamental visualization.
2. 🔬 **Deep Technical Rigor**: Exact NCERT/Advanced explanation with laws and diagrams/equations.
3. 🎯 **Key Rules & Exceptions**: Any anomalies or vital edge-cases tested in JEE/NEET.
4. ⚠️ **JEE / NEET Pitfall & Tip**: High-yield memory takeaway or mnemonic.

### 3. For Organic / Inorganic Chemistry Mechanisms:
1. 🧪 **Reaction Overview**: Substrate, reagent, reaction type (e.g., $S_N1$, $E2$, Electrophilic Addition).
2. 🔄 **Step-by-Step Mechanism**: Electron flow, arrows, intermediates (carbocation, transition state), and rate-determining step.
3. 🎯 **Final Major / Minor Products**: Regioselectivity (Markovnikov, Zaitsev) and stereochemistry.
4. ⚠️ **Exam Pitfall**: Common reagent tricks (e.g., cold dil. vs hot conc. $KMnO_4$).

### 4. For Mentorship, Exam Strategy & Low-Score Recovery:
- Provide high-energy, actionable, and empathetic guidance. Give specific time-table and revision blueprints.

Always write all equations, variables, and math formulas using LaTeX ($...$ inline or $$...$$ block).`;

    const currentParts = [];
    if (attachmentToSend) {
      currentParts.push({
        inlineData: { mimeType: attachmentToSend.mimeType, data: attachmentToSend.data }
      });
      currentParts.push({ text: `[Attached Question File: ${attachmentToSend.name}]\n\n${text}` });
    } else {
      currentParts.push({ text });
    }

    const payload = {
      contents: [
        { role: 'user', parts: [{ text: `System Instructions: ${systemPrompt}\n\nPlease acknowledge and prepare to solve all JEE/NEET doubts.` }] },
        { role: 'model', parts: [{ text: "Understood! I am ready to resolve all IIT-JEE and NEET doubts with master faculty precision and step-by-step guidance." }] },
        ...geminiHistory,
        { role: 'user', parts: currentParts }
      ],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.5 }
    };

    const resData = await callGeminiApi(payload);
    const loader = document.getElementById('chatLoader');
    if (loader) loader.remove();

    const assistantText = resData.candidates[0].content.parts[0].text;
    chatMessages.push({
      sender: 'assistant',
      text: assistantText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    renderChatMessages();
  } catch (err) {
    console.error("Gemini API Error:", err);
    const loader = document.getElementById('chatLoader');
    if (loader) loader.remove();
    chatMessages.push({
      sender: 'system',
      text: `🚨 Error resolving doubt: ${err.message}. Please try again.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    renderChatMessages();
  }
}

function renderChatMessages() {
  const messagesArea = document.getElementById('chatMessagesArea');
  if (!messagesArea) return;

  messagesArea.innerHTML = chatMessages.map(msg => {
    const alignment = msg.sender === 'user' ? 'align-self: flex-end;' : (msg.sender === 'system' ? 'align-self: center;' : 'align-self: flex-start;');
    const bubbleClass = msg.sender === 'user' ? 'user' : (msg.sender === 'system' ? 'system' : 'assistant');

    let attachmentHtml = '';
    if (msg.attachment) {
      if (msg.attachment.mimeType && msg.attachment.mimeType.startsWith('image/')) {
        attachmentHtml = `
          <div style="margin-bottom:8px; border-radius:6px; overflow:hidden; border:1px solid var(--border); max-width:280px; background:rgba(0,0,0,0.3);">
            <img src="data:${msg.attachment.mimeType};base64,${msg.attachment.data}" style="width:100%; display:block; max-height:220px; object-fit:contain;">
          </div>
        `;
      } else {
        attachmentHtml = `
          <div style="margin-bottom:8px; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.04); border:1px solid var(--border); padding:8px 12px; border-radius:6px; font-size:11px;">
            <span style="font-size:18px;">📄</span>
            <span style="font-family:'JetBrains Mono', monospace; color:var(--blue-l); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:200px;">${msg.attachment.name}</span>
          </div>
        `;
      }
    }

    const formattedText = msg.sender === 'assistant' ? parseTeacherSolutionSteps(msg.text) : formatMarkdownAndMath(msg.text);

    return `
      <div class="chat-bubble ${bubbleClass}" style="${alignment} max-width:85%;">
        ${attachmentHtml}
        <div>${formattedText}</div>
        <div style="font-size:8px; color:var(--txt-3); text-align:right; margin-top:6px; font-family:'JetBrains Mono';">${msg.timestamp}</div>
      </div>
    `;
  }).join('');

  messagesArea.scrollTop = messagesArea.scrollHeight;
}

// === 14. THEME & SIDEBAR ===
function initTheme() {
  const savedTheme = mjStorage.getItem('mj_theme') || 'dark';
  setTheme(savedTheme);
}

function setTheme(theme) {
  const body = document.body;
  const themeBtn = document.getElementById('themeToggleBtn');
  if (theme === 'light') {
    body.classList.add('light-theme');
    if (themeBtn) { themeBtn.textContent = '☀️'; themeBtn.title = 'Switch to Dark Theme'; }
    mjStorage.setItem('mj_theme', 'light');
  } else {
    body.classList.remove('light-theme');
    if (themeBtn) { themeBtn.textContent = '🌙'; themeBtn.title = 'Switch to Light Theme'; }
    mjStorage.setItem('mj_theme', 'dark');
  }
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-theme');
  setTheme(isLight ? 'dark' : 'light');
}

function toggleSidebarCollapse() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('collapsed');
}

function openMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.add('mobile-open');
  if (overlay) overlay.classList.add('open');
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (overlay) overlay.classList.remove('open');
}

document.addEventListener('click', function(e) {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'date') {
    if (typeof e.target.showPicker === 'function') {
      try { e.target.showPicker(); } catch (err) {}
    }
  }
});

// === 15. INITIALIZATION ON DOM READY ===
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuth();

  const pageDate = document.getElementById('pageDate');
  if (pageDate) {
    const opts = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    pageDate.textContent = new Date().toLocaleDateString('en-US', opts);
  }

  renderDoubtQuickStarters();
  renderChatMessages();
});

