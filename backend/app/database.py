from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

_engine = None
_SessionLocal = None
_Base = None

def get_engine():
    global _engine
    if _engine is None:
        from .config import get_settings
        settings = get_settings()
        database_url = settings.DATABASE_URL
        
        if database_url.startswith("postgresql://"):
            _engine = create_engine(
                database_url,
                pool_size=5,
                max_overflow=10,
                pool_pre_ping=True,
                pool_recycle=300
            )
        else:
            _engine = create_engine(
                database_url or "sqlite:///./invex.db",
                connect_args={"check_same_thread": False}
            )
    return _engine

def get_session_local():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal

def get_base():
    global _Base
    if _Base is None:
        _Base = declarative_base()
    return _Base

def get_db():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
