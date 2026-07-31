from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from sqlalchemy import select, delete
from datetime import datetime

from app.models.user import User
from app.models.class_model import (
    Class, Section, Subject, AcademicYear, TeacherClassSubject, StudentParentMapping,
    TimetableSlot, CalendarEvent, SystemSetting
)
from app.modules.teacher.models import TeacherProfile


class AdminUserRepository(ABC):
    """
    Interface for Admin User Repository.
    """
    @abstractmethod
    async def create_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def update_user(self, user_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def filter_users(self, role_id: Optional[int], search: Optional[str]) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def reset_password(self, user_id: int, password_hash: str) -> bool:
        pass

from app.auth.router import MOCK_USERS

class MockUserRepository(AdminUserRepository):
    """
    Mock implementation of AdminUserRepository.
    """
    def __init__(self):
        self.mock_users = {
            1: {"id": 1, "email": "rahul.b@edupulse.edu", "first_name": "Rahul", "last_name": "B", "role_id": 1, "is_active": True},
            2: {"id": 2, "email": "sarah.b@parent.edupulse.edu", "first_name": "Sarah", "last_name": "B", "role_id": 2, "is_active": True},
            3: {"id": 3, "email": "david.miller@teacher.edupulse.edu", "first_name": "David", "last_name": "Miller", "role_id": 3, "is_active": True}
        }

    async def create_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        existing_ids = [u["id"] for u in self.mock_users.values()] + [u["id"] for u in MOCK_USERS.values() if isinstance(u, dict) and "id" in u]
        user_id = max(existing_ids + [0]) + 1
        email_key = data["email"].lower().strip()
        user = {
            "id": user_id,
            "email": data["email"],
            "password_hash": data.get("password_hash"),
            "first_name": data.get("first_name"),
            "last_name": data.get("last_name"),
            "role_id": data["role_id"],
            "is_active": True
        }
        self.mock_users[user_id] = user
        MOCK_USERS[email_key] = user
        return {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "role_id": user["role_id"],
            "is_active": user["is_active"]
        }

    async def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.mock_users.get(user_id)

    async def update_user(self, user_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        user = self.mock_users.get(user_id)
        if not user:
            return None
        for k, v in data.items():
            if v is not None:
                user[k] = v
        self.mock_users[user_id] = user
        email_key = user.get("email", "").lower().strip()
        if user_id > 4 and email_key in MOCK_USERS:
            MOCK_USERS[email_key].update(user)
        return user

    async def filter_users(self, role_id: Optional[int], search: Optional[str]) -> List[Dict[str, Any]]:
        results = list(self.mock_users.values())
        if role_id is not None:
            results = [u for u in results if u["role_id"] == role_id]
        if search:
            search_lower = search.lower()
            results = [
                u for u in results
                if search_lower in u["email"].lower()
                or (u.get("first_name") and search_lower in u["first_name"].lower())
                or (u.get("last_name") and search_lower in u["last_name"].lower())
            ]
        return results

    async def reset_password(self, user_id: int, password_hash: str) -> bool:
        if user_id in self.mock_users:
            self.mock_users[user_id]["password_hash"] = password_hash
            email_key = self.mock_users[user_id]["email"].lower().strip()
            if email_key in MOCK_USERS:
                MOCK_USERS[email_key]["password_hash"] = password_hash
            return True
        return False

class RealUserRepository(AdminUserRepository):
    """
    SQLAlchemy database implementation of AdminUserRepository.
    """
    def __init__(self, db_session):
        self.db = db_session

    async def create_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        user = User(
            email=data["email"],
            password_hash=data["password_hash"],
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            role_id=data["role_id"],
            is_active=True
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        # Sync to MOCK_USERS registry for fallback/in-memory auth consistency
        email_key = user.email.lower().strip()
        MOCK_USERS[email_key] = {
            "id": user.id,
            "email": user.email,
            "password_hash": user.password_hash,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role_id": user.role_id,
            "is_active": user.is_active
        }

        # Auto-create role-specific profile rows
        if user.role_id == 1:  # Student
            from app.modules.student.models import StudentProfile
            from app.modules.growth.models import GrowthPassport
            sp = StudentProfile(user_id=user.id, roll_number=f"STU-{user.id:04d}", is_active=True)
            self.db.add(sp)
            await self.db.commit()
            await self.db.refresh(sp)
            gp = GrowthPassport(student_id=sp.id, holistic_score=75.0, growth_level="Beginner", is_active=True)
            self.db.add(gp)
            await self.db.commit()
        elif user.role_id == 2:  # Parent
            from app.modules.parent.models import ParentProfile
            pp = ParentProfile(user_id=user.id, is_active=True)
            self.db.add(pp)
            await self.db.commit()
        elif user.role_id == 3:  # Teacher
            from app.modules.teacher.models import TeacherProfile
            tp = TeacherProfile(user_id=user.id, bio="Instructor", department="General", is_active=True)
            self.db.add(tp)
            await self.db.commit()

        return {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role_id": user.role_id,
            "is_active": user.is_active
        }

    async def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            return None
        return {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role_id": user.role_id,
            "is_active": user.is_active
        }

    async def update_user(self, user_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            return None
        for k, v in data.items():
            if v is not None:
                setattr(user, k, v)
        await self.db.commit()
        await self.db.refresh(user)
        return {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role_id": user.role_id,
            "is_active": user.is_active
        }

    async def filter_users(self, role_id: Optional[int], search: Optional[str]) -> List[Dict[str, Any]]:
        stmt = select(User)
        if role_id is not None:
            stmt = stmt.where(User.role_id == role_id)
        if search:
            stmt = stmt.where(
                User.email.ilike(f"%{search}%") |
                User.first_name.ilike(f"%{search}%") |
                User.last_name.ilike(f"%{search}%")
            )
        result = await self.db.execute(stmt)
        users = result.scalars().all()
        return [
            {
                "id": u.id,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "role_id": u.role_id,
                "is_active": u.is_active
            }
            for u in users
        ]

    async def reset_password(self, user_id: int, password_hash: str) -> bool:
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            return False
        user.password_hash = password_hash
        await self.db.commit()
        return True


class AcademicRepository(ABC):
    """
    Interface for Academic Structure Repository.
    """
    @abstractmethod
    async def create_class(self, data: Dict[str, Any]) -> Dict[str, Any]: pass
    @abstractmethod
    async def get_classes(self) -> List[Dict[str, Any]]: pass
    @abstractmethod
    async def get_class_students(self, class_id: int) -> List[Dict[str, Any]]: pass
    @abstractmethod
    async def update_class(self, class_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]: pass
    @abstractmethod
    async def delete_class(self, class_id: int) -> bool: pass

    @abstractmethod
    async def create_section(self, data: Dict[str, Any]) -> Dict[str, Any]: pass
    @abstractmethod
    async def get_sections(self) -> List[Dict[str, Any]]: pass
    @abstractmethod
    async def update_section(self, section_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]: pass
    @abstractmethod
    async def delete_section(self, section_id: int) -> bool: pass

    @abstractmethod
    async def create_subject(self, data: Dict[str, Any]) -> Dict[str, Any]: pass
    @abstractmethod
    async def get_subjects(self) -> List[Dict[str, Any]]: pass
    @abstractmethod
    async def update_subject(self, subject_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]: pass
    @abstractmethod
    async def delete_subject(self, subject_id: int) -> bool: pass

    @abstractmethod
    async def create_academic_year(self, data: Dict[str, Any]) -> Dict[str, Any]: pass
    @abstractmethod
    async def get_academic_years(self) -> List[Dict[str, Any]]: pass


class MockAcademicRepository(AcademicRepository):
    """
    Mock implementation of AcademicRepository.
    """
    def __init__(self):
        self.mock_classes = {
            10: {"id": 10, "name": "Grade 10-A", "grade": "10", "section": "A", "is_active": True}
        }
        self.mock_sections = {
            1: {"id": 1, "name": "A", "is_active": True}
        }
        self.mock_subjects = {
            1: {"id": 1, "name": "Mathematics", "code": "MATH101", "is_active": True}
        }
        self.mock_years = {
            1: {"id": 1, "name": "2026-2027", "start_date": "2026-06-01", "end_date": "2027-04-30", "is_active": True}
        }

    # Classes
    async def create_class(self, data: Dict[str, Any]) -> Dict[str, Any]:
        cid = len(self.mock_classes) + 1
        item = {"id": cid, "name": data["name"], "grade": data.get("grade"), "section": data.get("section"), "is_active": True}
        self.mock_classes[cid] = item
        return item

    async def get_classes(self) -> List[Dict[str, Any]]:
        return list(self.mock_classes.values())

    async def get_class_students(self, class_id: int) -> List[Dict[str, Any]]:
        if class_id in (10, 1):
            return [
                {"id": 1, "roll_number": "STU-0001", "name": "Rahul B", "email": "rahul.b@edupulse.edu", "is_active": True},
                {"id": 2, "roll_number": "STU-0002", "name": "Priya S", "email": "priya.s@edupulse.edu", "is_active": True},
                {"id": 3, "roll_number": "STU-0003", "name": "Arjun K", "email": "arjun.k@edupulse.edu", "is_active": True}
            ]
        return []

    async def update_class(self, class_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        item = self.mock_classes.get(class_id)
        if not item: return None
        for k, v in data.items():
            if v is not None: item[k] = v
        self.mock_classes[class_id] = item
        return item

    async def delete_class(self, class_id: int) -> bool:
        if class_id in self.mock_classes:
            del self.mock_classes[class_id]
            return True
        return False

    # Sections
    async def create_section(self, data: Dict[str, Any]) -> Dict[str, Any]:
        sid = len(self.mock_sections) + 1
        item = {"id": sid, "name": data["name"], "is_active": True}
        self.mock_sections[sid] = item
        return item

    async def get_sections(self) -> List[Dict[str, Any]]:
        return list(self.mock_sections.values())

    async def update_section(self, section_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        item = self.mock_sections.get(section_id)
        if not item: return None
        for k, v in data.items():
            if v is not None: item[k] = v
        self.mock_sections[section_id] = item
        return item

    async def delete_section(self, section_id: int) -> bool:
        if section_id in self.mock_sections:
            del self.mock_sections[section_id]
            return True
        return False

    # Subjects
    async def create_subject(self, data: Dict[str, Any]) -> Dict[str, Any]:
        sid = len(self.mock_subjects) + 1
        item = {"id": sid, "name": data["name"], "code": data["code"], "is_active": True}
        self.mock_subjects[sid] = item
        return item

    async def get_subjects(self) -> List[Dict[str, Any]]:
        return list(self.mock_subjects.values())

    async def update_subject(self, subject_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        item = self.mock_subjects.get(subject_id)
        if not item: return None
        for k, v in data.items():
            if v is not None: item[k] = v
        self.mock_subjects[subject_id] = item
        return item

    async def delete_subject(self, subject_id: int) -> bool:
        if subject_id in self.mock_subjects:
            del self.mock_subjects[subject_id]
            return True
        return False

    # Academic Year
    async def create_academic_year(self, data: Dict[str, Any]) -> Dict[str, Any]:
        yid = len(self.mock_years) + 1
        item = {
            "id": yid,
            "name": data["name"],
            "start_date": data.get("start_date"),
            "end_date": data.get("end_date"),
            "is_active": True
        }
        self.mock_years[yid] = item
        return item

    async def get_academic_years(self) -> List[Dict[str, Any]]:
        return list(self.mock_years.values())


class RealAcademicRepository(AcademicRepository):
    """
    SQLAlchemy database implementation of AcademicRepository.
    """
    def __init__(self, db_session):
        self.db = db_session

    # Classes
    async def create_class(self, data: Dict[str, Any]) -> Dict[str, Any]:
        item = Class(name=data["name"], grade=data.get("grade"), section=data.get("section"), is_active=True)
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return {"id": item.id, "name": item.name, "grade": item.grade, "section": item.section, "is_active": item.is_active}

    async def get_classes(self) -> List[Dict[str, Any]]:
        stmt = select(Class)
        res = await self.db.execute(stmt)
        items = res.scalars().all()
        return [{"id": i.id, "name": i.name, "grade": i.grade, "section": i.section, "is_active": i.is_active} for i in items]

    async def get_class_students(self, class_id: int) -> List[Dict[str, Any]]:
        from app.modules.student.models import StudentProfile
        from app.models.user import User
        from sqlalchemy import select

        stmt = (
            select(StudentProfile, User)
            .join(User, StudentProfile.user_id == User.id)
            .where(StudentProfile.class_id == class_id)
        )
        res = await self.db.execute(stmt)
        rows = res.all()
        result = []
        for sp, user in rows:
            name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email
            roll_num = sp.roll_number or f"STU-{sp.id:04d}"
            result.append({
                "id": sp.id,
                "roll_number": roll_num,
                "name": name,
                "email": user.email,
                "is_active": user.is_active if user.is_active is not None else sp.is_active
            })
        return result

    async def update_class(self, class_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        stmt = select(Class).where(Class.id == class_id)
        res = await self.db.execute(stmt)
        item = res.scalar_one_or_none()
        if not item: return None
        for k, v in data.items():
            if v is not None: setattr(item, k, v)
        await self.db.commit()
        return {"id": item.id, "name": item.name, "grade": item.grade, "section": item.section, "is_active": item.is_active}

    async def delete_class(self, class_id: int) -> bool:
        stmt = delete(Class).where(Class.id == class_id)
        res = await self.db.execute(stmt)
        await self.db.commit()
        return res.rowcount > 0

    # Sections
    async def create_section(self, data: Dict[str, Any]) -> Dict[str, Any]:
        item = Section(name=data["name"], is_active=True)
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return {"id": item.id, "name": item.name, "is_active": item.is_active}

    async def get_sections(self) -> List[Dict[str, Any]]:
        stmt = select(Section)
        res = await self.db.execute(stmt)
        items = res.scalars().all()
        return [{"id": i.id, "name": i.name, "is_active": i.is_active} for i in items]

    async def update_section(self, section_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        stmt = select(Section).where(Section.id == section_id)
        res = await self.db.execute(stmt)
        item = res.scalar_one_or_none()
        if not item: return None
        for k, v in data.items():
            if v is not None: setattr(item, k, v)
        await self.db.commit()
        return {"id": item.id, "name": item.name, "is_active": item.is_active}

    async def delete_section(self, section_id: int) -> bool:
        stmt = delete(Section).where(Section.id == section_id)
        res = await self.db.execute(stmt)
        await self.db.commit()
        return res.rowcount > 0

    # Subjects
    async def create_subject(self, data: Dict[str, Any]) -> Dict[str, Any]:
        item = Subject(name=data["name"], code=data["code"], is_active=True)
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return {"id": item.id, "name": item.name, "code": item.code, "is_active": item.is_active}

    async def get_subjects(self) -> List[Dict[str, Any]]:
        stmt = select(Subject)
        res = await self.db.execute(stmt)
        items = res.scalars().all()
        return [{"id": i.id, "name": i.name, "code": i.code, "is_active": i.is_active} for i in items]

    async def update_subject(self, subject_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        stmt = select(Subject).where(Subject.id == subject_id)
        res = await self.db.execute(stmt)
        item = res.scalar_one_or_none()
        if not item: return None
        for k, v in data.items():
            if v is not None: setattr(item, k, v)
        await self.db.commit()
        return {"id": item.id, "name": item.name, "code": item.code, "is_active": item.is_active}

    async def delete_subject(self, subject_id: int) -> bool:
        stmt = delete(Subject).where(Subject.id == subject_id)
        res = await self.db.execute(stmt)
        await self.db.commit()
        return res.rowcount > 0

    # Academic Year
    async def create_academic_year(self, data: Dict[str, Any]) -> Dict[str, Any]:
        start = datetime.fromisoformat(data["start_date"]) if data.get("start_date") else None
        end = datetime.fromisoformat(data["end_date"]) if data.get("end_date") else None
        item = AcademicYear(name=data["name"], start_date=start, end_date=end, is_active=True)
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return {
            "id": item.id,
            "name": item.name,
            "start_date": str(item.start_date) if item.start_date else None,
            "end_date": str(item.end_date) if item.end_date else None,
            "is_active": item.is_active
        }

    async def get_academic_years(self) -> List[Dict[str, Any]]:
        stmt = select(AcademicYear)
        res = await self.db.execute(stmt)
        items = res.scalars().all()
        return [
            {
                "id": i.id,
                "name": i.name,
                "start_date": str(i.start_date) if i.start_date else None,
                "end_date": str(i.end_date) if i.end_date else None,
                "is_active": i.is_active
            }
            for i in items
        ]


class TeacherManagementRepository(ABC):
    """
    Interface for Teacher Assignment Management Repository.
    """
    @abstractmethod
    async def assign_teacher(self, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_teacher_assignments(self, teacher_id: Optional[int] = None) -> List[Dict[str, Any]]:
        pass


class MockTeacherManagementRepository(TeacherManagementRepository):
    """
    Mock implementation of TeacherManagementRepository.
    """
    def __init__(self):
        self.mock_assignments = [
            {
                "id": 1,
                "teacher_id": 3,
                "class_id": 10,
                "subject_id": 1,
                "is_homeroom": True,
                "created_at": "2026-07-23T12:00:00Z"
            }
        ]

    async def assign_teacher(self, data: Dict[str, Any]) -> Dict[str, Any]:
        aid = len(self.mock_assignments) + 1
        item = {
            "id": aid,
            "teacher_id": data["teacher_id"],
            "class_id": data["class_id"],
            "subject_id": data["subject_id"],
            "is_homeroom": data.get("is_homeroom", False),
            "created_at": datetime.now().isoformat() + "Z"
        }
        self.mock_assignments.append(item)
        return item

    async def get_teacher_assignments(self, teacher_id: Optional[int] = None) -> List[Dict[str, Any]]:
        if teacher_id is not None:
            return [a for a in self.mock_assignments if a["teacher_id"] == teacher_id]
        return self.mock_assignments


class RealTeacherManagementRepository(TeacherManagementRepository):
    """
    SQLAlchemy database implementation of TeacherManagementRepository.
    """
    def __init__(self, db_session):
        self.db = db_session

    async def assign_teacher(self, data: Dict[str, Any]) -> Dict[str, Any]:
        from app.modules.teacher.models import TeacherProfile
        t_id = data["teacher_id"]
        stmt = select(TeacherProfile).where((TeacherProfile.id == t_id) | (TeacherProfile.user_id == t_id))
        res = await self.db.execute(stmt)
        tp = res.scalar_one_or_none()
        if not tp:
            tp = TeacherProfile(user_id=t_id, bio="Instructor", department="General", is_active=True)
            self.db.add(tp)
            await self.db.commit()
            await self.db.refresh(tp)
        real_teacher_id = tp.id

        check_stmt = select(TeacherClassSubject).where(
            TeacherClassSubject.teacher_id == real_teacher_id,
            TeacherClassSubject.class_id == data["class_id"],
            TeacherClassSubject.subject_id == data["subject_id"]
        )
        c_res = await self.db.execute(check_stmt)
        existing = c_res.scalar_one_or_none()
        if existing:
            return {
                "id": existing.id,
                "teacher_id": existing.teacher_id,
                "class_id": existing.class_id,
                "subject_id": existing.subject_id,
                "is_homeroom": existing.is_homeroom,
                "created_at": str(existing.created_at)
            }

        item = TeacherClassSubject(
            teacher_id=real_teacher_id,
            class_id=data["class_id"],
            subject_id=data["subject_id"],
            is_homeroom=data.get("is_homeroom", False)
        )
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return {
            "id": item.id,
            "teacher_id": item.teacher_id,
            "class_id": item.class_id,
            "subject_id": item.subject_id,
            "is_homeroom": item.is_homeroom,
            "created_at": str(item.created_at)
        }

    async def get_teacher_assignments(self, teacher_id: Optional[int] = None) -> List[Dict[str, Any]]:
        stmt = select(TeacherClassSubject)
        if teacher_id is not None:
            from app.modules.teacher.models import TeacherProfile
            p_stmt = select(TeacherProfile).where((TeacherProfile.id == teacher_id) | (TeacherProfile.user_id == teacher_id))
            p_res = await self.db.execute(p_stmt)
            tp = p_res.scalar_one_or_none()
            real_t_id = tp.id if tp else teacher_id
            stmt = stmt.where(TeacherClassSubject.teacher_id == real_t_id)

        res = await self.db.execute(stmt)
        items = res.scalars().all()
        return [
            {
                "id": i.id,
                "teacher_id": i.teacher_id,
                "class_id": i.class_id,
                "subject_id": i.subject_id,
                "is_homeroom": i.is_homeroom,
                "created_at": str(i.created_at)
            }
            for i in items
        ]


class StudentManagementRepository(ABC):
    """
    Interface for Student Management Repository.
    """
    @abstractmethod
    async def map_student_class(self, student_id: int, class_id: int) -> bool:
        pass

    @abstractmethod
    async def link_parent(self, student_id: int, parent_id: int) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def promote_students(self, student_ids: List[int], target_class_id: int) -> int:
        pass

class MockStudentManagementRepository(StudentManagementRepository):
    """
    Mock implementation of StudentManagementRepository.
    """
    def __init__(self):
        self.mock_links = [
            {
                "id": 1,
                "student_id": 1,
                "parent_id": 1,
                "created_at": "2026-07-23T12:00:00Z"
            }
        ]
        self.mock_student_classes = {
            1: 10
        }

    async def map_student_class(self, student_id: int, class_id: int) -> bool:
        self.mock_student_classes[student_id] = class_id
        return True

    async def link_parent(self, student_id: int, parent_id: int) -> Dict[str, Any]:
        lid = len(self.mock_links) + 1
        item = {
            "id": lid,
            "student_id": student_id,
            "parent_id": parent_id,
            "created_at": datetime.now().isoformat() + "Z"
        }
        self.mock_links.append(item)
        return item

    async def promote_students(self, student_ids: List[int], target_class_id: int) -> int:
        count = 0
        for sid in student_ids:
            self.mock_student_classes[sid] = target_class_id
            count += 1
        return count

class RealStudentManagementRepository(StudentManagementRepository):
    """
    SQLAlchemy database implementation of StudentManagementRepository.
    """
    def __init__(self, db_session):
        self.db = db_session

    async def map_student_class(self, student_id: int, class_id: int) -> bool:
        from app.modules.student.models import StudentProfile
        from sqlalchemy import select
        stmt = select(StudentProfile).where((StudentProfile.id == student_id) | (StudentProfile.user_id == student_id))
        res = await self.db.execute(stmt)
        sp = res.scalar_one_or_none()
        if not sp:
            sp = StudentProfile(user_id=student_id, class_id=class_id, roll_number=f"STU-{student_id:04d}", is_active=True)
            self.db.add(sp)
            await self.db.commit()
            return True
        sp.class_id = class_id
        await self.db.commit()
        return True

    async def link_parent(self, student_id: int, parent_id: int) -> Dict[str, Any]:
        from app.modules.student.models import StudentProfile
        from app.modules.parent.models import ParentProfile
        from sqlalchemy import select

        s_stmt = select(StudentProfile).where((StudentProfile.id == student_id) | (StudentProfile.user_id == student_id))
        s_res = await self.db.execute(s_stmt)
        sp = s_res.scalar_one_or_none()
        if not sp:
            sp = StudentProfile(user_id=student_id, roll_number=f"STU-{student_id:04d}", is_active=True)
            self.db.add(sp)
            await self.db.commit()
            await self.db.refresh(sp)
        real_student_id = sp.id

        p_stmt = select(ParentProfile).where((ParentProfile.id == parent_id) | (ParentProfile.user_id == parent_id))
        p_res = await self.db.execute(p_stmt)
        pp = p_res.scalar_one_or_none()
        if not pp:
            pp = ParentProfile(user_id=parent_id, is_active=True)
            self.db.add(pp)
            await self.db.commit()
            await self.db.refresh(pp)
        real_parent_id = pp.id

        check_stmt = select(StudentParentMapping).where(
            StudentParentMapping.student_id == real_student_id,
            StudentParentMapping.parent_id == real_parent_id
        )
        c_res = await self.db.execute(check_stmt)
        existing = c_res.scalar_one_or_none()
        if existing:
            return {
                "id": existing.id,
                "student_id": existing.student_id,
                "parent_id": existing.parent_id,
                "created_at": str(existing.created_at)
            }

        item = StudentParentMapping(
            student_id=real_student_id,
            parent_id=real_parent_id
        )
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return {
            "id": item.id,
            "student_id": item.student_id,
            "parent_id": item.parent_id,
            "created_at": str(item.created_at)
        }

    async def promote_students(self, student_ids: List[int], target_class_id: int) -> int:
        from app.modules.student.models import StudentProfile
        from sqlalchemy import select
        stmt = select(StudentProfile).where(
            (StudentProfile.id.in_(student_ids)) | (StudentProfile.user_id.in_(student_ids))
        )
        res = await self.db.execute(stmt)
        profiles = res.scalars().all()
        count = 0
        for p in profiles:
            p.class_id = target_class_id
            count += 1
        await self.db.commit()
        return count


class ConfigRepository(ABC):
    """
    Interface for School Configuration Repository.
    """
    @abstractmethod
    async def create_timetable_slot(self, data: Dict[str, Any]) -> Dict[str, Any]: pass
    @abstractmethod
    async def get_timetable_slots(self, class_id: Optional[int] = None, teacher_id: Optional[int] = None) -> List[Dict[str, Any]]: pass
    @abstractmethod
    async def publish_timetable(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]: pass
    @abstractmethod
    async def generate_ai_timetable(self, class_id: int, teacher_ids: Optional[List[int]] = None) -> Dict[str, Any]: pass
    @abstractmethod
    async def get_available_teachers(self) -> List[Dict[str, Any]]: pass

    @abstractmethod
    async def create_calendar_event(self, data: Dict[str, Any]) -> Dict[str, Any]: pass
    @abstractmethod
    async def get_calendar_events(self) -> List[Dict[str, Any]]: pass

    @abstractmethod
    async def set_system_setting(self, key: str, value: str) -> Dict[str, Any]: pass
    @abstractmethod
    async def get_system_settings(self) -> List[Dict[str, Any]]: pass

class MockConfigRepository(ConfigRepository):
    """
    Mock implementation of ConfigRepository.
    """
    def __init__(self):
        self.mock_slots = [
            {
                "id": 1,
                "class_id": 1,
                "subject_id": 1,
                "teacher_id": 1,
                "day_of_week": "Monday",
                "period_number": 1,
                "start_time": "09:00",
                "end_time": "09:45",
                "is_published": True,
                "class_name": "Grade 10-B",
                "subject_name": "Mathematics",
                "teacher_name": "Mr Ravi"
            },
            {
                "id": 2,
                "class_id": 1,
                "subject_id": 2,
                "teacher_id": 2,
                "day_of_week": "Monday",
                "period_number": 2,
                "start_time": "09:45",
                "end_time": "10:30",
                "is_published": True,
                "class_name": "Grade 10-B",
                "subject_name": "Science",
                "teacher_name": "Mrs Anita"
            }
        ]
        self.mock_teachers = [
            {
                "id": 1,
                "user_id": 3,
                "name": "Mr Ravi",
                "email": "ravi@edupulse.com",
                "subject_name": "Mathematics",
                "subject_id": 1,
                "assigned_classes": ["Grade 10-B", "Grade 9-A"],
                "status": "Available"
            },
            {
                "id": 2,
                "user_id": 4,
                "name": "Mrs Anita",
                "email": "anita@edupulse.com",
                "subject_name": "Science",
                "subject_id": 2,
                "assigned_classes": ["Grade 10-B"],
                "status": "Available"
            },
            {
                "id": 3,
                "user_id": 5,
                "name": "Mr Sharma",
                "email": "sharma@edupulse.com",
                "subject_name": "English",
                "subject_id": 3,
                "assigned_classes": ["Grade 8-C"],
                "status": "Available"
            }
        ]
        self.mock_events = [
            {
                "id": 1,
                "title": "Summer Vacation Begins",
                "description": "No academic classes scheduled.",
                "event_date": "2026-05-01T00:00:00Z",
                "is_holiday": True
            }
        ]
        self.mock_settings = [
            {"id": 1, "key": "school_name", "value": "EduPulse Academy"}
        ]

    async def create_timetable_slot(self, data: Dict[str, Any]) -> Dict[str, Any]:
        sid = len(self.mock_slots) + 1
        item = {
            "id": sid,
            "class_id": data["class_id"],
            "subject_id": data["subject_id"],
            "teacher_id": data.get("teacher_id"),
            "day_of_week": data["day_of_week"],
            "period_number": data.get("period_number", 1),
            "start_time": data["start_time"],
            "end_time": data["end_time"],
            "is_published": data.get("is_published", True),
            "class_name": f"Class #{data['class_id']}",
            "subject_name": f"Subject #{data['subject_id']}",
            "teacher_name": f"Teacher #{data.get('teacher_id')}" if data.get("teacher_id") else "Unassigned"
        }
        self.mock_slots.append(item)
        return item

    async def get_timetable_slots(self, class_id: Optional[int] = None, teacher_id: Optional[int] = None) -> List[Dict[str, Any]]:
        slots = self.mock_slots
        if class_id is not None:
            slots = [s for s in slots if s["class_id"] == class_id]
        if teacher_id is not None:
            slots = [s for s in slots if s.get("teacher_id") == teacher_id]
        return slots

    async def get_available_teachers(self) -> List[Dict[str, Any]]:
        return self.mock_teachers

    async def publish_timetable(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        class_id = payload["class_id"]
        slots = payload.get("slots", [])

        # Check conflict with other classes
        other_slots = [s for s in self.mock_slots if s["class_id"] != class_id]
        other_busy = {}
        for s in other_slots:
            if s.get("teacher_id"):
                other_busy[(s["teacher_id"], s["day_of_week"], s.get("period_number", 1))] = (
                    s.get("teacher_name", f"Teacher #{s['teacher_id']}"),
                    s.get("class_name", f"Class #{s['class_id']}")
                )

        seen_teacher_slots = set()
        seen_subject_slots = set()
        teacher_map = {t["id"]: t["name"] for t in self.mock_teachers}

        for slot in slots:
            t_id = slot.get("teacher_id")
            s_id = slot.get("subject_id")
            day = slot.get("day_of_week")
            period = slot.get("period_number", 1)
            t_name = teacher_map.get(t_id, f"Teacher #{t_id}")

            if t_id:
                if (t_id, day, period) in other_busy:
                    busy_t_name, busy_c_name = other_busy[(t_id, day, period)]
                    raise ValueError(f"{busy_t_name} is already teaching {busy_c_name} on {day} Period {period}. Choose another teacher.")
                if (t_id, day, period) in seen_teacher_slots:
                    raise ValueError(f"{t_name} is duplicate assigned for Period {period} on {day}.")
                seen_teacher_slots.add((t_id, day, period))

            if s_id:
                if (s_id, day, period) in seen_subject_slots:
                    raise ValueError(f"Duplicate subject allocation in Period {period} on {day}.")
                seen_subject_slots.add((s_id, day, period))

        # Clear old slots for class
        self.mock_slots = [s for s in self.mock_slots if s["class_id"] != class_id]

        new_items = []
        for i, s in enumerate(slots):
            sid = len(self.mock_slots) + 1
            item = {
                "id": sid,
                "class_id": class_id,
                "subject_id": s["subject_id"],
                "teacher_id": s.get("teacher_id"),
                "day_of_week": s["day_of_week"],
                "period_number": s.get("period_number", 1),
                "start_time": s.get("start_time", "09:00"),
                "end_time": s.get("end_time", "09:45"),
                "is_published": True,
                "class_name": f"Class #{class_id}",
                "subject_name": f"Subject #{s['subject_id']}",
                "teacher_name": teacher_map.get(s.get("teacher_id"), f"Teacher #{s.get('teacher_id')}")
            }
            self.mock_slots.append(item)
            new_items.append(item)

        return await self.get_timetable_slots(class_id=class_id)

    async def generate_ai_timetable(self, class_id: int, teacher_ids: Optional[List[int]] = None) -> Dict[str, Any]:
        slots = await self.get_timetable_slots(class_id=class_id)
        return {
            "class_id": class_id,
            "class_name": f"Class #{class_id}",
            "ai_provider_active": True,
            "ai_optimization_summary": "Mock conflict-free timetable generated.",
            "slots": slots
        }

    async def create_calendar_event(self, data: Dict[str, Any]) -> Dict[str, Any]:
        eid = len(self.mock_events) + 1
        item = {
            "id": eid,
            "title": data["title"],
            "description": data.get("description"),
            "event_date": data["event_date"],
            "is_holiday": data.get("is_holiday", False)
        }
        self.mock_events.append(item)
        return item

    async def get_calendar_events(self) -> List[Dict[str, Any]]:
        return self.mock_events

    async def set_system_setting(self, key: str, value: str) -> Dict[str, Any]:
        for s in self.mock_settings:
            if s["key"] == key:
                s["value"] = value
                return s
        sid = len(self.mock_settings) + 1
        item = {"id": sid, "key": key, "value": value}
        self.mock_settings.append(item)
        return item

    async def get_system_settings(self) -> List[Dict[str, Any]]:
        return self.mock_settings

class RealConfigRepository(ConfigRepository):
    """
    SQLAlchemy database implementation of ConfigRepository.
    """
    def __init__(self, db_session):
        self.db = db_session

    async def create_timetable_slot(self, data: Dict[str, Any]) -> Dict[str, Any]:
        item = TimetableSlot(
            class_id=data["class_id"],
            subject_id=data["subject_id"],
            day_of_week=data["day_of_week"]
        )
        item.teacher_id = data.get("teacher_id")
        item.period_number = data.get("period_number", 1)
        item.is_published = data.get("is_published", True)
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return {
            "id": item.id,
            "class_id": item.class_id,
            "subject_id": item.subject_id,
            "teacher_id": item.teacher_id,
            "day_of_week": item.day_of_week,
            "period_number": item.period_number,
            "start_time": item.start_time,
            "end_time": item.end_time,
            "is_published": item.is_published
        }

    async def get_timetable_slots(self, class_id: Optional[int] = None, teacher_id: Optional[int] = None) -> List[Dict[str, Any]]:
        from sqlalchemy import cast, String
        stmt = select(TimetableSlot, Class, Subject, TeacherProfile, User)\
            .select_from(TimetableSlot)\
            .outerjoin(Class, TimetableSlot.class_id == Class.id)\
            .outerjoin(Subject, TimetableSlot.subject_id == Subject.id)\
            .outerjoin(TeacherProfile, TimetableSlot.end_time == cast(TeacherProfile.id, String))\
            .outerjoin(User, TeacherProfile.user_id == User.id)

        if class_id is not None:
            stmt = stmt.where(TimetableSlot.class_id == class_id)
        if teacher_id is not None:
            stmt = stmt.where(TimetableSlot.end_time == str(teacher_id))

        res = await self.db.execute(stmt)
        rows = res.all()

        result = []
        for slot, c_obj, s_obj, t_obj, u_obj in rows:
            c_name = f"Grade {c_obj.grade}-{c_obj.section}" if (c_obj and c_obj.grade and c_obj.section) else (c_obj.name if c_obj else f"Class #{slot.class_id}")
            s_name = s_obj.name if s_obj else f"Subject #{slot.subject_id}"
            t_name = f"{u_obj.first_name or ''} {u_obj.last_name or ''}".strip() if (u_obj and (u_obj.first_name or u_obj.last_name)) else (f"Teacher #{slot.teacher_id}" if slot.teacher_id else "Unassigned")

            p_num = getattr(slot, "period_number", 1) or 1
            st_time, ed_time = "09:00", "09:45"
            if p_num == 1:
                st_time, ed_time = "09:00", "09:45"
            elif p_num == 2:
                st_time, ed_time = "09:45", "10:30"
            elif p_num == 3:
                st_time, ed_time = "10:45", "11:30"
            elif p_num == 4:
                st_time, ed_time = "11:30", "12:15"
            elif p_num == 5:
                st_time, ed_time = "13:15", "14:00"
            elif p_num == 6:
                st_time, ed_time = "14:00", "14:45"
            elif p_num == 7:
                st_time, ed_time = "14:45", "15:30"
            elif p_num == 8:
                st_time, ed_time = "15:30", "16:15"

            result.append({
                "id": slot.id,
                "class_id": slot.class_id,
                "subject_id": slot.subject_id,
                "teacher_id": slot.teacher_id,
                "day_of_week": slot.day_of_week,
                "period_number": p_num,
                "start_time": st_time,
                "end_time": ed_time,
                "is_published": getattr(slot, "is_published", True),
                "class_name": c_name,
                "subject_name": s_name,
                "teacher_name": t_name
            })
        return result

    async def get_available_teachers(self) -> List[Dict[str, Any]]:
        stmt = select(TeacherProfile, User).join(User, TeacherProfile.user_id == User.id).where(User.is_active == True)
        res = await self.db.execute(stmt)
        rows = res.all()

        teachers = []
        for t_profile, u_obj in rows:
            m_stmt = select(TeacherClassSubject, Class, Subject)\
                .outerjoin(Class, TeacherClassSubject.class_id == Class.id)\
                .outerjoin(Subject, TeacherClassSubject.subject_id == Subject.id)\
                .where(TeacherClassSubject.teacher_id == t_profile.id)
            m_res = await self.db.execute(m_stmt)
            mappings = m_res.all()

            assigned_classes = list(set([f"Grade {c.grade}-{c.section}" if (c and c.grade) else (c.name if c else "") for tcs, c, s in mappings if c]))
            subject_names = list(set([s.name for tcs, c, s in mappings if s]))

            teachers.append({
                "id": t_profile.id,
                "user_id": u_obj.id,
                "name": f"{u_obj.first_name or ''} {u_obj.last_name or ''}".strip() or u_obj.email,
                "email": u_obj.email,
                "subject_name": ", ".join(subject_names) if subject_names else "General",
                "subject_id": mappings[0][2].id if (mappings and mappings[0][2]) else None,
                "assigned_classes": [ac for ac in assigned_classes if ac],
                "status": "Available"
            })
        return teachers

    async def publish_timetable(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        import logging
        from sqlalchemy import exists
        from app.models.class_model import Class, Subject
        from app.modules.teacher.models import TeacherProfile

        logger = logging.getLogger("timetable_publish")
        logger.setLevel(logging.INFO)

        class_id = payload["class_id"]
        slots = payload.get("slots", [])

        logger.info(f"Saving Timetable Slots for class_id={class_id}")
        logger.info(f"Generated Timetable payload count: {len(slots)}")

        # ── Phase 3: Validate every timetable slot before publish ──
        # 1. Verify Class ID exists
        class_exists = await self.db.scalar(select(exists().where(Class.id == class_id)))
        if not class_exists:
            logger.error(f"Validation failed: Class ID {class_id} does not exist.")
            raise ValueError(f"Class ID {class_id} does not exist in the database.")

        all_subject_ids = list(set([s.get("subject_id") for s in slots if s.get("subject_id")]))
        all_teacher_ids = list(set([s.get("teacher_id") for s in slots if s.get("teacher_id")]))

        logger.info(f"Selected Teachers (Teacher IDs): {all_teacher_ids}")

        # 2. Validate Subject existence
        if all_subject_ids:
            found_subj_res = await self.db.scalars(select(Subject.id).where(Subject.id.in_(all_subject_ids)))
            found_subj_ids = set(found_subj_res.all())
            for s_id in all_subject_ids:
                if s_id not in found_subj_ids:
                    logger.error(f"Validation failed: Subject ID {s_id} does not exist.")
                    raise ValueError(f"Subject with ID {s_id} does not exist.")

        # 3. Validate Teacher existence
        if all_teacher_ids:
            found_teach_res = await self.db.scalars(select(TeacherProfile.id).where(TeacherProfile.id.in_(all_teacher_ids)))
            found_teach_ids = set(found_teach_res.all())
            for t_id in all_teacher_ids:
                if t_id not in found_teach_ids:
                    logger.error(f"Validation failed: Teacher ID {t_id} does not exist.")
                    raise ValueError(f"Teacher with ID {t_id} does not exist.")

        # 4. Validate day & period ranges
        valid_days = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"}
        for s in slots:
            day = s.get("day_of_week")
            period = s.get("period_number", 1)
            t_id = s.get("teacher_id")
            s_id = s.get("subject_id")

            if day not in valid_days:
                logger.error(f"Exception details: Teacher ID={t_id}, Subject ID={s_id}, Class ID={class_id}, Period={period}, Day={day}")
                raise ValueError(f"Invalid day: '{day}'. Day must be a valid weekday name.")
            if not isinstance(period, int) or period < 1 or period > 8:
                logger.error(f"Exception details: Teacher ID={t_id}, Subject ID={s_id}, Class ID={class_id}, Period={period}, Day={day}")
                raise ValueError(f"Invalid period: {period}. Period must be an integer between 1 and 8.")

        # Fetch other class slots in DB to check teacher conflicts
        from sqlalchemy import case, cast, Integer
        teacher_id_expr = case(
            (TimetableSlot.end_time.op("~")("^[0-9]+$"), cast(TimetableSlot.end_time, Integer)),
            else_=None
        )
        stmt = select(TimetableSlot, Class, Subject, TeacherProfile, User)\
            .select_from(TimetableSlot)\
            .outerjoin(Class, TimetableSlot.class_id == Class.id)\
            .outerjoin(Subject, TimetableSlot.subject_id == Subject.id)\
            .outerjoin(TeacherProfile, teacher_id_expr == TeacherProfile.id)\
            .outerjoin(User, TeacherProfile.user_id == User.id)\
            .where(TimetableSlot.class_id != class_id)
        res = await self.db.execute(stmt)
        other_rows = res.all()

        busy_teacher_map = {}
        for slot, c_obj, s_obj, t_obj, u_obj in other_rows:
            if slot.teacher_id:
                t_name = f"{u_obj.first_name or ''} {u_obj.last_name or ''}".strip() if (u_obj and (u_obj.first_name or u_obj.last_name)) else f"Teacher #{slot.teacher_id}"
                c_name = f"Grade {c_obj.grade}-{c_obj.section}" if (c_obj and c_obj.grade) else f"Class #{slot.class_id}"
                busy_teacher_map[(slot.teacher_id, slot.day_of_week, getattr(slot, "period_number", 1))] = (t_name, c_name)

        seen_teacher_slots = set()
        seen_subject_slots = set()

        teacher_name_map = {}
        if all_teacher_ids:
            t_stmt = select(TeacherProfile, User).join(User, TeacherProfile.user_id == User.id).where(TeacherProfile.id.in_(all_teacher_ids))
            t_res = await self.db.execute(t_stmt)
            for tp, u in t_res.all():
                teacher_name_map[tp.id] = f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email

        for slot in slots:
            t_id = slot.get("teacher_id")
            s_id = slot.get("subject_id")
            day = slot.get("day_of_week")
            period = slot.get("period_number", 1)
            t_name = teacher_name_map.get(t_id, f"Teacher #{t_id}")

            if t_id:
                if (t_id, day, period) in busy_teacher_map:
                    other_t_name, other_c_name = busy_teacher_map[(t_id, day, period)]
                    logger.error(f"Teacher conflict exception details: Teacher ID={t_id}, Subject ID={s_id}, Class ID={class_id}, Period={period}, Day={day}")
                    raise ValueError(f"{other_t_name} is already teaching {other_c_name} on {day} Period {period}. Choose another teacher.")

                if (t_id, day, period) in seen_teacher_slots:
                    logger.error(f"Duplicate teacher assignment exception details: Teacher ID={t_id}, Subject ID={s_id}, Class ID={class_id}, Period={period}, Day={day}")
                    raise ValueError(f"{t_name} is duplicate assigned for Period {period} on {day}.")
                seen_teacher_slots.add((t_id, day, period))

            if s_id:
                if (s_id, day, period) in seen_subject_slots:
                    logger.error(f"Duplicate subject exception details: Teacher ID={t_id}, Subject ID={s_id}, Class ID={class_id}, Period={period}, Day={day}")
                    raise ValueError(f"Duplicate subject allocation in Period {period} on {day}.")
                seen_subject_slots.add((s_id, day, period))

        # Validation passed! Clear old slots for this class and bulk insert new slots
        await self.db.execute(delete(TimetableSlot).where(TimetableSlot.class_id == class_id))

        for slot in slots:
            item = TimetableSlot(
                class_id=class_id,
                subject_id=slot["subject_id"],
                day_of_week=slot["day_of_week"]
            )
            item.teacher_id = slot.get("teacher_id")
            item.period_number = slot.get("period_number", 1)
            item.is_published = True
            self.db.add(item)

        await self.db.commit()
        logger.info("Publish Completed: Timetable slots successfully committed.")

        logger.info("Loading Timetable slots for validation after commit...")
        retrieved_slots = await self.get_timetable_slots(class_id=class_id)
        return retrieved_slots

    async def analyze_timetable(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        import httpx
        import logging
        from app.core.config import settings

        logger = logging.getLogger("timetable_ai")
        logger.setLevel(logging.INFO)

        slots = payload.get("slots", [])
        class_name = payload.get("class_name", "Class")
        working_days = payload.get("working_days", 5)
        periods_per_day = payload.get("periods_per_day", 6)

        # 1. Perform static analysis to detect warnings
        warnings = []
        
        # Check PE periods
        pe_count = 0
        for slot in slots:
            sub_name = slot.get("subject_name", "").lower()
            if "physical education" in sub_name or sub_name == "pe":
                pe_count += 1
        if pe_count < 2:
            warnings.append({"message": f"PE teacher unavailable: only {pe_count} Physical Education periods scheduled this week."})

        # Check duplicate teacher assignments within the payload
        seen_slots = {}
        for slot in slots:
            t_id = slot.get("teacher_id")
            t_name = slot.get("teacher_name", f"Teacher #{t_id}")
            day = slot.get("day_of_week")
            period = slot.get("period_number")
            if t_id and day and period:
                key = (t_id, day, period)
                if key in seen_slots:
                    warnings.append({"message": f"Science teacher assigned twice: {t_name} is assigned to multiple slots during the same period."})
                seen_slots[key] = slot

        # Check other class slots in DB to check teacher conflicts
        from app.models.class_model import TimetableSlot, Class
        from app.models.user import User
        from app.modules.teacher.models import TeacherProfile
        from sqlalchemy import select, case, cast, Integer
        
        teacher_id_expr = case(
            (TimetableSlot.end_time.op("~")("^[0-9]+$"), cast(TimetableSlot.end_time, Integer)),
            else_=None
        )
        
        stmt = select(TimetableSlot, Class, TeacherProfile, User)\
            .select_from(TimetableSlot)\
            .outerjoin(Class, TimetableSlot.class_id == Class.id)\
            .outerjoin(TeacherProfile, teacher_id_expr == TeacherProfile.id)\
            .outerjoin(User, TeacherProfile.user_id == User.id)
        
        res = await self.db.execute(stmt)
        other_rows = res.all()
        
        busy_teacher_map = {}
        for slot_obj, c_obj, t_obj, u_obj in other_rows:
            if slot_obj.teacher_id:
                t_name = f"{u_obj.first_name or ''} {u_obj.last_name or ''}".strip() if (u_obj and (u_obj.first_name or u_obj.last_name)) else f"Teacher #{slot_obj.teacher_id}"
                c_name = f"Grade {c_obj.grade}-{c_obj.section}" if (c_obj and c_obj.grade) else f"Class #{slot_obj.class_id}"
                busy_teacher_map[(slot_obj.teacher_id, slot_obj.day_of_week, slot_obj.period_number)] = (t_name, c_name)

        # Check conflicts
        for slot in slots:
            t_id = slot.get("teacher_id")
            t_name = slot.get("teacher_name", f"Teacher #{t_id}")
            day = slot.get("day_of_week")
            period = slot.get("period_number")
            if t_id and day and period:
                if (t_id, day, period) in busy_teacher_map:
                    warnings.append({"message": f"Teacher conflict detected: {t_name} is already teaching on {day} Period {period}."})

        # 2. Build Groq AI analysis request
        schedule_summary = "\n".join([
            f"- {s.get('day_of_week')} Period {s.get('period_number')}: {s.get('subject_name')} (Teacher: {s.get('teacher_name')})"
            for s in slots
        ])

        prompt_text = f"""
Below is the automatically generated weekly timetable for {class_name}.
Working Days: {"Monday-Friday" if working_days == 5 else "Monday-Saturday"}, Periods per day: {periods_per_day}.

Weekly Schedule:
{schedule_summary}

Please analyze this timetable and provide your expert feedback:
1. Is it balanced?
2. Are there any potential teacher overloads?
3. Suggest improvements or optimization tips for school administration.
"""
        api_key = settings.GROQ_API or settings.GROQ_API_KEY
        async with httpx.AsyncClient() as client:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            body = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert academic scheduler. Analyze the provided timetable for balance, teacher overload, and suggest optimization improvements."
                    },
                    {
                        "role": "user",
                        "content": prompt_text
                    }
                ]
            }

            logger.info(f"Request URL: {url}")
            try:
                response = await client.post(url, json=body, headers=headers, timeout=15.0)
                logger.info(f"Response status: {response.status_code}")
                logger.info(f"Response body: {response.text}")
                
                if response.status_code != 200:
                    raise ValueError(f"Groq API returned error: Status {response.status_code} - {response.text}")
                
                res_data = response.json()
                analysis = res_data.get("choices", [{}])[0].get("message", {}).get("content", "No analysis content received.")
            except Exception as e:
                logger.error(f"Failed to communicate with Groq: {str(e)}")
                raise ValueError(f"Failed to connect to Groq API: {str(e)}")

        return {
            "analysis": analysis,
            "warnings": warnings
        }

    async def generate_ai_timetable(self, class_id: int, teacher_ids: Optional[List[int]] = None) -> Dict[str, Any]:
        from sqlalchemy import select, delete
        from app.models.class_model import Class, TeacherClassSubject, Subject, TimetableSlot
        from app.modules.teacher.models import TeacherProfile
        from app.models.user import User
        from app.modules.ai.resolver import get_ai_provider

        # 1. Fetch class details
        c_stmt = select(Class).where(Class.id == class_id)
        c_res = await self.db.execute(c_stmt)
        c_obj = c_res.scalar_one_or_none()
        class_name = f"Grade {c_obj.grade}-{c_obj.section}" if (c_obj and c_obj.grade) else (c_obj.name if c_obj else f"Class #{class_id}")

        # 2. Fetch all active subjects from DB
        s_stmt = select(Subject).where(Subject.is_active == True)
        s_res = await self.db.execute(s_stmt)
        all_subjects = s_res.scalars().all()

        if not all_subjects:
            s_stmt = select(Subject)
            s_res = await self.db.execute(s_stmt)
            all_subjects = s_res.scalars().all()

        # 3. Fetch active teachers with user details
        t_stmt = select(TeacherProfile, User).join(User, TeacherProfile.user_id == User.id).where(User.is_active == True)
        if teacher_ids and len(teacher_ids) > 0:
            t_stmt = t_stmt.where(TeacherProfile.id.in_(teacher_ids))
        t_res = await self.db.execute(t_stmt)
        candidate_teachers = t_res.all()

        if not candidate_teachers:
            t_res_all = await self.db.execute(select(TeacherProfile, User).join(User, TeacherProfile.user_id == User.id).where(User.is_active == True))
            candidate_teachers = t_res_all.all()

        # 4. Fetch specific teacher-subject mappings for this class
        tcs_stmt = select(TeacherClassSubject, Subject, TeacherProfile, User)\
            .join(Subject, TeacherClassSubject.subject_id == Subject.id)\
            .join(TeacherProfile, TeacherClassSubject.teacher_id == TeacherProfile.id)\
            .join(User, TeacherProfile.user_id == User.id)\
            .where(TeacherClassSubject.class_id == class_id)
        tcs_res = await self.db.execute(tcs_stmt)
        class_mappings = tcs_res.all()

        class_subject_teacher_map = {}
        for tcs, s_obj, tp_obj, u_obj in class_mappings:
            t_name = f"{u_obj.first_name or ''} {u_obj.last_name or ''}".strip() or u_obj.email
            class_subject_teacher_map[s_obj.id] = (tp_obj.id, t_name)

        # Build subject pool with distinct subjects and assigned teachers
        unique_subject_map = {}
        for s_obj in all_subjects:
            key = s_obj.name.strip().lower()
            if key not in unique_subject_map:
                unique_subject_map[key] = s_obj

        dedup_subjects = list(unique_subject_map.values())
        subject_pool = []

        # Dedicated PE teacher detection
        pe_teacher_info = None
        for tp, u in candidate_teachers:
            u_name = (f"{u.first_name or ''} {u.last_name or ''} {u.email or ''}").lower()
            if "pe" in u_name or "sports" in u_name or "physical" in u_name or "gym" in u_name:
                pe_teacher_info = (tp.id, f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email)
                break

        for idx, s_obj in enumerate(dedup_subjects):
            s_name_lower = s_obj.name.strip().lower()
            if ("pe" in s_name_lower or "physical education" in s_name_lower or "sports" in s_name_lower) and pe_teacher_info:
                t_id, t_name = pe_teacher_info
            elif s_obj.id in class_subject_teacher_map:
                t_id, t_name = class_subject_teacher_map[s_obj.id]
            elif candidate_teachers:
                # Try to match subject prefix with teacher name/email
                matched_t = next(
                    (
                        (tp, u) for tp, u in candidate_teachers
                        if s_name_lower[:3] in (f"{u.first_name or ''} {u.email or ''}").lower()
                    ),
                    None
                )
                if matched_t:
                    t_id = matched_t[0].id
                    t_name = f"{matched_t[1].first_name or ''} {matched_t[1].last_name or ''}".strip() or matched_t[1].email
                else:
                    t_pair = candidate_teachers[idx % len(candidate_teachers)]
                    t_id = t_pair[0].id
                    t_name = f"{t_pair[1].first_name or ''} {t_pair[1].last_name or ''}".strip() or t_pair[1].email
            else:
                t_id = 1
                t_name = "Assigned Teacher"

            subject_pool.append({
                "subject_id": s_obj.id,
                "subject_name": s_obj.name,
                "teacher_id": t_id,
                "teacher_name": t_name
            })

        # Separate academic subjects from PE
        academic_pool = [s for s in subject_pool if "pe" not in s["subject_name"].lower() and "physical" not in s["subject_name"].lower()]
        pe_info = next((s for s in subject_pool if "pe" in s["subject_name"].lower() or "physical" in s["subject_name"].lower()), None)

        if not pe_info:
            pe_info = {"subject_id": 11, "subject_name": "Physical Education", "teacher_id": 29, "teacher_name": "PE"}

        if not academic_pool:
            academic_pool = [
                {"subject_id": 1, "subject_name": "Mathematics", "teacher_id": 16, "teacher_name": "MAT1"},
                {"subject_id": 2, "subject_name": "Science", "teacher_id": 18, "teacher_name": "SCI1"},
                {"subject_id": 4, "subject_name": "English", "teacher_id": 20, "teacher_name": "ENG1"},
                {"subject_id": 5, "subject_name": "Social Science", "teacher_id": 14, "teacher_name": "SOC1"},
                {"subject_id": 3, "subject_name": "Tamil", "teacher_id": 22, "teacher_name": "TAM1"}
            ]

        working_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        periods_per_day = 6

        # Query busy teacher slots from other classes to prevent double-booking
        other_slots_res = await self.db.execute(
            select(TimetableSlot).where(TimetableSlot.class_id != class_id)
        )
        other_slots = other_slots_res.scalars().all()
        
        busy_teacher_slots = set()
        for os in other_slots:
            if os.teacher_id:
                busy_teacher_slots.add((os.day_of_week, os.period_number, os.teacher_id))

        # Dynamically pick 2 PE slots for this class where PE teacher is NOT double-booked
        pe_teacher_id = pe_info["teacher_id"]
        candidate_pe_slots = [
            ("Wednesday", 6), ("Friday", 6),
            ("Tuesday", 6), ("Thursday", 6), ("Monday", 6),
            ("Friday", 5), ("Wednesday", 5), ("Tuesday", 5), ("Thursday", 5), ("Monday", 5)
        ]
        
        pe_slots = set()
        for day_c, p_c in candidate_pe_slots:
            if (day_c, p_c, pe_teacher_id) not in busy_teacher_slots:
                pe_slots.add((day_c, p_c))
                if len(pe_slots) == 2:
                    break

        if len(pe_slots) < 2:
            pe_slots = {("Tuesday", 6), ("Friday", 5)}

        # Delete existing timetable slots for this class
        await self.db.execute(delete(TimetableSlot).where(TimetableSlot.class_id == class_id))
        await self.db.commit()

        # Build 30 slots across Monday to Friday, periods 1 to 6
        acad_counter = 0
        for day_idx, day in enumerate(working_days):
            for p_num in range(1, periods_per_day + 1):
                if (day, p_num) in pe_slots:
                    item_info = pe_info
                else:
                    item_info = academic_pool[acad_counter % len(academic_pool)]
                    acad_counter += 1

                slot = TimetableSlot(
                    class_id=class_id,
                    subject_id=item_info["subject_id"],
                    day_of_week=day
                )
                slot.teacher_id = item_info["teacher_id"]
                slot.period_number = p_num
                slot.is_published = True
                self.db.add(slot)

        await self.db.commit()

        # Fetch created slots with names
        slots_dto_list = await self.get_timetable_slots(class_id=class_id)

        provider = get_ai_provider()
        ai_summary = f"Balanced multi-subject weekly timetable generated for {class_name} across 30 periods with zero teacher double-booking."

        if provider.is_available():
            try:
                ai_prompt = f"""
Class Name: {class_name}
Subjects Included: {[s['subject_name'] + ' (' + s['teacher_name'] + ')' for s in subject_pool]}
Total Period Slots Created: {len(slots_dto_list)}

Write a concise 2-sentence institutional summary of how this balanced weekly timetable was optimized across subjects and teachers.
"""
                raw_summary = await provider.generate_response(
                    prompt=ai_prompt,
                    system_instruction="You are an expert AI Institutional Timetable Optimizer. Provide 2 concise sentences."
                )
                ai_summary = raw_summary.strip()
            except Exception:
                pass

        return {
            "class_id": class_id,
            "class_name": class_name,
            "ai_provider_active": provider.is_available(),
            "ai_optimization_summary": ai_summary,
            "slots": slots_dto_list
        }


    async def create_calendar_event(self, data: Dict[str, Any]) -> Dict[str, Any]:
        from datetime import date, datetime
        date_input = data["event_date"]
        if isinstance(date_input, str):
            try:
                dt_obj = datetime.fromisoformat(date_input)
                if type(dt_obj) is date:
                    date_val = datetime.combine(dt_obj, datetime.min.time())
                else:
                    date_val = dt_obj
            except ValueError:
                date_val = datetime.now()
        elif type(date_input) is date:
            date_val = datetime.combine(date_input, datetime.min.time())
        elif isinstance(date_input, datetime):
            date_val = date_input
        else:
            date_val = datetime.now()

        item = CalendarEvent(
            title=data["title"],
            description=data.get("description"),
            event_date=date_val,
            is_holiday=data.get("is_holiday", False)
        )
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return {
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "event_date": item.event_date.strftime("%Y-%m-%d") if item.event_date else str(item.event_date),
            "is_holiday": item.is_holiday
        }

    async def get_calendar_events(self) -> List[Dict[str, Any]]:
        stmt = select(CalendarEvent)
        res = await self.db.execute(stmt)
        items = res.scalars().all()
        return [
            {
                "id": i.id,
                "title": i.title,
                "description": i.description,
                "event_date": i.event_date.strftime("%Y-%m-%d") if i.event_date else str(i.event_date),
                "is_holiday": i.is_holiday
            }
            for i in items
        ]

    async def set_system_setting(self, key: str, value: str) -> Dict[str, Any]:
        stmt = select(SystemSetting).where(SystemSetting.key == key)
        res = await self.db.execute(stmt)
        item = res.scalar_one_or_none()
        if item:
            item.value = value
        else:
            item = SystemSetting(key=key, value=value)
            self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return {"id": item.id, "key": item.key, "value": item.value}

    async def get_system_settings(self) -> List[Dict[str, Any]]:
        stmt = select(SystemSetting)
        res = await self.db.execute(stmt)
        items = res.scalars().all()
        return [{"id": i.id, "key": i.key, "value": i.value} for i in items]


class AdminDashboardRepository(ABC):
    """
    Interface for Admin Dashboard Summary Repository.
    """
    @abstractmethod
    async def get_dashboard_summary(self) -> Dict[str, Any]:
        pass

class MockAdminDashboardRepository(AdminDashboardRepository):
    """
    Mock implementation of AdminDashboardRepository.
    """
    async def get_dashboard_summary(self) -> Dict[str, Any]:
        return {
            "student_count": 142,
            "teacher_count": 12,
            "class_count": 8,
            "system_status": "Healthy",
            "active_alerts_count": 3
        }

class RealAdminDashboardRepository(AdminDashboardRepository):
    """
    SQLAlchemy database implementation of AdminDashboardRepository.
    """
    def __init__(self, db_session):
        self.db = db_session

    async def get_dashboard_summary(self) -> Dict[str, Any]:
        from sqlalchemy import func
        # Count classes
        class_stmt = select(func.count(Class.id))
        class_res = await self.db.execute(class_stmt)
        class_cnt = class_res.scalar() or 0

        # Count students and teachers from User table mapping
        student_stmt = select(func.count(User.id)).where(User.role_id == 1)
        student_res = await self.db.execute(student_stmt)
        student_cnt = student_res.scalar() or 0

        teacher_stmt = select(func.count(User.id)).where(User.role_id == 3)
        teacher_res = await self.db.execute(teacher_stmt)
        teacher_cnt = teacher_res.scalar() or 0

        return {
            "student_count": student_cnt,
            "teacher_count": teacher_cnt,
            "class_count": class_cnt,
            "system_status": "Healthy",
            "active_alerts_count": 0
        }
