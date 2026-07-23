import os
from dotenv import load_dotenv

load_dotenv()
gmail = os.getenv('GMAIL_ADDRESS', '')
app_pwd = os.getenv('GMAIL_APP_PASSWORD', '')
demo_mode = os.getenv('DEMO_MODE', '')

masked_gmail = f"{gmail[:2]}***@{gmail.split('@')[1]}" if '@' in gmail else "Not a valid email"
masked_pwd = "Set" if app_pwd else "Not Set"

print(f"GMAIL_ADDRESS: {masked_gmail} (len: {len(gmail)})")
print(f"GMAIL_APP_PASSWORD: {masked_pwd} (len: {len(app_pwd)})")
print(f"DEMO_MODE: {demo_mode}")
