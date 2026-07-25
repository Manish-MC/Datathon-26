import fs from 'fs';

async function testCases() {
  const loginRes = await fetch('http://127.0.0.1:8000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: 'SP_0042_1995', password: 'ksp_1709' })
  });
  const token = (await loginRes.json()).access_token;
  
  const resCases = await fetch(`http://127.0.0.1:8000/cases`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const casesData = await resCases.json();
  
  const loginResPC = await fetch('http://127.0.0.1:8000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: 'PI_0007_2003', password: 'ksp_1709' })
  });
  const tokenPC = (await loginResPC.json()).access_token;
  
  const resStation = await fetch(`http://127.0.0.1:8000/station/records`, {
    headers: { 'Authorization': `Bearer ${tokenPC}` }
  });
  const stationData = await resStation.json();

  console.log("=== First case from /cases ===");
  console.log(casesData[0]);

  console.log("\n=== First case from /station/records ===");
  console.log(stationData[0]);
}

testCases();
