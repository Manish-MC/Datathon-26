import requests

for port in [5173, 5174, 5175, 3000]:
    try:
        r = requests.get(f"http://127.0.0.1:{port}", timeout=1)
        print(f"Port {port}: {r.status_code}")
    except Exception as e:
        print(f"Port {port}: down")
