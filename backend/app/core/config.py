import os
from typing import Any, Dict, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine the base directory of the backend to locate the .env file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_FILE_PATH = os.path.join(BASE_DIR, ".env")

class Settings(BaseSettings):
    """
    EduPulse Backend Settings.
    Loads configurations from environment variables and fallback to the .env file.
    """
    
    # ----------------------------------------------------
    # Core Application Settings
    # ----------------------------------------------------
    APP_NAME: str = Field(default="EduPulse", validation_alias="APP_NAME")
    APP_ENV: str = Field(default="development", validation_alias="APP_ENV")
    DEBUG: bool = Field(default=True, validation_alias="DEBUG")
    
    # ----------------------------------------------------
    # Security & Authentication Settings
    # ----------------------------------------------------
    SECRET_KEY: str = Field(default="", validation_alias="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", validation_alias="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # ----------------------------------------------------
    # Database Settings
    # ----------------------------------------------------
    DATABASE_URL: str = Field(default="", validation_alias="DATABASE_URL")
    
    # ----------------------------------------------------
    # AI Engine Settings (Groq Cloud Free Tier API)
    # ----------------------------------------------------
    GROQ_API: str = Field(default="", validation_alias="GROQ_API")
    GROQ_API_KEY: str = Field(default="", validation_alias="GROQ_API_KEY")
    GROQ_MODEL: str = Field(default="llama-3.3-70b-versatile", validation_alias="GROQ_MODEL")
    GROQ_BASE_URL: str = Field(default="https://api.groq.com/openai/v1", validation_alias="GROQ_BASE_URL")
    
    # ----------------------------------------------------
    # Supabase Settings
    # ----------------------------------------------------
    SUPABASE_URL: str = Field(default="", validation_alias="SUPABASE_URL")
    SUPABASE_KEY: str = Field(default="", validation_alias="SUPABASE_KEY")
    SUPABASE_BUCKET_AVATARS: str = Field(default="edupulse-avatars", validation_alias="SUPABASE_BUCKET_AVATARS")
    SUPABASE_BUCKET_RESOURCES: str = Field(default="edupulse-resources", validation_alias="SUPABASE_BUCKET_RESOURCES")
    SUPABASE_BUCKET_SUBMISSIONS: str = Field(default="edupulse-submissions", validation_alias="SUPABASE_BUCKET_SUBMISSIONS")
    SUPABASE_BUCKET_ATTACHMENTS: str = Field(default="edupulse-attachments", validation_alias="SUPABASE_BUCKET_ATTACHMENTS")
    
    # ----------------------------------------------------
    # Qdrant Vector DB Settings
    # ----------------------------------------------------
    QDRANT_URL: str = Field(default="", validation_alias="QDRANT_URL")
    QDRANT_API_KEY: str = Field(default="", validation_alias="QDRANT_API_KEY")
    
    # ----------------------------------------------------
    # Adaptive Data Source Architecture (ADSA) Settings
    # ----------------------------------------------------
    # Global data source mode: mock, real, or hybrid
    DATA_SOURCE: str = Field(default="mock", validation_alias="DATA_SOURCE")
    
    # Global flag for Mock mode (fallback compatibility)
    USE_MOCK: bool = Field(default=True, validation_alias="USE_MOCK")
    
    # Feature-Level Configuration (Allowed values: MOCK, HYBRID, REAL)
    # Defaulting all features to MOCK mode for MVP
    STUDENT_PROFILE_MODE: str = Field(default="MOCK", validation_alias="STUDENT_PROFILE_MODE")
    STUDENT_ATTENDANCE_MODE: str = Field(default="MOCK", validation_alias="STUDENT_ATTENDANCE_MODE")
    STUDENT_ANALYTICS_MODE: str = Field(default="MOCK", validation_alias="STUDENT_ANALYTICS_MODE")
    TEACHER_ASSIGNMENTS_MODE: str = Field(default="MOCK", validation_alias="TEACHER_ASSIGNMENTS_MODE")
    PARENT_PROGRESS_MODE: str = Field(default="MOCK", validation_alias="PARENT_PROGRESS_MODE")
    ADMIN_REPORTS_MODE: str = Field(default="MOCK", validation_alias="ADMIN_REPORTS_MODE")
    
    @field_validator(
        "STUDENT_PROFILE_MODE",
        "STUDENT_ATTENDANCE_MODE",
        "STUDENT_ANALYTICS_MODE",
        "TEACHER_ASSIGNMENTS_MODE",
        "PARENT_PROGRESS_MODE",
        "ADMIN_REPORTS_MODE",
        mode="before"
    )
    @classmethod
    def validate_mode(cls, value: str) -> str:
        """Ensure the mode is one of the permitted ADSA modes."""
        upper_val = str(value).upper()
        if upper_val not in {"MOCK", "HYBRID", "REAL"}:
            raise ValueError(f"Invalid mode: {value}. Must be one of MOCK, HYBRID, REAL")
        return upper_val

    @field_validator("DATA_SOURCE", mode="before")
    @classmethod
    def validate_data_source(cls, value: str) -> str:
        lower_val = str(value).lower()
        if lower_val not in {"mock", "real", "hybrid"}:
            raise ValueError(f"Invalid DATA_SOURCE: {value}. Must be one of mock, real, hybrid")
        return lower_val

    def get_resolved_mode(self, feature_key: str) -> str:
        """
        Resolves the active data source mode for a given feature key.
        """
        ds = self.DATA_SOURCE.lower()
        if ds == "mock":
            return "MOCK"
        elif ds == "real":
            return "REAL"
        
        # If hybrid, resolve using feature overrides
        feature_mapping = {
            "student.profile": self.STUDENT_PROFILE_MODE,
            "student.attendance": self.STUDENT_ATTENDANCE_MODE,
            "student.analytics": self.STUDENT_ANALYTICS_MODE,
            "teacher.assignments": self.TEACHER_ASSIGNMENTS_MODE,
            "parent.progress": self.PARENT_PROGRESS_MODE,
            "admin.reports": self.ADMIN_REPORTS_MODE,
        }
        
        normalized_key = str(feature_key).lower().strip()
        return feature_mapping.get(normalized_key, "MOCK")

    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Settings instance loader
settings = Settings()
