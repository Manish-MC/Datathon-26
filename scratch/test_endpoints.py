import urllib.request
import json
import traceback

base_url = "http://127.0.0.1:8000"

endpoints = [
    "/cases/map",
    "/analytics/hotspots",
    "/cases",
    "/dashboard/stats",
    "/alerts",
    "/station/records"
]

for ep in endpoints:
    url = f"{base_url}{ep}"
    print(f"Testing {url}")
    try:
        req = urllib.request.Request(url)
        # Login to get token first
        login_req = urllib.request.Request(f"{base_url}/auth/login", data=json.dumps({"login_id": "HC_10218_2011", "password": "ksp_1709", "is_admin": False}).encode(), headers={"Content-Type": "application/json"})
        login_resp = urllib.request.urlopen(login_req)
        token = json.loads(login_resp.read())["access_token"]
        
        req.add_header("Authorization", f"Bearer {token}")
        response = urllib.request.urlopen(req)
        
        body = response.read()
        print(f"  -> SUCCESS: {response.getcode()}")
        try:
            parsed = json.loads(body)
            print(f"  -> JSON PARSE SUCCESS: Array/Dict length {len(parsed)}")
        except Exception as e:
            print(f"  -> JSON PARSE ERROR: {e}")
            print(f"  -> BODY: {body[:100]}")
    except urllib.error.HTTPError as e:
        print(f"  -> HTTP ERROR: {e.code}")
        print(f"  -> BODY: {e.read().decode()}")
    except Exception as e:
        print(f"  -> ERROR: {e}")
        traceback.print_exc()
