from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.db import get_db
from app.services.auth_service import get_current_employee
from app.models.schema import Employee, CaseMaster, Unit, Investigation
from app.schemas import ProfileResponse, OrderInvestigationRequest
from app.services.scope_helpers import get_district_officers
from app.services.notification_service import notify_employee
from app.permissions import get_permissions_for_rank

router = APIRouter(prefix="/district", tags=["district"])

@router.get("/inspectors", response_model=List[ProfileResponse])
def get_district_inspectors(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    if not current_employee.DistrictID:
        raise HTTPException(status_code=400, detail="Employee not assigned to a district")
    
    perms = get_permissions_for_rank(current_employee.rank.RankName)
    if "order_investigation" not in perms:
        raise HTTPException(status_code=403, detail="Not authorized to manage district investigators")

    # Fetch all active inspectors in the same district
    inspectors = get_district_officers(db, current_employee.DistrictID, rank_name="Inspector / SHO")
    # Construct response correctly (Employee -> ProfileResponse schema)
    # The schema relies on Employee properties, but we might need to map RankName
    # Wait, the Employee model has a `rank` relationship so pydantic handles `RankName` if we configure an alias or property.
    # Ah! In schemas.py, ProfileResponse expects `RankName`.
    # Let's map it explicitly since pydantic from_attributes might not traverse `rank.RankName` automatically unless defined.
    result = []
    for emp in inspectors:
        result.append(ProfileResponse(
            EmployeeID=emp.EmployeeID,
            LoginID=emp.LoginID,
            EmployeeName=emp.EmployeeName,
            PhoneNumber=emp.PhoneNumber,
            Email=emp.Email,
            RankName=emp.rank.RankName if emp.rank else "Unknown",
            PhotoURL=emp.PhotoURL
        ))
    return result

@router.post("/cases/{case_id}/order-investigation")
def order_case_investigation(
    case_id: int,
    req: OrderInvestigationRequest,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    perms = get_permissions_for_rank(current_employee.rank.RankName)
    if "order_investigation" not in perms:
        raise HTTPException(status_code=403, detail="Not authorized to order investigations")

    case = db.query(CaseMaster).filter(CaseMaster.CaseMasterID == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    unit = db.query(Unit).filter(Unit.UnitID == case.PoliceStationID).first()
    if not unit or unit.DistrictID != current_employee.DistrictID:
        raise HTTPException(status_code=403, detail="Case is outside your district jurisdiction")

    # Determine targets
    targets = []
    if req.NotifyAllInspectors:
        targets = get_district_officers(db, current_employee.DistrictID, rank_name="Inspector / SHO")
    elif req.TargetInspectorEmployeeID:
        target = db.query(Employee).filter(Employee.EmployeeID == req.TargetInspectorEmployeeID, Employee.DistrictID == current_employee.DistrictID).first()
        if not target:
            raise HTTPException(status_code=404, detail="Target inspector not found in your district")
        targets = [target]
    else:
        raise HTTPException(status_code=400, detail="Must specify a target inspector or notify all")

    if not targets:
        raise HTTPException(status_code=400, detail="No eligible inspectors found to notify")

    # Create investigation record
    investigation = Investigation(
        CaseMasterID=case_id,
        OrderedByEmployeeID=current_employee.EmployeeID,
        LeadOfficerEmployeeID=None,
        DirectiveNote=req.DirectiveNote,
        CreatedAt=datetime.now()
    )
    db.add(investigation)
    db.flush()
    
    # Create notifications
    for target in targets:
        notify_employee(
            db,
            employee_id=target.EmployeeID,
            title="New Investigation Ordered",
            message=f"Investigation ordered for Case #{case_id} by {current_employee.rank.RankName} {current_employee.EmployeeName}. Note: {req.DirectiveNote or 'No specific instructions.'}",
            notification_type="investigation_order",
            related_id=investigation.InvestigationID,
            is_urgent=True
        )

    db.commit()
    return {"message": "Investigation order issued successfully", "targets_notified": len(targets)}
