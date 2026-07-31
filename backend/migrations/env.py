import asyncio
import os
import sys
import platform
from logging.config import fileConfig

# Fix Windows ProactorEventLoop incompatibility with psycopg async mode
if platform.system() == "Windows":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import pool
from sqlalchemy.engine import Connection

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import Base, async_engine

# Explicitly import all domain models to register them on Base.metadata for autogenerate
from app.models.user import User, Role
from app.models.class_model import (
    Class, Section, Subject, AcademicYear, GradeMapping,
    TeacherClassSubject, StudentParentMapping, TimetableSlot,
    CalendarEvent, SystemSetting
)
from app.modules.student.models import StudentProfile, StudyPlan, AIRecommendation
from app.modules.teacher.models import TeacherProfile, SharedGoal, Assignment, AssignmentSubmission, LearningResource
from app.modules.parent.models import ParentProfile
from app.modules.notification.models import Notification
from app.modules.growth.models import GrowthPassport, Achievement, Activity

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

def include_object(object, name, type_, reflected, compare_to):
    """
    Ensure Alembic only processes objects belonging to the edupulse schema.
    """
    if type_ == "schema":
        return name == "edupulse"
        
    schema = None
    if type_ == "table":
        schema = object.schema
    elif hasattr(object, "table") and object.table is not None:
        schema = object.table.schema
    
    return schema == "edupulse"

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well. By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    db_url = settings.DATABASE_URL
    if db_url:
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
        elif db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_schemas=True,
        include_object=include_object,
        version_table_schema="edupulse"
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_schemas=True,
        include_object=include_object,
        version_table_schema="edupulse"
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Reuse the async engine defined in our database setup
    connectable = async_engine

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
