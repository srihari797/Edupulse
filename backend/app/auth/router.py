from fastapi.routing import APIRoute
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Callable
import json

from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token, decode_access_token
from app.models.user import User
from app.auth.schemas import LoginRequest, LoginResponse, LoginResponseData, UserDTO, CurrentUserResponse

class LoginAPIRoute(APIRoute):
    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()
        async def custom_route_handler(request: Request) -> Response:
            content_type = request.headers.get("content-type", "")
            if "application/x-www-form-urlencoded" in content_type:
                form = await request.form()
                username = form.get("username", "")
                password = form.get("password", "")
                body_dict = {"username": username, "password": password}
                body_bytes = json.dumps(body_dict).encode("utf-8")
                
                async def receive():
                    return {"type": "http.request", "body": body_bytes, "more_body": False}
                request._receive = receive
                
                headers = dict(request.scope["headers"])
                headers[b"content-type"] = b"application/json"
                headers[b"content-length"] = str(len(body_bytes)).encode("ascii")
                request.scope["headers"] = list(headers.items())
            return await original_route_handler(request)
        return custom_route_handler

router = APIRouter(prefix="/auth", tags=["auth"], route_class=LoginAPIRoute)

security_scheme = HTTPBearer()

# In-memory mock users database for Mock mode
MOCK_USERS = {
    "rahul.b@edupulse.edu": {
        "id": 1,
        "email": "rahul.b@edupulse.edu",
        "password_hash": "$2b$12$4hnTUSjk8A2Uxc84RH6/qOS0xChC7CanIb4PpYoJr.v8fF1QC7xGS", #bcrypt hash of 'password'
        "first_name": "Rahul",
        "last_name": "B",
        "role_id": 1,
        "is_active": True
    },
    "sarah.b@parent.edupulse.edu": {
        "id": 2,
        "email": "sarah.b@parent.edupulse.edu",
        "password_hash": "$2b$12$4hnTUSjk8A2Uxc84RH6/qOS0xChC7CanIb4PpYoJr.v8fF1QC7xGS",
        "first_name": "Sarah",
        "last_name": "B",
        "role_id": 2,
        "is_active": True
    },
    "david.miller@teacher.edupulse.edu": {
        "id": 3,
        "email": "david.miller@teacher.edupulse.edu",
        "password_hash": "$2b$12$4hnTUSjk8A2Uxc84RH6/qOS0xChC7CanIb4PpYoJr.v8fF1QC7xGS",
        "first_name": "David",
        "last_name": "Miller",
        "role_id": 3,
        "is_active": True
    },
    "admin@edupulse.edu": {
        "id": 4,
        "email": "admin@edupulse.edu",
        "password_hash": "$2b$12$4hnTUSjk8A2Uxc84RH6/qOS0xChC7CanIb4PpYoJr.v8fF1QC7xGS",
        "first_name": "Admin",
        "last_name": "User",
        "role_id": 4,
        "is_active": True
    },
    "demo_par@gmail.com": {
        "id": 101,
        "email": "demo_par@gmail.com",
        "password_hash": "$2b$12$4hnTUSjk8A2Uxc84RH6/qOS0xChC7CanIb4PpYoJr.v8fF1QC7xGS",
        "first_name": "Demo",
        "last_name": "Parent",
        "role_id": 2,
        "is_active": True
    },
    "demo_stu@gmail.com": {
        "id": 102,
        "email": "demo_stu@gmail.com",
        "password_hash": "$2b$12$4hnTUSjk8A2Uxc84RH6/qOS0xChC7CanIb4PpYoJr.v8fF1QC7xGS",
        "first_name": "Demo",
        "last_name": "Student",
        "role_id": 1,
        "is_active": True
    },
    "srihari": {
        "id": 103,
        "email": "srihari@edupulse.edu",
        "password_hash": "$2b$12$4hnTUSjk8A2Uxc84RH6/qOS0xChC7CanIb4PpYoJr.v8fF1QC7xGS",
        "first_name": "Srihari",
        "last_name": "Student",
        "role_id": 1,
        "is_active": True
    },
    "srihari@edupulse.edu": {
        "id": 103,
        "email": "srihari@edupulse.edu",
        "password_hash": "$2b$12$4hnTUSjk8A2Uxc84RH6/qOS0xChC7CanIb4PpYoJr.v8fF1QC7xGS",
        "first_name": "Srihari",
        "last_name": "Student",
        "role_id": 1,
        "is_active": True
    },
    "srihari@gmail.com": {
        "id": 103,
        "email": "srihari@edupulse.edu",
        "password_hash": "$2b$12$4hnTUSjk8A2Uxc84RH6/qOS0xChC7CanIb4PpYoJr.v8fF1QC7xGS",
        "first_name": "Srihari",
        "last_name": "Student",
        "role_id": 1,
        "is_active": True
    }
}

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> UserDTO:
    """
    Dependency that decodes the access token and retrieves the current authenticated user.
    """
    token = credentials.credentials
    user_id_str = decode_access_token(token)
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user_id = int(user_id_str)
    
    # Resolve depending on ADSA mode configuration
    mode = settings.DATA_SOURCE.lower()
    if mode == "mock":
        # Search mock users
        for u in MOCK_USERS.values():
            if u["id"] == user_id:
                return UserDTO(**u)
    else:
        # Query PostgreSQL database
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            return UserDTO(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                role_id=user.role_id,
                is_active=user.is_active
            )
            
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="User not found.",
        headers={"WWW-Authenticate": "Bearer"}
    )

@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and issue JWT access token.
    """
    username = payload.username.lower().strip()
    password = payload.password
    
    user_data = None
    mode = settings.DATA_SOURCE.lower()
    
    if mode == "mock":
        user_data = MOCK_USERS.get(username)
        if not user_data or not verify_password(password, user_data["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )
        user_dto = UserDTO(**user_data)
    else:
        # Authenticate via database
        stmt = select(User).where(User.email == username)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )
        user_dto = UserDTO(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role_id=user.role_id,
            is_active=user.is_active
        )
        
    # Generate token
    token = create_access_token(subject=user_dto.id)
    
    return LoginResponse(
        success=True,
        message="Login successful.",
        data=LoginResponseData(
            access_token=token,
            user=user_dto
        )
    )

@router.post("/logout")
async def logout():
    """
    Stateless logout endpoint. Tokens are invalidated client-side.
    """
    return {
        "success": True,
        "message": "Logout successful."
    }

@router.get("/me", response_model=CurrentUserResponse)
async def get_me(
    current_user: UserDTO = Depends(get_current_user)
):
    """
    Retrieve authenticated user profile.
    """
    return CurrentUserResponse(
        success=True,
        message="Current user profile retrieved successfully.",
        data=current_user
    )
