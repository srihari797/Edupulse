from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.modules.parent.repository import ParentRepository, MockParentRepository, RealParentRepository

# Shared mock instance to persist state across request lifecycles during runtime
_mock_repository_instance = MockParentRepository()

def get_parent_repository(db: AsyncSession) -> ParentRepository:
    """
    ADSA Data Source Resolver for Parent Module.
    """
    mode = settings.get_resolved_mode("parent.progress")
    
    if mode == "REAL":
        return RealParentRepository(db)
    else:
        return _mock_repository_instance

