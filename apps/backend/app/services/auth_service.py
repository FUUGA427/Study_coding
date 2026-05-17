import secrets

from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse


class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def register(self, email: str, username: str, password: str) -> TokenResponse:
        existing = await self.user_repo.get_by_email(email)
        if existing:
            raise ConflictError("このメールアドレスは既に登録されています")

        hashed = hash_password(password)
        user = await self.user_repo.create(email, username, hashed)

        return TokenResponse(
            access_token=create_access_token(str(user.id)),
            refresh_token=create_refresh_token(str(user.id)),
        )

    async def login(self, email: str, password: str) -> TokenResponse:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise NotFoundError("メールアドレスまたはパスワードが正しくありません")
        if not user.is_active:
            raise NotFoundError("アカウントが無効化されています")

        return TokenResponse(
            access_token=create_access_token(str(user.id)),
            refresh_token=create_refresh_token(str(user.id)),
        )

    async def guest_login(self) -> TokenResponse:
        suffix = secrets.token_hex(6)
        email = f"guest+{suffix}@guest.local"
        username = f"guest-{suffix}"
        password_hash = hash_password(secrets.token_urlsafe(16))
        user = await self.user_repo.create(email, username, password_hash)

        return TokenResponse(
            access_token=create_access_token(str(user.id)),
            refresh_token=create_refresh_token(str(user.id)),
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        user_id = decode_token(refresh_token, expected_type="refresh")
        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise NotFoundError("ユーザーが見つかりません")

        return TokenResponse(
            access_token=create_access_token(str(user.id)),
            refresh_token=create_refresh_token(str(user.id)),
        )
