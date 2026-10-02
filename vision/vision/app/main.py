import os
import io
import base64
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from vision.app.database.vector_db import VectorDB
from vision.app.ai.face_service import FaceService

app = FastAPI(
    title="Vision CV Attendance System API",
    description="Computer Vision Face Recognition & Vector Database Attendance API",
    version="2.0.0",
)

# CORS Configuration for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files and Templates
static_dir = os.path.join(os.path.dirname(__file__), "static")
templates_dir = os.path.join(os.path.dirname(__file__), "templates")

if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

templates = (
    Jinja2Templates(directory=templates_dir) if os.path.exists(templates_dir) else None
)

# Initialize Core Services
vector_db = VectorDB()
face_service = FaceService()


class Base64MarkRequest(BaseModel):
    image_base64: str
    student_id: Optional[str] = None


class Base64RegisterRequest(BaseModel):
    student_id: str
    student_name: str
    images_base64: List[str]


@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "Vision CV Attendance & Vector DB",
        "registered_students_count": len(vector_db.vectors_cache),
    }


from fastapi.responses import HTMLResponse, JSONResponse, FileResponse

@app.get("/", response_class=FileResponse)
def index_page():
    index_file = os.path.join(templates_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return HTMLResponse("<h1>Vision CV Attendance System Running</h1>")


# ─────────────────────────────────────────────────────────────────────────────
# API Endpoints
# ─────────────────────────────────────────────────────────────────────────────


@app.post("/api/vision/register")
async def register_student_face(
    student_id: str = Form(...),
    student_name: str = Form(...),
    images: List[UploadFile] = File(...),
):
    """
    Register a student face profile into VectorDB.
    Extracts facial embeddings from uploaded images and indexes normalized centroid vector.
    """
    try:
        all_embeddings = []

        for upload in images:
            contents = await upload.read()
            img_bgr = face_service.process_image_bytes(contents)
            if img_bgr is not None:
                embs = face_service.extract_face_embeddings(img_bgr)
                all_embeddings.extend(embs)

        if not all_embeddings:
            raise HTTPException(
                status_code=400,
                detail="No clear face detected in uploaded images. Please ensure face is visible.",
            )

        reg_result = vector_db.register_face_vector(
            student_id=student_id.strip(),
            student_name=student_name.strip(),
            embeddings=all_embeddings,
        )

        return {
            "status": "success",
            "message": f"Successfully registered face vector for {student_name} ({student_id})",
            "data": reg_result,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/vision/register_base64")
async def register_student_face_base64(req: Base64RegisterRequest):
    """Register student using base64 encoded frame snapshots from web camera."""
    try:
        all_embeddings = []

        for b64_str in req.images_base64:
            # Strip data URI prefix if present
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]

            img_bytes = base64.b64decode(b64_str)
            img_bgr = face_service.process_image_bytes(img_bytes)
            if img_bgr is not None:
                embs = face_service.extract_face_embeddings(img_bgr)
                all_embeddings.extend(embs)

        if not all_embeddings:
            raise HTTPException(
                status_code=400,
                detail="No face detected in camera stream snapshots. Please face the camera clearly.",
            )

        reg_result = vector_db.register_face_vector(
            student_id=req.student_id.strip(),
            student_name=req.student_name.strip(),
            embeddings=all_embeddings,
        )

        return {
            "status": "success",
            "message": f"Registered face vector in VectorDB for {req.student_name}",
            "data": reg_result,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/vision/mark")
async def mark_attendance_image(image: UploadFile = File(...)):
    """
    Mark attendance via live camera frame upload.
    Queries VectorDB for nearest face vector match.
    """
    try:
        contents = await image.read()
        img_bgr = face_service.process_image_bytes(contents)

        if img_bgr is None:
            raise HTTPException(status_code=400, detail="Invalid image payload.")

        query_embs = face_service.extract_face_embeddings(img_bgr)

        if not query_embs:
            return JSONResponse(
                status_code=200,
                content={
                    "status": "success",
                    "matched": False,
                    "confidence": 0.0,
                    "message": "No face detected in frame. Please align face with camera.",
                },
            )

        # Match primary query face embedding against VectorDB
        query_vector = query_embs[0]
        matched_student, confidence = vector_db.search_nearest_vector(
            query_vector, threshold=0.40
        )

        if not matched_student:
            return {
                "status": "success",
                "matched": False,
                "confidence": confidence,
                "message": f"Face not recognized in database (Confidence: {confidence * 100:.1f}%)",
            }

        # Mark attendance in SQLite database
        att_res = vector_db.mark_attendance(
            student_id=matched_student["student_id"],
            student_name=matched_student["student_name"],
            confidence=confidence,
        )

        return {
            "status": "success",
            "matched": True,
            "confidence": confidence,
            "student_id": matched_student["student_id"],
            "student_name": matched_student["student_name"],
            "attendance": att_res,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/vision/mark_base64")
async def mark_attendance_base64(req: Base64MarkRequest):
    """Mark attendance using Base64 camera frame payload."""
    try:
        b64_str = req.image_base64
        if "," in b64_str:
            b64_str = b64_str.split(",")[1]

        img_bytes = base64.b64decode(b64_str)
        img_bgr = face_service.process_image_bytes(img_bytes)

        if img_bgr is None:
            raise HTTPException(status_code=400, detail="Invalid camera frame.")

        query_embs = face_service.extract_face_embeddings(img_bgr)

        if not query_embs:
            return {
                "status": "success",
                "matched": False,
                "confidence": 0.0,
                "message": "No face detected in frame. Align face clearly.",
            }

        query_vector = query_embs[0]

        matched_student, confidence = vector_db.search_nearest_vector(
            query_vector, threshold=0.35
        )

        if not matched_student:
            return {
                "status": "success",
                "matched": False,
                "confidence": confidence,
                "message": f"Face not recognized in database (Match Score: {confidence * 100:.1f}%)",
            }

        # Security rule: Matched face vector MUST belong to the active logged-in account
        active_account_id = req.student_id.strip() if req.student_id else None

        if active_account_id:
            matched_id = str(matched_student["student_id"]).strip().lower()
            active_id = str(active_account_id).strip().lower()

            if matched_id != active_id:
                return {
                    "status": "success",
                    "matched": False,
                    "security_error": True,
                    "confidence": confidence,
                    "message": f"Security Alert: Scanned face belongs to '{matched_student['student_name']}' ({matched_student['student_id']}), but active account is '{active_account_id}'. Proxy attendance is prohibited!",
                }

        att_res = vector_db.mark_attendance(
            student_id=matched_student["student_id"],
            student_name=matched_student["student_name"],
            confidence=confidence,
        )

        return {
            "status": "success",
            "matched": True,
            "confidence": confidence,
            "student_id": matched_student["student_id"],
            "student_name": matched_student["student_name"],
            "attendance": att_res,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/vision/check_registration/{student_id}")
def check_student_registration(student_id: str):
    """Check if face vector is registered for a specific student ID or email."""
    record = vector_db.is_student_registered(student_id)
    if record:
        return {
            "status": "success",
            "is_registered": True,
            "data": {
                "student_id": record["student_id"],
                "student_name": record["student_name"],
                "registered_at": record.get("registered_at"),
                "sample_count": record.get("sample_count", 1),
            },
        }
    return {"status": "success", "is_registered": False, "data": None}


@app.get("/api/vision/attendance")
def get_attendance_history(student_id: Optional[str] = None, limit: int = 50):
    """Retrieve attendance history records."""
    records = vector_db.get_attendance_history(student_id=student_id, limit=limit)
    return {"status": "success", "count": len(records), "data": records}


@app.get("/api/vision/registered_students")
def get_registered_students():
    """Retrieve list of registered students in VectorDB."""
    students = vector_db.list_registered_students()
    return {"status": "success", "count": len(students), "data": students}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)