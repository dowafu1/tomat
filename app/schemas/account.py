"""Account-management contracts: profile, password and deletion."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import validate_password


class ProfileUpdate(BaseModel):
    display_name: str = Field(min_length=1, max_length=80)

    @field_validator("display_name")
    @classmethod
    def clean_display_name(cls, value: str) -> str:
        value = " ".join(value.split())
        if not value:
            raise ValueError("Укажите имя")
        return value


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=72)
    new_password: str = Field(min_length=8, max_length=72)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        return validate_password(value)


class AccountDeleteRequest(BaseModel):
    password: str = Field(min_length=1, max_length=72)
