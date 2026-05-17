from fastapi import APIRouter, Depends

from app.dependencies import get_auth_service
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    req: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
):
    return await service.register(req.email, req.username, req.password)


@router.post("/login", response_model=TokenResponse)
async def login(
    req: LoginRequest,
    service: AuthService = Depends(get_auth_service),
):
    return await service.login(req.email, req.password)


@router.post("/guest", response_model=TokenResponse, status_code=201)
async def guest_login(
    service: AuthService = Depends(get_auth_service),
):
    return await service.guest_login()


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    req: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
):
    return await service.refresh(req.refresh_token)
