import fs from 'fs';

async function logStats() {
  const loginRes = await fetch('http://127.0.0.1:8000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: 'SP_0042_1995', password: 'ksp_1709' })
  });
  const token = (await loginRes.json()).access_token;
  
  const res = await fetch(`http://127.0.0.1:8000/dashboard/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(JSON.stringify(await res.json(), null, 2));
}

logStats();
