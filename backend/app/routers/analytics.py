from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.db import get_db
from app.models.schema import CaseMaster, Employee, District, CaseCategory, Unit
from app import schemas
from datetime import datetime, timedelta
from app.services.auth_service import get_current_employee
from app.permissions import get_permissions_for_rank
from fastapi import Query

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/hotspots", response_model=List[schemas.HotspotCell])
def get_hotspots(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    # Group cases by 0.01 degree rounded grid cells
    # SQLite supports round(value, decimal_places)
    
    try:
        query = db.query(
            func.round(CaseMaster.latitude, 2).label("lat_bucket"),
            func.round(CaseMaster.longitude, 2).label("lon_bucket"),
            func.count(CaseMaster.CaseMasterID).label("case_count")
        )
        
        perms = get_permissions_for_rank(current_employee.rank.RankName)
        if "state_wide_access" not in perms:
            if current_employee.UnitID and "monitor_stations" not in perms:
                query = query.filter(CaseMaster.PoliceStationID == current_employee.UnitID)
            elif current_employee.DistrictID:
                unit_ids = [u.UnitID for u in db.query(Unit).filter(Unit.DistrictID == current_employee.DistrictID).all()]
                query = query.filter(CaseMaster.PoliceStationID.in_(unit_ids))
                
        results = query.group_by(
            "lat_bucket", "lon_bucket"
        ).all()
        
        # Map the buckets to latitude and longitude
        hotspots = [
            schemas.HotspotCell(
                latitude=float(row.lat_bucket), 
                longitude=float(row.lon_bucket), 
                case_count=int(row.case_count)
            ) 
            for row in results if row.lat_bucket is not None and row.lon_bucket is not None
        ]
        
        return hotspots
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate hotspots: {str(e)}")

@router.get("/range-districts", response_model=List[schemas.DistrictResponse])
def get_range_districts(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    perms = get_permissions_for_rank(current_employee.rank.RankName)
    if "compare_districts" not in perms:
        raise HTTPException(status_code=403, detail="Not authorized to compare districts")
        
    if not current_employee.DistrictID:
        raise HTTPException(status_code=400, detail="Employee not assigned to a district")
        
    emp_district = db.query(District).filter(District.DistrictID == current_employee.DistrictID).first()
    if not emp_district:
        raise HTTPException(status_code=400, detail="Invalid employee district")
        
    from app.services.scope_helpers import get_range_districts as fetch_range_districts
    districts = fetch_range_districts(db, emp_district.RangeID)
    return districts

@router.get("/district-comparison", response_model=schemas.DistrictComparisonResponse)
def get_district_comparison(
    district_ids: str = Query(..., description="Comma separated list of district IDs"),
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    perms = get_permissions_for_rank(current_employee.rank.RankName)
    if "compare_districts" not in perms:
        raise HTTPException(status_code=403, detail="Not authorized to compare districts")

    if not current_employee.DistrictID:
        raise HTTPException(status_code=400, detail="Employee not assigned to a district")
        
    emp_district = db.query(District).filter(District.DistrictID == current_employee.DistrictID).first()
    
    requested_ids = [int(id.strip()) for id in district_ids.split(",") if id.strip().isdigit()]
    if not requested_ids:
        raise HTTPException(status_code=400, detail="Invalid district_ids provided")

    # Validate districts belong to the same range
    districts = db.query(District).filter(District.DistrictID.in_(requested_ids)).all()
    
    for d in districts:
        if d.RangeID != emp_district.RangeID:
            raise HTTPException(status_code=403, detail=f"District {d.DistrictName} is outside your range jurisdiction")
            
    stats_list = []
    ninety_days_ago = datetime.now() - timedelta(days=90)
    
    for d in districts:
        # Get cases for this district
        unit_ids = [u.UnitID for u in db.query(Unit).filter(Unit.DistrictID == d.DistrictID).all()]
        
        # Total cases
        total_cases = db.query(CaseMaster).filter(CaseMaster.PoliceStationID.in_(unit_ids)).count()
        
        # Categories breakdown
        categories = db.query(CaseCategory.LookupValue, func.count(CaseMaster.CaseMasterID)).join(CaseMaster).filter(CaseMaster.PoliceStationID.in_(unit_ids)).group_by(CaseCategory.LookupValue).all()
        cat_dict = {cat: count for cat, count in categories}
        
        # Trend 90 days
        one_eighty_days_ago = ninety_days_ago - timedelta(days=90)
        recent_cases = db.query(CaseMaster).filter(CaseMaster.PoliceStationID.in_(unit_ids), CaseMaster.CrimeRegisteredDate >= ninety_days_ago).count()
        older_cases = db.query(CaseMaster).filter(CaseMaster.PoliceStationID.in_(unit_ids), CaseMaster.CrimeRegisteredDate >= one_eighty_days_ago, CaseMaster.CrimeRegisteredDate < ninety_days_ago).count()
        
        trend = 0.0
        if older_cases > 0:
            trend = ((recent_cases - older_cases) / older_cases) * 100.0
        elif recent_cases > 0:
            trend = 100.0
            
        # Active Hotspots
        hotspots_query = db.query(
            func.round(CaseMaster.latitude, 2).label("lat_bucket"),
            func.round(CaseMaster.longitude, 2).label("lon_bucket"),
            func.count(CaseMaster.CaseMasterID).label("case_count")
        ).filter(CaseMaster.PoliceStationID.in_(unit_ids)).group_by("lat_bucket", "lon_bucket").having(func.count(CaseMaster.CaseMasterID) > 2).all()
        
        active_hotspots = len(hotspots_query)
        
        stats_list.append(schemas.DistrictComparisonStats(
            DistrictID=d.DistrictID,
            DistrictName=d.DistrictName,
            total_cases=total_cases,
            active_hotspots=active_hotspots,
            trend_90_days_pct=round(trend, 2),
            categories=cat_dict
        ))
        
    insights = []
    if stats_list:
        max_cases_dist = max(stats_list, key=lambda x: x.total_cases)
        max_hotspots_dist = max(stats_list, key=lambda x: x.active_hotspots)
        max_trend_dist = max(stats_list, key=lambda x: x.trend_90_days_pct)
        
        avg_cases = sum(s.total_cases for s in stats_list) / len(stats_list)
        if avg_cases > 0 and len(stats_list) > 1:
            pct_above = round(((max_cases_dist.total_cases - avg_cases) / avg_cases) * 100, 1)
            insights.append(f"{max_cases_dist.DistrictName} has the highest case volume in the range at {max_cases_dist.total_cases} cases, {pct_above}% above the comparison average.")
        else:
            insights.append(f"{max_cases_dist.DistrictName} has {max_cases_dist.total_cases} total cases.")
            
        if max_trend_dist.trend_90_days_pct > 0:
            insights.append(f"{max_trend_dist.DistrictName}'s cases increased {max_trend_dist.trend_90_days_pct}% over the last 90 days, the sharpest rise in the comparison.")
        
        insights.append(f"{max_hotspots_dist.DistrictName} has the most active hotspot zones ({max_hotspots_dist.active_hotspots}).")
        
    return schemas.DistrictComparisonResponse(districts=stats_list, insights=insights)


@router.get("/regional-heatmap", response_model=List[schemas.RegionalHeatmapItem])
def get_regional_heatmap(
    zone_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    perms = get_permissions_for_rank(current_employee.rank.RankName)
    if "regional_heatmap" not in perms:
        raise HTTPException(status_code=403, detail="Not authorized to view regional heatmap")

    from app.models.schema import District, PoliceRange
    emp_district = db.query(District).filter(District.DistrictID == current_employee.DistrictID).first()
    if not emp_district:
        raise HTTPException(status_code=400, detail="Employee not assigned to a district")
    
    emp_range = db.query(PoliceRange).filter(PoliceRange.RangeID == emp_district.RangeID).first()
    if not emp_range or not emp_range.ZoneID:
        raise HTTPException(status_code=400, detail="Employee not assigned to a zone")
        
    if emp_range.ZoneID != zone_id:
        raise HTTPException(status_code=403, detail="Cannot access regional heatmap outside of your assigned zone")

    from app.services.scope_helpers import get_zone_districts
    districts = get_zone_districts(db, zone_id)
    
    heatmap_data = []
    max_cases = 0
    
    for d in districts:
        unit_ids = [u.UnitID for u in db.query(Unit).filter(Unit.DistrictID == d.DistrictID).all()]
        if not unit_ids:
            continue
            
        stats = db.query(
            func.count(CaseMaster.CaseMasterID).label("case_count"),
            func.avg(CaseMaster.latitude).label("avg_lat"),
            func.avg(CaseMaster.longitude).label("avg_lng")
        ).filter(CaseMaster.PoliceStationID.in_(unit_ids)).first()
        
        count = stats.case_count or 0
        lat = stats.avg_lat or 12.9716  # fallback to blr center
        lng = stats.avg_lng or 77.5946
        
        if count > max_cases:
            max_cases = count
            
        heatmap_data.append({
            "district_id": d.DistrictID,
            "district_name": d.DistrictName,
            "lat": float(lat),
            "lng": float(lng),
            "case_count": int(count)
        })
        
    # Normalize intensity
    result = []
    for item in heatmap_data:
        intensity = item["case_count"] / max_cases if max_cases > 0 else 0
        result.append(schemas.RegionalHeatmapItem(
            district_id=item["district_id"],
            district_name=item["district_name"],
            lat=item["lat"],
            lng=item["lng"],
            case_count=item["case_count"],
            intensity=intensity
        ))
        
    return result


@router.get("/district-risk-rating", response_model=schemas.DistrictRiskRatingResponse)
def get_district_risk_rating(
    zone_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    perms = get_permissions_for_rank(current_employee.rank.RankName)
    if "district_risk_rating" not in perms:
        raise HTTPException(status_code=403, detail="Not authorized to view district risk rating")

    from app.models.schema import District, PoliceRange
    emp_district = db.query(District).filter(District.DistrictID == current_employee.DistrictID).first()
    if not emp_district:
        raise HTTPException(status_code=400, detail="Employee not assigned to a district")
    
    emp_range = db.query(PoliceRange).filter(PoliceRange.RangeID == emp_district.RangeID).first()
    if not emp_range or not emp_range.ZoneID:
        raise HTTPException(status_code=400, detail="Employee not assigned to a zone")
        
    if emp_range.ZoneID != zone_id:
        raise HTTPException(status_code=403, detail="Cannot access risk ratings outside of your assigned zone")

    from app.services.scope_helpers import get_zone_districts
    districts = get_zone_districts(db, zone_id)
    
    # Weights for the Risk Index
    WEIGHT_TREND = 0.40
    WEIGHT_HOTSPOT = 0.35
    WEIGHT_SEVERITY = 0.25
    
    ninety_days_ago = datetime.now() - timedelta(days=90)
    one_eighty_days_ago = ninety_days_ago - timedelta(days=90)
    
    ratings = []
    
    # Calculate global max values for normalization
    raw_metrics = []
    
    for d in districts:
        unit_ids = [u.UnitID for u in db.query(Unit).filter(Unit.DistrictID == d.DistrictID).all()]
        if not unit_ids:
            continue
            
        # 1. Trend
        recent_cases = db.query(CaseMaster).filter(CaseMaster.PoliceStationID.in_(unit_ids), CaseMaster.CrimeRegisteredDate >= ninety_days_ago).count()
        older_cases = db.query(CaseMaster).filter(CaseMaster.PoliceStationID.in_(unit_ids), CaseMaster.CrimeRegisteredDate >= one_eighty_days_ago, CaseMaster.CrimeRegisteredDate < ninety_days_ago).count()
        
        trend = 0.0
        if older_cases > 0:
            trend = ((recent_cases - older_cases) / older_cases) * 100.0
        elif recent_cases > 0:
            trend = 100.0
            
        # 2. Hotspots
        hotspots_query = db.query(
            func.round(CaseMaster.latitude, 2).label("lat_bucket"),
            func.round(CaseMaster.longitude, 2).label("lon_bucket"),
            func.count(CaseMaster.CaseMasterID).label("case_count")
        ).filter(CaseMaster.PoliceStationID.in_(unit_ids)).group_by("lat_bucket", "lon_bucket").having(func.count(CaseMaster.CaseMasterID) > 2).all()
        
        active_hotspots = len(hotspots_query)
        total_cases = db.query(CaseMaster).filter(CaseMaster.PoliceStationID.in_(unit_ids)).count()
        hotspot_density = active_hotspots / total_cases if total_cases > 0 else 0
        
        # 3. Severity Mix (Heinous cases have GravityOffenceID = 1, usually)
        heinous_cases = db.query(CaseMaster).filter(CaseMaster.PoliceStationID.in_(unit_ids), CaseMaster.GravityOffenceID == 1).count()
        severity_mix = heinous_cases / total_cases if total_cases > 0 else 0
        
        raw_metrics.append({
            "district": d,
            "trend": trend,
            "hotspot_density": hotspot_density,
            "severity_mix": severity_mix
        })

    if not raw_metrics:
        return schemas.DistrictRiskRatingResponse(ratings=[])

    max_trend = max([m["trend"] for m in raw_metrics]) or 1.0
    max_hotspot = max([m["hotspot_density"] for m in raw_metrics]) or 1.0
    max_severity = max([m["severity_mix"] for m in raw_metrics]) or 1.0
    
    for m in raw_metrics:
        # Normalize each to 0-100
        n_trend = max(0, min(100, (m["trend"] / max_trend) * 100))
        n_hotspot = (m["hotspot_density"] / max_hotspot) * 100
        n_severity = (m["severity_mix"] / max_severity) * 100
        
        risk_index = (n_trend * WEIGHT_TREND) + (n_hotspot * WEIGHT_HOTSPOT) + (n_severity * WEIGHT_SEVERITY)
        
        breakdown = schemas.RiskFactorBreakdown(
            case_volume_trend=round(n_trend, 2),
            hotspot_density=round(n_hotspot, 2),
            severity_mix=round(n_severity, 2)
        )
        
        ratings.append(schemas.DistrictRiskRatingItem(
            district_id=m["district"].DistrictID,
            district_name=m["district"].DistrictName,
            risk_index=round(risk_index, 2),
            breakdown=breakdown
        ))
        
    # Sort by risk index descending
    ratings.sort(key=lambda x: x.risk_index, reverse=True)
    
    return schemas.DistrictRiskRatingResponse(ratings=ratings)

@router.get("/department-kpis", response_model=schemas.DepartmentKPIResponse)
def get_department_kpis(
    department_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    perms = get_permissions_for_rank(current_employee.rank.RankName)
    if "department_dashboard" not in perms:
        raise HTTPException(status_code=403, detail="Not authorized to view department dashboard")
        
    if "state_wide_access" not in perms and current_employee.DepartmentID != department_id:
        raise HTTPException(status_code=403, detail="Cannot access KPIs for a different department")
        
    ninety_days_ago = datetime.now() - timedelta(days=90)
    one_eighty_days_ago = ninety_days_ago - timedelta(days=90)
    
    # 1. Total Cases & Trend (Statewide for this department)
    base_query = db.query(CaseMaster).join(CaseCategory).filter(CaseCategory.DepartmentID == department_id)
    
    total_cases = base_query.count()
    recent_cases = base_query.filter(CaseMaster.CrimeRegisteredDate >= ninety_days_ago).count()
    older_cases = base_query.filter(CaseMaster.CrimeRegisteredDate >= one_eighty_days_ago, CaseMaster.CrimeRegisteredDate < ninety_days_ago).count()
    
    trend = 0.0
    if older_cases > 0:
        trend = ((recent_cases - older_cases) / older_cases) * 100.0
    elif recent_cases > 0:
        trend = 100.0
        
    # 2. Status Breakdown
    from app.models.schema import CaseStatusMaster
    status_query = db.query(
        CaseStatusMaster.CaseStatusName,
        func.count(CaseMaster.CaseMasterID)
    ).join(CaseMaster).join(CaseCategory, CaseMaster.CaseCategoryID == CaseCategory.CaseCategoryID)\
     .filter(CaseCategory.DepartmentID == department_id)\
     .group_by(CaseStatusMaster.CaseStatusName).all()
     
    status_breakdown = [
        schemas.DepartmentStatusBreakdown(status_name=name, count=count)
        for name, count in status_query
    ]
    
    # 3. District Risk Ratings (Filtered by department)
    WEIGHT_TREND = 0.40
    WEIGHT_HOTSPOT = 0.35
    WEIGHT_SEVERITY = 0.25
    
    districts = db.query(District).all()
    raw_metrics = []
    
    for d in districts:
        unit_ids = [u.UnitID for u in db.query(Unit).filter(Unit.DistrictID == d.DistrictID).all()]
        if not unit_ids:
            continue
            
        d_base_query = db.query(CaseMaster).join(CaseCategory)\
                         .filter(CaseMaster.PoliceStationID.in_(unit_ids), CaseCategory.DepartmentID == department_id)
                         
        d_total_cases = d_base_query.count()
        if d_total_cases == 0:
            continue # Skip districts with no cases for this department
            
        d_recent_cases = d_base_query.filter(CaseMaster.CrimeRegisteredDate >= ninety_days_ago).count()
        d_older_cases = d_base_query.filter(CaseMaster.CrimeRegisteredDate >= one_eighty_days_ago, CaseMaster.CrimeRegisteredDate < ninety_days_ago).count()
        
        d_trend = 0.0
        if d_older_cases > 0:
            d_trend = ((d_recent_cases - d_older_cases) / d_older_cases) * 100.0
        elif d_recent_cases > 0:
            d_trend = 100.0
            
        hotspots_query = db.query(
            func.round(CaseMaster.latitude, 2).label("lat_bucket"),
            func.round(CaseMaster.longitude, 2).label("lon_bucket")
        ).join(CaseCategory).filter(CaseMaster.PoliceStationID.in_(unit_ids), CaseCategory.DepartmentID == department_id)\
         .group_by("lat_bucket", "lon_bucket").having(func.count(CaseMaster.CaseMasterID) > 2).all()
         
        active_hotspots = len(hotspots_query)
        hotspot_density = active_hotspots / d_total_cases
        
        heinous_cases = d_base_query.filter(CaseMaster.GravityOffenceID == 1).count()
        severity_mix = heinous_cases / d_total_cases
        
        raw_metrics.append({
            "district": d,
            "trend": d_trend,
            "hotspot_density": hotspot_density,
            "severity_mix": severity_mix
        })
        
    ratings = []
    if raw_metrics:
        max_trend = max([m["trend"] for m in raw_metrics]) or 1.0
        max_hotspot = max([m["hotspot_density"] for m in raw_metrics]) or 1.0
        max_severity = max([m["severity_mix"] for m in raw_metrics]) or 1.0
        
        for m in raw_metrics:
            n_trend = max(0, min(100, (m["trend"] / max_trend) * 100))
            n_hotspot = (m["hotspot_density"] / max_hotspot) * 100
            n_severity = (m["severity_mix"] / max_severity) * 100
            
            risk_index = (n_trend * WEIGHT_TREND) + (n_hotspot * WEIGHT_HOTSPOT) + (n_severity * WEIGHT_SEVERITY)
            
            breakdown = schemas.RiskFactorBreakdown(
                case_volume_trend=round(n_trend, 2),
                hotspot_density=round(n_hotspot, 2),
                severity_mix=round(n_severity, 2)
            )
            ratings.append(schemas.DistrictRiskRatingItem(
                district_id=m["district"].DistrictID,
                district_name=m["district"].DistrictName,
                risk_index=round(risk_index, 2),
                breakdown=breakdown
            ))
            
        ratings.sort(key=lambda x: x.risk_index, reverse=True)
        
    return schemas.DepartmentKPIResponse(
        total_cases=total_cases,
    trend_90_days_pct=round(trend, 2),
        status_breakdown=status_breakdown,
        district_risk_ratings=ratings
    )

@router.get("/statewide-anomalies", response_model=schemas.AnomalyResponse)
def get_statewide_anomalies(db: Session = Depends(get_db), current_employee: Employee = Depends(get_current_employee)):
    perms = get_permissions_for_rank(current_employee.rank.RankName)
    if "anomaly_detection" not in perms:
        raise HTTPException(status_code=403, detail="Not authorized for anomaly detection")
    
    thirty_days_ago = datetime.now() - timedelta(days=30)
    six_months_ago = thirty_days_ago - timedelta(days=180)

    districts = db.query(District).all()
    anomalies = []

    for d in districts:
        unit_ids = [u.UnitID for u in db.query(Unit).filter(Unit.DistrictID == d.DistrictID).all()]
        if not unit_ids:
            continue
            
        recent_count = db.query(CaseMaster).filter(
            CaseMaster.PoliceStationID.in_(unit_ids),
            CaseMaster.CrimeRegisteredDate >= thirty_days_ago
        ).count()
        
        hist_count = db.query(CaseMaster).filter(
            CaseMaster.PoliceStationID.in_(unit_ids),
            CaseMaster.CrimeRegisteredDate >= six_months_ago,
            CaseMaster.CrimeRegisteredDate < thirty_days_ago
        ).count()
        
        hist_avg = hist_count / 6.0
        
        if hist_avg > 0:
            std_dev = (hist_avg) ** 0.5
            z_score = (recent_count - hist_avg) / std_dev
        elif recent_count > 0:
            z_score = 99.0 
        else:
            z_score = 0.0
            
        if z_score > 2.0:
            anomalies.append(schemas.AnomalyItem(
                district_id=d.DistrictID,
                district_name=d.DistrictName,
                z_score=round(z_score, 2),
                reason=f"District case volume ({recent_count}) is {round(z_score, 2)} standard deviations above its 6-month average ({round(hist_avg, 1)}/month)."
            ))

    return schemas.AnomalyResponse(anomalies=anomalies)

@router.get("/network-graph", response_model=schemas.NetworkGraphResponse)
def get_network_graph(case_id: int = None, db: Session = Depends(get_db), current_employee: Employee = Depends(get_current_employee)):
    perms = get_permissions_for_rank(current_employee.rank.RankName)
    if "criminal_network_graph" not in perms:
        raise HTTPException(status_code=403, detail="Not authorized for criminal network graph")
        
    from app.models.schema import Accused, Victim
    nodes = []
    edges = []
    
    node_ids = set()
    
    def add_node(n_id, label, n_type, detail_id):
        if n_id not in node_ids:
            nodes.append(schemas.NetworkNode(id=str(n_id), label=str(label), type=n_type, detail_id=int(detail_id)))
            node_ids.add(n_id)
            
    def add_edge(source, target, label):
        edges.append(schemas.NetworkEdge(source=str(source), target=str(target), label=label))

    cases_query = db.query(CaseMaster)
    if case_id:
        cases_query = cases_query.filter(CaseMaster.CaseMasterID == case_id)
    else:
        cases_query = cases_query.order_by(CaseMaster.CrimeRegisteredDate.desc()).limit(20) 
        
    cases = cases_query.all()
    
    for c in cases:
        c_id = f"case_{c.CaseMasterID}"
        add_node(c_id, c.CrimeNo, "Case", c.CaseMasterID)
        
        accused_list = db.query(Accused).filter(Accused.CaseMasterID == c.CaseMasterID).all()
        victim_list = db.query(Victim).filter(Victim.CaseMasterID == c.CaseMasterID).all()
        
        accused_ids = []
        for a in accused_list:
            p_id = f"accused_{a.PersonID if a.PersonID else a.AccusedName}"
            accused_ids.append(p_id)
            add_node(p_id, a.AccusedName, "Accused", a.AccusedMasterID)
            add_edge(p_id, c_id, "Involved In")
            
        for i in range(len(accused_ids)):
            for j in range(i + 1, len(accused_ids)):
                if accused_ids[i] != accused_ids[j]:
                    add_edge(accused_ids[i], accused_ids[j], "Co-Accused")
                
        for v in victim_list:
            v_id = f"victim_{v.VictimName}"
            add_node(v_id, v.VictimName, "Victim", v.VictimMasterID)
            add_edge(v_id, c_id, "Victim In")
            
    return schemas.NetworkGraphResponse(nodes=nodes, edges=edges)

@router.get("/decision-timeline", response_model=schemas.TimelineResponse)
def get_decision_timeline(db: Session = Depends(get_db), current_employee: Employee = Depends(get_current_employee)):
    perms = get_permissions_for_rank(current_employee.rank.RankName)
    if "decision_timeline" not in perms:
        raise HTTPException(status_code=403, detail="Not authorized for decision timeline")
        
    from app.models.schema import Investigation, DepartmentCaseFlag, Alert, Notification
    
    events = []
    
    invs = db.query(Investigation).order_by(Investigation.CreatedAt.desc()).limit(20).all()
    for i in invs:
        actor = db.query(Employee).filter(Employee.EmployeeID == i.OrderedByEmployeeID).first()
        events.append(schemas.TimelineEvent(
            timestamp=i.CreatedAt,
            type="Investigation",
            summary=f"Investigation Ordered: {i.DirectiveNote or 'No specific directive'}",
            actor=actor.EmployeeName if actor else "Unknown",
            related_case_id=i.CaseMasterID
        ))
        
    flags = db.query(DepartmentCaseFlag).order_by(DepartmentCaseFlag.CreatedAt.desc()).limit(20).all()
    for f in flags:
        actor = db.query(Employee).filter(Employee.EmployeeID == f.FlaggedByEmployeeID).first()
        events.append(schemas.TimelineEvent(
            timestamp=f.CreatedAt,
            type="DepartmentFlag",
            summary=f"Case Flagged to Dept {f.ToDepartmentID}: {f.Note}",
            actor=actor.EmployeeName if actor else "Unknown",
            related_case_id=f.CaseMasterID
        ))
        
    alerts = db.query(Alert).filter(Alert.Status != "open").order_by(Alert.ReviewedAt.desc()).limit(20).all()
    for a in alerts:
        case_ids = []
        import json
        try:
            case_ids = json.loads(a.RelatedCaseIDs)
        except:
            pass
        rel_case = case_ids[0] if case_ids else None
        
        events.append(schemas.TimelineEvent(
            timestamp=a.ReviewedAt or a.CreatedAt,
            type="AlertReview",
            summary=f"Alert '{a.Reason}' marked as {a.Status}",
            actor=a.ReviewedBy or "System",
            related_case_id=rel_case
        ))
        
    notifs = db.query(Notification).filter(Notification.IsUrgent == True).order_by(Notification.CreatedAt.desc()).limit(20).all()
    for n in notifs:
        events.append(schemas.TimelineEvent(
            timestamp=n.CreatedAt,
            type="UrgentNotification",
            summary=n.Title + ": " + n.Message,
            actor="System",
            related_case_id=n.RelatedID
        ))
        
    events.sort(key=lambda x: x.timestamp, reverse=True)
    return schemas.TimelineResponse(events=events[:50])
