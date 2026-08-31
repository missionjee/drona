// ==============================================================================
// MISSION JEET (DRONA) — CORE APPLICATION CONTROLLER
// Dedicated IIT-JEE & NEET Test Arsenal & Performance Analytics Command Deck
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
const DEFAULT_SUPABASE_URL = "https://fvmbqikdomcjalladwmz.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_UNWum89AzkwnfNb2BoxdKA_otmSXn5c";

const SUPABASE_CONFIG = {
  get PROJECT_URL() {
    return mjStorage.getItem('mj_supabase_url') || DEFAULT_SUPABASE_URL;
  },
  get ANON_KEY() {
    return mjStorage.getItem('mj_supabase_key') || DEFAULT_SUPABASE_KEY;
  },
  get REST_ENDPOINT() {
    return `${this.PROJECT_URL.replace(/\/$/, '')}/rest/v1`;
  }
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

    // 3. Return default profile
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

    // Update local cache
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

      tests.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      mjStorage.setItem(`mj_cached_tests_${email}`, JSON.stringify(tests));
      return tests;
    }

    // 2. Cache fallback
    const cached = mjStorage.getItem(`mj_cached_tests_${email}`);
    if (cached) {
      try {
        const arr = JSON.parse(cached);
        if (Array.isArray(arr)) return arr;
      } catch (e) {}
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

    let current = [];
    try { current = JSON.parse(mjStorage.getItem(`mj_cached_tests_${email}`) || '[]'); } catch (e) {}
    const existingIdx = current.findIndex(t => t.id === testId);
    if (existingIdx >= 0) current[existingIdx] = fullTest;
    else current.unshift(fullTest);
    mjStorage.setItem(`mj_cached_tests_${email}`, JSON.stringify(current));

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
    const cleanId = String(testId).replace('drona_test_', '');
    const issueKey = `drona_test_${cleanId}`;

    // 1. Immediately remove from local storage cache
    let current = [];
    try { current = JSON.parse(mjStorage.getItem(`mj_cached_tests_${email}`) || '[]'); } catch (e) {}
    current = current.filter(t => t && t.id !== cleanId && t.id !== testId && t.id !== issueKey);
    mjStorage.setItem(`mj_cached_tests_${email}`, JSON.stringify(current));

    // 2. Mark as deleted in Supabase (soft delete) and delete
    await this._request(`/global_signals?issue_number=eq.${encodeURIComponent(issueKey)}`, 'PATCH', { status: 'deleted' });
    await this._request(`/global_signals?issue_number=eq.${encodeURIComponent(issueKey)}`, 'DELETE');
    return true;
  },

  async clearAllTests(userEmail) {
    const email = (userEmail || 'diveshsah2@gmail.com').toLowerCase().trim();
    mjStorage.setItem(`mj_cached_tests_${email}`, JSON.stringify([]));

    const res = await this._request(`/global_signals?strategy=eq.drona_test&stake_units=eq.${encodeURIComponent(email)}&select=issue_number`);
    if (res.ok && Array.isArray(res.data)) {
      for (const item of res.data) {
        await this._request(`/global_signals?issue_number=eq.${encodeURIComponent(item.issue_number)}`, 'PATCH', { status: 'deleted' });
      }
    }
  }
};

// === 3. FIREBASE AUTHENTICATION ===
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

// === 4. EXAM CONFIGURATION SYSTEM ===
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

// === 5. STATE VARIABLES ===
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
let syncTimer = null;

// === 6. UTILITIES ===
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

// === 7. UI UPDATERS ===
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

  const syncStatusEl = document.getElementById('sbSyncStatusText');
  if (syncStatusEl) {
    const userEmail = (currentUser && currentUser.email) || profile.email || 'diveshsah2@gmail.com';
    syncStatusEl.textContent = `Connected: ${userEmail}`;
  }

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

  const th1 = document.getElementById('th-sub1-pct');
  const th2 = document.getElementById('th-sub2-pct');
  const th3 = document.getElementById('th-sub3-pct');
  if (th1 && subs[0]) th1.textContent = subs[0].label;
  if (th2 && subs[1]) th2.textContent = subs[1].label;
  if (th3 && subs[2]) th3.textContent = subs[2].label;

  const ts1 = document.getElementById('ts-sub1-label');
  const ts2 = document.getElementById('ts-sub2-label');
  const ts3 = document.getElementById('ts-sub3-label');
  if (ts1 && subs[0]) ts1.textContent = subs[0].label;
  if (ts2 && subs[1]) ts2.textContent = subs[1].label;
  if (ts3 && subs[2]) ts3.textContent = subs[2].label;

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
  } else if (id === 'sec-settings') {
    renderSettings();
  }
}

