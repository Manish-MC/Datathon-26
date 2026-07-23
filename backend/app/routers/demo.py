from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import get_db, engine, Base
from app.services.alert_engine import generate_cluster_alerts, generate_hotspot_alerts

router = APIRouter(prefix="/demo", tags=["demo"])

@router.post("/reset")
def reset_demo(db: Session = Depends(get_db)):
    """
    WARNING: This endpoint is strictly for the hackathon demo. 
    It completely wipes the database and re-seeds the initial synthetic data,
    clearing all generated summaries and alerts so the demo can run fresh.
    """
    try:
        from app.main import seed_database
        
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Seed the database 
        seed_database()
        
        db.expunge_all()
        
        generate_cluster_alerts(db)
        generate_hotspot_alerts(db)
        
        return {"message": "Demo reset successful. Database wiped, re-seeded, and initial alerts generated."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reset demo data: {str(e)}")
