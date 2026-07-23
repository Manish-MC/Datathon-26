import sys
import os
sys.path.append('backend')

# override database url to point to the correct sqlite file
import app.db
app.db.DATABASE_URL = "sqlite:///backend/police_mvp.db"
from sqlalchemy import create_engine
app.db.engine = create_engine(app.db.DATABASE_URL, connect_args={"check_same_thread": False})
app.db.SessionLocal.configure(bind=app.db.engine)

from app.db import SessionLocal
from app.services.similarity_matcher import find_similar_cases

db = SessionLocal()
from app.models.schema import CaseMaster
case = db.query(CaseMaster).filter(CaseMaster.CrimeNo == 'KOR/2026/0301').first()
if case:
    print(f"Target case: {case.CrimeNo} - {case.BriefFacts}")
    matches = find_similar_cases(case.CaseMasterID, db)
    for m in matches:
        print(f"Match: {m['CrimeNo']} (Score: {m['score']:.2f}) -> {m['matched_on']}")
else:
    print("Case not found")
db.close()
