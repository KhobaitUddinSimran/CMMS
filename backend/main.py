"""FastAPI Application Entry Point"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from backend.routers import auth
from backend.routers import health
from backend.routers import user

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting CMMS application...")
    yield
    logger.info("⏹️  Shutting down...")

def create_app() -> FastAPI:
    app = FastAPI(
        title="CMMS",
        description="Carry Mark Management System API",
        version="1.0.0",
        lifespan=lifespan
    )
    
    # Rate limiter from auth module
    app.state.limiter = auth.limiter
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost", "http://localhost:3001"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(auth.router)
    app.include_router(user.router)
    
    # Custom exception handler for rate limit errors
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many login attempts. Please try again in 15 minutes."},
        )
    
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "healthy", "version": "1.0.0"}
    
    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
