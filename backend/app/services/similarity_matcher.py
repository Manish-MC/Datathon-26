import math
from datetime import datetime
from collections import Counter
import re
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

def compute_tfidf_cosine_sim(texts, target_index):
    # Pure Python TF-IDF and Cosine Similarity
    if not texts or len(texts) == 0:
        return []
    
    # Simple tokenization
    def tokenize(text):
        if not text: return []
        words = re.findall(r'\b\w+\b', text.lower())
        # simple stopword removal
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        return [w for w in words if w not in stop_words]
        
    tokenized_texts = [tokenize(t) for t in texts]
    N = len(texts)
    
    # Document frequencies
    df = Counter()
    for tokens in tokenized_texts:
        df.update(set(tokens))
        
    # IDF
    idf = {word: math.log(N / (count + 1)) + 1 for word, count in df.items()}
    
    # TF-IDF vectors
    vectors = []
    for tokens in tokenized_texts:
        tf = Counter(tokens)
        vec = {word: count * idf[word] for word, count in tf.items()}
        # Normalize
        norm = math.sqrt(sum(v*v for v in vec.values()))
        if norm > 0:
            vec = {word: v/norm for word, v in vec.items()}
        vectors.append(vec)
        
    # Cosine similarity with target
    target_vec = vectors[target_index]
    sims = []
    for vec in vectors:
        sim = sum(target_vec.get(w, 0) * v for w, v in vec.items())
        sims.append(sim)
        
    return sims

def find_similar_cases(case_id: int, db: Session, limit: int = 5) -> list[dict]:
    all_cases = db.query(CaseMaster).all()
    target_case = next((c for c in all_cases if c.CaseMasterID == case_id), None)
    
    if not target_case:
        return []

    # 1. Text Similarity (Pure Python TF-IDF + Cosine)
    texts = [c.BriefFacts if c.BriefFacts else "" for c in all_cases]
    target_index = all_cases.index(target_case)
    
    cosine_sim = compute_tfidf_cosine_sim(texts, target_index)

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
