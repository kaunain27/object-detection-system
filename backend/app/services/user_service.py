from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from app.models.user import User
from app.core.security import hash_password, verify_password
from app.core.schemas import RegisterRequest


class UserService:

    @staticmethod
    def _normalize_username(value: str) -> str:
        return (value or "").strip().lower()

    @staticmethod
    def _normalize_email(value: str) -> str:
        return (value or "").strip().lower()

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_username(db: AsyncSession, username: str) -> Optional[User]:
        normalized = UserService._normalize_username(username)
        result = await db.execute(
            select(User).where(func.lower(User.username) == normalized)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        normalized = UserService._normalize_email(email)
        result = await db.execute(
            select(User).where(func.lower(User.email) == normalized)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, data: RegisterRequest) -> User:
        username = UserService._normalize_username(data.username)
        email = UserService._normalize_email(data.email)
        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def authenticate(db: AsyncSession, username: str, password: str) -> Optional[User]:
        user = await UserService.get_by_username(db, username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
