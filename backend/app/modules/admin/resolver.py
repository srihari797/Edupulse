from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.modules.admin.repository import (
    AdminUserRepository, MockUserRepository, RealUserRepository,
    AcademicRepository, MockAcademicRepository, RealAcademicRepository,
    TeacherManagementRepository, MockTeacherManagementRepository, RealTeacherManagementRepository,
    StudentManagementRepository, MockStudentManagementRepository, RealStudentManagementRepository,
    ConfigRepository, MockConfigRepository, RealConfigRepository,
    AdminDashboardRepository, MockAdminDashboardRepository, RealAdminDashboardRepository
)

# Shared mock repository instances to persist state during application runtime
_mock_user_repository = MockUserRepository()
_mock_academic_repository = MockAcademicRepository()
_mock_teacher_repository = MockTeacherManagementRepository()
_mock_student_repository = MockStudentManagementRepository()
_mock_config_repository = MockConfigRepository()
_mock_dashboard_repository = MockAdminDashboardRepository()

def get_admin_user_repository(db: AsyncSession) -> AdminUserRepository:
    """
    ADSA Data Source Resolver for Admin User Module.
    """
    mode = settings.get_resolved_mode("admin.reports")
    
    if mode == "REAL":
        return RealUserRepository(db)
    else:
        return _mock_user_repository

def get_academic_repository(db: AsyncSession) -> AcademicRepository:
    """
    ADSA Data Source Resolver for Academic Structure.
    """
    mode = settings.get_resolved_mode("admin.reports")
    
    if mode == "REAL":
        return RealAcademicRepository(db)
    else:
        return _mock_academic_repository

def get_teacher_management_repository(db: AsyncSession) -> TeacherManagementRepository:
    """
    ADSA Data Source Resolver for Teacher Management.
    """
    mode = settings.get_resolved_mode("admin.reports")
    
    if mode == "REAL":
        return RealTeacherManagementRepository(db)
    else:
        return _mock_teacher_repository

def get_student_management_repository(db: AsyncSession) -> StudentManagementRepository:
    """
    ADSA Data Source Resolver for Student Management.
    """
    mode = settings.get_resolved_mode("admin.reports")
    
    if mode == "REAL":
        return RealStudentManagementRepository(db)
    else:
        return _mock_student_repository

def get_config_repository(db: AsyncSession) -> ConfigRepository:
    """
    ADSA Data Source Resolver for School Configuration.
    """
    mode = settings.get_resolved_mode("admin.reports")
    
    if mode == "REAL":
        return RealConfigRepository(db)
    else:
        return _mock_config_repository

def get_admin_dashboard_repository(db: AsyncSession) -> AdminDashboardRepository:
    """
    ADSA Data Source Resolver for Admin Dashboard.
    """
    mode = settings.get_resolved_mode("admin.reports")
    
    if mode == "REAL":
        return RealAdminDashboardRepository(db)
    else:
        return _mock_dashboard_repository

