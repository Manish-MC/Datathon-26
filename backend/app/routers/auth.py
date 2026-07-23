from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db import get_db
from app.models.schema import Employee
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
        
    if not verify_password(request.password, employee.PasswordHash):
        raise HTTPException(status_code=401, detail="Invalid login credentials")
        
    access_token = create_access_token(
        data={
            "sub": employee.EmployeeID, 
            "login_id": employee.LoginID, 
            "rank": employee.rank.RankName,
            "session_version": employee.SessionVersion
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "employee_name": employee.EmployeeName,
        "login_id": employee.LoginID,
        "rank": employee.rank.RankName,
        "permissions": get_permissions_for_rank(employee.rank.RankName),
        "hierarchy": employee.rank.Hierarchy
    }
