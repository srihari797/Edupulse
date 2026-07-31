from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from app.modules.student.schemas import APIResponse

class LoginRequest(BaseModel):
    username: str  # Can be username or email
    password: str

class UserDTO(BaseModel):
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role_id: Optional[int] = None
    is_active: bool

class LoginResponseData(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserDTO

class LoginResponse(APIResponse):
    data: LoginResponseData

class CurrentUserResponse(APIResponse):
    data: UserDTO
