from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import Response, StreamingResponse
import io
import mimetypes
from typing import Optional

from app.auth.router import get_current_user
from app.auth.schemas import UserDTO
from app.services.storage import StorageService

router = APIRouter(prefix="/files", tags=["files"])

def get_storage_service() -> StorageService:
    return StorageService()

@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_file(
    bucket: str = Form(...),
    path: str = Form(...),
    file: UploadFile = File(...),
    current_user: UserDTO = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage_service)
):
    """
    Secure gateway to upload a file to Supabase Storage.
    Only authenticated users are permitted.
    """
    try:
        file_content = await file.read()
        mime_type = file.content_type
        if not mime_type:
            mime_type, _ = mimetypes.guess_type(file.filename)
            if not mime_type:
                mime_type = "application/octet-stream"

        metadata = await storage_service.upload_file(
            bucket_name=bucket,
            storage_path=path,
            file_content=file_content,
            original_filename=file.filename,
            mime_type=mime_type,
            upsert=True
        )
        return {
            "success": True,
            "message": "File uploaded successfully.",
            "data": metadata
        }
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(exc)}"
        )

@router.get("/signed/{bucket}/{path:path}")
async def get_signed_url(
    bucket: str,
    path: str,
    expires_in: int = 3600,
    current_user: UserDTO = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage_service)
):
    """
    Generate a temporary signed URL for secure access to private storage assets.
    """
    try:
        url = await storage_service.generate_signed_url(
            bucket_name=bucket,
            storage_path=path,
            expires_in_seconds=expires_in
        )
        return {
            "success": True,
            "message": "Signed URL generated successfully.",
            "data": {
                "signed_url": url,
                "expires_in": expires_in
            }
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate signed URL: {str(exc)}"
        )

@router.get("/{bucket}/{path:path}")
async def download_file(
    bucket: str,
    path: str,
    current_user: UserDTO = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage_service)
):
    """
    Retrieve and stream a file's raw binary data.
    """
    try:
        file_bytes = await storage_service.download_file(bucket_name=bucket, storage_path=path)
        mime_type, _ = mimetypes.guess_type(path)
        if not mime_type:
            mime_type = "application/octet-stream"
        
        return Response(content=file_bytes, media_type=mime_type)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found in storage bucket '{bucket}': {path}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Download failed: {str(exc)}"
        )

@router.delete("/{bucket}/{path:path}")
async def delete_file(
    bucket: str,
    path: str,
    current_user: UserDTO = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage_service)
):
    """
    Delete a file from the specified storage bucket.
    """
    try:
        success = await storage_service.delete_file(bucket_name=bucket, storage_path=path)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Delete operation rejected by storage provider."
            )
        return {
            "success": True,
            "message": "File deleted successfully."
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Deletion failed: {str(exc)}"
        )
