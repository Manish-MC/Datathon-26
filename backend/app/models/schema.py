from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db import Base

class Rank(Base):
    __tablename__ = "Rank"
    
    RankID = Column(Integer, primary_key=True, index=True)
    RankName = Column(String, nullable=False, unique=True)
    Hierarchy = Column(Integer, nullable=False) # Lower number = higher authority
    
    employees = relationship("Employee", back_populates="rank")

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
    
    rank = relationship("Rank", back_populates="employees")
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
    
    cases = relationship("CaseMaster", back_populates="police_station")

class CaseCategory(Base):
    __tablename__ = "CaseCategory"
    
    CaseCategoryID = Column(Integer, primary_key=True, index=True)
    LookupValue = Column(String, nullable=False, unique=True)
    
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
    
    # Relationships
    police_station = relationship("Unit", back_populates="cases")
    category = relationship("CaseCategory", back_populates="cases")
    status = relationship("CaseStatusMaster", back_populates="cases")
    
    complainants = relationship("ComplainantDetails", back_populates="case", cascade="all, delete-orphan")
    victims = relationship("Victim", back_populates="case", cascade="all, delete-orphan")
    accused = relationship("Accused", back_populates="case", cascade="all, delete-orphan")
    arrests = relationship("ArrestSurrender", back_populates="case", cascade="all, delete-orphan")
    summary = relationship("CaseSummary", back_populates="case", uselist=False, cascade="all, delete-orphan")

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
