from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey
from typing import Optional
from app.core.database import Base

class Class(Base):
    """
    SQLAlchemy model representing an Academic Class.
    """
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    grade = Column(String(20), nullable=True)
    section = Column(String(10), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class Section(Base):
    """
    SQLAlchemy model representing a Class Section.
    """
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class Subject(Base):
    """
    SQLAlchemy model representing an Academic Subject.
    """
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class AcademicYear(Base):
    """
    SQLAlchemy model representing an Academic Year.
    """
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False) # e.g. 2026-2027
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class GradeMapping(Base):
    """
    SQLAlchemy model representing a Grade Score range mapping.
    """
    __tablename__ = "grade_mappings"

    id = Column(Integer, primary_key=True, index=True)
    min_score = Column(Integer, nullable=False)
    max_score = Column(Integer, nullable=False)
    grade = Column(String(10), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class TeacherClassSubject(Base):
    """
    SQLAlchemy association model representing Teacher assignment to Class and Subject.
    """
    __tablename__ = "teacher_class_subjects"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    is_homeroom = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class StudentParentMapping(Base):
    """
    SQLAlchemy association model representing Parent to Student links.
    """
    __tablename__ = "student_parent_mappings"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("parent_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class TimetableSlot(Base):
    """
    SQLAlchemy model representing a Scheduled Timetable Slot.
    """
    __tablename__ = "timetable_slots"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week = Column(String(20), nullable=False) # e.g. Monday
    start_time = Column(String(10), nullable=False) # e.g. "4|P"
    end_time = Column(String(10), nullable=False) # e.g. "12"
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    @property
    def teacher_id(self) -> Optional[int]:
        if not self.end_time:
            return None
        try:
            return int(self.end_time)
        except ValueError:
            return None

    @teacher_id.setter
    def teacher_id(self, val: Optional[int]):
        self.end_time = str(val) if val is not None else ""

    @property
    def period_number(self) -> int:
        if not self.start_time:
            return 1
        parts = self.start_time.split("|")
        try:
            return int(parts[0])
        except ValueError:
            return 1

    @period_number.setter
    def period_number(self, val: int):
        pub_val = self.is_published
        pub_char = "P" if pub_val else "D"
        self.start_time = f"{val}|{pub_char}"

    @property
    def is_published(self) -> bool:
        if not self.start_time:
            return True
        parts = self.start_time.split("|")
        if len(parts) > 1:
            return parts[1] == "P"
        return True

    @is_published.setter
    def is_published(self, val: bool):
        p_num = 1
        if self.start_time:
            parts = self.start_time.split("|")
            try:
                p_num = int(parts[0])
            except ValueError:
                pass
        pub_char = "P" if val else "D"
        self.start_time = f"{p_num}|{pub_char}"


class CalendarEvent(Base):
    """
    SQLAlchemy model representing an Academic Calendar Event.
    """
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    event_date = Column(DateTime, nullable=False)
    is_holiday = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class SystemSetting(Base):
    """
    SQLAlchemy model representing System Configuration key-value settings.
    """
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(String(500), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
