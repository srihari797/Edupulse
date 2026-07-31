from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.modules.growth.repository import GrowthRepository, MockGrowthRepository, RealGrowthRepository

# Shared mock repository instance to persist state during application runtime
_mock_repository_instance = MockGrowthRepository()

def get_growth_repository(db: AsyncSession) -> GrowthRepository:
    """
    ADSA Data Source Resolver for Growth Module.
    """
    mode = settings.get_resolved_mode("student.analytics") # Using analytics mode configuration as fallback
    
    if mode == "REAL":
        return RealGrowthRepository(db)
    else:
        return _mock_repository_instance

