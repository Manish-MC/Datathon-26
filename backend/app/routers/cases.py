from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import List, Optional
from datetime import datetime

from app.db import get_db
from app.models.schema import CaseMaster, Unit, ComplainantDetails, Victim, Accused, CaseSummary
from app import schemas
from app.services.nlp_summarizer import generate_summary
from app.services.auth_service import require_permission, Employee

router = APIRouter(prefix="/cases", tags=["cases"])

@router.get("", response_model=List[schemas.CaseMasterList])
def list_cases(
    skip: int = 0,
    limit: int = 50,
    station_id: Optional[int] = None,
    category_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(CaseMaster)
        
        if station_id:
            query = query.filter(CaseMaster.PoliceStationID == station_id)
        if category_id:
            query = query.filter(CaseMaster.CaseCategoryID == category_id)
        if start_date:
            query = query.filter(CaseMaster.CrimeRegisteredDate >= start_date)
        if end_date:
            query = query.filter(CaseMaster.CrimeRegisteredDate <= end_date)
            
        cases = query.order_by(desc(CaseMaster.CrimeRegisteredDate)).offset(skip).limit(limit).all()
        return cases
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cases: {str(e)}")

@router.post("", response_model=dict)
def create_case(case_in: schemas.CaseCreate, db: Session = Depends(get_db), current_employee: Employee = Depends(require_permission("register_fir"))):
    try:
        new_case = CaseMaster(
            CrimeNo=case_in.CrimeNo,
            CaseNo=f"{case_in.CrimeNo}/{datetime.now().year}",
            CrimeRegisteredDate=datetime.now(),
            PoliceStationID=case_in.PoliceStationID,
            CaseCategoryID=case_in.CaseCategoryID,
            GravityOffenceID=1,
            CrimeMajorHeadID=case_in.CaseCategoryID,
            CrimeMinorHeadID=0,
            CaseStatusID=1,
            IncidentFromDate=case_in.IncidentFromDate,
            latitude=case_in.latitude,
            longitude=case_in.longitude,
            BriefFacts=case_in.BriefFacts
        )
        db.add(new_case)
        db.commit()
        db.refresh(new_case)
        
        # Notify all officers at the station
        from app.services.notification_service import notify_station_rank_and_above, notify_station_below_rank
        notify_station_rank_and_above(
            db=db,
            unit_id=case_in.PoliceStationID,
            min_hierarchy_level=100, # All ranks
            title="New FIR Registered",
            message=f"A new case (Crime No: {case_in.CrimeNo}) has been filed at your station.",
            notification_type="new_fir",
            related_id=new_case.CaseMasterID
        )

        if getattr(case_in, "BroadcastOnCreate", False):
            # Check if user has permission
            if "broadcast_urgent_alert" in current_employee.permissions:
                msg = getattr(case_in, "BroadcastReason", None) or f"Immediate inspection required on Case {case_in.CrimeNo} — flagged by {current_employee.EmployeeName}"
                notify_station_below_rank(
                    db=db,
                    unit_id=case_in.PoliceStationID,
                    above_hierarchy_level=current_employee.rank.Hierarchy,
                    title="Urgent Case Alert",
                    message=msg,
                    notification_type="urgent_case_alert",
                    related_id=new_case.CaseMasterID
                )

        # Trigger Alerts
        from app.services.alert_engine import generate_cluster_alerts, generate_hotspot_alerts
        new_cluster_alerts = generate_cluster_alerts(db, target_case_id=new_case.CaseMasterID)
        new_hotspot_alerts = generate_hotspot_alerts(db, target_lat=new_case.latitude, target_lon=new_case.longitude)

        # Combine all new alerts
        all_new_alerts = new_cluster_alerts + new_hotspot_alerts
        
        # Serialize alerts for response
        alerts_data = [
            {
                "AlertID": a.AlertID,
                "AlertType": a.AlertType,
                "Reason": a.Reason,
                "Score": a.Score,
                "Status": a.Status
            } for a in all_new_alerts
        ]

        # Fetch full case data to return using schemas.CaseMasterList
        case_full = db.query(CaseMaster).filter(CaseMaster.CaseMasterID == new_case.CaseMasterID).first()
        case_data = schemas.CaseMasterList.model_validate(case_full).model_dump(mode='json')

        return {
            "case": case_data,
            "new_alerts": alerts_data
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create case: {str(e)}")

@router.get("/search", response_model=List[schemas.CaseMasterList])
def search_cases(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    try:
        search_term = f"%{q}%"
        
        cases = db.query(CaseMaster).outerjoin(ComplainantDetails).outerjoin(Victim).outerjoin(Accused).filter(
            or_(
                CaseMaster.CrimeNo.ilike(search_term),
                CaseMaster.BriefFacts.ilike(search_term),
                ComplainantDetails.ComplainantName.ilike(search_term),
                Victim.VictimName.ilike(search_term),
                Accused.AccusedName.ilike(search_term)
            )
        ).order_by(desc(CaseMaster.CrimeRegisteredDate)).limit(50).all()
        
        # Deduplicate because of joins
        unique_cases = {c.CaseMasterID: c for c in cases}.values()
        return list(unique_cases)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/map", response_model=List[schemas.CaseMapItem])
def get_cases_map(db: Session = Depends(get_db)):
    try:
        cases = db.query(
            CaseMaster.CaseMasterID,
            CaseMaster.latitude,
            CaseMaster.longitude,
            CaseMaster.CrimeMajorHeadID,
            CaseMaster.CrimeRegisteredDate,
            CaseMaster.CrimeNo
        ).all()
        
        return [schemas.CaseMapItem(**case._mapping) for case in cases]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch map cases: {str(e)}")

@router.get("/{case_id}", response_model=schemas.CaseMasterDetail)
def get_case(case_id: int, db: Session = Depends(get_db)):
    try:
        case = db.query(CaseMaster).filter(CaseMaster.CaseMasterID == case_id).first()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.get("/{case_id}/summary", response_model=schemas.CaseSummaryBase)
def get_or_generate_summary(case_id: int, db: Session = Depends(get_db)):
    # Check if summary already exists
    summary = db.query(CaseSummary).filter(CaseSummary.CaseMasterID == case_id).first()
    if summary:
        return summary
        
    # Get the case to summarize
    case = db.query(CaseMaster).filter(CaseMaster.CaseMasterID == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    if not case.BriefFacts:
        raise HTTPException(status_code=400, detail="Case has no brief facts to summarize")
        
    # Generate the summary
    try:
        summary_text = generate_summary(case.BriefFacts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")
        
    # Save the summary to database
    new_summary = CaseSummary(
        CaseMasterID=case_id,
        SummaryText=summary_text,
        GeneratedAt=datetime.now()
    )
    db.add(new_summary)
    db.commit()
    db.refresh(new_summary)
    
    return new_summary

@router.post("/{case_id}/summary/regenerate", response_model=schemas.CaseSummaryBase)
def regenerate_summary(case_id: int, db: Session = Depends(get_db)):
    # Get the case to summarize
    case = db.query(CaseMaster).filter(CaseMaster.CaseMasterID == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    if not case.BriefFacts:
        raise HTTPException(status_code=400, detail="Case has no brief facts to summarize")
        
    # Generate the summary
    try:
        summary_text = generate_summary(case.BriefFacts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")
        
    # Check if summary already exists
    summary = db.query(CaseSummary).filter(CaseSummary.CaseMasterID == case_id).first()
    
    if summary:
        summary.SummaryText = summary_text
        summary.GeneratedAt = datetime.now()
    else:
        summary = CaseSummary(
            CaseMasterID=case_id,
            SummaryText=summary_text,
            GeneratedAt=datetime.now()
        )
        db.add(summary)
        
    db.commit()
    db.refresh(summary)
    
    return summary

@router.get("/{case_id}/similar", response_model=List[schemas.SimilarCase])
def get_similar_cases(case_id: int, limit: int = 5, db: Session = Depends(get_db)):
    try:
        from app.services.similarity_matcher import find_similar_cases
        matches = find_similar_cases(case_id, db, limit)
        return matches
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find similar cases: {str(e)}")

@router.post("/{case_id}/broadcast-alert", response_model=dict)
def broadcast_urgent_alert(case_id: int, body: schemas.BroadcastRequest, db: Session = Depends(get_db), current_employee: Employee = Depends(require_permission("broadcast_urgent_alert"))):
    case = db.query(CaseMaster).filter(CaseMaster.CaseMasterID == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    if case.PoliceStationID != current_employee.UnitID:
        raise HTTPException(status_code=403, detail="Cannot broadcast alerts for a different station")
        
    custom_message = body.reason if body and body.reason else None
    message = custom_message or f"Immediate inspection required on Case {case.CrimeNo} — flagged by {current_employee.EmployeeName}"
    
    from app.services.notification_service import notify_station_below_rank
    notify_station_below_rank(
        db=db,
        unit_id=case.PoliceStationID,
        above_hierarchy_level=current_employee.rank.Hierarchy,
        title="Urgent Case Alert",
        message=message,
        notification_type="urgent_case_alert",
        related_id=case_id
    )
    
    return {"status": "success", "message": "Urgent alert broadcasted"}

@router.get("/station/pending-approval", response_model=List[schemas.CaseMasterList])
def list_pending_approval_cases(db: Session = Depends(get_db), current_employee: Employee = Depends(require_permission("approve_fir"))):
    if not current_employee.UnitID:
        raise HTTPException(status_code=400, detail="Employee not assigned to a station")
        
    cases = db.query(CaseMaster).filter(
        CaseMaster.PoliceStationID == current_employee.UnitID,
        CaseMaster.ApprovalStatus == 'pending'
    ).order_by(desc(CaseMaster.CrimeRegisteredDate)).limit(50).all()
    
    return cases

@router.post("/{case_id}/approve", response_model=schemas.CaseMasterList)
def approve_case(case_id: int, db: Session = Depends(get_db), current_employee: Employee = Depends(require_permission("approve_fir"))):
    case = db.query(CaseMaster).filter(CaseMaster.CaseMasterID == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    if case.PoliceStationID != current_employee.UnitID:
        raise HTTPException(status_code=403, detail="Not authorized to approve cases from another station")
        
    case.ApprovalStatus = "approved"
    case.ApprovedByEmployeeID = current_employee.EmployeeID
    case.ApprovedByRankName = current_employee.rank.RankName
    case.ApprovedAt = datetime.now()
    
    db.commit()
    db.refresh(case)
    
    return case
