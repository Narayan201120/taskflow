"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import auth, dashboard, projects, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup / shutdown logic."""
    # Startup: create tables if they don't exist
    await init_db()
    yield
    # Shutdown: nothing to clean up


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="A collaborative team task manager with role-based access control.",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)


# ── Health check ─────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}
