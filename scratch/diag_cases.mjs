import fs from 'fs';

async function diagnoseCases() {
  const ranks = [
    { rank: 'SP', login: 'SP_0042_1995', password: 'ksp_1709' },
    { rank: 'DGP', login: 'DGP_0001_1983', password: 'ksp_1709' },
    { rank: 'PI', login: 'PI_0007_2003', password: 'ksp_1709' }
  ];

  for (const r of ranks) {
    console.log(`\n=== Testing ${r.rank} (${r.login}) ===`);
    try {
      const loginRes = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: r.login, password: r.password })
      });
      if (!loginRes.ok) {
        console.log(`Login failed for ${r.login}: ${loginRes.status}`);
        continue;
      }
      const loginData = await loginRes.json();
      const token = loginData.access_token;
      
      const endpoints = [
        '/cases',
        '/station/records'
      ];

      for (const ep of endpoints) {
        const res = await fetch(`http://127.0.0.1:8000${ep}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        let data;
        try {
          data = await res.json();
        } catch(e) {
          data = await res.text();
        }
        
        if (!res.ok) {
          console.log(`[ERROR] ${ep} returned ${res.status}:`, data);
        } else {
          console.log(`[OK] ${ep} type: ${typeof data}, isArray: ${Array.isArray(data)}, null: ${data === null}`);
        }
      }
    } catch(err) {
      console.log(`Error testing ${r.login}:`, err);
    }
  }
}

diagnoseCases();
