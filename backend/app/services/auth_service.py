from typing import Optional
from prisma import Prisma
from prisma.models import User
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.schemas.user import UserCreate, UserUpdate


class AuthService:
    def __init__(self, db: Prisma):
        self.db = db
    
    async def register(self, user_data: UserCreate) -> User:
        existing_user = await self.db.user.find_unique(where={"email": user_data.email})
        if existing_user:
            raise ValueError("Email already registered")
        
        user = await self.db.user.create(
            data={
                "email": user_data.email,
                "passwordHash": get_password_hash(user_data.password),
                "full_name": user_data.full_name,
                "phone": user_data.phone,
            }
        )
        return user
    
    async def login(self, email: str, password: str) -> tuple[User, str, str]:
        user = await self.db.user.find_unique(where={"email": email})
        if not user:
            raise ValueError("Invalid email or password")
        
        if not verify_password(password, user.passwordHash):
            raise ValueError("Invalid email or password")
        
        if not user.isActive:
            raise ValueError("Account is inactive")
        
        access_token = create_access_token(data={"sub": user.id})
        refresh_token = create_refresh_token(data={"sub": user.id})
        
        return user, access_token, refresh_token
    
    async def refresh_tokens(self, user_id: str) -> tuple[str, str]:
        user = await self.db.user.find_unique(where={"id": user_id})
        if not user or not user.isActive:
            raise ValueError("Invalid user")
        
        access_token = create_access_token(data={"sub": user.id})
        refresh_token = create_refresh_token(data={"sub": user.id})
        
        return access_token, refresh_token
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        return await self.db.user.find_unique(where={"id": user_id})
    
    async def update_user(self, user_id: str, data: UserUpdate) -> User:
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return await self.db.user.find_unique(where={"id": user_id})
        
        return await self.db.user.update(
            where={"id": user_id},
            data=update_data
        )
    
    async def change_password(self, user_id: str, old_password: str, new_password: str) -> bool:
        user = await self.db.user.find_unique(where={"id": user_id})
        if not user:
            raise ValueError("User not found")
        
        if not verify_password(old_password, user.passwordHash):
            raise ValueError("Current password is incorrect")
        
        await self.db.user.update(
            where={"id": user_id},
            data={"passwordHash": get_password_hash(new_password)}
        )
        return True
    
    async def list_users(self, skip: int = 0, take: int = 20) -> tuple[list[User], int]:
        users = await self.db.user.find_many(
            skip=skip,
            take=take,
            order={"createdAt": "desc"}
        )
        total = await self.db.user.count()
        return users, total
