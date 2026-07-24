from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class ComplainantBase(BaseModel):
    ComplainantID: int
    ComplainantName: str
    AgeYear: Optional[int] = None
    GenderID: int
    model_config = ConfigDict(from_attributes=True)

class VictimBase(BaseModel):
    VictimMasterID: int
    VictimName: str
    AgeYear: Optional[int] = None
    GenderID: int
    model_config = ConfigDict(from_attributes=True)

class AccusedBase(BaseModel):
    AccusedMasterID: int
    AccusedName: str
    AgeYear: Optional[int] = None
    GenderID: int
    PersonID: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class ArrestBase(BaseModel):
    ArrestSurrenderID: int
    ArrestSurrenderDate: datetime
    ArrestSurrenderTypeID: int
    model_config = ConfigDict(from_attributes=True)

class CaseSummaryBase(BaseModel):
    SummaryText: str
    GeneratedAt: datetime
    model_config = ConfigDict(from_attributes=True)

class EvidenceLinkResponse(BaseModel):
    EvidenceLinkID: int
    PersonType: str
    AccusedMasterID: Optional[int] = None
    VictimMasterID: Optional[int] = None
    UnlistedPersonNote: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class EvidenceResponse(BaseModel):
    EvidenceID: int
    UploadedByEmployeeID: int
    FileURL: str
    FileType: str
    OriginalFileName: str
    FileSizeBytes: int
    LocationLat: Optional[float] = None
    LocationLng: Optional[float] = None
    LocationText: Optional[str] = None
    Description: Optional[str] = None
    UploadedAt: datetime
    
    VerificationStatus: str = "pending"
    VerifiedByEmployeeID: Optional[int] = None
    VerifiedByRankName: Optional[str] = None
    VerifiedAt: Optional[datetime] = None
    
    links: List[EvidenceLinkResponse] = []
    
    # Optional fields that can be included by custom queries
    uploader_name: Optional[str] = None
    uploader_rank: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class UnitBase(BaseModel):
    UnitID: int
    UnitName: str
    model_config = ConfigDict(from_attributes=True)

class CaseCategoryBase(BaseModel):
    CaseCategoryID: int
    LookupValue: str
    model_config = ConfigDict(from_attributes=True)

class CaseStatusBase(BaseModel):
    CaseStatusID: int
    CaseStatusName: str
    model_config = ConfigDict(from_attributes=True)

class CaseCreate(BaseModel):
    CrimeNo: str
    CaseCategoryID: int
    PoliceStationID: int
    IncidentFromDate: datetime
    latitude: float
    longitude: float
    BriefFacts: str
    BroadcastOnCreate: bool = False
    BroadcastReason: Optional[str] = None

class CaseMasterList(BaseModel):
    CaseMasterID: int
    CrimeNo: str
    CaseNo: str
    CrimeRegisteredDate: datetime
    IncidentFromDate: datetime
    IncidentToDate: Optional[datetime] = None
    BriefFacts: str
    PoliceStationID: int
    CaseCategoryID: int
    CaseStatusID: int
    
    police_station: Optional[UnitBase] = None
    category: Optional[CaseCategoryBase] = None
    status: Optional[CaseStatusBase] = None

    model_config = ConfigDict(from_attributes=True)

class CaseMasterDetail(CaseMasterList):
    GravityOffenceID: int
    CrimeMajorHeadID: int
    CrimeMinorHeadID: int
    latitude: float
    longitude: float
    
    complainants: List[ComplainantBase] = []
    victims: List[VictimBase] = []
    accused: List[AccusedBase] = []
    arrests: List[ArrestBase] = []
    summary: Optional[CaseSummaryBase] = None
    evidence: List[EvidenceResponse] = []
    investigations: List['InvestigationResponse'] = []

    model_config = ConfigDict(from_attributes=True)

class CaseMapItem(BaseModel):
    CaseMasterID: int
    latitude: float
    longitude: float
    CrimeMajorHeadID: int
    CrimeRegisteredDate: datetime
    CrimeNo: str

    model_config = ConfigDict(from_attributes=True)

class HotspotCell(BaseModel):
    latitude: float
    longitude: float
    case_count: int

class SimilarCase(BaseModel):
    CaseMasterID: int
    CrimeNo: str
    CaseCategoryID: int
    score: float
    matched_on: List[str]
    model_config = ConfigDict(from_attributes=True)

class AlertBase(BaseModel):
    AlertType: str
    RelatedCaseIDs: str
    Reason: str
    Score: float

class AlertUpdate(BaseModel):
    Status: str
    ReviewedBy: Optional[str] = None