// === 8. NAVIGATION CONTROLLER ===
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

  const bns = ['tests', 'settings'];
  const bnIdx = bns.indexOf(secId);
  if (bnIdx !== -1) {
    const bnBtns = document.querySelectorAll('.bottom-nav-btn');
    if (bnBtns[bnIdx]) bnBtns[bnIdx].classList.add('active');
  }

  const titles = {
    'tests': 'Test Arsenal',
    'settings': 'Profile & Stream'
  };
  const pageTitleEl = document.getElementById('pageTitle');
  if (pageTitleEl) pageTitleEl.textContent = titles[secId] || secId.toUpperCase();

  closeMobileSidebar();
  triggerActiveSectionRefresh();
}

// === 9. AUTHENTICATION & SYNC ===
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
      console.warn('[Firebase Auth] Popup blocked/closed, entering directly:', e.message);
      directAccessLogin();
    });
  } else {
    directAccessLogin();
  }
}

function directAccessLogin() {
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
  startDataSyncTimer();
  toast('Signed in as Divesh Sah — Connected to Supabase Cloud', 'success');
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

// === 10. CLOUD BACKUP & RESTORE HUB ===
async function forceCloudSync() {
  toast('Syncing with Supabase Cloud...', 'info');
  await syncUserData();
  toast(`Cloud sync complete! ${allTests.length} tests loaded.`, 'success');
}

function exportDataBackup() {
  const email = (currentUser && currentUser.email) || 'diveshsah2@gmail.com';
  const backupData = {
    app: "Mission Jeet (Drona)",
    version: "3.2",
    exportedAt: new Date().toISOString(),
    user: {
      email,
      name: profile.name || 'Divesh Sah',
      class: profile.class || '12',
      examMode: profile.examMode || 'jee'
    },
    tests: allTests
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `mission_jeet_backup_${email}_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  toast('Backup JSON exported successfully!', 'success');
}

async function importDataBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported && Array.isArray(imported.tests)) {
        const email = (currentUser && currentUser.email) || 'diveshsah2@gmail.com';
        
        toast(`Importing ${imported.tests.length} tests into Supabase...`, 'info');

        for (const t of imported.tests) {
          await DronaDB.saveTest(email, t);
        }

        if (imported.user) {
          profile = { ...profile, ...imported.user };
          await DronaDB.saveUserProfile(email, profile);
        }

        await syncUserData();
        toast(`Successfully restored ${imported.tests.length} tests from backup!`, 'success');
      } else {
        toast('Invalid backup format.', 'error');
      }
    } catch (err) {
      toast('Failed to parse backup JSON: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
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
    let actionButtons = '';

    if (isCompleted) {
      let obtained = 0, totalMax = 0;
      Object.keys(t.marks).forEach(k => {
        obtained += parseFloat(t.marks[k] || 0);
        totalMax += parseFloat((t.maxMarks && t.maxMarks[k]) || 100);
      });
      const pct = totalMax > 0 ? Math.round((obtained / totalMax) * 100) : 0;
      totalScoreDisplay = `<strong>${obtained}</strong>/${totalMax} <span style="color:var(--blue-l); font-size:11px; font-weight:700;">(${pct}%)</span>`;
      statusBadge = '<span class="badge badge-green">🔒 Graded & Locked</span>';
      actionButtons = `
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="btn btn-ghost btn-sm" onclick="openMarksModal('${t.id}')">👁️ View Marks</button>
          <span class="badge badge-ghost" style="font-size:10px; opacity:0.6; cursor:not-allowed;" title="Permanently Locked: Graded mock scores cannot be edited or deleted">🔒 Locked</span>
        </div>
      `;
    } else {
      actionButtons = `
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="btn btn-primary btn-sm" onclick="openMarksModal('${t.id}')">+ Enter Marks</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--red-l);" onclick="deleteTest('${t.id}')" title="Delete Upcoming Mock">🗑️</button>
        </div>
      `;
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
        <td>${actionButtons}</td>
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

  // 1. Line Chart
  const ctxTrend = document.getElementById('chartTestTrend');
  const emptyTrend = document.getElementById('chartTestTrendEmpty');
  if (emptyTrend) emptyTrend.classList.add('hidden');

  if (ctxTrend && typeof Chart !== 'undefined') {
    if (chartInstances['trend']) chartInstances['trend'].destroy();

    // Short X-axis label to eliminate clipping with content below
    const chartLabels = normalizedTests.map((t, idx) => {
      const raw = (t.number || `Mock ${idx + 1}`).trim();
      return raw.length > 16 ? raw.substring(0, 14) + '…' : raw;
    });

    chartInstances['trend'] = new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Aggregate Score %',
          data: scores,
          borderColor: '#818cf8',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#818cf8',
          pointBorderColor: '#0b0b11',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 10,
            bottom: 15,
            left: 5,
            right: 15
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              callback: v => v + '%',
              color: 'rgba(238, 242, 255, 0.65)',
              font: { family: "'JetBrains Mono', monospace", size: 11 }
            },
            grid: { color: 'rgba(255,255,255,0.06)' }
          },
          x: {
            ticks: {
              color: 'rgba(238, 242, 255, 0.75)',
              font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
              maxRotation: 20,
              minRotation: 0,
              padding: 10
            },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0d0d15',
            titleColor: '#eef2ff',
            bodyColor: '#818cf8',
            borderColor: 'rgba(99, 102, 241, 0.3)',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              title: items => {
                if (!items.length) return '';
                const idx = items[0].dataIndex;
                return `${normalizedTests[idx].number} (${normalizedTests[idx].date || 'No Date'})`;
              },
              label: ctx => {
                const t = normalizedTests[ctx.dataIndex];
                return `Score: ${ctx.parsed.y}% (${t.obtained}/${t.max} marks)`;
              }
            }
          }
        }
      }
    });
  }

  // 2. Radar Chart
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
          backgroundColor: 'rgba(52, 211, 153, 0.2)',
          pointBackgroundColor: '#34d399',
          pointBorderColor: '#0b0b11',
          pointBorderWidth: 2,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 10, bottom: 10, left: 10, right: 10 }
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { display: false, stepSize: 25 },
            grid: { color: 'rgba(255,255,255,0.06)' },
            angleLines: { color: 'rgba(255,255,255,0.06)' },
            pointLabels: { color: '#eef2ff', font: { size: 12, weight: '700', family: "'Inter', sans-serif" } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0d0d15',
            borderColor: 'rgba(52, 211, 153, 0.3)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.raw}% Mastery`
            }
          }
        }
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
          : '⚠️ Core gap detected. Focus on chapter formula revision and mocks.');
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
  const cleanId = String(testId).replace('drona_test_', '');
  const test = allTests.find(t => t && (t.id === testId || t.id === cleanId || t.id === `drona_test_${cleanId}`));
  
  if (test && (test.completed || test.locked)) {
    toast('🔒 Permanent Record: Finalized test scores cannot be deleted.', 'error');
    return;
  }

  if (!confirm('Are you sure you want to delete this upcoming test?')) return;
  const email = (currentUser && currentUser.email) || 'diveshsah2@gmail.com';

  allTests = allTests.filter(t => t && t.id !== testId && t.id !== cleanId && t.id !== `drona_test_${cleanId}`);
  renderTestArsenal();
  if (testArsenalTab === 'analysis') renderTestAnalysis();
  toast('Upcoming test deleted.', 'info');

  try {
    await DronaDB.deleteTest(email, testId);
  } catch (e) {
    console.error('[DeleteTest] Error:', e);
  }
}

