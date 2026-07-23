from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.db import get_db
from app.models.schema import Employee, Rank, AdminUser
from app.services.auth_service import get_current_admin, get_password_hash
from app.permissions import RANK_PREFIX_MAP

router = APIRouter(prefix="/admin", tags=["admin"])

class OfficerCreateRequest(BaseModel):
    RankName: str
    NumericID: str
    BatchYear: str
    FullName: str
    PhoneNumber: Optional[str] = None
    Email: Optional[str] = None
    Password: str

class OfficerResponse(BaseModel):
    EmployeeID: int
    LoginID: str
    FullName: str
    RankName: str
    PhoneNumber: Optional[str] = None
    Email: Optional[str] = None
    Active: bool

@router.get("/officers")
def list_officers(db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    officers = db.query(Employee).join(Rank).all()
    result = []
    for o in officers:
        result.append({
            "EmployeeID": o.EmployeeID,
            "LoginID": o.LoginID,
            "FullName": o.EmployeeName,
            "RankName": o.rank.RankName,
            "PhoneNumber": o.PhoneNumber,
            "Email": o.Email,
            "Active": o.Active
        })
    return result

@router.post("/officers")
def create_officer(req: OfficerCreateRequest, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    # Find rank
    rank = db.query(Rank).filter(Rank.RankName == req.RankName).first()
    if not rank:
        raise HTTPException(status_code=400, detail="Invalid rank name")
        
    # Get prefix
    prefix = None
    for pfx, rname in RANK_PREFIX_MAP.items():
        if rname == req.RankName:
            prefix = pfx
            break
            
    if not prefix:
        raise HTTPException(status_code=400, detail="No prefix mapping for this rank")
        
    # Construct LoginID
    login_id = f"{prefix}_{req.NumericID}_{req.BatchYear}"
    
    # Check if exists
    existing = db.query(Employee).filter(Employee.LoginID == login_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Officer with LoginID {login_id} already exists")
        
    hashed_password = get_password_hash(req.Password)
    
    new_officer = Employee(
        LoginID=login_id,
        PasswordHash=hashed_password,
        EmployeeName=req.FullName,
        PhoneNumber=req.PhoneNumber,
        Email=req.Email,
        RankID=rank.RankID,
        Active=True
    )
    
    db.add(new_officer)
    db.commit()
    db.refresh(new_officer)
    
    return {
        "message": "Officer created successfully",
        "LoginID": login_id,
        "EmployeeID": new_officer.EmployeeID
    }

@router.patch("/officers/{employee_id}/deactivate")
def deactivate_officer(employee_id: int, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    officer = db.query(Employee).filter(Employee.EmployeeID == employee_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
        
    officer.Active = False
    db.commit()
    
    return {"message": f"Officer {officer.LoginID} deactivated"}
