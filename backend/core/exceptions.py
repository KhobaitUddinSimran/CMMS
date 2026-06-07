"""Custom exceptions"""
from fastapi import status as http_status


class CMSSException(Exception):
    """Base exception with an optional HTTP status code."""
    status_code: int = http_status.HTTP_400_BAD_REQUEST

    def __init__(self, message: str = "An error occurred", status_code: int | None = None):
        super().__init__(message)
        if status_code is not None:
            self.status_code = status_code


class InvalidTokenException(CMSSException):
    status_code: int = http_status.HTTP_401_UNAUTHORIZED


class InvalidCredentialsException(CMSSException):
    status_code: int = http_status.HTTP_401_UNAUTHORIZED


class UserNotFound(CMSSException):
    status_code: int = http_status.HTTP_404_NOT_FOUND


class RoleUnauthorized(CMSSException):
    status_code: int = http_status.HTTP_403_FORBIDDEN
