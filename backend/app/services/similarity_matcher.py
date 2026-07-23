import math
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from app.models.schema import CaseMaster

WEIGHT_TEXT = 0.5
WEIGHT_CATEGORY = 0.3
WEIGHT_SPATIAL_TEMPORAL = 0.2

MAX_DISTANCE_KM = 2.0
MAX_TIME_DAYS = 30

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return distance

def find_similar_cases(case_id: int, db: Session, limit: int = 5) -> list[dict]:
    all_cases = db.query(CaseMaster).all()
    target_case = next((c for c in all_cases if c.CaseMasterID == case_id), None)
    
    if not target_case:
        return []

    # 1. Text Similarity (TF-IDF + Cosine)
    texts = [c.BriefFacts if c.BriefFacts else "" for c in all_cases]
    vectorizer = TfidfVectorizer(stop_words='english')
    
    try:
        tfidf_matrix = vectorizer.fit_transform(texts)
        target_index = all_cases.index(target_case)
        cosine_sim = cosine_similarity(tfidf_matrix[target_index:target_index+1], tfidf_matrix)[0]
    except ValueError:
        # If texts are empty or vectorizer fails
        cosine_sim = [0.0] * len(all_cases)

    matches = []
    
    for idx, candidate in enumerate(all_cases):
        if candidate.CaseMasterID == target_case.CaseMasterID:
            continue
            
        matched_on = []
        score = 0.0
        
        # a) Text similarity
        text_sim = cosine_sim[idx]
        score += text_sim * WEIGHT_TEXT
        if text_sim > 0.2: # arbitrary threshold for display reason
            matched_on.append(f"text similarity {text_sim:.2f}")
            
        # b) Category match
        category_score = 0.0
        if target_case.CrimeMajorHeadID == candidate.CrimeMajorHeadID and target_case.CrimeMinorHeadID == candidate.CrimeMinorHeadID:
            category_score = 1.0
            matched_on.append("exact category match")
        elif target_case.CrimeMajorHeadID == candidate.CrimeMajorHeadID:
            category_score = 0.5
            matched_on.append("same major category")
            
        score += category_score * WEIGHT_CATEGORY
        
        # c) Spatial-temporal proximity
        spatial_temporal_score = 0.0
        dist = haversine(target_case.latitude, target_case.longitude, candidate.latitude, candidate.longitude)
        
        time_diff = 99999
        if target_case.IncidentFromDate and candidate.IncidentFromDate:
            time_diff = abs((target_case.IncidentFromDate - candidate.IncidentFromDate).days)
        elif target_case.CrimeRegisteredDate and candidate.CrimeRegisteredDate:
            time_diff = abs((target_case.CrimeRegisteredDate - candidate.CrimeRegisteredDate).days)
            
        if dist <= MAX_DISTANCE_KM and time_diff <= MAX_TIME_DAYS:
            spatial_temporal_score = 1.0
            matched_on.append(f"{dist:.1f}km away & within {time_diff} days")
        elif dist <= MAX_DISTANCE_KM:
            spatial_temporal_score = 0.5
            matched_on.append(f"{dist:.1f}km away")
        elif time_diff <= MAX_TIME_DAYS:
            spatial_temporal_score = 0.5
            matched_on.append(f"within {time_diff} days")
            
        score += spatial_temporal_score * WEIGHT_SPATIAL_TEMPORAL
        
        if score > 0:
            matches.append({
                "CaseMasterID": candidate.CaseMasterID,
                "CrimeNo": candidate.CrimeNo,
                "CaseCategoryID": candidate.CaseCategoryID,
                "score": score,
                "matched_on": matched_on
            })
            
    # Sort by score descending
    matches.sort(key=lambda x: x["score"], reverse=True)
    return matches[:limit]
