import requests

BASE_URL = "http://127.0.0.1:8000"

def login(login_id, password="ksp_1709"):
    r = requests.post(f"{BASE_URL}/auth/login", json={"LoginID": login_id, "Password": password})
    return r.json()

def test_endpoints(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Test Copilot
    print("Testing Copilot...")
    r = requests.post(f"{BASE_URL}/copilot/query", json={"query": "Which district has the highest crime?"}, headers=headers)
    print("Copilot status:", r.status_code)
    
    # 2. Test Anomalies
    print("Testing Anomalies...")
    r = requests.get(f"{BASE_URL}/analytics/statewide-anomalies", headers=headers)
    print("Anomalies status:", r.status_code)
    
    # 3. Test Network Graph
    print("Testing Network Graph...")
    r = requests.get(f"{BASE_URL}/analytics/network-graph", headers=headers)
    print("Network Graph status:", r.status_code)
    
    # 4. Test Timeline
    print("Testing Timeline...")
    r = requests.get(f"{BASE_URL}/analytics/decision-timeline", headers=headers)
    print("Timeline status:", r.status_code)

if __name__ == "__main__":
    print("Logging in as DGP_0001_1983...")
    res = login("DGP_0001_1983")
    if "token" in res:
        print("Login successful.")
        test_endpoints(res["token"])
    else:
        print("Login failed:", res)
