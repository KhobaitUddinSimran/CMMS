"""Pytest configuration and fixtures"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(bind=engine)
    yield TestingSessionLocal()

@pytest.fixture
def client():
    from ..main import app
    from fastapi.testclient import TestClient
    return TestClient(app)
