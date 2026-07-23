from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
import os
import json
from datetime import datetime

from app.db import get_db
from app.models.schema import CaseMaster, Evidence, EvidenceLink
from app import schemas
from app.services.auth_service import require_permission, Employee

router = APIRouter(prefix="/evidence", tags=["evidence"])

ALLOWED_MIME_TYPES = {
    # Images
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/heic": "heic",
    # Video
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    # Audio
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-m4a": "m4a",
    # Documents
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}

MAX_FILE_SIZE = 25 * 1024 * 1024 # 25MB

@router.post("", response_model=schemas.EvidenceResponse)
async def upload_evidence(
    CaseMasterID: int = Form(...),
    LocationLat: Optional[float] = Form(None),
    LocationLng: Optional[float] = Form(None),
    LocationText: Optional[str] = Form(None),
    Description: Optional[str] = Form(None),
    AccusedIDs: Optional[str] = Form(None), # Comma separated list of AccusedMasterID
    VictimIDs: Optional[str] = Form(None), # Comma separated list of VictimMasterID
    UnlistedPersonNote: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_permission("upload_evidence"))
):
    # Validate Case
    case = db.query(CaseMaster).filter(CaseMaster.CaseMasterID == CaseMasterID).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Validate file type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Supported types: images, video (mp4/mov), audio (mp3/wav/m4a), docs (pdf/doc).")

    # Validate file size (reading into memory to check size)
    file_bytes = await file.read()
    file_size = len(file_bytes)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds the 25MB size limit")

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # Ensure upload directory exists
    base_upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "evidence", str(CaseMasterID))
    os.makedirs(base_upload_dir, exist_ok=True)
    
    # Save file
    file_extension = ALLOWED_MIME_TYPES[file.content_type]
    file_uuid = str(uuid.uuid4())
    filename = f"{file_uuid}.{file_extension}"
    file_path = os.path.join(base_upload_dir, filename)
    
    with open(file_path, "wb") as f:
        f.write(file_bytes)
        
    relative_url = f"/uploads/evidence/{CaseMasterID}/{filename}"
    
    # Create Evidence Record
    new_evidence = Evidence(
        CaseMasterID=CaseMasterID,
        UploadedByEmployeeID=current_employee.EmployeeID,
        FileURL=relative_url,
        FileType=file.content_type,
        OriginalFileName=file.filename,
        FileSizeBytes=file_size,
        LocationLat=LocationLat,
        LocationLng=LocationLng,
        LocationText=LocationText,
        Description=Description,
        UploadedAt=datetime.now()
    )
    
    db.add(new_evidence)
    db.flush()
    
    # Process links (Suspects)
    if AccusedIDs:
        try:
            ids = [int(x.strip()) for x in AccusedIDs.split(",") if x.strip()]
            for a_id in ids:
                link = EvidenceLink(
                    EvidenceID=new_evidence.EvidenceID,
                    PersonType="suspect",
                    AccusedMasterID=a_id
                )
                db.add(link)
        except Exception:
            pass
            
    # Process links (Victims)
    if VictimIDs:
        try:
            ids = [int(x.strip()) for x in VictimIDs.split(",") if x.strip()]
            for v_id in ids:
                link = EvidenceLink(
                    EvidenceID=new_evidence.EvidenceID,
                    PersonType="victim",
                    VictimMasterID=v_id
                )
                db.add(link)
        except Exception:
            pass
            
    # Unlisted Persons
    if UnlistedPersonNote:
        link = EvidenceLink(
            EvidenceID=new_evidence.EvidenceID,
            PersonType="unlisted",
            UnlistedPersonNote=UnlistedPersonNote
        )
        db.add(link)
        
    db.commit()
    db.refresh(new_evidence)
    
    return new_evidence

@router.get("/pending", response_model=List[schemas.EvidenceResponse])
def get_pending_evidence(db: Session = Depends(get_db), current_employee: Employee = Depends(require_permission("verify_evidence"))):
    pending_evidence = db.query(Evidence).join(CaseMaster).filter(
        Evidence.VerificationStatus == "pending",
        CaseMaster.PoliceStationID == current_employee.UnitID
    ).all()
    return pending_evidence

@router.patch("/{evidence_id}/verify", response_model=schemas.EvidenceResponse)
def verify_evidence(evidence_id: int, db: Session = Depends(get_db), current_employee: Employee = Depends(require_permission("verify_evidence"))):
    evidence = db.query(Evidence).filter(Evidence.EvidenceID == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
        
    if evidence.VerificationStatus == "verified":
        raise HTTPException(status_code=400, detail=f"Evidence already verified by {evidence.VerifiedByRankName}")
        
    if evidence.UploadedByEmployeeID == current_employee.EmployeeID:
        raise HTTPException(status_code=403, detail="You cannot verify evidence that you uploaded yourself")
        
    evidence.VerificationStatus = "verified"
    evidence.VerifiedByEmployeeID = current_employee.EmployeeID
    evidence.VerifiedByRankName = current_employee.rank.RankName
    evidence.VerifiedAt = datetime.now()
    
    db.commit()
    db.refresh(evidence)
    return evidence
