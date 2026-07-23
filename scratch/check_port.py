import requests

for port in [5173, 5174, 3000, 8080]:
    try:
        r = requests.get(f"http://localhost:{port}")
        print(f"Port {port}: {r.status_code}")
    except Exception as e:
        print(f"Port {port}: down ({e})")
