from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(String(20), unique=True, nullable=False)

    name = Column(String(100), nullable=False)

    department = Column(String(100))

    designation = Column(String(100))

    email = Column(String(100), unique=True)

    phone = Column(String(15))

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True)

    employee_id = Column(String(20), nullable=False)

    attendance_date = Column(DateTime)

    punch_in = Column(DateTime)

    punch_out = Column(DateTime)

    working_hours = Column(String(20))

    recognition_score = Column(String(10))

    status = Column(String(20))
class FaceRegistration(Base):
    __tablename__ = "face_registrations"

    id = Column(Integer, primary_key=True)

    employee_id = Column(String(20), nullable=False)

    embedding_count = Column(Integer)

    model_name = Column(String(100))

    registered_at = Column(DateTime(timezone=True), server_default=func.now())