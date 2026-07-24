from sqlalchemy.orm import Session
from app.models.schema import Employee, Rank

def get_district_officers(db: Session, district_id: int, rank_name: str = None):
    """
    Returns active officers belonging to the specified district.
    Optionally filters by a specific rank_name (e.g., 'Inspector / SHO').
    """
    query = db.query(Employee).filter(Employee.DistrictID == district_id, Employee.Active == True)
    if rank_name:
        query = query.join(Rank).filter(Rank.RankName == rank_name)
    return query.all()

def get_range_districts(db: Session, range_id: int):
    """
    Returns all District rows under the given PoliceRange.
    """
    from app.models.schema import District
    return db.query(District).filter(District.RangeID == range_id).all()

def get_zone_districts(db: Session, zone_id: int):
    """
    Returns all District rows under all PoliceRanges of the given PoliceZone.
    """
    from app.models.schema import District, PoliceRange
    return db.query(District).join(PoliceRange).filter(PoliceRange.ZoneID == zone_id).all()
