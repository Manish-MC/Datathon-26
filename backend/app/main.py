import csv
import os
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi.staticfiles import StaticFiles

from app.db import engine, Base, get_db, SessionLocal
from app.models.schema import (
    Unit, CaseCategory, CaseStatusMaster, CaseMaster,
    ComplainantDetails, Victim, Accused, ArrestSurrender,
    Rank, Employee, PendingOTP, AdminUser, PoliceZone, PoliceRange, District,
    Department
)
from app.services.auth_service import get_password_hash
from app.permissions import RANK_SEED_DATA

app = FastAPI(title="AI-Powered Police Analytics Platform API", version="1.0.0")

from app.routers import cases, dashboard, analytics, alerts, demo, auth, profile, admin, notifications, evidence, station, district, department, copilot
app.include_router(cases.router)
app.include_router(district.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(alerts.router)
app.include_router(demo.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(admin.router)
app.include_router(notifications.router)
app.include_router(evidence.router)
app.include_router(station.router)
app.include_router(department.router)
app.include_router(copilot.router)

# Mount static files for uploads
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(os.path.join(uploads_dir, "profile_photos"), exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "evidence"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon demo, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_date(date_str):
    if not date_str or date_str == "":
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return None

def seed_database():
    db = SessionLocal()
    try:
        if db.query(PoliceZone).first() is None:
            print("Seeding Police Zones, Ranges, and Districts...")
            zones = [
                {"ZoneID": 1, "ZoneName": "State Zone 1"},
                {"ZoneID": 2, "ZoneName": "State Zone 2"}
            ]
            for z in zones:
                db.add(PoliceZone(**z))
            db.commit()

            ranges = [
                {"RangeID": 1, "RangeName": "Central Range", "ZoneID": 1},
                {"RangeID": 2, "RangeName": "Northern Range", "ZoneID": 1},
                {"RangeID": 3, "RangeName": "Southern Range", "ZoneID": 2}
            ]
            for r in ranges:
                db.add(PoliceRange(**r))
            db.commit()

            districts = [
                {"DistrictID": 1, "DistrictName": "Bengaluru Central", "RangeID": 1},
                {"DistrictID": 2, "DistrictName": "Bengaluru West", "RangeID": 1},
                {"DistrictID": 3, "DistrictName": "Bengaluru North", "RangeID": 2},
                {"DistrictID": 4, "DistrictName": "Bengaluru East", "RangeID": 2},
                {"DistrictID": 5, "DistrictName": "Bengaluru South", "RangeID": 3},
                {"DistrictID": 6, "DistrictName": "Bengaluru South East", "RangeID": 3},
            ]
            for d in districts:
                db.add(District(**d))
            db.commit()

        if db.query(Department).first() is None:
            print("Seeding Departments...")
            departments = [
                {"DepartmentID": 1, "DepartmentName": "Crime"},
                {"DepartmentID": 2, "DepartmentName": "Traffic"},
                {"DepartmentID": 3, "DepartmentName": "CID"},
                {"DepartmentID": 4, "DepartmentName": "Cyber"}
            ]
            for dept in departments:
                db.add(Department(**dept))
            db.commit()
        # Seed Auth Data
        if db.query(AdminUser).first() is None:
            print("Seeding Admin User...")
            hashed_admin_pwd = get_password_hash("ksp_admin_1709")
            admin_user = AdminUser(
                LoginID="ADMIN_001",
                PasswordHash=hashed_admin_pwd,
                FullName="System Administrator",
                CreatedAt=datetime.now()
            )
            db.add(admin_user)
            db.commit()

        if db.query(Rank).first() is None:
            print("Seeding Ranks and Employees...")
            hashed_pwd = get_password_hash("ksp_1709")
            
            rank_map = {}
            for rank_data in RANK_SEED_DATA:
                rank = Rank(RankName=rank_data["RankName"], Hierarchy=rank_data["Hierarchy"])
                db.add(rank)
                db.flush() # to get rank.RankID
                rank_map[rank_data["RankName"]] = rank.RankID
                
            demo_accounts = [
                ("PC_10452_2015", "Police Constable", "Police Constable", None),
                ("HC_10218_2011", "Head Constable", "Head Constable", None),
                ("ASI_10084_2009", "Assistant Sub-Inspector", "Assistant Sub-Inspector", None),
                ("SI_10021_2007", "Sub-Inspector", "Sub-Inspector", None),
                ("PI_0007_2003", "Inspector / SHO", "Inspector / SHO", None),
                ("DYSP_015_1999", "DySP / ACP", "DySP / ACP", None),
                ("SP_0042_1995", "SP / DCP", "SP / DCP", None),
                ("DIG_0028_1993", "DIG", "DIG", None),
                ("IGP_0011_1991", "IGP", "IGP", None),
                ("ADGP_0004_1987", "ADGP (Crime)", "ADGP", 1), # Crime department
                ("ADGP_0005_1987", "ADGP (Cyber)", "ADGP", 4), # Cyber department
                ("DGP_0001_1983", "DGP", "DGP", None)
            ]
            for i, (login_id, emp_name, rank_name, dept_id) in enumerate(demo_accounts):
                existing = db.query(Employee).filter_by(LoginID=login_id).first()
                if not existing:
                    # Mock phone number based on index for variety
                    mock_phone = f"98765432{i:02d}"
                    mock_email = f"{login_id.lower()}@ksp.gov.in"
                    
                    db.add(Employee(
                        LoginID=login_id,
                        PasswordHash=hashed_pwd,
                        EmployeeName=emp_name,
                        PhoneNumber=mock_phone,
                        Email=mock_email,
                        RankID=rank_map[rank_name],
                        UnitID=1,  # Default to Koramangala
                        DepartmentID=dept_id
                    ))
            db.commit()

        # Check if database has already been seeded with cases
        if db.query(CaseMaster).first() is not None:
            print("Cases already seeded.")
            return

        print("Seeding database from CSV...")
        csv_path = os.path.join(os.path.dirname(__file__), "..", "sample_data", "fir_sample.csv")
        if not os.path.exists(csv_path):
            print(f"Error: CSV file not found at {csv_path}")
            return

        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            
            # Keep track of units, categories, statuses we have inserted to avoid duplicates
            units_inserted = set()
            categories_inserted = set()
            statuses_inserted = set()

            for row in reader:
                # 1. Seed Units (Police Stations)
                unit_id = int(row["PoliceStationID"])
                if unit_id not in units_inserted:
                    unit = db.query(Unit).filter_by(UnitID=unit_id).first()
                    if not unit:
                        unit = Unit(UnitID=unit_id, UnitName=row["PoliceStationName"], DistrictID=(unit_id % 6) + 1)
                        db.add(unit)
                    units_inserted.add(unit_id)

                # 2. Seed Case Categories (Default mapped to Crime - Dept 1)
                cat_id = int(row["CaseCategoryID"])
                if cat_id not in categories_inserted:
                    category = db.query(CaseCategory).filter_by(CaseCategoryID=cat_id).first()
                    if not category:
                        category = CaseCategory(CaseCategoryID=cat_id, LookupValue=row["CaseCategoryName"], DepartmentID=1)
                        db.add(category)
                    elif not category.DepartmentID:
                        category.DepartmentID = 1 # update existing to Crime
                    categories_inserted.add(cat_id)

                # 3. Seed Case Status
                status_id = int(row["CaseStatusID"])
                if status_id not in statuses_inserted:
                    status = db.query(CaseStatusMaster).filter_by(CaseStatusID=status_id).first()
                    if not status:
                        status = CaseStatusMaster(CaseStatusID=status_id, CaseStatusName=row["CaseStatusName"])
                        db.add(status)
                    statuses_inserted.add(status_id)

                # Flush to ensure FK integrity
                db.commit()

                # 4. Seed Case Master
                case = CaseMaster(
                    CrimeNo=row["CrimeNo"],
                    CaseNo=row["CaseNo"],
                    CrimeRegisteredDate=parse_date(row["CrimeRegisteredDate"]),
                    PoliceStationID=unit_id,
                    CaseCategoryID=cat_id,
                    GravityOffenceID=int(row["GravityOffenceID"]),
                    CrimeMajorHeadID=int(row["CrimeMajorHeadID"]),
                    CrimeMinorHeadID=int(row["CrimeMinorHeadID"]),
                    CaseStatusID=status_id,
                    IncidentFromDate=parse_date(row["IncidentFromDate"]),
                    IncidentToDate=parse_date(row["IncidentToDate"]),
                    latitude=float(row["latitude"]),
                    longitude=float(row["longitude"]),
                    BriefFacts=row["BriefFacts"]
                )
                db.add(case)
                db.flush() # gets case.CaseMasterID

                # 5. Seed Complainant Details
                comp_age = int(row["ComplainantAge"]) if row["ComplainantAge"] else None
                complainant = ComplainantDetails(
                    CaseMasterID=case.CaseMasterID,
                    ComplainantName=row["ComplainantName"],
                    AgeYear=comp_age,
                    GenderID=int(row["ComplainantGender"])
                )
                db.add(complainant)

                # 6. Seed Victim Details
                vic_age = int(row["VictimAge"]) if row["VictimAge"] else None
                victim = Victim(
                    CaseMasterID=case.CaseMasterID,
                    VictimName=row["VictimName"],
                    AgeYear=vic_age,
                    GenderID=int(row["VictimGender"])
                )
                db.add(victim)

                # 7. Seed Accused Details
                acc_age = int(row["AccusedAge"]) if row["AccusedAge"] else None
                person_id = int(row["AccusedPersonID"]) if row["AccusedPersonID"] else None
                accused = Accused(
                    CaseMasterID=case.CaseMasterID,
                    AccusedName=row["AccusedName"],
                    AgeYear=acc_age,
                    GenderID=int(row["AccusedGender"]),
                    PersonID=person_id
                )
                db.add(accused)

                # 8. Seed Arrest Surrender Details (optional based on status)
                arrest_date_parsed = parse_date(row["ArrestSurrenderDate"])
                if arrest_date_parsed:
                    arrest = ArrestSurrender(
                        CaseMasterID=case.CaseMasterID,
                        ArrestSurrenderDate=arrest_date_parsed,
                        ArrestSurrenderTypeID=int(row["ArrestSurrenderTypeID"])
                    )
                    db.add(arrest)

            db.commit()
            print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

# Startup Events
@app.on_event("startup")
def on_startup():
    # Create SQLite tables
    Base.metadata.create_all(bind=engine)
    # Seed the tables from CSV
    seed_database()
    
    # Generate initial alerts on startup
    db = SessionLocal()
    try:
        from app.services.alert_engine import generate_cluster_alerts, generate_hotspot_alerts
        generate_cluster_alerts(db)
        generate_hotspot_alerts(db)
    except Exception as e:
        print(f"Error generating initial alerts: {e}")
    finally:
        db.close()

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Check SQLite db connection with raw SQL query
        db.execute(text("SELECT 1"))
        db_alive = True
    except Exception as e:
        db_alive = False
        return {"status": "unhealthy", "db_connected": False, "error": str(e)}

    # Get some quick stats to display in health response
    case_count = db.query(CaseMaster).count()
    unit_count = db.query(Unit).count()
    accused_count = db.query(Accused).count()
    
    return {
        "status": "healthy",
        "db_connected": db_alive,
        "db_stats": {
            "cases": case_count,
            "units_police_stations": unit_count,
            "accused_records": accused_count
        }
    }
