from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.modules.teacher.repository import TeacherRepository, MockTeacherRepository, RealTeacherRepository

# Shared mock instance to persist state across request lifecycles during runtime
_mock_repository_instance = MockTeacherRepository()

def get_teacher_repository(db: AsyncSession) -> TeacherRepository:
    """
    ADSA Data Source Resolver for Teacher Module.
    """
    mode = settings.get_resolved_mode("teacher.assignments")
    
    if mode == "REAL":
        return RealTeacherRepository(db)
    else:
        return _mock_repository_instance

