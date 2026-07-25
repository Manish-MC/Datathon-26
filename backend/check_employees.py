import sqlite3

def run():
    conn = sqlite3.connect("police_mvp.db")
    c = conn.cursor()
    c.execute("SELECT LoginID, UnitID, DistrictID, DepartmentID FROM Employee WHERE LoginID IN ('SP_0042_1995', 'DIG_0028_1993', 'IGP_0011_1991', 'ADGP_0004_1987', 'ADGP_0005_1987', 'DGP_0001_1983', 'PI_0007_2003')")
    print(c.fetchall())
    conn.close()

if __name__ == "__main__":
    run()
