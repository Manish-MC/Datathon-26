from sqlalchemy.orm import Session
from app.models.schema import CopilotQueryLog, Employee, District, Unit, CaseMaster, CaseCategory, Alert, Department
from sqlalchemy import func
from datetime import datetime, timedelta
import re

def match_intent(query: str, db: Session, current_employee: Employee) -> dict:
    q = query.lower().strip()
    
    # Intent 1: Highest crime district / district comparison
    if "district" in q and ("highest" in q or "worst" in q or "compare" in q or "crime" in q):
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        district_counts = db.query(
            District.DistrictName,
            func.count(CaseMaster.CaseMasterID).label("count")
        ).join(Unit, Unit.DistrictID == District.DistrictID)\
         .join(CaseMaster, CaseMaster.PoliceStationID == Unit.UnitID)\
         .filter(CaseMaster.CrimeRegisteredDate >= thirty_days_ago)\
         .group_by(District.DistrictName)\
         .order_by(func.count(CaseMaster.CaseMasterID).desc()).all()
         
        if not district_counts:
            text = "I couldn't find any recent cases to compare districts."
        else:
            top_district = district_counts[0]
            text = f"Based on recent data (last 30 days), {top_district.DistrictName} has the highest number of registered cases ({top_district.count} cases)."
            if len(district_counts) > 1:
                text += f" The next highest is {district_counts[1].DistrictName} with {district_counts[1].count} cases."
                
        return {
            "text": text,
            "endpoint_used": "GET /analytics/district-comparison (Internal Logic)",
            "intent": "district_comparison"
        }
        
    # Intent 2: Alerts / Open Alerts
    if "alert" in q or "open alert" in q:
        open_alerts = db.query(Alert).filter(Alert.Status == "open").count()
        text = f"There are currently {open_alerts} open alerts statewide requiring review."
        return {
            "text": text,
            "endpoint_used": "GET /alerts (Internal Logic)",
            "intent": "alerts_summary"
        }
        
    # Intent 3: Department performance
    if "department" in q and ("performance" in q or "kpi" in q or "stats" in q):
        if not current_employee.DepartmentID:
            return {
                "text": "You are not assigned to a specific department to view department performance.",
                "endpoint_used": "GET /analytics/department-kpis",
                "intent": "department_performance_error"
            }
            
        dept = db.query(Department).filter(Department.DepartmentID == current_employee.DepartmentID).first()
        dept_name = dept.DepartmentName if dept else "Unknown"
        
        thirty_days_ago = datetime.now() - timedelta(days=30)
        cases_count = db.query(CaseMaster).join(CaseCategory)\
            .filter(CaseCategory.DepartmentID == current_employee.DepartmentID, CaseMaster.CrimeRegisteredDate >= thirty_days_ago).count()
            
        text = f"For the {dept_name} department, there have been {cases_count} cases registered in the last 30 days."
        return {
            "text": text,
            "endpoint_used": f"GET /analytics/department-kpis?department_id={current_employee.DepartmentID}",
            "intent": "department_performance"
        }
        
    # Intent 4: Trend / Category
    if "trend" in q:
        ninety_days = datetime.now() - timedelta(days=90)
        recent_count = db.query(CaseMaster).filter(CaseMaster.CrimeRegisteredDate >= ninety_days).count()
        
        text = f"Statewide case trend: {recent_count} cases were registered in the last 90 days."
        return {
            "text": text,
            "endpoint_used": "GET /analytics/district-comparison (Trend Logic)",
            "intent": "trend_analysis"
        }

    # Fallback
    return {
        "text": "I can help with district comparisons, crime trends, alerts, and department performance — try asking about one of those.",
        "endpoint_used": None,
        "intent": "unmatched"
    }

def process_query_and_log(query: str, db: Session, current_employee: Employee) -> dict:
    result = match_intent(query, db, current_employee)
    
    # Log query
    log_entry = CopilotQueryLog(
        Query=query,
        MatchedIntent=result["intent"],
        EmployeeID=current_employee.EmployeeID,
        CreatedAt=datetime.now()
    )
    db.add(log_entry)
    db.commit()
    
    return result
