from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db import get_db
from app.models.schema import Employee, AdminUser
from app.services.auth_service import verify_password, create_access_token
from app.permissions import get_permissions_for_rank

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    login_id: str
    password: str

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.LoginID == request.login_id).first()
    if not employee:
        raise HTTPException(status_code=401, detail="Invalid login credentials")
        
    if not employee.Active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
        
    if not verify_password(request.password, employee.PasswordHash):
        raise HTTPException(status_code=401, detail="Invalid login credentials")
        
    access_token = create_access_token(
        data={
            "sub": employee.EmployeeID, 
            "login_id": employee.LoginID, 
            "rank": employee.rank.RankName,
            "session_version": employee.SessionVersion,
            "role": "officer"
        }
    )
    
    # Calculate ZoneID if applicable
    zone_id = None
    if employee.DistrictID:
        from app.models.schema import District, PoliceRange
        emp_district = db.query(District).filter(District.DistrictID == employee.DistrictID).first()
        if emp_district:
            emp_range = db.query(PoliceRange).filter(PoliceRange.RangeID == emp_district.RangeID).first()
            if emp_range:
                zone_id = emp_range.ZoneID

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "employee_name": employee.EmployeeName,
        "login_id": employee.LoginID,
        "rank": employee.rank.RankName,
        "permissions": get_permissions_for_rank(employee.rank.RankName),
        "hierarchy": employee.rank.Hierarchy,
        "role": "officer",
        "zone_id": zone_id,
        "department_id": employee.DepartmentID
    }

@router.post("/admin/login")
def admin_login(request: LoginRequest, db: Session = Depends(get_db)):
    admin_user = db.query(AdminUser).filter(AdminUser.LoginID == request.login_id).first()
    if not admin_user:
        raise HTTPException(status_code=401, detail="Invalid login credentials")
        
    if not verify_password(request.password, admin_user.PasswordHash):
        raise HTTPException(status_code=401, detail="Invalid login credentials")
        
    access_token = create_access_token(
        data={
            "sub": admin_user.AdminID, 
            "login_id": admin_user.LoginID, 
            "role": "admin"
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "employee_name": admin_user.FullName,
        "login_id": admin_user.LoginID,
        "role": "admin"
    }