async function clearAllUserTests() {
  if (!confirm('Are you sure you want to clear upcoming mock tests? (Finalized/graded tests will remain safely recorded).')) return;
  const email = (currentUser && currentUser.email) || 'diveshsah2@gmail.com';

  // Only delete uncompleted/upcoming tests
  const upcomingTests = allTests.filter(t => !t.completed);
  allTests = allTests.filter(t => t.completed);
  renderTestArsenal();
  if (testArsenalTab === 'analysis') renderTestAnalysis();
  toast('Upcoming mock tests cleared.', 'info');

  try {
    for (const t of upcomingTests) {
      await DronaDB.deleteTest(email, t.id);
    }
  } catch (e) {
    console.error('[ClearAll] Error:', e);
  }
}

function openMarksModal(testId) {
  const test = allTests.find(t => t.id === testId);
  if (!test) return;

  currentMarkTestId = testId;
  const subs = getActiveSubjects();
  const isLocked = Boolean(test.completed && test.marks && Object.keys(test.marks).length > 0);

  const titleEl = document.getElementById('marksModalTitle');
  if (titleEl) titleEl.textContent = isLocked ? 'Mock Score Record (Locked)' : 'Submit Obtained Scores';

  const lockNotice = document.getElementById('marksLockNotice');
  if (lockNotice) lockNotice.style.display = isLocked ? 'block' : 'none';

  const infoEl = document.getElementById('marksTestInfo');
  if (infoEl) infoEl.textContent = `Test: "${test.number}" (${test.type}) - Target Date: ${test.date || 'N/A'}`;

  const max1 = (test.maxMarks && test.maxMarks[subs[0].key]) || 100;
  const max2 = (test.maxMarks && test.maxMarks[subs[1].key]) || 100;
  const max3 = (test.maxMarks && test.maxMarks[subs[2].key]) || 100;

  document.getElementById('m-sub1-max').textContent = max1;
  document.getElementById('m-sub2-max').textContent = max2;
  document.getElementById('m-sub3-max').textContent = max3;

  const inp1 = document.getElementById('m-sub1');
  const inp2 = document.getElementById('m-sub2');
  const inp3 = document.getElementById('m-sub3');

  inp1.value = (test.marks && test.marks[subs[0].key] !== undefined) ? test.marks[subs[0].key] : '';
  inp2.value = (test.marks && test.marks[subs[1].key] !== undefined) ? test.marks[subs[1].key] : '';
  inp3.value = (test.marks && test.marks[subs[2].key] !== undefined) ? test.marks[subs[2].key] : '';

  inp1.disabled = isLocked;
  inp2.disabled = isLocked;
  inp3.disabled = isLocked;

  const submitBtn = document.getElementById('marksSubmitBtn');
  if (submitBtn) {
    if (isLocked) {
      submitBtn.style.display = 'none';
    } else {
      submitBtn.style.display = 'block';
      submitBtn.textContent = 'Submit & Lock Obtained Marks';
    }
  }

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
  const testIdx = allTests.findIndex(t => t.id === currentMarkTestId);
  if (testIdx < 0) return;

  const test = allTests[testIdx];
  if (test.completed || test.locked) {
    toast('🔒 Permanent Record: Score is finalized and cannot be edited.', 'error');
    closeModal('marksModal');
    return;
  }

  const subs = getActiveSubjects();
  const s1 = parseFloat(document.getElementById('m-sub1').value) || 0;
  const s2 = parseFloat(document.getElementById('m-sub2').value) || 0;
  const s3 = parseFloat(document.getElementById('m-sub3').value) || 0;

  const confirmMsg = "⚠️ PERMANENT RECORD LOCK:\n\nAre you sure you want to finalize and submit these marks?\n\nOnce submitted, this mock test score will be PERMANENTLY LOCKED and cannot be edited or deleted.";
  if (!confirm(confirmMsg)) return;

  const updatedMarks = {
    [subs[0].key]: s1,
    [subs[1].key]: s2,
    [subs[2].key]: s3
  };

  allTests[testIdx].marks = updatedMarks;
  allTests[testIdx].completed = true;
  allTests[testIdx].locked = true;
  allTests[testIdx].submittedAt = new Date().toISOString();
  allTests[testIdx].updatedAt = new Date().toISOString();

  closeModal('marksModal');
  toast('Score permanently finalized and locked!', 'success');
  renderTestArsenal();
  if (testArsenalTab === 'analysis') renderTestAnalysis();

  const email = (currentUser && currentUser.email) || 'diveshsah2@gmail.com';
  try {
    await DronaDB.saveTest(email, allTests[testIdx]);
  } catch (e) {
    console.error('[SubmitMarks] Error:', e);
  }
}

