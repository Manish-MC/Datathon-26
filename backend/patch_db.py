import sqlite3

db_path = "police_mvp.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute('ALTER TABLE CaseMaster ADD COLUMN ApprovalStatus VARCHAR NOT NULL DEFAULT "pending"')
    print("Added ApprovalStatus")
except Exception as e:
    print("ApprovalStatus err:", e)

try:
    cursor.execute('ALTER TABLE CaseMaster ADD COLUMN ApprovedByEmployeeID INTEGER')
    print("Added ApprovedByEmployeeID")
except Exception as e:
    print("ApprovedByEmployeeID err:", e)
    
try:
    cursor.execute('ALTER TABLE CaseMaster ADD COLUMN ApprovedByRankName VARCHAR')
    print("Added ApprovedByRankName")
except Exception as e:
    print("ApprovedByRankName err:", e)
    
try:
    cursor.execute('ALTER TABLE CaseMaster ADD COLUMN ApprovedAt DATETIME')
    print("Added ApprovedAt")
except Exception as e:
    print("ApprovedAt err:", e)

conn.commit()
conn.close()
print("DB Patched.")
