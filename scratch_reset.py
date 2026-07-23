import sys
import os
sys.path.append('backend')

import app.db
app.db.DATABASE_URL = "sqlite:///backend/police_mvp.db"
from sqlalchemy import create_engine
app.db.engine = create_engine(app.db.DATABASE_URL, connect_args={"check_same_thread": False})
app.db.SessionLocal.configure(bind=app.db.engine)

from app.db import SessionLocal
from app.routers.demo import reset_demo

db = SessionLocal()
try:
    print("Running reset_demo...")
    result = reset_demo(db)
    print("Result:", result)
except Exception as e:
    print("Error:", e)
finally:
    db.close()
