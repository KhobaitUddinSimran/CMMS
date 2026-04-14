from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    email: str
    name: str
    role: str
    initials: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    force_password_change: bool = False

class TokenRequest(BaseModel):
    access_token: str
    token_type: str = "bearer"
