from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db import Base

class Rank(Base):
    __tablename__ = "Rank"
    
    RankID = Column(Integer, primary_key=True, index=True)
    RankName = Column(String, nullable=False, unique=True)
    Hierarchy = Column(Float, nullable=False) # Lower number = higher authority
    
    employees = relationship("Employee", back_populates="rank")

class Department(Base):
    __tablename__ = "Department"
    
    DepartmentID = Column(Integer, primary_key=True, index=True)
    DepartmentName = Column(String, nullable=False, unique=True)
    
    case_categories = relationship("CaseCategory", back_populates="department")
    employees = relationship("Employee", back_populates="department")

class PoliceZone(Base):
    __tablename__ = "PoliceZone"
    
    ZoneID = Column(Integer, primary_key=True, index=True)
    ZoneName = Column(String, nullable=False, unique=True)
    
    ranges = relationship("PoliceRange", back_populates="zone")

class PoliceRange(Base):
    __tablename__ = "PoliceRange"
    
    RangeID = Column(Integer, primary_key=True, index=True)
    RangeName = Column(String, nullable=False, unique=True)
    ZoneID = Column(Integer, ForeignKey("PoliceZone.ZoneID"), nullable=True)
    
    zone = relationship("PoliceZone", back_populates="ranges")
    districts = relationship("District", back_populates="range")

class District(Base):
    __tablename__ = "District"
    
    DistrictID = Column(Integer, primary_key=True, index=True)
    DistrictName = Column(String, nullable=False, unique=True)
    RangeID = Column(Integer, ForeignKey("PoliceRange.RangeID"), nullable=False)
    
    range = relationship("PoliceRange", back_populates="districts")
    units = relationship("Unit", back_populates="district")

class AdminUser(Base):
    __tablename__ = "AdminUser"
    
    AdminID = Column(Integer, primary_key=True, index=True)
    LoginID = Column(String, nullable=False, unique=True, index=True)
    PasswordHash = Column(String, nullable=False)
    FullName = Column(String, nullable=True)
    CreatedAt = Column(DateTime, nullable=False)

class Employee(Base):
    __tablename__ = "Employee"
    
    EmployeeID = Column(Integer, primary_key=True, index=True)
    LoginID = Column(String, nullable=False, unique=True, index=True)
    PasswordHash = Column(String, nullable=False)
    EmployeeName = Column(String, nullable=False)
    PhoneNumber = Column(String, nullable=True)
    Email = Column(String, nullable=True)
    SessionVersion = Column(Integer, default=1, nullable=False)
    RankID = Column(Integer, ForeignKey("Rank.RankID"), nullable=False)
    Active = Column(Boolean, default=True, nullable=False)
    PhotoURL = Column(String, nullable=True)
    UnitID = Column(Integer, ForeignKey("Unit.UnitID"), nullable=True)
    DistrictID = Column(Integer, ForeignKey("District.DistrictID"), nullable=True, default=1)
    DepartmentID = Column(Integer, ForeignKey("Department.DepartmentID"), nullable=True)
    
    rank = relationship("Rank", back_populates="employees")
    department = relationship("Department", back_populates="employees")
    pending_otp = relationship("PendingOTP", back_populates="employee", uselist=False, cascade="all, delete-orphan")

class PendingOTP(Base):
    __tablename__ = "PendingOTP"
    
    EmployeeID = Column(Integer, ForeignKey("Employee.EmployeeID"), primary_key=True, index=True)
    OTPCode = Column(String, nullable=False)
    CreatedAt = Column(DateTime, nullable=False)
    ExpiresAt = Column(DateTime, nullable=False)
    Attempts = Column(Integer, default=0, nullable=False)
    Verified = Column(Boolean, default=False, nullable=False)
    
    employee = relationship("Employee", back_populates="pending_otp")

