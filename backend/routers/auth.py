from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from core.database import DbSession, get_db
from core.dependencies import get_current_user
from services.auth import register_user, login_user
from schemas.user import UserCreate, UserResponse, Token
from models.user import User
from core.logging import logger
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user_data: UserCreate, db: DbSession):
    logger.info("Register attempt")
    return await register_user(db, user_data)


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    logger.info("Login attempt")
    return await login_user(db, form_data.username, form_data.password)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
