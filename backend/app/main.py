import asyncio
import platform
from fastapi import FastAPI

# Fix Windows ProactorEventLoop incompatibility with psycopg async mode
if platform.system() == "Windows":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Register all SQLAlchemy models for clean metadata resolution
import app.models.user
import app.models.class_model
import app.models.doubt
import app.modules.student.models
import app.modules.teacher.models
import app.modules.growth.models
import app.modules.notification.models

from app.modules.student.router import router as student_router
from app.modules.parent.router import router as parent_router
from app.modules.growth.router import router as growth_router
from app.modules.notification.router import router as notification_router
from app.auth.router import router as auth_router
from app.modules.teacher.router import router as teacher_router, router_singular as teacher_router_singular
from app.modules.admin.router import router as admin_router
from app.modules.ai.router import router as ai_router
from app.api.files import router as files_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="EduPulse API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "EduPulse API is running 🚀"}

app.include_router(student_router, prefix="/api/v1")
app.include_router(parent_router, prefix="/api/v1")
app.include_router(growth_router, prefix="/api/v1")
app.include_router(notification_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(teacher_router, prefix="/api/v1")
app.include_router(teacher_router_singular, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(files_router, prefix="/api/v1")