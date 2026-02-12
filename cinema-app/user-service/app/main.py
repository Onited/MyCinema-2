from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.api.v1.endpoints.users import router as users_router
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.database import Base, engine, async_session
from app.models.user import User, UserType
from app.schemas.user import HealthResponse


# ---------------------------------------------------------------------------
# Lifespan – create tables on startup (dev convenience)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables if they don't exist yet, seed admin account."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed admin account if it doesn't exist
    async with async_session() as session:
        result = await session.execute(
            select(User).where(User.email == "admin@mycinema.fr")
        )
        if not result.scalar_one_or_none():
            admin = User(
                email="admin@mycinema.fr",
                hashed_password=get_password_hash("Admin123!"),
                full_name="Administrateur",
                user_type=UserType.ADMIN.value,
                is_active=True,
            )
            session.add(admin)
            await session.commit()

    yield


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    description="Microservice de gestion des comptes utilisateurs pour l'application cinéma MyCinema.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS – allow all origins in dev (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(users_router)


# ---------------------------------------------------------------------------
# Health check (Kubernetes readiness / liveness)
# ---------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    """Simple health-check endpoint."""
    return HealthResponse()
