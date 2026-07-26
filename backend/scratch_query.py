import sqlite3

for db_name in ['police_mvp.db', 'app.db', 'db.sqlite', 'police_platform.db']:
    try:
        conn = sqlite3.connect(db_name)
        cursor = conn.cursor()
        
        # Check Employee
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Employee';")
        if cursor.fetchone():
            cursor.execute("SELECT EmployeeID, LoginID, PasswordHash FROM Employee WHERE LoginID='PC_10452_2015';")
            row = cursor.fetchone()
            if row:
                print(f"Found PC_10452_2015 in {db_name}: {row}")
            else:
                print(f"PC_10452_2015 NOT found in {db_name}")
                
            cursor.execute("SELECT COUNT(*) FROM Employee;")
            count = cursor.fetchone()[0]
            print(f"Total Employee rows in {db_name}: {count}")
        else:
            print(f"Table Employee does not exist in {db_name}")
            
    except Exception as e:
        print(f"Error reading {db_name}: {e}")
