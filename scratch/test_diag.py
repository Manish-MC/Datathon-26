import requests
import json

BASE_URL = "http://127.0.0.1:8000"

users = [
    ("HC_10218_2011", "ksp_1709"),
    ("PC_10452_2015", "ksp_1709"),
    ("PI_0007_2003", "ksp_1709"),
    ("DGP_0001_1983", "ksp_1709"),
]

endpoints = [
    ("GET", "/health", False),
    ("GET", "/dashboard/stats", False),
    ("GET", "/notifications", True),
    ("GET", "/notifications/unread-count", True),
    ("GET", "/cases", False),
    ("GET", "/cases/map", False),
    ("GET", "/analytics/hotspots", False),
    ("GET", "/alerts?status=open", False),
    ("GET", "/evidence/pending", True),
    ("GET", "/station/team", True),
    ("GET", "/station/records", True),
    ("GET", "/profile/me", True),
]

for login_id, password in users:
    print(f"\n==================== LOGGING IN AS {login_id} ====================")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"login_id": login_id, "password": password})
    if resp.status_code != 200:
        print(f"LOGIN FAILED: {resp.status_code} {resp.text}")
        continue
    
    data = resp.json()
    token = data["access_token"]
    rank = data["rank"]
    perms = data["permissions"]
    print(f"Logged in successfully as {login_id} (Rank: {rank})")
    print(f"Permissions ({len(perms)}): {perms}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    for method, path, needs_auth in endpoints:
        h = headers if needs_auth else {}
        # Try both with and without auth header for non-mandatory endpoints
        res = requests.request(method, f"{BASE_URL}{path}", headers=headers)
        print(f"Endpoint {method} {path:30s} -> Status: {res.status_code} | Response: {res.text[:120]}")
