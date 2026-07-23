from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.schema import Employee, Rank, AdminUser
from app.permissions import get_permissions_for_rank

# For MVP, a simple secret key
SECRET_KEY = "ksp_hackathon_super_secret_key"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    # JWT spec requires 'sub' to be a string
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_employee(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "officer":
            raise credentials_exception
            
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        employee_id = int(sub)  # sub is stored as string per JWT spec
        session_version = payload.get("session_version", 1)
    except (jwt.PyJWTError, ValueError, TypeError):
        raise credentials_exception
        
    employee = db.query(Employee).filter(Employee.EmployeeID == employee_id).first()
    if employee is None or not employee.Active:
        raise credentials_exception
        
    if employee.SessionVersion != session_version:
        # Invalidated token
        raise credentials_exception
        
    return employee

def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise credentials_exception
            
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        admin_id = int(sub)
    except (jwt.PyJWTError, ValueError, TypeError):
        raise credentials_exception
        
    admin_user = db.query(AdminUser).filter(AdminUser.AdminID == admin_id).first()
    if admin_user is None:
        raise credentials_exception
        
    return admin_user

class RequirePermission:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, current_employee: Employee = Depends(get_current_employee)):
        rank_name = current_employee.rank.RankName
        permissions = get_permissions_for_rank(rank_name)
        
        # In a real app, DGP might have implicitly all permissions.
        # For this MVP, if they have "state_wide_access" or specific DGP permissions, we can allow everything,
        # or we explicitly define permissions. The prompt requested strict access control based on permissions.
        # Let's say DGP/ADGP/IGP/SP/DySP implicitly have "dismiss_alert", "approve_alert_action", "register_fir" etc.
        # For MVP simplicity, we will just check if the exact string is in their permission list, OR if their hierarchy is high enough.
        # Actually, let's just make it strictly based on the list + hierarchy exceptions if needed.
        # Let's say anyone Inspector (Hierarchy=6) or higher can dismiss/approve alerts.
        # Anyone Sub-Inspector (Hierarchy=7) or higher can register FIRs.
        
        # Action mappings to hierarchy:
        hierarchy_req = {
            "register_fir": 7, # SI and above
            "approve_alert_action": 6, # Inspector and above
            "dismiss_alert": 6 # Inspector and above
        }
        
        emp_hierarchy = current_employee.rank.Hierarchy
        
        if self.required_permission in hierarchy_req:
            if emp_hierarchy > hierarchy_req[self.required_permission]:
                raise HTTPException(status_code=403, detail="Not enough permissions")
            return current_employee
            
        if self.required_permission not in permissions:
             raise HTTPException(status_code=403, detail="Not enough permissions")
             
        return current_employee

def require_permission(permission: str):
    return RequirePermission(permission)
