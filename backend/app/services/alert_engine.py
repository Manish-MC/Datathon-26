import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.schema import CaseMaster, Alert

def _cluster_exists(db: Session, case_ids: list[int]) -> bool:
    """Check if an open similar_cluster alert already contains at least one of these cases."""
    open_alerts = db.query(Alert).filter(Alert.Status == "open", Alert.AlertType == "similar_cluster").all()
    case_ids_set = set(case_ids)
    for alert in open_alerts:
        try:
            alert_cases = set(json.loads(alert.RelatedCaseIDs))
            if len(alert_cases.intersection(case_ids_set)) > 0:
                return True
        except:
            continue
    return False

def _hotspot_exists(db: Session, lat_bucket: float, lon_bucket: float) -> bool:
    """Check if an open hotspot_spike alert already exists for this approx location."""
    open_alerts = db.query(Alert).filter(Alert.Status == "open", Alert.AlertType == "hotspot_spike").all()
    
    for alert in open_alerts:
        try:
            alert_cases = json.loads(alert.RelatedCaseIDs)
            if not alert_cases:
                continue
            first_case_id = alert_cases[0]
            case = db.query(CaseMaster).filter(CaseMaster.CaseMasterID == first_case_id).first()
            if case and round(case.latitude, 2) == lat_bucket and round(case.longitude, 2) == lon_bucket:
                return True
        except:
            continue
    return False

def generate_cluster_alerts(db: Session, threshold: float = 0.6, target_case_id: int = None) -> list[Alert]:
    from app.services.similarity_matcher import find_similar_cases
    
    if target_case_id:
        recent_cases = db.query(CaseMaster).filter(CaseMaster.CaseMasterID == target_case_id).all()
    else:
        recent_cases = db.query(CaseMaster).order_by(CaseMaster.CrimeRegisteredDate.desc()).limit(100).all()
    
    new_alerts = []
    processed_case_ids = set()
    
    for case in recent_cases:
        if case.CaseMasterID in processed_case_ids:
            continue
            
        matches = find_similar_cases(case.CaseMasterID, db, limit=10)
        high_score_matches = [m for m in matches if m["score"] >= threshold]
        
        if len(high_score_matches) >= 2:
            cluster_ids = [case.CaseMasterID] + [m["CaseMasterID"] for m in high_score_matches]
            
            if not _cluster_exists(db, cluster_ids):
                avg_score = sum(m["score"] for m in high_score_matches) / len(high_score_matches)
                cat_id = case.CaseCategoryID
                reason = f"{len(cluster_ids)} similar cases (Category {cat_id}) clustered together spatially and temporally. Average similarity score: {avg_score:.2f}."
                
                alert = Alert(
                    AlertType="similar_cluster",
                    RelatedCaseIDs=json.dumps(cluster_ids),
                    Reason=reason,
                    Score=avg_score,
                    CreatedAt=datetime.now(),
                    Status="open"
                )
                db.add(alert)
                db.commit()
                db.refresh(alert)
                new_alerts.append(alert)
                
            processed_case_ids.update(cluster_ids)
            
    return new_alerts

def generate_hotspot_alerts(db: Session, threshold_count: int = 5, target_lat: float = None, target_lon: float = None) -> list[Alert]:
    query = db.query(
        func.round(CaseMaster.latitude, 2).label("lat_bucket"),
        func.round(CaseMaster.longitude, 2).label("lon_bucket"),
        func.count(CaseMaster.CaseMasterID).label("case_count")
    )
    
    if target_lat is not None and target_lon is not None:
        query = query.filter(
            func.round(CaseMaster.latitude, 2) == round(target_lat, 2),
            func.round(CaseMaster.longitude, 2) == round(target_lon, 2)
        )
        
    query = query.group_by("lat_bucket", "lon_bucket").all()
    
    new_alerts = []
    
    for row in query:
        if row.lat_bucket is None or row.lon_bucket is None:
            continue
            
        count = int(row.case_count)
        if count >= threshold_count:
            lat, lon = float(row.lat_bucket), float(row.lon_bucket)
            if not _hotspot_exists(db, lat, lon):
                cases_in_bucket = db.query(CaseMaster).filter(
                    func.round(CaseMaster.latitude, 2) == lat,
                    func.round(CaseMaster.longitude, 2) == lon
                ).all()
                
                case_ids = [c.CaseMasterID for c in cases_in_bucket]
                reason = f"{count} incidents in a tight radius (grid {lat}, {lon}) — exceeding the threshold of {threshold_count}."
                
                alert = Alert(
                    AlertType="hotspot_spike",
                    RelatedCaseIDs=json.dumps(case_ids),
                    Reason=reason,
                    Score=min(count / 10.0, 1.0),
                    CreatedAt=datetime.now(),
                    Status="open"
                )
                db.add(alert)
                db.commit()
                db.refresh(alert)
                new_alerts.append(alert)
                
    return new_alerts
