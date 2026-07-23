import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

conn = sqlite3.connect('police_mvp.db')
c = conn.cursor()
c.execute('SELECT LoginID, PasswordHash FROM Employee WHERE LoginID="DGP_0001_1983"')
user = c.fetchone()
print(f"User: {user[0]}, Hash: {user[1]}")

try:
    is_valid = pwd_context.verify("ksp_1709", user[1])
    print(f"Password valid: {is_valid}")
except Exception as e:
    print(f"Error: {e}")
