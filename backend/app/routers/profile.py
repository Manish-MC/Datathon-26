from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.schema import Employee
from app.services.auth_service import get_current_employee
from app.schemas import ProfileResponse, ProfileUpdate

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
        RankName=current_employee.rank.RankName
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
        RankName=current_employee.rank.RankName
    )
