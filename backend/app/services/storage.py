import logging
import mimetypes
import os
import platform
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import httpx
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger("edupulse.storage")

class StorageService:
    """
    Centralized Real Supabase Storage Service.
    Handles all uploads, downloads, deletions, URL generation, and path conventions
    directly using the live Supabase storage HTTP REST API.
    """

    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL.rstrip("/")
        self.supabase_key = settings.SUPABASE_KEY
        self.base_api_url = f"{self.supabase_url}/storage/v1"
        self.headers = {
            "Authorization": f"Bearer {self.supabase_key}",
            "apikey": self.supabase_key,
        }

    # ----------------------------------------------------
    # Storage Path Conventions
    # ----------------------------------------------------
    @staticmethod
    def get_avatar_path(role: str, user_id: int) -> str:
        """
        Generate path for avatar uploads: [role]s/{user_id}.jpg
        Supported roles: student, teacher, parent, admin
        """
        role_plural = f"{role.lower().strip()}s"
        return f"{role_plural}/{user_id}.jpg"

    @staticmethod
    def get_resource_path(teacher_id: int, resource_id: int, filename: str) -> str:
        """
        Generate path for Learning Resources:
        teacher_{teacher_id}/resource_{resource_id}/{filename}
        """
        clean_filename = os.path.basename(filename)
        return f"teacher_{teacher_id}/resource_{resource_id}/{clean_filename}"

    @staticmethod
    def get_submission_path(assignment_id: int, student_id: int, filename: str) -> str:
        """
        Generate path for Assignment Submissions:
        assignment_{assignment_id}/student_{student_id}/{filename}
        """
        clean_filename = os.path.basename(filename)
        return f"assignment_{assignment_id}/student_{student_id}/{clean_filename}"

    @staticmethod
    def get_attachment_path(student_id: int, achievement_id: int, filename: str) -> str:
        """
        Generate path for Growth Passport Attachments:
        student_{student_id}/achievement_{achievement_id}/{filename}
        """
        clean_filename = os.path.basename(filename)
        return f"student_{student_id}/achievement_{achievement_id}/{clean_filename}"

    # ----------------------------------------------------
    # Centralized Validation
    # ----------------------------------------------------
    def validate_file(
        self, file_content: bytes, filename: str, mime_type: str, bucket_name: str
    ) -> None:
        """
        Validate file content, size, and MIME type based on bucket-specific rules.
        Raises ValueError if validation fails.
        """
        if not file_content:
            raise ValueError("File content cannot be empty.")

        if not filename or not filename.strip():
            raise ValueError("Filename cannot be empty.")

        # Determine validation rules based on bucket type
        file_size = len(file_content)
        mime_lower = mime_type.lower().strip() if mime_type else ""

        # Retrieve mapped buckets from settings
        is_avatar = bucket_name == settings.SUPABASE_BUCKET_AVATARS
        is_resource = bucket_name == settings.SUPABASE_BUCKET_RESOURCES
        is_submission = bucket_name == settings.SUPABASE_BUCKET_SUBMISSIONS
        is_attachment = bucket_name == settings.SUPABASE_BUCKET_ATTACHMENTS

        if is_avatar:
            # Avatars: image/* and <= 500 KB
            if not mime_lower.startswith("image/"):
                raise ValueError(f"Invalid avatar MIME type '{mime_type}'. Must be an image.")
            max_size = 500 * 1024
            if file_size > max_size:
                raise ValueError(f"Avatar file size exceeds the 500 KB limit. (Got {file_size / 1024:.1f} KB)")

        elif is_resource:
            # Resources: PDF, DOCX, PPTX, Images and <= 20 MB
            allowed_resource_mimes = {
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document", # DOCX
                "application/vnd.openxmlformats-officedocument.presentationml.presentation", # PPTX
            }
            is_allowed = mime_lower in allowed_resource_mimes or mime_lower.startswith("image/")
            if not is_allowed:
                raise ValueError(f"Invalid resource type '{mime_type}'. Allowed: PDF, DOCX, PPTX, Images.")
            max_size = 20 * 1024 * 1024
            if file_size > max_size:
                raise ValueError(f"Resource file size exceeds the 20 MB limit. (Got {file_size / (1024*1024):.1f} MB)")

        elif is_submission:
            # Submissions: PDF, DOCX, Images and <= 10 MB
            allowed_sub_mimes = {
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            }
            is_allowed = mime_lower in allowed_sub_mimes or mime_lower.startswith("image/")
            if not is_allowed:
                raise ValueError(f"Invalid submission type '{mime_type}'. Allowed: PDF, DOCX, Images.")
            max_size = 10 * 1024 * 1024
            if file_size > max_size:
                raise ValueError(f"Submission file size exceeds the 10 MB limit. (Got {file_size / (1024*1024):.1f} MB)")

        elif is_attachment:
            # Attachments: PDF, Images and <= 10 MB
            allowed_att_mimes = {
                "application/pdf",
            }
            is_allowed = mime_lower in allowed_att_mimes or mime_lower.startswith("image/")
            if not is_allowed:
                raise ValueError(f"Invalid attachment type '{mime_type}'. Allowed: PDF, Images.")
            max_size = 10 * 1024 * 1024
            if file_size > max_size:
                raise ValueError(f"Attachment file size exceeds the 10 MB limit. (Got {file_size / (1024*1024):.1f} MB)")

        else:
            # Generic validation: <= 10 MB
            max_size = 10 * 1024 * 1024
            if file_size > max_size:
                raise ValueError(f"File size exceeds the 10 MB limit. (Got {file_size / (1024*1024):.1f} MB)")

    # ----------------------------------------------------
    # Core HTTP Operations
    # ----------------------------------------------------
    async def upload_file(
        self,
        bucket_name: str,
        storage_path: str,
        file_content: bytes,
        original_filename: str,
        mime_type: Optional[str] = None,
        upsert: bool = True,
    ) -> Dict[str, Any]:
        """
        Uploads file content to the specified Supabase bucket and path.
        """
        if not mime_type:
            mime_type, _ = mimetypes.guess_type(original_filename)
            if not mime_type:
                mime_type = "application/octet-stream"

        # Centralized validation check
        self.validate_file(file_content, original_filename, mime_type, bucket_name)

        clean_path = storage_path.lstrip("/")
        url = f"{self.base_api_url}/object/{bucket_name}/{clean_path}"

        upload_headers = self.headers.copy()
        upload_headers["Content-Type"] = mime_type
        if upsert:
            upload_headers["x-upsert"] = "true"

        logger.info(f"Uploading file to bucket '{bucket_name}' path '{clean_path}' (x-upsert={upsert})...")

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=upload_headers, content=file_content)
            if resp.status_code != 200:
                logger.error(f"Supabase upload failed ({resp.status_code}): {resp.text}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Storage upload failed: {resp.text}"
                )

        return {
            "bucket_name": bucket_name,
            "storage_path": clean_path,
            "original_filename": original_filename,
            "mime_type": mime_type,
            "file_size": len(file_content),
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
        }

    async def replace_file(
        self,
        bucket_name: str,
        storage_path: str,
        file_content: bytes,
        original_filename: str,
        mime_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Replace an existing file on Supabase.
        Wrapper around upload_file with upsert=True.
        """
        return await self.upload_file(
            bucket_name=bucket_name,
            storage_path=storage_path,
            file_content=file_content,
            original_filename=original_filename,
            mime_type=mime_type,
            upsert=True,
        )

    async def download_file(self, bucket_name: str, storage_path: str) -> bytes:
        """
        Downloads a file's raw binary data from the specified Supabase bucket and path.
        """
        clean_path = storage_path.lstrip("/")
        url = f"{self.base_api_url}/object/{bucket_name}/{clean_path}"

        logger.info(f"Downloading file from bucket '{bucket_name}' path '{clean_path}'...")

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url, headers=self.headers)
            if resp.status_code != 200:
                logger.error(f"Supabase download failed ({resp.status_code}): {resp.text}")
                raise FileNotFoundError(f"File not found in storage: {clean_path}")
            return resp.content

    async def delete_file(self, bucket_name: str, storage_path: str) -> bool:
        """
        Deletes a single file from the specified Supabase bucket.
        """
        clean_path = storage_path.lstrip("/")
        url = f"{self.base_api_url}/object/{bucket_name}"
        
        logger.info(f"Deleting file from bucket '{bucket_name}' path '{clean_path}'...")

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Supabase delete takes a prefixes JSON payload containing paths to delete
            resp = await client.request(
                "DELETE",
                url,
                headers=self.headers,
                json={"prefixes": [clean_path]}
            )
            if resp.status_code != 200:
                logger.error(f"Supabase delete failed ({resp.status_code}): {resp.text}")
                return False
            
            # Returns list of successfully deleted keys. Check if our path is in it.
            result = resp.json()
            if isinstance(result, list) and len(result) > 0:
                return True
            return False

    def generate_public_url(self, bucket_name: str, storage_path: str) -> str:
        """
        Construct a static public URL for a file in a public bucket.
        Does not issue network requests.
        """
        clean_path = storage_path.lstrip("/")
        return f"{self.base_api_url}/object/public/{bucket_name}/{clean_path}"

    async def generate_signed_url(
        self, bucket_name: str, storage_path: str, expires_in_seconds: int = 3600
    ) -> str:
        """
        Request a temporary signed URL from Supabase for access to files in private buckets.
        """
        clean_path = storage_path.lstrip("/")
        url = f"{self.base_api_url}/object/sign/{bucket_name}/{clean_path}"

        logger.info(f"Generating signed URL for bucket '{bucket_name}' path '{clean_path}' (expiry={expires_in_seconds}s)...")

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                url,
                headers=self.headers,
                json={"expiresIn": expires_in_seconds}
            )
            if resp.status_code != 200:
                logger.error(f"Failed to generate signed URL ({resp.status_code}): {resp.text}")
                raise Exception(f"Failed to generate signed URL: {resp.text}")
            
            data = resp.json()
            # Handle both 'signedUrl' and 'signedURL' response casing
            signed_url_path = data.get("signedUrl") or data.get("signedURL")
            if not signed_url_path:
                raise Exception(f"Invalid signed URL response: {data}")
            
            # The response path is usually relative or complete URL.
            # If it is relative, prefix it with the supabase storage host URL.
            if signed_url_path.startswith("http://") or signed_url_path.startswith("https://"):
                return signed_url_path
            
            return f"{self.supabase_url}{signed_url_path}"

    async def check_file_exists(self, bucket_name: str, storage_path: str) -> bool:
        """
        Verifies if a file exists in the specified Supabase bucket.
        """
        clean_path = storage_path.lstrip("/")
        # We fetch info metadata of the file. Returns 200 if exists.
        url = f"{self.base_api_url}/object/info/{bucket_name}/{clean_path}"

        logger.info(f"Checking if file exists in bucket '{bucket_name}' path '{clean_path}'...")

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=self.headers)
            return resp.status_code == 200

    async def get_file_metadata(self, bucket_name: str, storage_path: str) -> Dict[str, Any]:
        """
        Retrieves detailed file metadata from Supabase.
        """
        clean_path = storage_path.lstrip("/")
        url = f"{self.base_api_url}/object/info/{bucket_name}/{clean_path}"

        logger.info(f"Retrieving metadata for bucket '{bucket_name}' path '{clean_path}'...")

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=self.headers)
            if resp.status_code != 200:
                logger.error(f"Failed to fetch file metadata ({resp.status_code}): {resp.text}")
                raise FileNotFoundError(f"File not found in storage: {clean_path}")
            
            # Supabase metadata details
            info = resp.json()
            return {
                "bucket_name": bucket_name,
                "storage_path": clean_path,
                "original_filename": os.path.basename(clean_path),
                "mime_type": info.get("mimetype") or info.get("mimeType") or "application/octet-stream",
                "file_size": info.get("size") or info.get("metadata", {}).get("size") or 0,
                "uploaded_at": info.get("created_at") or info.get("updated_at") or datetime.now(timezone.utc).isoformat(),
            }
