import urllib.request
import json
import traceback

base_url = "http://127.0.0.1:8000"

logins = [
    {"login_id": "PC_10452_2015", "password": "ksp_1709", "is_admin": False},
    {"login_id": "HC_10218_2011", "password": "ksp_1709", "is_admin": False},
    {"login_id": "ASI_10084_2009", "password": "ksp_1709", "is_admin": False},
    {"login_id": "SI_10021_2007", "password": "ksp_1709", "is_admin": False},
    {"login_id": "PI_0007_2003", "password": "ksp_1709", "is_admin": False},
    {"login_id": "DGP_0001_1983", "password": "ksp_1709", "is_admin": False},
    {"login_id": "ADMIN_001", "password": "ksp_admin_1709", "is_admin": True},
]

endpoints = {
    "me": "/auth/me",
    "dashboard": "/dashboard/stats",
    "evidence_pending": "/evidence/pending",
    "station_team": "/station/team"
}

results = {}

for login in logins:
    print(f"\n--- Testing {login['login_id']} ---")
    try:
        login_url = f"{base_url}/auth/admin/login" if login["is_admin"] else f"{base_url}/auth/login"
        req = urllib.request.Request(login_url, data=json.dumps(login).encode(), headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read())
        token = data["access_token"]
        print(f"Login SUCCESS. Role: {data.get('role')} | Rank: {data.get('rank')}")
        
        user_res = {"permissions": data.get("permissions", []), "endpoints": {}}
        
        for name, ep in endpoints.items():
            try:
                ep_req = urllib.request.Request(f"{base_url}{ep}")
                ep_req.add_header("Authorization", f"Bearer {token}")
                ep_resp = urllib.request.urlopen(ep_req)
                user_res["endpoints"][name] = ep_resp.getcode()
                print(f"  {name}: {ep_resp.getcode()}")
            except urllib.error.HTTPError as e:
                user_res["endpoints"][name] = e.code
                print(f"  {name}: HTTP {e.code}")
            except Exception as e:
                user_res["endpoints"][name] = str(e)
                print(f"  {name}: {e}")
                
        results[login["login_id"]] = user_res
        
    except Exception as e:
        print(f"Login failed for {login['login_id']}: {e}")

with open("scratch_test_state.json", "w") as f:
    json.dump(results, f, indent=2)