class Unit(Base):
    __tablename__ = "Unit"
    
    UnitID = Column(Integer, primary_key=True, index=True)
    UnitName = Column(String, nullable=False, unique=True)
    DistrictID = Column(Integer, ForeignKey("District.DistrictID"), nullable=True, default=1)
    
    cases = relationship("CaseMaster", back_populates="police_station")
    district = relationship("District", back_populates="units")

class CaseCategory(Base):
    __tablename__ = "CaseCategory"
    
    CaseCategoryID = Column(Integer, primary_key=True, index=True)
    LookupValue = Column(String, nullable=False, unique=True)
    DepartmentID = Column(Integer, ForeignKey("Department.DepartmentID"), nullable=True)
    
    department = relationship("Department", back_populates="case_categories")
    cases = relationship("CaseMaster", back_populates="category")

class CaseStatusMaster(Base):
    __tablename__ = "CaseStatusMaster"
    
    CaseStatusID = Column(Integer, primary_key=True, index=True)
    CaseStatusName = Column(String, nullable=False, unique=True)
    
    cases = relationship("CaseMaster", back_populates="status")

class CaseMaster(Base):
    __tablename__ = "CaseMaster"
    
    CaseMasterID = Column(Integer, primary_key=True, index=True)
    CrimeNo = Column(String, nullable=False)
    CaseNo = Column(String, nullable=False)
    CrimeRegisteredDate = Column(DateTime, nullable=False)
    PoliceStationID = Column(Integer, ForeignKey("Unit.UnitID"), nullable=False)
    CaseCategoryID = Column(Integer, ForeignKey("CaseCategory.CaseCategoryID"), nullable=False)
    GravityOffenceID = Column(Integer, nullable=False)  # e.g., 1=Heinous, 2=Non-Heinous
    CrimeMajorHeadID = Column(Integer, nullable=False)   # Broad category ID
    CrimeMinorHeadID = Column(Integer, nullable=False)   # Specific crime sub-category ID
    CaseStatusID = Column(Integer, ForeignKey("CaseStatusMaster.CaseStatusID"), nullable=False)
    IncidentFromDate = Column(DateTime, nullable=False)
    IncidentToDate = Column(DateTime, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    BriefFacts = Column(String, nullable=False)
    
    ApprovalStatus = Column(String, default="pending", nullable=False)
    ApprovedByEmployeeID = Column(Integer, ForeignKey("Employee.EmployeeID"), nullable=True)
    ApprovedByRankName = Column(String, nullable=True)
    ApprovedAt = Column(DateTime, nullable=True)
    
    # Relationships
    police_station = relationship("Unit", back_populates="cases")
    category = relationship("CaseCategory", back_populates="cases")
    status = relationship("CaseStatusMaster", back_populates="cases")
    
    complainants = relationship("ComplainantDetails", back_populates="case", cascade="all, delete-orphan")
    victims = relationship("Victim", back_populates="case", cascade="all, delete-orphan")
    accused = relationship("Accused", back_populates="case", cascade="all, delete-orphan")
    arrests = relationship("ArrestSurrender", back_populates="case", cascade="all, delete-orphan")
    summary = relationship("CaseSummary", back_populates="case", uselist=False, cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    department_flags = relationship("DepartmentCaseFlag", back_populates="case", cascade="all, delete-orphan")

class DepartmentCaseFlag(Base):
    __tablename__ = "DepartmentCaseFlag"
    
    FlagID = Column(Integer, primary_key=True, index=True)
    CaseMasterID = Column(Integer, ForeignKey("CaseMaster.CaseMasterID"), nullable=False, index=True)
    FlaggedByEmployeeID = Column(Integer, ForeignKey("Employee.EmployeeID"), nullable=False)
    FromDepartmentID = Column(Integer, ForeignKey("Department.DepartmentID"), nullable=False)
    ToDepartmentID = Column(Integer, ForeignKey("Department.DepartmentID"), nullable=False)
    Note = Column(String, nullable=True)
    CreatedAt = Column(DateTime, nullable=False)
    Status = Column(String, nullable=False, default="open") # "open" | "acknowledged" | "resolved"
    
    case = relationship("CaseMaster", back_populates="department_flags")
    flagged_by = relationship("Employee", foreign_keys=[FlaggedByEmployeeID])
    from_department = relationship("Department", foreign_keys=[FromDepartmentID])
    to_department = relationship("Department", foreign_keys=[ToDepartmentID])

class CaseSummary(Base):
    __tablename__ = "CaseSummary"
    
    CaseMasterID = Column(Integer, ForeignKey("CaseMaster.CaseMasterID"), primary_key=True, index=True)
    SummaryText = Column(String, nullable=False)
    GeneratedAt = Column(DateTime, nullable=False)
    
    case = relationship("CaseMaster", back_populates="summary")

class ComplainantDetails(Base):
    __tablename__ = "ComplainantDetails"
    
    ComplainantID = Column(Integer, primary_key=True, index=True)
    CaseMasterID = Column(Integer, ForeignKey("CaseMaster.CaseMasterID"), nullable=False)
    ComplainantName = Column(String, nullable=False)
    AgeYear = Column(Integer, nullable=True)
    GenderID = Column(Integer, nullable=False)  # 1=Male, 2=Female, 3=Other
    
    case = relationship("CaseMaster", back_populates="complainants")

class Victim(Base):
    __tablename__ = "Victim"
    
    VictimMasterID = Column(Integer, primary_key=True, index=True)
    CaseMasterID = Column(Integer, ForeignKey("CaseMaster.CaseMasterID"), nullable=False)
    VictimName = Column(String, nullable=False)
    AgeYear = Column(Integer, nullable=True)
    GenderID = Column(Integer, nullable=False)
    
    case = relationship("CaseMaster", back_populates="victims")

class Accused(Base):
    __tablename__ = "Accused"
    
    AccusedMasterID = Column(Integer, primary_key=True, index=True)
    CaseMasterID = Column(Integer, ForeignKey("CaseMaster.CaseMasterID"), nullable=False)
    AccusedName = Column(String, nullable=False)
    AgeYear = Column(Integer, nullable=True)
    GenderID = Column(Integer, nullable=False)
    PersonID = Column(Integer, nullable=True)  # Links accused records of same person across cases
    
    case = relationship("CaseMaster", back_populates="accused")

class ArrestSurrender(Base):
    __tablename__ = "ArrestSurrender"
    
    ArrestSurrenderID = Column(Integer, primary_key=True, index=True)
    CaseMasterID = Column(Integer, ForeignKey("CaseMaster.CaseMasterID"), nullable=False)
    ArrestSurrenderDate = Column(DateTime, nullable=False)
    ArrestSurrenderTypeID = Column(Integer, nullable=False)  # e.g., 1=Arrest, 2=Surrender
    
    case = relationship("CaseMaster", back_populates="arrests")

class Alert(Base):
    __tablename__ = "Alert"

    AlertID = Column(Integer, primary_key=True, index=True)
    AlertType = Column(String, nullable=False) # "similar_cluster" | "hotspot_spike"
    RelatedCaseIDs = Column(String, nullable=False) # JSON list of case IDs
    Reason = Column(String, nullable=False)
    Score = Column(Float, nullable=False)
    CreatedAt = Column(DateTime, nullable=False)
    Status = Column(String, nullable=False, default="open") # "open" | "reviewed" | "dismissed"
    ReviewedBy = Column(String, nullable=True)
    ReviewedAt = Column(DateTime, nullable=True)

class Notification(Base):
    __tablename__ = "Notification"
    
    NotificationID = Column(Integer, primary_key=True, index=True)
    RecipientEmployeeID = Column(Integer, ForeignKey("Employee.EmployeeID"), nullable=True, index=True)
    RecipientRankThreshold = Column(Integer, nullable=True)
    RecipientUnitID = Column(Integer, ForeignKey("Unit.UnitID"), nullable=True)
    Title = Column(String, nullable=False)
    Message = Column(String, nullable=False)
    Type = Column(String, nullable=False) # "alert" | "new_fir" | "account" | "urgent_case_alert"
    RelatedID = Column(Integer, nullable=True)
    CreatedAt = Column(DateTime, nullable=False)
    IsRead = Column(Boolean, default=False, nullable=False)
    IsUrgent = Column(Boolean, default=False, nullable=False)

class Evidence(Base):
    __tablename__ = "Evidence"
    
    EvidenceID = Column(Integer, primary_key=True, index=True)
    CaseMasterID = Column(Integer, ForeignKey("CaseMaster.CaseMasterID"), nullable=False, index=True)
    UploadedByEmployeeID = Column(Integer, ForeignKey("Employee.EmployeeID"), nullable=False)
    FileURL = Column(String, nullable=False)
    FileType = Column(String, nullable=False)
    OriginalFileName = Column(String, nullable=False)
    FileSizeBytes = Column(Integer, nullable=False)
    LocationLat = Column(Float, nullable=True)
    LocationLng = Column(Float, nullable=True)
    LocationText = Column(String, nullable=True)
    Description = Column(String, nullable=True)
    UploadedAt = Column(DateTime, nullable=False)
    
    VerificationStatus = Column(String, default="pending", nullable=False)
    VerifiedByEmployeeID = Column(Integer, ForeignKey("Employee.EmployeeID"), nullable=True)
    VerifiedByRankName = Column(String, nullable=True)
    VerifiedAt = Column(DateTime, nullable=True)
    
    case = relationship("CaseMaster", back_populates="evidence")
    uploaded_by = relationship("Employee", foreign_keys=[UploadedByEmployeeID])
    verified_by = relationship("Employee", foreign_keys=[VerifiedByEmployeeID])
    links = relationship("EvidenceLink", back_populates="evidence", cascade="all, delete-orphan")

    @property
    def uploader_name(self) -> str:
        return self.uploaded_by.EmployeeName if self.uploaded_by else "Unknown"

    @property
    def uploader_rank(self) -> str:
        return self.uploaded_by.rank.RankName if self.uploaded_by and self.uploaded_by.rank else "Unknown"

class EvidenceLink(Base):
    __tablename__ = "EvidenceLink"
    
    EvidenceLinkID = Column(Integer, primary_key=True, index=True)
    EvidenceID = Column(Integer, ForeignKey("Evidence.EvidenceID"), nullable=False, index=True)
    PersonType = Column(String, nullable=False) # "suspect", "victim", "unlisted"
    AccusedMasterID = Column(Integer, ForeignKey("Accused.AccusedMasterID"), nullable=True)
    VictimMasterID = Column(Integer, ForeignKey("Victim.VictimMasterID"), nullable=True)
    UnlistedPersonNote = Column(String, nullable=True)
    
    evidence = relationship("Evidence", back_populates="links")

class Investigation(Base):
    __tablename__ = "Investigation"
    
    InvestigationID = Column(Integer, primary_key=True, index=True)
    CaseMasterID = Column(Integer, ForeignKey("CaseMaster.CaseMasterID"), nullable=False, index=True)
    OrderedByEmployeeID = Column(Integer, ForeignKey("Employee.EmployeeID"), nullable=True)
    LeadOfficerEmployeeID = Column(Integer, ForeignKey("Employee.EmployeeID"), nullable=True)
    DirectiveNote = Column(String, nullable=True)
    CreatedAt = Column(DateTime, nullable=False)
    
    case = relationship("CaseMaster", backref="investigations")
    ordered_by = relationship("Employee", foreign_keys=[OrderedByEmployeeID])
    lead_officer = relationship("Employee", foreign_keys=[LeadOfficerEmployeeID])


class CopilotQueryLog(Base):
    __tablename__ = "CopilotQueryLog"
    
    LogID = Column(Integer, primary_key=True, index=True)
    Query = Column(String, nullable=False)
    MatchedIntent = Column(String, nullable=True)
    EmployeeID = Column(Integer, ForeignKey("Employee.EmployeeID"), nullable=False)
    CreatedAt = Column(DateTime, nullable=False)

