"""Profile, password-change and account-deletion business logic."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import User
from app.schemas import PasswordChange
from app.security import hash_password, verify_password


def update_profile(db: Session, user: User, display_name: str) -> User:
    user.display_name = display_name
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user: User, payload: PasswordChange) -> User:
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Текущий пароль указан неверно",
        )
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Новый пароль должен отличаться от текущего",
        )
    user.hashed_password = hash_password(payload.new_password)
    user.token_version += 1
    db.commit()
    db.refresh(user)
    return user


def delete_account(db: Session, user: User, password: str) -> None:
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пароль указан неверно",
        )
    db.delete(user)
    db.commit()
