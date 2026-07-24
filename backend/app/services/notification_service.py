from datetime import datetime
from sqlalchemy.orm import Session
from app.models.schema import Notification, Employee, Rank

def notify_employee(db: Session, employee_id: int, title: str, message: str, notification_type: str, related_id: int = None, is_urgent: bool = False):
    """Direct, single-recipient notification."""
    notification = Notification(
        RecipientEmployeeID=employee_id,
        Title=title,
        Message=message,
        Type=notification_type,
        RelatedID=related_id,
        CreatedAt=datetime.now(),
        IsRead=False,
        IsUrgent=is_urgent
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

def notify_station_rank_and_above(db: Session, unit_id: int, min_hierarchy_level: int, title: str, message: str, notification_type: str, related_id: int = None):
    """Creates one Notification row per matching officer at that station whose Rank.Hierarchy is at or above the given seniority level."""
    # Find all active employees at the unit with hierarchy <= min_hierarchy_level
    # Hierarchy: Lower number = higher authority
    officers = db.query(Employee).join(Rank).filter(
        Employee.Active == True,
        Employee.UnitID == unit_id,
        Rank.Hierarchy <= min_hierarchy_level
    ).all()
    
    notifications = []
    for officer in officers:
        notification = Notification(
            RecipientEmployeeID=officer.EmployeeID,
            RecipientRankThreshold=min_hierarchy_level,
            RecipientUnitID=unit_id,
            Title=title,
            Message=message,
            Type=notification_type,
            RelatedID=related_id,
            CreatedAt=datetime.now(),
            IsRead=False
        )
        db.add(notification)
        notifications.append(notification)
        
    db.commit()
    return notifications

def notify_station_below_rank(db: Session, unit_id: int, above_hierarchy_level: int, title: str, message: str, notification_type: str, related_id: int = None):
    """Creates one Notification row per matching officer at that station whose Rank.Hierarchy is STRICTLY GREATER (lower seniority) than the given hierarchy level."""
    # Find all active employees at the unit with hierarchy > above_hierarchy_level
    # Hierarchy: Lower number = higher authority, so > means lower rank
    officers = db.query(Employee).join(Rank).filter(
        Employee.Active == True,
        Employee.UnitID == unit_id,
        Rank.Hierarchy > above_hierarchy_level
    ).all()
    
    notifications = []
    for officer in officers:
        notification = Notification(
            RecipientEmployeeID=officer.EmployeeID,
            RecipientRankThreshold=above_hierarchy_level,
            RecipientUnitID=unit_id,
            Title=title,
            Message=message,
            Type=notification_type,
            RelatedID=related_id,
            CreatedAt=datetime.now(),
            IsRead=False,
            IsUrgent=True
        )
        db.add(notification)
        notifications.append(notification)
        
    db.commit()
    return notifications
