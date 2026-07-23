from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.db import get_db
from app.models.schema import CaseMaster, CaseCategory, CaseStatusMaster

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
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
    
    # Time series (weekly) for the last 6 months
    # SQLite function strftime('%Y-%W') groups by Year-WeekNumber
    six_months_ago = datetime.now() - timedelta(days=180)
    
    time_series_query_weekly = db.query(
        func.strftime('%Y-%W', CaseMaster.CrimeRegisteredDate).label('week'),
        func.count(CaseMaster.CaseMasterID)
    ).filter(CaseMaster.CrimeRegisteredDate >= six_months_ago).group_by('week').order_by('week').all()
    
    time_series = [{"date": week, "count": count} for week, count in time_series_query_weekly]
    
    return {
        "total_cases": total_cases,
        "by_category": category_stats,
        "by_status": status_stats,
        "time_series": time_series
    }
