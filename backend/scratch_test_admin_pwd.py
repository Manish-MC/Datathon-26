import sqlite3

conn = sqlite3.connect('police_mvp.db')
cursor = conn.cursor()
cursor.execute("SELECT PasswordHash FROM AdminUser WHERE LoginID='ADMIN_001'")
hash_val = cursor.fetchone()[0]

from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
for p in ["admin", "password", "ksp_1709", "admin123", "ADMIN_001"]:
    print(f"{p}: {pwd_context.verify(p, hash_val)}")
