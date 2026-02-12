"""
SQLAlchemy ORM model – User table + UserType enum.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class UserType(str, enum.Enum):
    """Types d'utilisateur pour la tarification cinéma."""
    STANDARD = "standard"
    ETUDIANT = "etudiant"
    MINEUR = "mineur"      # -16 ans
    CHOMEUR = "chomeur"
    ADMIN = "admin"


class User(Base):
    """User account for the cinema application."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # User type for cinema pricing (stored as plain string, validated by Pydantic)
    user_type: Mapped[str] = mapped_column(
        String(20), default=UserType.STANDARD.value, server_default="standard", nullable=False,
    )
    proof_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
