from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta

from app.db import get_db
from app.models.schema import CaseMaster, CaseCategory, CaseStatusMaster, Accused, Unit, Employee
from app.services.auth_service import get_current_employee

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(days: int = Query(180, description="Number of days for time series"), db: Session = Depends(get_db)):
    total_cases = db.query(CaseMaster).count()
    
    # Cases by category
    categories_query = db.query(
        CaseCategory.LookupValue, 
        func.count(CaseMaster.CaseMasterID)
    ).join(CaseMaster, CaseCategory.CaseCategoryID == CaseMaster.CaseCategoryID).group_by(CaseCategory.LookupValue).all()
    
    category_stats = [{"category": name, "count": count} for name, count in categories_query]
    
    # Cases by status
    status_query = db.query(
        CaseStatusMaster.CaseStatusName, 
        func.count(CaseMaster.CaseMasterID)
    ).join(CaseMaster, CaseStatusMaster.CaseStatusID == CaseMaster.CaseStatusID).group_by(CaseStatusMaster.CaseStatusName).all()
    
    status_stats = [{"status": name, "count": count} for name, count in status_query]
    
    # Time series
    start_date = datetime.now() - timedelta(days=days)
    
    if days > 30:
        time_series_query = db.query(
            func.strftime('%Y-%W', CaseMaster.CrimeRegisteredDate).label('period'),
            func.count(CaseMaster.CaseMasterID)
        ).filter(CaseMaster.CrimeRegisteredDate >= start_date).group_by('period').order_by('period').all()
    else:
        time_series_query = db.query(
            func.strftime('%Y-%m-%d', CaseMaster.CrimeRegisteredDate).label('period'),
            func.count(CaseMaster.CaseMasterID)
        ).filter(CaseMaster.CrimeRegisteredDate >= start_date).group_by('period').order_by('period').all()
        
    time_series = [{"date": period, "count": count} for period, count in time_series_query]
    
    return {
        "total_cases": total_cases,
        "by_category": category_stats,
        "by_status": status_stats,
        "time_series": time_series
    }

@router.get("/top-offenders")
def get_top_offenders(db: Session = Depends(get_db), current_employee: Employee = Depends(get_current_employee)):
    # Base query for accused
    query = db.query(
        Accused.AccusedName,
        func.count(CaseMaster.CaseMasterID).label("case_count")
    ).join(CaseMaster, CaseMaster.CaseMasterID == Accused.CaseMasterID)
    
    # Scope to employee
    if current_employee.UnitID:
        query = query.filter(CaseMaster.PoliceStationID == current_employee.UnitID)
    elif current_employee.DistrictID:
        # We need to find units for this district
        units = db.query(Unit.UnitID).filter(Unit.DistrictID == current_employee.DistrictID).all()
        unit_ids = [u[0] for u in units]
        if unit_ids:
            query = query.filter(CaseMaster.PoliceStationID.in_(unit_ids))
            
    # Group and order
    results = query.group_by(Accused.AccusedName).order_by(desc("case_count")).limit(5).all()
    
    offenders = []
    for row in results:
        count = row.case_count
        if count >= 3:
            tier = "High"
        elif count == 2:
            tier = "Medium"
        else:
            tier = "Low"
        offenders.append({"name": row.AccusedName, "case_count": count, "risk_tier": tier})
        
    return offenders

@router.get("/drilldown")
def get_drilldown(db: Session = Depends(get_db), current_employee: Employee = Depends(get_current_employee)):
    if current_employee.UnitID:
        # Station level: Break down by category for this station
        results = db.query(
            CaseCategory.LookupValue.label("name"),
            func.count(CaseMaster.CaseMasterID).label("count")
        ).join(CaseMaster, CaseCategory.CaseCategoryID == CaseMaster.CaseCategoryID)\
         .filter(CaseMaster.PoliceStationID == current_employee.UnitID)\
         .group_by(CaseCategory.LookupValue)\
         .order_by(desc("count")).limit(10).all()
    elif current_employee.DistrictID:
        # District level: Break down by station
        results = db.query(
            Unit.UnitName.label("name"),
            func.count(CaseMaster.CaseMasterID).label("count")
        ).join(CaseMaster, Unit.UnitID == CaseMaster.PoliceStationID)\
         .filter(Unit.DistrictID == current_employee.DistrictID)\
         .group_by(Unit.UnitName)\
         .order_by(desc("count")).limit(10).all()
    else:
        # State/Zone level: Break down by district
        from app.models.schema import District
        results = db.query(
            District.DistrictName.label("name"),
            func.count(CaseMaster.CaseMasterID).label("count")
        ).join(Unit, District.DistrictID == Unit.DistrictID)\
         .join(CaseMaster, Unit.UnitID == CaseMaster.PoliceStationID)\
         .group_by(District.DistrictName)\
         .order_by(desc("count")).limit(10).all()
         
    # Mocking a trend arrow (in real app, compare with previous period)
    drilldown = []
    for i, row in enumerate(results):
        trend = "up" if i % 2 == 0 else "down"
        drilldown.append({"name": row.name, "case_count": row.count, "trend": trend})
        
    return drilldown
