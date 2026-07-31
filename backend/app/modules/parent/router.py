from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.modules.parent.resolver import get_parent_repository
from app.modules.parent.service import ParentService
from app.modules.parent.schemas import (
    ParentDashboardResponse,
    ParentDashboardDTO,
    BusTrackingResponse,
    BusTrackingDTO,
    AICoachQueryRequest,
    AICoachResponse,
    AICoachAdviceDTO,
    AICoachHistoryResponse
)

from app.auth.router import get_current_user
from app.auth.schemas import UserDTO

router = APIRouter(prefix="/parents", tags=["parent"])

def get_current_parent(
    current_user: UserDTO = Depends(get_current_user)
) -> UserDTO:
    """
    Dependency verifying that the user is authenticated and has the Parent role (role_id = 2).
    """
    if current_user.role_id != 2:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: User role is not authorized to access Parent endpoints."
        )
    return current_user

def get_parent_service(
    db: AsyncSession = Depends(get_db)
) -> ParentService:
    repository = get_parent_repository(db)
    return ParentService(repository, db=db)

@router.get("/dashboard", response_model=ParentDashboardResponse)
async def get_dashboard(
    mode: Optional[str] = None,
    current_parent: UserDTO = Depends(get_current_parent),
    service: ParentService = Depends(get_parent_service)
):
    """
    Retrieve parent dashboard statistics and linked student overview.
    Supports mode=mock or mode=real optional query parameter.
    """
    data = await service.get_dashboard(current_parent.id, mode=mode)
    dto = ParentDashboardDTO(**data)
    return ParentDashboardResponse(
        success=True,
        message="Parent dashboard statistics retrieved successfully.",
        data=dto
    )

@router.get("/bus-tracking", response_model=BusTrackingResponse)
async def get_bus_tracking(
    current_parent: UserDTO = Depends(get_current_parent),
    service: ParentService = Depends(get_parent_service)
):
    """
    Retrieve simulated real-time school bus tracking status.
    """
    data = await service.get_bus_tracking(current_parent.id)
    dto = BusTrackingDTO(**data)
    return BusTrackingResponse(
        success=True,
        message="Bus tracking coordinates retrieved successfully.",
        data=dto
    )

@router.post("/ai-coach", response_model=AICoachResponse)
async def ask_ai_coach(
    payload: AICoachQueryRequest,
    current_parent: UserDTO = Depends(get_current_parent),
    service: ParentService = Depends(get_parent_service)
):
    """
    Query the AI Parent Coach for parenting guidance, study recommendations, or wellness advice.
    """
    print(f"Incoming User Question:\n{payload.query}")
    advice = await service.ask_ai_coach(current_parent.id, payload.query)
    dto = AICoachAdviceDTO(**advice)
    return AICoachResponse(
        success=True,
        message="AI Coach advice generated successfully.",
        data=dto
    )

@router.get("/ai-coach/history", response_model=AICoachHistoryResponse)
async def get_ai_coach_history(
    current_parent: UserDTO = Depends(get_current_parent),
    service: ParentService = Depends(get_parent_service)
):
    """
    Retrieve history of queries and advice compiled by the Parent AI Coach.
    """
    data = await service.get_ai_coach_history(current_parent.id)
    dtos = [AICoachAdviceDTO(**item) for item in data]
    return AICoachHistoryResponse(
        success=True,
        message="AI Coach query history retrieved successfully.",
        data=dtos
    )
