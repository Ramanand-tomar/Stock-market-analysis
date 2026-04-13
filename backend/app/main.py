"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import admin, auth, insights, models, predict, stocks, user
from app.core.database import close_mongo, init_db, init_mongo
from app.models import sql_models  # noqa: F401 — register ORM models with Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — models must be imported before create_all
    await init_db()
    await init_mongo()
    yield
    # Shutdown
    await close_mongo()


app = FastAPI(
    title="NIFTY 50 AI Stock Intelligence API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(stocks.router)
app.include_router(predict.router)
app.include_router(models.router)
app.include_router(user.router)
app.include_router(admin.router)
app.include_router(insights.router)


# ── Custom exception handlers ────────────────────────────────
@app.exception_handler(400)
async def bad_request_handler(request: Request, exc):
    return JSONResponse(status_code=400, content={"detail": str(exc.detail) if hasattr(exc, "detail") else "Bad request"})


@app.exception_handler(401)
async def unauthorized_handler(request: Request, exc):
    return JSONResponse(status_code=401, content={"detail": "Unauthorized"})


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Resource not found"})


@app.exception_handler(503)
async def service_unavailable_handler(request: Request, exc):
    return JSONResponse(status_code=503, content={"detail": "Service temporarily unavailable"})


@app.get("/health")
async def health():
    return {"status": "ok"}
