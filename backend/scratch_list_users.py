import sqlite3

conn = sqlite3.connect('police_mvp.db')
cursor = conn.cursor()

cursor.execute("""
SELECT e.LoginID, r.RankName 
FROM Employee e
JOIN Rank r ON e.RankID = r.RankID
ORDER BY r.Hierarchy DESC
""")

for row in cursor.fetchall():
    print(row)
    
cursor.execute("SELECT LoginID FROM AdminUser")
print("Admin users:", cursor.fetchall())
