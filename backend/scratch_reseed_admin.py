import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
new_hash = pwd_context.hash("ksp_1709")

conn = sqlite3.connect('police_mvp.db')
cursor = conn.cursor()
cursor.execute("UPDATE AdminUser SET PasswordHash = ? WHERE LoginID = 'ADMIN_001'", (new_hash,))
conn.commit()
print("Updated ADMIN_001 password to 'ksp_1709'")
