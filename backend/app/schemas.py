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
    
    model_config = ConfigDict(from_attributes=True)

class UnreadCountResponse(BaseModel):
    count: int
