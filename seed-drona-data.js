const https = require('https');

const SUPABASE_URL = 'https://fvmbqikdomcjalladwmz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UNWum89AzkwnfNb2BoxdKA_otmSXn5c';

function supabaseRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1${path}`);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data || '{}') });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function seedData() {
  const email = 'diveshsah2@gmail.com';
  console.log(`[Seed] Seeding Supabase database for user: ${email}...`);

  // 1. User Profile
  const profileKey = `drona_user_${email}`;
  const profilePayload = {
    issue_number: profileKey,
    strategy: 'drona_profile',
    predicted_type: 'jee',
    confidence: 100,
    status: 'active',
    stake_units: email,
    reason: JSON.stringify({
      email: email,
      name: 'Divesh Sah',
      class: '12',
      examMode: 'jee',
      targetCollege: 'IIT Bombay / IIT Delhi - Computer Science',
      targetScore: 285,
      avatar: '',
      updatedAt: new Date().toISOString()
    })
  };

  const existingProf = await supabaseRequest(`/global_signals?issue_number=eq.${encodeURIComponent(profileKey)}`);
  if (existingProf.data && existingProf.data.length > 0) {
    console.log('[Seed] Updating existing user profile...');
    await supabaseRequest(`/global_signals?issue_number=eq.${encodeURIComponent(profileKey)}`, 'PATCH', profilePayload);
  } else {
    console.log('[Seed] Creating new user profile...');
    await supabaseRequest('/global_signals', 'POST', profilePayload);
  }

  // 2. Comprehensive Test Arsenal for diveshsah2@gmail.com
  const sampleTests = [
    {
      id: 'mock_test_1',
      number: 'JEE Main Full Syllabus Mock - 01',
      type: 'JEE Main',
      examMode: 'jee',
      date: '2026-08-15',
      maxMarks: { physics: 100, chemistry: 100, mathematics: 100 },
      marks: { physics: 78, chemistry: 86, mathematics: 74 },
      completed: true,
      createdAt: '2026-08-15T10:00:00.000Z'
    },
    {
      id: 'mock_test_2',
      number: 'AITS Part Test - Electrodynamics & Organic',
      type: 'JEE Main',
      examMode: 'jee',
      date: '2026-08-20',
      maxMarks: { physics: 100, chemistry: 100, mathematics: 100 },
      marks: { physics: 84, chemistry: 92, mathematics: 80 },
      completed: true,
      createdAt: '2026-08-20T10:00:00.000Z'
    },
    {
      id: 'mock_test_3',
      number: 'JEE Main All India Ranker Mock - 03',
      type: 'JEE Main',
      examMode: 'jee',
      date: '2026-08-28',
      maxMarks: { physics: 100, chemistry: 100, mathematics: 100 },
      marks: { physics: 88, chemistry: 94, mathematics: 85 },
      completed: true,
      createdAt: '2026-08-28T10:00:00.000Z'
    },
    {
      id: 'mock_test_4',
      number: 'JEE Main Final Sprint Mock - 04',
      type: 'JEE Main',
      examMode: 'jee',
      date: '2026-09-05',
      maxMarks: { physics: 100, chemistry: 100, mathematics: 100 },
      marks: {},
      completed: false,
      createdAt: '2026-08-31T12:00:00.000Z'
    }
  ];

  for (const test of sampleTests) {
    const testKey = `drona_test_${test.id}`;
    const testPayload = {
      issue_number: testKey,
      strategy: 'drona_test',
      predicted_type: test.examMode,
      confidence: test.marks && test.marks.physics !== undefined ? (test.marks.physics + test.marks.chemistry + test.marks.mathematics) : 0,
      status: test.completed ? 'completed' : 'upcoming',
      stake_units: email,
      reason: JSON.stringify({
        ...test,
        userEmail: email
      })
    };

    const exTest = await supabaseRequest(`/global_signals?issue_number=eq.${encodeURIComponent(testKey)}`);
    if (exTest.data && exTest.data.length > 0) {
      console.log(`[Seed] Updating test: ${test.number}`);
      await supabaseRequest(`/global_signals?issue_number=eq.${encodeURIComponent(testKey)}`, 'PATCH', testPayload);
    } else {
      console.log(`[Seed] Inserting test: ${test.number}`);
      await supabaseRequest('/global_signals', 'POST', testPayload);
    }
  }

  console.log('[Seed] User data successfully exported and stored in Supabase!');
}

seedData().catch(console.error);
