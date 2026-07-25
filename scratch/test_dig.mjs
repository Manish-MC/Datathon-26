import fs from 'fs';

async function testDrilldown() {
  const loginRes = await fetch('http://127.0.0.1:8000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: 'DIG_0028_1993', password: 'ksp_1709' })
  });
  const token = (await loginRes.json()).access_token;
  
  const resDrilldown = await fetch(`http://127.0.0.1:8000/dashboard/drilldown`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const text = await resDrilldown.text();
  console.log("=== DIG Drilldown ===");
  console.log(text.substring(0, 500));
}

testDrilldown();