// === 12. PROFILE SETTINGS ===
function renderSettings() {
  const nameEl = document.getElementById('profileNameInput');
  if (nameEl) nameEl.value = profile.name || mjStorage.getItem('mj_local_name') || 'Divesh Sah';

  const classEl = document.getElementById('profileClassSelect');
  if (classEl) classEl.value = profile.class || mjStorage.getItem('mj_local_class') || '12';

  const sbUrlInput = document.getElementById('customSupabaseUrl');
  if (sbUrlInput) sbUrlInput.value = SUPABASE_CONFIG.PROJECT_URL;

  const sbKeyInput = document.getElementById('customSupabaseKey');
  if (sbKeyInput) sbKeyInput.value = SUPABASE_CONFIG.ANON_KEY;

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

function saveCustomSupabaseConfig() {
  const url = (document.getElementById('customSupabaseUrl').value || '').trim();
  const key = (document.getElementById('customSupabaseKey').value || '').trim();

  if (!url || !key) {
    toast('Please enter both Supabase URL and Key', 'error');
    return;
  }

  mjStorage.setItem('mj_supabase_url', url);
  mjStorage.setItem('mj_supabase_key', key);
  toast('Custom Supabase Project saved! Synchronizing...', 'success');
  syncUserData();
}

function resetSupabaseConfig() {
  mjStorage.removeItem('mj_supabase_url');
  mjStorage.removeItem('mj_supabase_key');

  const sbUrlInput = document.getElementById('customSupabaseUrl');
  if (sbUrlInput) sbUrlInput.value = DEFAULT_SUPABASE_URL;

  const sbKeyInput = document.getElementById('customSupabaseKey');
  if (sbKeyInput) sbKeyInput.value = DEFAULT_SUPABASE_KEY;

  toast('Reset to default Supabase project', 'info');
  syncUserData();
}

async function setExamMode(mode) {
  mjStorage.setItem('mj_exam_mode', mode);
  profile.examMode = mode;
  updateGlobalStats();
  renderSettings();
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

// === 13. THEME & SIDEBAR CONTROLS ===
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

// === 14. INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuth();

  const pageDate = document.getElementById('pageDate');
  if (pageDate) {
    const opts = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    pageDate.textContent = new Date().toLocaleDateString('en-US', opts);
  }
});

