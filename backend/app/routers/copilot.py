from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.schema import Employee
from app import schemas
from app.services.auth_service import get_current_employee
from app.permissions import get_permissions_for_rank
from app.services.copilot_engine import process_query_and_log

router = APIRouter(prefix="/copilot", tags=["copilot"])

@router.post("/query", response_model=schemas.CopilotQueryResponse)
def query_copilot(
    request: schemas.CopilotQueryRequest,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    perms = get_permissions_for_rank(current_employee.rank.RankName)
    if "ai_copilot" not in perms:
        raise HTTPException(status_code=403, detail="Not authorized to use AI Copilot")
        
    result = process_query_and_log(request.query, db, current_employee)
    
    return schemas.CopilotQueryResponse(
        text=result["text"],
        endpoint_used=result["endpoint_used"]
    )
