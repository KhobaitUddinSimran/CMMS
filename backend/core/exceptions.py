"""Custom exceptions"""

class CMSSException(Exception):
    pass

class InvalidTokenException(CMSSException):
    pass

class InvalidCredentialsException(CMSSException):
    pass

class UserNotFound(CMSSException):
    pass

class RoleUnauthorized(CMSSException):
    pass
