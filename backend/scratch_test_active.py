import sqlite3

conn = sqlite3.connect('police_mvp.db')
cursor = conn.cursor()
cursor.execute("SELECT EmployeeID, LoginID, Active FROM Employee WHERE LoginID='PC_10452_2015';")
row = cursor.fetchone()
print(f"Row for PC_10452_2015: {row}")
