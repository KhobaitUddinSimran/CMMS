"""Custom decorators"""
from functools import wraps

def require_role(*roles):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # TODO: Check user role
            return await func(*args, **kwargs)
        return wrapper
    return decorator
