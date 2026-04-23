"""FastAPI Application Entry Point"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from .routers import auth, health, user, admin, courses, assessments, enrollments, marks, otp
from .core.config import settings

# Configure logging with more detailed format
logging_format = '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
logging.basicConfig(
    level=logging.INFO,
    format=logging_format,
    datefmt='%Y-%m-%d %H:%M:%S'
)
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
    
    # Parse CORS origins from environment
    if settings.ENVIRONMENT == "development":
        cors_origins = ["*"]
    else:
        cors_origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["http://localhost:3000"]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True if settings.ENVIRONMENT != "development" else False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(auth.router)
    app.include_router(user.router)
    app.include_router(otp.router)
    app.include_router(courses.router)
    app.include_router(assessments.router)
    app.include_router(enrollments.router)
    app.include_router(marks.router)
    app.include_router(admin.router)
    
    # Custom exception handler for rate limit errors
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many login attempts. Please try again in 15 minutes."},
        )
    
    # Global exception handler for detailed error logging
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {type(exc).__name__}: {str(exc)}", exc_info=True)
        
        if settings.ENVIRONMENT == "development":
            # Include full error details in development
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "error": str(exc),
                    "type": type(exc).__name__,
                    "path": str(request.url),
                    "method": request.method,
                },
            )
        else:
            # Generic error in production
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"},
            )
    
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "healthy", "version": "1.0.0"}
    
    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
