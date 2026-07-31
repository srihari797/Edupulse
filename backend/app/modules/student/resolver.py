from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.modules.student.repository import StudentRepository, MockStudentRepository, RealStudentRepository

# Single shared instance for in-memory mock statefulness across requests
_mock_repository_instance = MockStudentRepository()

def get_student_repository(db: AsyncSession) -> StudentRepository:
    """
    ADSA Data Source Resolver for Student Module.
    Selects between Mock and Real repositories depending on active settings configuration.
    """
    mode = settings.get_resolved_mode("student.profile")
    
    if mode == "REAL":
        return RealStudentRepository(db)
    elif mode == "HYBRID":
        # Hybrid defaults to REAL if possible, falls back to MOCK
        # For MVP phase, fallback to MOCK
        return _mock_repository_instance
    else:
        # Default to MOCK
        return _mock_repository_instance

