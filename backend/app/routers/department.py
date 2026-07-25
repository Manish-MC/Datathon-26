from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db import get_db
from app.models.schema import CaseMaster, Employee, Department, DepartmentCaseFlag, Rank
from app import schemas
from app.services.auth_service import get_current_employee
from app.permissions import get_permissions_for_rank
from app.services.notification_service import notify_employee

router = APIRouter(prefix="/department", tags=["department"])

@router.get("/all", response_model=List[schemas.DepartmentResponse])
def get_all_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).all()
    return departments

@router.post("/cases/{case_id}/flag", response_model=schemas.DepartmentCaseFlagResponse)
def flag_case_to_department(
    case_id: int,
    flag_data: schemas.DepartmentCaseFlagCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    perms = get_permissions_for_rank(current_employee.rank.RankName)
    if "inter_department_collaboration" not in perms:
        raise HTTPException(status_code=403, detail="Not authorized to flag cases to other departments")
        
    if not current_employee.DepartmentID:
        raise HTTPException(status_code=400, detail="Employee not assigned to a department")
        
    case = db.query(CaseMaster).filter(CaseMaster.CaseMasterID == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    to_dept = db.query(Department).filter(Department.DepartmentID == flag_data.ToDepartmentID).first()
    if not to_dept:
        raise HTTPException(status_code=404, detail="Target department not found")
        
    flag = DepartmentCaseFlag(
        CaseMasterID=case_id,
        FlaggedByEmployeeID=current_employee.EmployeeID,
        FromDepartmentID=current_employee.DepartmentID,
        ToDepartmentID=flag_data.ToDepartmentID,
        Note=flag_data.Note,
        CreatedAt=datetime.now(),
        Status="open"
    )
    db.add(flag)
    db.commit()
    db.refresh(flag)
    
    # Notify target ADGPs
    target_adgps = db.query(Employee).join(Employee.rank)\
                     .filter(Employee.DepartmentID == flag_data.ToDepartmentID, Rank.RankName == "ADGP").all()
                     
    from_dept = db.query(Department).filter(Department.DepartmentID == current_employee.DepartmentID).first()
    from_dept_name = from_dept.DepartmentName if from_dept else "Unknown"
    
    for adgp in target_adgps:
        notify_employee(
            db=db,
            employee_id=adgp.EmployeeID,
            title=f"New Cross-Department Flag: {case.CrimeNo}",
            message=f"Case flagged by {current_employee.EmployeeName} ({from_dept_name} Department). Note: {flag_data.Note}",
            notification_type="department_flag",
            related_id=case_id
        )
        
    return {
        "FlagID": flag.FlagID,
        "CaseMasterID": flag.CaseMasterID,
        "CrimeNo": case.CrimeNo,
        "FlaggedByEmployeeID": current_employee.EmployeeID,
        "FlaggedByEmployeeName": current_employee.EmployeeName,
        "FlaggedByRank": current_employee.rank.RankName,
        "FromDepartmentID": current_employee.DepartmentID,
        "FromDepartmentName": from_dept_name,
        "ToDepartmentID": to_dept.DepartmentID,
        "Note": flag.Note,
        "CreatedAt": flag.CreatedAt,
        "Status": flag.Status
    }

@router.get("/flags", response_model=List[schemas.DepartmentCaseFlagResponse])
def get_department_flags(
    department_id: int = None,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    perms = get_permissions_for_rank(current_employee.rank.RankName)
    if "department_dashboard" not in perms:
        raise HTTPException(status_code=403, detail="Not authorized to view department flags")
        
    if "state_wide_access" not in perms:
        if not current_employee.DepartmentID:
            raise HTTPException(status_code=400, detail="Employee not assigned to a department")
        if department_id and department_id != current_employee.DepartmentID:
            raise HTTPException(status_code=403, detail="Cannot access flags for a different department")
        department_id = current_employee.DepartmentID
    else:
        if not department_id:
            raise HTTPException(status_code=400, detail="Must provide department_id for statewide access")
            
    flags = db.query(DepartmentCaseFlag).filter(DepartmentCaseFlag.ToDepartmentID == department_id)\
              .order_by(DepartmentCaseFlag.CreatedAt.desc()).all()
              
    response_list = []
    for f in flags:
        response_list.append({
            "FlagID": f.FlagID,
            "CaseMasterID": f.CaseMasterID,
            "CrimeNo": f.case.CrimeNo,
            "FlaggedByEmployeeID": f.FlaggedByEmployeeID,
            "FlaggedByEmployeeName": f.flagged_by.EmployeeName,
            "FlaggedByRank": f.flagged_by.rank.RankName,
            "FromDepartmentID": f.FromDepartmentID,
            "FromDepartmentName": f.from_department.DepartmentName,
            "ToDepartmentID": f.ToDepartmentID,
            "Note": f.Note,
            "CreatedAt": f.CreatedAt,
            "Status": f.Status
        })
    return response_list

@router.patch("/flags/{flag_id}/status", response_model=schemas.DepartmentCaseFlagResponse)
def update_department_flag_status(
    flag_id: int,
    status_data: schemas.DepartmentCaseFlagUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    perms = get_permissions_for_rank(current_employee.rank.RankName)
    if "inter_department_collaboration" not in perms:
        raise HTTPException(status_code=403, detail="Not authorized to update flags")
        
    flag = db.query(DepartmentCaseFlag).filter(DepartmentCaseFlag.FlagID == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
        
    if "state_wide_access" not in perms and flag.ToDepartmentID != current_employee.DepartmentID:
        raise HTTPException(status_code=403, detail="Flag belongs to a different department")
        
    if status_data.Status not in ["acknowledged", "resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    flag.Status = status_data.Status
    db.commit()
    db.refresh(flag)
    
    return {
        "FlagID": flag.FlagID,
        "CaseMasterID": flag.CaseMasterID,
        "CrimeNo": flag.case.CrimeNo,
        "FlaggedByEmployeeID": flag.FlaggedByEmployeeID,
        "FlaggedByEmployeeName": flag.flagged_by.EmployeeName,
        "FlaggedByRank": flag.flagged_by.rank.RankName,
        "FromDepartmentID": flag.FromDepartmentID,
        "FromDepartmentName": flag.from_department.DepartmentName,
        "ToDepartmentID": flag.ToDepartmentID,
        "Note": flag.Note,
        "CreatedAt": flag.CreatedAt,
        "Status": flag.Status
    }
