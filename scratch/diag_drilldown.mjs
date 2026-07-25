import fs from 'fs';

async function testDrilldown() {
  const ranks = [
    { rank: 'SP', login: 'SP_0042_1995', password: 'ksp_1709' },
    { rank: 'PI', login: 'PI_0007_2003', password: 'ksp_1709' }
  ];

  for (const r of ranks) {
    const loginRes = await fetch('http://127.0.0.1:8000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_id: r.login, password: r.password })
    });
    const token = (await loginRes.json()).access_token;
    
    const res = await fetch(`http://127.0.0.1:8000/dashboard/drilldown`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    let data;
    try { data = await res.json(); } catch(e) { data = await res.text(); }
    console.log(`\n=== Drilldown for ${r.rank} ===`);
    console.log(JSON.stringify(data, null, 2).substring(0, 500));
  }
}

testDrilldown();
