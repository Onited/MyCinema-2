"""
Pydantic schemas for User requests / responses.
"""

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict, field_validator, Field

from app.models.user import UserType


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------
class UserCreate(BaseModel):
    """Payload for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    user_type: UserType = UserType.STANDARD
    proof_url: Optional[str] = Field(default=None, max_length=512)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Enforce minimum password complexity."""
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v

    @field_validator("full_name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        """Strip whitespace and reject suspicious patterns."""
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("proof_url")
    @classmethod
    def validate_proof_url(cls, v: str | None) -> str | None:
        """Basic URL validation for proof documents."""
        if v is not None:
            v = v.strip()
            if v and not v.startswith(("http://", "https://")):
                raise ValueError("proof_url must be a valid HTTP(S) URL")
        return v or None


class UserLogin(BaseModel):
    """Payload for login."""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Payload for profile update (partial)."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    user_type: Optional[UserType] = None
    proof_url: Optional[str] = Field(default=None, max_length=512)

    @field_validator("full_name")
    @classmethod
    def sanitize_update_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Name cannot be empty")
        return v

    @field_validator("proof_url")
    @classmethod
    def validate_update_proof_url(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if v and not v.startswith(("http://", "https://")):
                raise ValueError("proof_url must be a valid HTTP(S) URL")
        return v or None


class VerifyTypeRequest(BaseModel):
    """Payload to submit proof for user type verification."""
    user_type: UserType
    proof_url: str = Field(..., min_length=1, max_length=512)

    @field_validator("proof_url")
    @classmethod
    def validate_proof(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("proof_url must be a valid HTTP(S) URL")
        return v


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------
class UserResponse(BaseModel):
    """Public user representation (no password)."""
    id: int
    email: str
    full_name: str
    is_active: bool
    user_type: UserType
    proof_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


class HealthResponse(BaseModel):
    """Health-check response."""
    status: str = "ok"
