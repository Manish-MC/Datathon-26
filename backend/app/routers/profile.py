from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.schema import Employee
from app.services.auth_service import get_current_employee, get_password_hash
from app.services.notification_service import notify_employee
from app.schemas import ProfileResponse, ProfileUpdate
import os
import shutil
from fastapi import File, UploadFile
from pydantic import BaseModel

router = APIRouter(prefix="/profile", tags=["profile"])


# ---------------------------------------------------------------------------
# GET /profile/me
# ---------------------------------------------------------------------------
@router.get("/me", response_model=ProfileResponse)
def get_profile(current_employee: Employee = Depends(get_current_employee)):
    return ProfileResponse(
        EmployeeID=current_employee.EmployeeID,
        LoginID=current_employee.LoginID,
        EmployeeName=current_employee.EmployeeName,
        PhoneNumber=current_employee.PhoneNumber,
        Email=current_employee.Email,
        RankName=current_employee.rank.RankName,
        PhotoURL=current_employee.PhotoURL
    )


# ---------------------------------------------------------------------------
# PATCH /profile/me
# ---------------------------------------------------------------------------
@router.patch("/me", response_model=ProfileResponse)
def update_profile(
    update_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    if update_data.EmployeeName is not None:
        current_employee.EmployeeName = update_data.EmployeeName
    if update_data.PhoneNumber is not None:
        current_employee.PhoneNumber = update_data.PhoneNumber
    if update_data.Email is not None:
        current_employee.Email = update_data.Email

    db.commit()
    db.refresh(current_employee)

    return ProfileResponse(
        EmployeeID=current_employee.EmployeeID,
        LoginID=current_employee.LoginID,
        EmployeeName=current_employee.EmployeeName,
        PhoneNumber=current_employee.PhoneNumber,
        Email=current_employee.Email,
        RankName=current_employee.rank.RankName,
        PhotoURL=current_employee.PhotoURL
    )

# ---------------------------------------------------------------------------
# POST /profile/me/photo
# ---------------------------------------------------------------------------
@router.post("/me/photo", response_model=ProfileResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPG and PNG are allowed.")
    
    # Read to check size (2MB)
    file_bytes = await file.read()
    if len(file_bytes) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max size is 2MB.")
    
    # Reset pointer for saving
    await file.seek(0)
    
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "profile_photos")
    os.makedirs(upload_dir, exist_ok=True)
    
    ext = file.filename.split(".")[-1]
    filename = f"{current_employee.EmployeeID}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    
    with open(filepath, "wb") as buffer:
        buffer.write(file_bytes)
        
    photo_url = f"/uploads/profile_photos/{filename}"
    current_employee.PhotoURL = photo_url
    db.commit()
    db.refresh(current_employee)
    
    return ProfileResponse(
        EmployeeID=current_employee.EmployeeID,
        LoginID=current_employee.LoginID,
        EmployeeName=current_employee.EmployeeName,
        PhoneNumber=current_employee.PhoneNumber,
        Email=current_employee.Email,
        RankName=current_employee.rank.RankName,
        PhotoURL=current_employee.PhotoURL
    )

class PasswordUpdate(BaseModel):
    new_password: str

# ---------------------------------------------------------------------------
# POST /profile/me/password
# ---------------------------------------------------------------------------
@router.post("/me/password")
def change_password(
    data: PasswordUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    current_employee.PasswordHash = get_password_hash(data.new_password)
    db.commit()
    
    notify_employee(
        db=db,
        employee_id=current_employee.EmployeeID,
        title="Password Changed",
        message="Your password was changed successfully.",
        notification_type="account",
        related_id=None
    )
    
    return {"message": "Password changed successfully."}
