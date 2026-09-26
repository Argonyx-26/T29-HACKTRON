from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.seed.seed_data import init_db, seed_database
from app.api import chapters, subjects, assessments, twin, interventions, documents, teacher, admin, groups, revision

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB & Seed Data automatically on boot
    print(f"Starting {settings.APP_NAME} (Team: {settings.TEAM_NAME})...")
    init_db()
    seed_database()
    yield
    print("Shutting down Knowledge Twin backend...")

app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description="Intelligent diagnostic learning layer powered by deterministic misconception analysis and LLM escalation fallback.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    )

# Mount Routers under /api
app.include_router(subjects.router, prefix="/api")
app.include_router(chapters.router, prefix="/api")
app.include_router(assessments.router, prefix="/api")
app.include_router(assessments.reports_router, prefix="/api")
app.include_router(twin.router, prefix="/api")
app.include_router(interventions.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(teacher.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(groups.router, prefix="/api")
app.include_router(revision.router, prefix="/api")

@app.get("/")
def root():
    return {
        "product": settings.APP_NAME,
        "team": settings.TEAM_NAME,
        "tagline": "We solve learning gaps for students using an AI-powered living model of what they know.",
        "status": "operational",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "sqlite_connected"
    }
