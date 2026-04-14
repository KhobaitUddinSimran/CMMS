"""Request/response logging"""
import logging

logger = logging.getLogger(__name__)

async def log_request(request):
    logger.info(f"{request.method} {request.url}")
