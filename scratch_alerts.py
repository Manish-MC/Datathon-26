import sys
import os
import json
sys.path.append('backend')

import app.db
app.db.DATABASE_URL = "sqlite:///backend/police_mvp.db"
from sqlalchemy import create_engine
app.db.engine = create_engine(app.db.DATABASE_URL, connect_args={"check_same_thread": False})
app.db.SessionLocal.configure(bind=app.db.engine)

from app.db import SessionLocal
from app.models.schema import Base, Alert
from app.services.alert_engine import generate_cluster_alerts, generate_hotspot_alerts

# create new tables if any
Base.metadata.create_all(bind=app.db.engine)

db = SessionLocal()
try:
    cluster_alerts = generate_cluster_alerts(db)
    print(f"Generated {len(cluster_alerts)} cluster alerts")
    for a in cluster_alerts:
        print(f" - [{a.Score:.2f}] {a.Reason} (IDs: {a.RelatedCaseIDs})")
        
    hotspot_alerts = generate_hotspot_alerts(db)
    print(f"Generated {len(hotspot_alerts)} hotspot alerts")
    for a in hotspot_alerts:
        print(f" - [{a.Score:.2f}] {a.Reason} (IDs: {a.RelatedCaseIDs})")
finally:
    db.close()
