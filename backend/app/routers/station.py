from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List

from app.db import get_db
from app.models.schema import Employee, CaseMaster, ComplainantDetails, Victim, Accused
from app import schemas
from app.services.auth_service import require_permission, Employee as AuthEmployee

router = APIRouter(prefix="/station", tags=["station"])

@router.get("/team", response_model=List[schemas.StationTeamMember])
def get_station_team(db: Session = Depends(get_db), current_employee: AuthEmployee = Depends(require_permission("view_assigned_firs"))):
    if not current_employee.UnitID:
        raise HTTPException(status_code=400, detail="Officer is not assigned to a station")
        
    team = db.query(Employee).filter(
        Employee.UnitID == current_employee.UnitID,
        Employee.Active == True
    ).all()
    
    # Map to schema
    result = []
    for emp in team:
        result.append({
            "EmployeeID": emp.EmployeeID,
            "LoginID": emp.LoginID,
            "EmployeeName": emp.EmployeeName,
            "RankName": emp.rank.RankName if emp.rank else "Unknown",
            "PhotoURL": emp.PhotoURL
        })
    return result

@router.get("/records", response_model=List[schemas.CaseMasterList])
def get_station_records(
    q: str = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db), 
    current_employee: AuthEmployee = Depends(require_permission("view_assigned_firs"))
):
    if not current_employee.UnitID:
        raise HTTPException(status_code=400, detail="Officer is not assigned to a station")
        
    query = db.query(CaseMaster).filter(CaseMaster.PoliceStationID == current_employee.UnitID)
    
    if q:
        search_term = f"%{q}%"
        query = query.outerjoin(ComplainantDetails).outerjoin(Victim).outerjoin(Accused).filter(
            or_(
                CaseMaster.CrimeNo.ilike(search_term),
                CaseMaster.BriefFacts.ilike(search_term),
                ComplainantDetails.ComplainantName.ilike(search_term),
                Victim.VictimName.ilike(search_term),
                Accused.AccusedName.ilike(search_term)
            )
        )
        
    cases = query.order_by(desc(CaseMaster.CrimeRegisteredDate)).offset(skip).limit(limit).all()
    
    # Deduplicate because of joins
    unique_cases = {c.CaseMasterID: c for c in cases}.values()
    return list(unique_cases)
