"""Authentication service"""
from ..core.security import hash_password, verify_password, create_access_token

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        return hash_password(password)
    
    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        return verify_password(plain, hashed)
    
    @staticmethod
    def create_token(user_id: str, role: str) -> str:
        return create_access_token(user_id, role)
