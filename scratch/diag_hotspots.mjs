import fs from 'fs';

async function testHotspots() {
  const loginRes = await fetch('http://127.0.0.1:8000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: 'SP_0042_1995', password: 'ksp_1709' })
  });
  const token = (await loginRes.json()).access_token;
  
  const resHotspots = await fetch(`http://127.0.0.1:8000/analytics/hotspots`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const hotspotsData = await resHotspots.json();

  console.log("=== Hotspots ===");
  console.log(hotspotsData);
}

testHotspots();
