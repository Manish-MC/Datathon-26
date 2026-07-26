import sqlite3
conn = sqlite3.connect('police_mvp.db')
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM CaseMaster")
cases = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM Evidence")
evidence = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM Alert")
alerts = cursor.fetchone()[0]
print(f"Cases: {cases}, Evidence: {evidence}, Alerts: {alerts}")
