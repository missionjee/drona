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
  console.log(`[Seed] Initializing Supabase profile for user: ${email}...`);

  // 1. User Profile only
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
    await supabaseRequest(`/global_signals?issue_number=eq.${encodeURIComponent(profileKey)}`, 'PATCH', profilePayload);
  } else {
    await supabaseRequest('/global_signals', 'POST', profilePayload);
  }

  console.log('[Seed] Supabase initialized with clean profile and 0 mock tests.');
}

seedData().catch(console.error);
