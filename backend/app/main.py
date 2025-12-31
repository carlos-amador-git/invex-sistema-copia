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
from .models import Usuario, Rol
from .utils.security import get_password_hash
import json
from datetime import datetime

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

def seed_database():
    """Crear datos iniciales si no existen"""
    db = SessionLocal()
    try:
        # Verificar si hay usuarios
        user_count = db.query(Usuario).count()
        if user_count > 0:
            return

        # Crear roles
        roles_data = [
            {
                "nombre": "admin",
                "descripcion": "Admin Inventario",
                "area": "Inventario",
                "color": "#8b5cf6",
                "modulos": json.dumps(["dashboard", "balance", "forecast", "productos", "ordenes", "usuarios", "configuracion"]),
                "permisos": json.dumps({"verTodo": True, "editarTodo": True, "crearOrdenes": True, "gestionarUsuarios": True, "verDashboard": True})
            },
            {
                "nombre": "tsys",
                "descripcion": "Usuario TSYS",
                "area": "Almacén (TSYS)",
                "color": "#3b82f6",
                "modulos": json.dumps(["captura-tsys", "mi-historial", "dashboard-lectura"]),
                "permisos": json.dumps({"editarInventarioTSYS": True, "verDashboard": True})
            },
            {
                "nombre": "distribucion",
                "descripcion": "Distribución",
                "area": "Distribución",
                "color": "#f59e0b",
                "modulos": json.dumps(["captura-distribucion", "mi-historial", "dashboard-lectura"]),
                "permisos": json.dumps({"editarDemandaDistribucion": True, "verDashboard": True})
            },
            {
                "nombre": "modulos",
                "descripcion": "Módulos",
                "area": "Módulos",
                "color": "#10b981",
                "modulos": json.dumps(["captura-modulos", "mi-historial", "dashboard-lectura"]),
                "permisos": json.dumps({"editarDemandaModulos": True, "verDashboard": True})
            },
            {
                "nombre": "consulta",
                "descripcion": "Directivo",
                "area": "Dirección",
                "color": "#64748b",
                "modulos": json.dumps(["dashboard-lectura"]),
                "permisos": json.dumps({"verDashboard": True, "soloLectura": True})
            }
        ]

        for rol_data in roles_data:
            existing = db.query(Rol).filter(Rol.nombre == rol_data["nombre"]).first()
            if not existing:
                db.add(Rol(**rol_data))
        db.commit()

        # Crear usuarios
        usuarios_data = [
            {"username": "admin", "password_hash": get_password_hash("admin123"), "nombre": "Carlos Mendoza", "email": "carlos.mendoza@banco.com", "rol": "admin", "face_registered": False, "activo": True},
            {"username": "tsys_user", "password_hash": get_password_hash("tsys123"), "nombre": "María García", "email": "maria.garcia@banco.com", "rol": "tsys", "face_registered": False, "activo": True},
            {"username": "dist_user", "password_hash": get_password_hash("dist123"), "nombre": "Roberto Sánchez", "email": "roberto.sanchez@banco.com", "rol": "distribucion", "face_registered": False, "activo": True},
            {"username": "mod_user", "password_hash": get_password_hash("mod123"), "nombre": "Ana López", "email": "ana.lopez@banco.com", "rol": "modulos", "face_registered": False, "activo": True},
            {"username": "director", "password_hash": get_password_hash("dir123"), "nombre": "Fernando Ruiz", "email": "fernando.ruiz@banco.com", "rol": "consulta", "face_registered": False, "activo": True}
        ]

        for user_data in usuarios_data:
            existing = db.query(Usuario).filter(Usuario.username == user_data["username"]).first()
            if not existing:
                db.add(Usuario(**user_data))
        db.commit()

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    """Ejecutar seed en startup"""
    seed_database()

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


@app.get("/debug/users")
async def debug_users():
    """Endpoint de debug para verificar usuarios en la BD"""
    db = SessionLocal()
    try:
        users = db.query(Usuario).all()
        user_list = [{"username": u.username, "nombre": u.nombre, "rol": u.rol, "activo": u.activo} for u in users]
        return {"count": len(user_list), "users": user_list}
    finally:
        db.close()
