from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.growth.resolver import get_growth_repository
from app.modules.growth.service import GrowthService
from app.modules.growth.schemas import (
    GrowthPassportResponse,
    GrowthPassportDTO,
    RecognitionResponse,
    RecognitionDTO
)

from app.auth.router import get_current_user
from app.auth.schemas import UserDTO

router = APIRouter(prefix="/students", tags=["growth"])

def get_current_student(
    current_user: UserDTO = Depends(get_current_user)
) -> UserDTO:
    """
    Dependency verifying that the user is authenticated and has the Student role (role_id = 1).
    """
    if current_user.role_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: User role is not authorized to access Growth endpoints."
        )
    return current_user

def get_growth_service(
    db: AsyncSession = Depends(get_db)
) -> GrowthService:
    repository = get_growth_repository(db)
    return GrowthService(repository)

@router.get("/growth-passport", response_model=GrowthPassportResponse)
async def get_growth_passport(
    current_student: UserDTO = Depends(get_current_student),
    service: GrowthService = Depends(get_growth_service)
):
    """
    Retrieve holistic student growth passport containing academic and extracurricular progress.
    """
    data = await service.get_passport(current_student.id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Growth passport not found."
        )
    dto = GrowthPassportDTO(**data)
    return GrowthPassportResponse(
        success=True,
        message="Holistic growth passport retrieved successfully.",
        data=dto
    )

@router.get("/recognition", response_model=RecognitionResponse)
async def get_recognition(
    current_student: UserDTO = Depends(get_current_student),
    service: GrowthService = Depends(get_growth_service)
):
    """
    Retrieve earned badges, milestones, and appreciation records.
    """
    data = await service.get_recognition(current_student.id)
    dto = RecognitionDTO(**data)
    return RecognitionResponse(
        success=True,
        message="Appreciation and recognition records retrieved successfully.",
        data=dto
    )