class AlertResponse(AlertBase):
    AlertID: int
    CreatedAt: datetime
    Status: str
    ReviewedBy: Optional[str] = None
    ReviewedAt: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class ProfileResponse(BaseModel):
    EmployeeID: int
    LoginID: str
    EmployeeName: str
    PhoneNumber: Optional[str] = None
    Email: Optional[str] = None
    RankName: str
    PhotoURL: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class StationTeamMember(BaseModel):
    EmployeeID: int
    LoginID: str
    EmployeeName: str
    RankName: str
    PhotoURL: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ProfileUpdate(BaseModel):
    EmployeeName: Optional[str] = None
    PhoneNumber: Optional[str] = None
    Email: Optional[str] = None

class NotificationResponse(BaseModel):
    NotificationID: int
    Title: str
    Message: str
    Type: str
    RelatedID: Optional[int] = None
    CreatedAt: datetime
    IsRead: bool
    IsUrgent: bool
    
    model_config = ConfigDict(from_attributes=True)

class BroadcastRequest(BaseModel):
    reason: str

class UnreadCountResponse(BaseModel):
    count: int

class InvestigationBase(BaseModel):
    InvestigationID: int
    CaseMasterID: int
    OrderedByEmployeeID: Optional[int] = None
    LeadOfficerEmployeeID: Optional[int] = None
    DirectiveNote: Optional[str] = None
    CreatedAt: datetime
    model_config = ConfigDict(from_attributes=True)

class InvestigationResponse(InvestigationBase):
    pass

class OrderInvestigationRequest(BaseModel):
    TargetInspectorEmployeeID: Optional[int] = None
    NotifyAllInspectors: bool = False
    DirectiveNote: Optional[str] = None

class DistrictResponse(BaseModel):
    DistrictID: int
    DistrictName: str
    RangeID: int
    model_config = ConfigDict(from_attributes=True)

class DistrictComparisonStats(BaseModel):
    DistrictID: int
    DistrictName: str
    total_cases: int
    active_hotspots: int
    trend_90_days_pct: float
    categories: dict

class DistrictComparisonResponse(BaseModel):
    districts: List[DistrictComparisonStats]
    insights: List[str]

class RegionalHeatmapItem(BaseModel):
    district_id: int
    district_name: str
    lat: float
    lng: float
    case_count: int
    intensity: float

class RiskFactorBreakdown(BaseModel):
    case_volume_trend: float
    hotspot_density: float
    severity_mix: float

class DistrictRiskRatingItem(BaseModel):
    district_id: int
    district_name: str
    risk_index: float
    breakdown: RiskFactorBreakdown

class DistrictRiskRatingResponse(BaseModel):
    ratings: List[DistrictRiskRatingItem]

class DepartmentResponse(BaseModel):
    DepartmentID: int
    DepartmentName: str
    model_config = ConfigDict(from_attributes=True)

class DepartmentCaseFlagCreate(BaseModel):
    ToDepartmentID: int
    Note: str

class DepartmentCaseFlagUpdate(BaseModel):
    Status: str # "acknowledged" or "resolved"

class DepartmentCaseFlagResponse(BaseModel):
    FlagID: int
    CaseMasterID: int
    CrimeNo: str
    FlaggedByEmployeeID: int
    FlaggedByEmployeeName: str
    FlaggedByRank: str
    FromDepartmentID: int
    FromDepartmentName: str
    ToDepartmentID: int
    Note: str
    CreatedAt: datetime
    Status: str
    model_config = ConfigDict(from_attributes=True)

class DepartmentStatusBreakdown(BaseModel):
    status_name: str
    count: int

class DepartmentKPIResponse(BaseModel):
    total_cases: int
    trend_90_days_pct: float
    status_breakdown: List[DepartmentStatusBreakdown]
    district_risk_ratings: List[DistrictRiskRatingItem]

class CopilotQueryRequest(BaseModel):
    query: str

class CopilotQueryResponse(BaseModel):
    text: str
    endpoint_used: Optional[str] = None

class AnomalyItem(BaseModel):
    district_id: int
    district_name: str
    z_score: float
    reason: str

class AnomalyResponse(BaseModel):
    anomalies: List[AnomalyItem]

class NetworkNode(BaseModel):
    id: str
    label: str
    type: str # 'Case', 'Accused', 'Victim'
    detail_id: int # To link back to case or person

class NetworkEdge(BaseModel):
    source: str
    target: str
    label: str

class NetworkGraphResponse(BaseModel):
    nodes: List[NetworkNode]
    edges: List[NetworkEdge]

class TimelineEvent(BaseModel):
    timestamp: datetime
    type: str
    summary: str
    actor: str
    related_case_id: Optional[int]

class TimelineResponse(BaseModel):
    events: List[TimelineEvent]
