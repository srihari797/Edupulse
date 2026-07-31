from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func
from app.core.database import Base

class TeacherProfile(Base):
    """
    SQLAlchemy model representing a Teacher Profile.
    """
    __tablename__ = "teacher_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    bio = Column(String(500), nullable=True)
    department = Column(String(100), nullable=True)

    # Common audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

class SharedGoal(Base):
    """
    SQLAlchemy model representing a Parent-Teacher Shared Goal.
    """
    __tablename__ = "shared_goals"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("parent_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(500), nullable=False)
    status = Column(String(50), default="Proposed", nullable=False) # e.g. Proposed, Active, Completed, Cancelled
    target_date = Column(DateTime, nullable=True)

    # Common audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class Assignment(Base):
    """
    SQLAlchemy model representing an educational Assignment.
    """
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    instructions = Column(String(500), nullable=True)
    max_marks = Column(Integer, default=100, nullable=False)
    is_graded = Column(Boolean, default=True, nullable=False)
    has_deadline = Column(Boolean, default=False, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    notify_parent_on_overdue = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default="Draft", nullable=False)  # Draft, Published, Closed
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    # Optional attachment mappings
    attachment_bucket = Column(String(100), nullable=True)
    attachment_path = Column(String(200), nullable=True)

    # Common audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class AssignmentSubmission(Base):
    """
    SQLAlchemy model representing an individual Assignment Submission.
    """
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="Pending", nullable=False)  # Pending, Submitted, Graded
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    score = Column(Integer, nullable=True)
    feedback = Column(String(500), nullable=True)
    
    # Storage reference metadata
    file_bucket = Column(String(100), nullable=True)
    file_path = Column(String(200), nullable=True)

    # Common audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class LearningResource(Base):
    """
    SQLAlchemy model representing an educational Resource / study material.
    """
    __tablename__ = "learning_resources"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    
    # Storage reference metadata
    file_bucket = Column(String(100), nullable=False)
    file_path = Column(String(200), nullable=False)

    # Common audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

