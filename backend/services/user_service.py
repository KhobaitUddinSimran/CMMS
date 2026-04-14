"""User service"""
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.user import User

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_user_by_email(self, email: str):
        # TODO: Query user by email
        pass
    
    async def create_user(self, user_data: dict):
        # TODO: Create new user
        pass
    
    async def update_user(self, user_id: str, data: dict):
        # TODO: Update user
        pass
