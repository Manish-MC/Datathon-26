from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

logins = [
    ("PC_10452_2015", "ksp_1709", False),
    ("HC_10218_2011", "ksp_1709", False),
    ("ASI_10084_2009", "ksp_1709", False), 
    ("SI_10021_2007", "ksp_1709", False),
    ("PI_0007_2003", "ksp_1709", False),
    ("SP_0042_1995", "ksp_1709", False), 
    ("DIG_0028_1993", "ksp_1709", False),
    ("IGP_0011_1991", "ksp_1709", False),
    ("ADGP_0004_1987", "ksp_1709", False),
    ("DGP_0001_1983", "ksp_1709", False),
    ("ADMIN_001", "ksp_1709", True)
]

for login_id, pwd, is_admin in logins:
    url = "/auth/admin/login" if is_admin else "/auth/login"
    response = client.post(url, json={"login_id": login_id, "password": pwd})
    if response.status_code == 200:
        data = response.json()
        print(f"SUCCESS: {login_id} (Role: {data.get('role')}, Rank: {data.get('rank', 'Admin')})")
    else:
        print(f"FAILED: {login_id} - Status {response.status_code} - {response.text}")
