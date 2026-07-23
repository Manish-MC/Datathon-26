const API_BASE_URL = "http://127.0.0.1:8000";

async function apiFetch(endpoint, token, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Fetch Error [${endpoint}]:`, error.message);
    return null;
  }
}

async function runTest() {
  const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({login_id: 'HC_10218_2011', password: 'ksp_1709'})
  });
  const loginData = await loginRes.json();
  const token = loginData.access_token;
  
  const endpoints = [
    '/health',
    '/dashboard/stats',
    '/notifications',
    '/notifications/unread-count',
    '/cases',
    '/cases/map',
    '/analytics/hotspots',
    '/alerts?status=open',
    '/evidence/pending',
    '/station/team',
    '/station/records'
  ];

  for (const ep of endpoints) {
    const res = await apiFetch(ep, token);
    if (res !== null) {
      console.log(`[SUCCESS] ${ep}`);
    }
  }
}

runTest();
