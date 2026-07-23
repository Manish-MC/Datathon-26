from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime
import json

from app.db import get_db
from app.models.schema import Alert, CaseMaster
from app import schemas
from app.services.alert_engine import generate_cluster_alerts, generate_hotspot_alerts
from app.services.auth_service import require_permission, Employee

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("", response_model=List[schemas.AlertResponse])
def list_alerts(status: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(Alert)
        if status:
            query = query.filter(Alert.Status == status)
        alerts = query.order_by(desc(Alert.CreatedAt)).all()
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list alerts: {str(e)}")

@router.get("/{alert_id}")
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    try:
        alert = db.query(Alert).filter(Alert.AlertID == alert_id).first()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    try:
        case_ids = json.loads(alert.RelatedCaseIDs)
    except:
        case_ids = []
        
    related_cases = []
    if case_ids:
        cases = db.query(CaseMaster).filter(CaseMaster.CaseMasterID.in_(case_ids)).all()
        # manual serialize to return a dict
        for c in cases:
            related_cases.append({
                "CaseMasterID": c.CaseMasterID,
                "CrimeNo": c.CrimeNo,
                "BriefFacts": c.BriefFacts,
                "CrimeRegisteredDate": c.CrimeRegisteredDate,
                "latitude": c.latitude,
                "longitude": c.longitude,
            })
            
    return {
        "AlertID": alert.AlertID,
        "AlertType": alert.AlertType,
        "RelatedCaseIDs": alert.RelatedCaseIDs,
        "Reason": alert.Reason,
        "Score": alert.Score,
        "CreatedAt": alert.CreatedAt,
        "Status": alert.Status,
        "ReviewedBy": alert.ReviewedBy,
        "ReviewedAt": alert.ReviewedAt,
        "related_cases": related_cases
    }

@router.patch("/{alert_id}", response_model=schemas.AlertResponse)
def update_alert_status(alert_id: int, update_data: schemas.AlertUpdate, db: Session = Depends(get_db), current_employee: Employee = Depends(require_permission("approve_alert_action"))):
    try:
        alert = db.query(Alert).filter(Alert.AlertID == alert_id).first()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    if update_data.Status not in ["open", "reviewed", "dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    alert.Status = update_data.Status
    if update_data.Status in ["reviewed", "dismissed"]:
        alert.ReviewedBy = update_data.ReviewedBy
        alert.ReviewedAt = datetime.now()
        
    db.commit()
    db.refresh(alert)
    return alert

@router.post("/refresh")
def refresh_alerts(db: Session = Depends(get_db)):
    try:
        cluster_alerts = generate_cluster_alerts(db)
        hotspot_alerts = generate_hotspot_alerts(db)
        
        return {
            "message": "Alert generation completed.",
            "new_cluster_alerts": len(cluster_alerts),
            "new_hotspot_alerts": len(hotspot_alerts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh alerts: {str(e)}")
