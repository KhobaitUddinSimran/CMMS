"""CORS middleware configuration"""
from fastapi.middleware.cors import CORSMiddleware
from ..core.config import settings

def setup_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
