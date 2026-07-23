from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from app.db import get_db
from app.models.schema import Notification, Employee
from app.services.auth_service import get_current_employee
from app.schemas import NotificationResponse, UnreadCountResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_employee: Employee = Depends(get_current_employee)):
    notifications = db.query(Notification).filter(
        Notification.RecipientEmployeeID == current_employee.EmployeeID
    ).order_by(desc(Notification.CreatedAt)).all()
    
    return notifications

@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(db: Session = Depends(get_db), current_employee: Employee = Depends(get_current_employee)):
    count = db.query(Notification).filter(
        Notification.RecipientEmployeeID == current_employee.EmployeeID,
        Notification.IsRead == False
    ).count()
    return {"count": count}

@router.patch("/{notification_id}/read")
def mark_as_read(notification_id: int, db: Session = Depends(get_db), current_employee: Employee = Depends(get_current_employee)):
    notification = db.query(Notification).filter(
        Notification.NotificationID == notification_id,
        Notification.RecipientEmployeeID == current_employee.EmployeeID
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.IsRead = True
    db.commit()
    return {"message": "Marked as read"}

@router.patch("/read-all")
def mark_all_as_read(db: Session = Depends(get_db), current_employee: Employee = Depends(get_current_employee)):
    notifications = db.query(Notification).filter(
        Notification.RecipientEmployeeID == current_employee.EmployeeID,
        Notification.IsRead == False
    ).all()
    
    for notification in notifications:
        notification.IsRead = True
        
    db.commit()
    return {"message": f"Marked {len(notifications)} as read"}
