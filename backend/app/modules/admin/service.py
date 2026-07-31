from typing import Optional, Dict, Any, List
from app.modules.admin.repository import (
    AdminUserRepository, AcademicRepository, TeacherManagementRepository, StudentManagementRepository, ConfigRepository, AdminDashboardRepository
)
from app.core.security import get_password_hash

class AdminUserService:
    """
    Business Service Layer for User Administration.
    """
    def __init__(self, repository: AdminUserRepository):
        self.repository = repository

    async def create_user(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raw_password = payload.pop("password")
        payload["password_hash"] = get_password_hash(raw_password)
        return await self.repository.create_user(payload)

    async def get_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        return await self.repository.get_user_by_id(user_id)

    async def update_user(self, user_id: int, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await self.repository.update_user(user_id, payload)

    async def filter_users(self, role_id: Optional[int] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        return await self.repository.filter_users(role_id, search)

    async def reset_password(self, user_id: int, raw_password: str) -> bool:
        password_hash = get_password_hash(raw_password)
        return await self.repository.reset_password(user_id, password_hash)


class AcademicService:
    """
    Business Service Layer for Academic Structure.
    """
    def __init__(self, repository: AcademicRepository):
        self.repository = repository

    # Classes
    async def create_class(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return await self.repository.create_class(payload)

    async def get_classes(self) -> List[Dict[str, Any]]:
        return await self.repository.get_classes()

    async def get_class_students(self, class_id: int) -> List[Dict[str, Any]]:
        return await self.repository.get_class_students(class_id)

    async def update_class(self, class_id: int, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await self.repository.update_class(class_id, payload)

    async def delete_class(self, class_id: int) -> bool:
        return await self.repository.delete_class(class_id)

    # Sections
    async def create_section(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return await self.repository.create_section(payload)

    async def get_sections(self) -> List[Dict[str, Any]]:
        return await self.repository.get_sections()

    async def update_section(self, section_id: int, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await self.repository.update_section(section_id, payload)

    async def delete_section(self, section_id: int) -> bool:
        return await self.repository.delete_section(section_id)

    # Subjects
    async def create_subject(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return await self.repository.create_subject(payload)

    async def get_subjects(self) -> List[Dict[str, Any]]:
        return await self.repository.get_subjects()

    async def update_subject(self, subject_id: int, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await self.repository.update_subject(subject_id, payload)

    async def delete_subject(self, subject_id: int) -> bool:
        return await self.repository.delete_subject(subject_id)

    # Academic Year
    async def create_academic_year(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return await self.repository.create_academic_year(payload)

    async def get_academic_years(self) -> List[Dict[str, Any]]:
        return await self.repository.get_academic_years()


class TeacherManagementService:
    """
    Business Service Layer for Teacher Assignments.
    """
    def __init__(self, repository: TeacherManagementRepository):
        self.repository = repository

    async def assign_teacher(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return await self.repository.assign_teacher(payload)

    async def get_teacher_assignments(self, teacher_id: Optional[int] = None) -> List[Dict[str, Any]]:
        return await self.repository.get_teacher_assignments(teacher_id)


class StudentManagementService:
    """
    Business Service Layer for Student management, mapping, and promotion.
    """
    def __init__(self, repository: StudentManagementRepository):
        self.repository = repository

    async def map_student_class(self, student_id: int, class_id: int) -> bool:
        return await self.repository.map_student_class(student_id, class_id)

    async def link_parent(self, student_id: int, parent_id: int) -> Dict[str, Any]:
        return await self.repository.link_parent(student_id, parent_id)

    async def promote_students(self, student_ids: List[int], target_class_id: int) -> int:
        return await self.repository.promote_students(student_ids, target_class_id)


class ConfigService:
    """
    Business Service Layer for School Configurations.
    """
    def __init__(self, repository: ConfigRepository):
        self.repository = repository

    # Timetable
    async def create_timetable_slot(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return await self.repository.create_timetable_slot(payload)

    async def get_timetable_slots(self, class_id: Optional[int] = None, teacher_id: Optional[int] = None) -> List[Dict[str, Any]]:
        return await self.repository.get_timetable_slots(class_id, teacher_id)

    async def get_available_teachers(self) -> List[Dict[str, Any]]:
        return await self.repository.get_available_teachers()

    async def publish_timetable(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        return await self.repository.publish_timetable(payload)

    async def analyze_timetable(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return await self.repository.analyze_timetable(payload)

    async def generate_ai_timetable(self, class_id: int, teacher_ids: Optional[List[int]] = None) -> Dict[str, Any]:
        return await self.repository.generate_ai_timetable(class_id, teacher_ids)


    # Calendar
    async def create_calendar_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return await self.repository.create_calendar_event(payload)

    async def get_calendar_events(self) -> List[Dict[str, Any]]:
        return await self.repository.get_calendar_events()

    # Settings
    async def set_system_setting(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return await self.repository.set_system_setting(payload["key"], payload["value"])

    async def get_system_settings(self) -> List[Dict[str, Any]]:
        return await self.repository.get_system_settings()


class AdminDashboardService:
    """
    Business Service Layer for Admin Dashboard Summary metrics.
    """
    def __init__(self, repository: AdminDashboardRepository):
        self.repository = repository

    async def get_dashboard_summary(self) -> Dict[str, Any]:
        return await self.repository.get_dashboard_summary()
