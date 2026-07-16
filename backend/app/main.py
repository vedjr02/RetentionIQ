from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.routers import channels, cohorts, features, funnel, meta, overview

app = FastAPI(
    title="RetentionIQ API",
    description="Product analytics API for funnel, cohort, and feature adoption analysis.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(overview.router)
app.include_router(funnel.router)
app.include_router(cohorts.router)
app.include_router(features.router)
app.include_router(channels.router)
app.include_router(meta.router)


class HealthResponse(BaseModel):
    status: str
    database: str


@app.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    try:
        db.execute(text("SELECT 1"))
        database_status = "connected"
        status = "ok"
    except Exception:
        database_status = "disconnected"
        status = "degraded"

    return HealthResponse(status=status, database=database_status)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "RetentionIQ API", "docs": "/docs"}
