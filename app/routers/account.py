"""Authenticated account endpoints: profile, password and deletion."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import (
    AccountDeleteRequest,
    PasswordChange,
    ProfileUpdate,
    TokenResponse,
    UserOut,
)
from app.services import account_service, auth_service

router = APIRouter(prefix="/api/auth", tags=["Профиль"])


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    return account_service.update_profile(db, current_user, payload.display_name)


@router.post("/password", response_model=TokenResponse)
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TokenResponse:
    user = account_service.change_password(db, current_user, payload)
    return auth_service.token_response(user)


@router.delete("/account", status_code=204)
def delete_account(
    payload: AccountDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    account_service.delete_account(db, current_user, payload.password)
    return Response(status_code=204)
