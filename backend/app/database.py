from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import get_settings

settings = get_settings()

try:
    # Corregir URL de base de datos para SQLAlchemy (postgres:// -> postgresql://)
    database_url = settings.DATABASE_URL
    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    # Determinar si es PostgreSQL o SQLite
    is_postgres = database_url and database_url.startswith("postgresql://")

    # Crear engine con configuración apropiada
    if is_postgres:
        engine = create_engine(database_url)
    else:
        # Fallback a SQLite local si no hay URL válida o es sqlite
        if not database_url:
            database_url = "sqlite:///./invex_fallback.db"
            
        engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False}
        )
    
    print(f"✓ Database engine created successfully: {database_url.split('@')[-1] if '@' in database_url else database_url}")

except Exception as e:
    print(f"❌ Error creating database engine: {e}")
    # Fallback de emergencia a SQLite en memoria para evitar crash al inicio
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False}
    )

# Crear sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()


def get_db():
    """Dependency para obtener sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
