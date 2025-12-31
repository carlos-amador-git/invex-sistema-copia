from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import engine, Base, SessionLocal
from .routers import (
    auth_router,
    usuarios_router,
    productos_router,
    proveedores_router,
    inventario_router,
    capturas_router,
    ordenes_router,
    roles_router,
    snapshots_router,
    materiales_router,
    procesos_bau_router,
    inventario_historial_router
)
from .models import Usuario

settings = get_settings()

# Crear tablas
Base.metadata.create_all(bind=engine)

# Crear aplicación FastAPI
app = FastAPI(
    title="INVEX API",
    description="API REST para el Sistema de Control de Inventario de Tarjetas Bancarias",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
async def startup_event():
    """Ejecutar seed en startup si no hay usuarios"""
    db = SessionLocal()
    try:
        user_count = db.query(Usuario).count()
        if user_count == 0:
            import os
            import sys
            sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
            from migrations.seed_data import main as seed_main
            seed_main()
    finally:
        db.close()

# Configurar CORS
origins = settings.CORS_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth_router, prefix="/api")
app.include_router(usuarios_router, prefix="/api")
app.include_router(productos_router, prefix="/api")
app.include_router(proveedores_router, prefix="/api")
app.include_router(inventario_router, prefix="/api")
app.include_router(capturas_router, prefix="/api")
app.include_router(ordenes_router, prefix="/api")
app.include_router(roles_router, prefix="/api")
app.include_router(snapshots_router, prefix="/api")
app.include_router(materiales_router, prefix="/api")
app.include_router(procesos_bau_router, prefix="/api")
app.include_router(inventario_historial_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "INVEX API - Sistema de Control de Inventario",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
