"""
API v1 – User endpoints (register, login, profile CRUD, type verification).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, decode_access_token, verify_password
from app.crud.user import create_user, delete_user, get_user_by_email, get_user_by_id, update_user
from app.db.database import get_db
from app.schemas.user import Token, UserCreate, UserResponse, UserUpdate, VerifyTypeRequest

router = APIRouter(prefix="/api/v1/users", tags=["users"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/login")


# ---------------------------------------------------------------------------
# Dependency – current authenticated user
# ---------------------------------------------------------------------------
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Decode JWT and return the corresponding User, or 401."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: int | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = await get_user_by_id(db, int(user_id))
    if user is None:
        raise credentials_exception
    return user


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user account with optional user_type and proof_url."""
    existing = await get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = await create_user(db, user_in)
    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Authenticate via OAuth2 form (username=email) and return a JWT access token.

    The JWT payload includes the user's `type` (standard, etudiant, mineur, chomeur)
    for downstream microservices to apply pricing rules.
    """
    user = await get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Include user type in JWT claims for cinema pricing microservices
    access_token = create_access_token(data={
        "sub": str(user.id),
        "type": user.user_type.value if hasattr(user.user_type, 'value') else user.user_type,
    })
    return Token(access_token=access_token)


# ---------------------------------------------------------------------------
# Protected endpoints
# ---------------------------------------------------------------------------
@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    """Return the profile of the authenticated user (includes user_type & proof_url)."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_in: UserUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the authenticated user's profile (name, email, user_type, proof_url)."""
    if user_in.email:
        existing = await get_user_by_email(db, user_in.email)
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )
    updated = await update_user(db, current_user, user_in)
    return updated


@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_me(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete the authenticated user's account."""
    await delete_user(db, current_user)
    return {"detail": "User deleted successfully"}


# ---------------------------------------------------------------------------
# Type verification (MVP – stores proof URL for manual review)
# ---------------------------------------------------------------------------
@router.post("/verify-type", response_model=UserResponse)
async def verify_type(
    request: VerifyTypeRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit proof to change user type (étudiant, mineur, chômeur).

    MVP: stores the proof URL and updates user_type immediately.
    Future: integrate with proof verification workflow.
    """
    current_user.user_type = request.user_type
    current_user.proof_url = request.proof_url
    await db.flush()
    await db.refresh(current_user)
    return current_user
