from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.db import get_db
from app.models.schema import CaseMaster
from app import schemas

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/hotspots", response_model=List[schemas.HotspotCell])
def get_hotspots(db: Session = Depends(get_db)):
    # Group cases by 0.01 degree rounded grid cells
    # SQLite supports round(value, decimal_places)
    
    try:
        query = db.query(
            func.round(CaseMaster.latitude, 2).label("lat_bucket"),
            func.round(CaseMaster.longitude, 2).label("lon_bucket"),
            func.count(CaseMaster.CaseMasterID).label("case_count")
        ).group_by(
            "lat_bucket", "lon_bucket"
        ).all()
        
        # Map the buckets to latitude and longitude
        hotspots = [
            schemas.HotspotCell(
                latitude=float(row.lat_bucket), 
                longitude=float(row.lon_bucket), 
                case_count=int(row.case_count)
            ) 
            for row in query if row.lat_bucket is not None and row.lon_bucket is not None
        ]
        
        return hotspots
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate hotspots: {str(e)}")
