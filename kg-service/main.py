"""FastAPI application for the Education Knowledge Graph service."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.generate import router as generate_router
from api.standards import router as standards_router
from api.progress import router as progress_router
from api.graph_export import router as graph_export_router
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: verify that the Kuzu database directory exists."""
    if not settings.kuzu_db_path.exists():
        print(
            f"WARNING: Kuzu database not found at {settings.kuzu_db_path}. "
            "Run `python -m ingest.rebuild` to create it."
        )
    yield


app = FastAPI(
    title="Edu-App Knowledge Graph Service",
    description=(
        "Manages an embedded Kuzu graph database of educational standards, "
        "philosophy principles, activity types, and developmental milestones. "
        "Provides lesson generation and standards query endpoints."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3456,http://localhost:3000,http://localhost:3001").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate_router, tags=["Lesson Generation"])
app.include_router(standards_router, tags=["Standards"])
app.include_router(progress_router, tags=["Progress"])
app.include_router(graph_export_router, tags=["Graph Export"])


@app.get("/health")
async def health():
    db_exists = settings.kuzu_db_path.exists()
    return {
        "status": "ok" if db_exists else "degraded",
        "database_initialized": db_exists,
        "database_path": str(settings.kuzu_db_path),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
