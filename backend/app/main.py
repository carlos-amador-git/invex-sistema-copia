from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .config import get_settings
from .database import get_session_local, get_base
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
Base = get_base()
SessionLocal = get_session_local()

# Crear aplicación FastAPI
app = FastAPI(
    title="INVEX API",
    description="API REST para el Sistema de Control de Inventario de Tarjetas Bancarias",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware manual para asegurar CORS incluso en errores
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        origin = request.headers.get("origin")
        if origin and ("onrender.com" in origin or "localhost" in origin or "127.0.0.1" in origin or "vercel.app" in origin or "vercel.dev" in origin):
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*",
                }
            )

    try:
        response = await call_next(request)
    except Exception as e:
        print(f"Error no manejado en request: {e}")
        import traceback
        traceback.print_exc()
        response = JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "error": str(e)}
        )
    
    origin = request.headers.get("origin")
    if origin:
        if "onrender.com" in origin or "localhost" in origin or "127.0.0.1" in origin or "vercel.app" in origin or "vercel.dev" in origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
            
    return response

@app.on_event("startup")
async def startup_event():
    print(f"Iniciando aplicación en {settings.VERCEL_ENV or 'local'} mode")
    # No ejecutar seed en producción - los datos ya están en Neon

def seed_database():
    """Crear datos iniciales si no existen"""
    from .models import Proveedor, Producto, Inventario
    from datetime import date

    db = SessionLocal()
    try:
        # Verificar si hay usuarios
        user_count = db.query(Usuario).count()
        if user_count > 0:
            return

        print("Base de datos vacía. Ejecutando seed completo...")

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
        print("✓ Roles creados")

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
        print("✓ Usuarios creados")

        # Crear proveedores
        proveedores_data = [
            {"nombre": "Thales", "tiempo_entrega": 8, "contacto": "ventas@thales.com"},
            {"nombre": "MyCard", "tiempo_entrega": 6, "contacto": "ventas@mycard.com"},
            {"nombre": "TGS", "tiempo_entrega": 10, "contacto": "ventas@tgs.com"}
        ]

        for prov_data in proveedores_data:
            existing = db.query(Proveedor).filter(Proveedor.nombre == prov_data["nombre"]).first()
            if not existing:
                db.add(Proveedor(**prov_data))
        db.commit()
        print("✓ Proveedores creados")

        # Crear productos
        thales = db.query(Proveedor).filter(Proveedor.nombre == "Thales").first()
        mycard = db.query(Proveedor).filter(Proveedor.nombre == "MyCard").first()
        tgs = db.query(Proveedor).filter(Proveedor.nombre == "TGS").first()

        productos_data = [
            {"id": "J14885C", "nombre": "MCI INMEDIATA VOYAGE PLATINUM DUAL INT", "proveedor_id": thales.id, "costo_unitario": 2.17, "marca": "Mastercard", "tipo": "Crédito"},
            {"id": "J14886C", "nombre": "MCI NORMAL VOYAGE GOLD DUAL INTERFACE", "proveedor_id": thales.id, "costo_unitario": 2.17, "marca": "Mastercard", "tipo": "Crédito"},
            {"id": "J14887C", "nombre": "MCI NORMAL VOYAGE PLATINUM DUAL INTERF", "proveedor_id": thales.id, "costo_unitario": 2.17, "marca": "Mastercard", "tipo": "Crédito"},
            {"id": "J14901I", "nombre": "MCI INMEDIATO HEJCARD (IKEA) DUAL INTE", "proveedor_id": mycard.id, "costo_unitario": 1.43, "marca": "Mastercard", "tipo": "Crédito"},
            {"id": "J14902I", "nombre": "MCI SINGLE PANEL HEJCARD (IKEA) DUAL I", "proveedor_id": mycard.id, "costo_unitario": 1.43, "marca": "Mastercard", "tipo": "Crédito"},
            {"id": "J14910C", "nombre": "MCI AMAZON TDD DUAL INTERFACE", "proveedor_id": mycard.id, "costo_unitario": 1.50, "marca": "Mastercard", "tipo": "Débito"},
            {"id": "J14941C", "nombre": "MCI NORMAL VOLARIS 1 DUAL INTERFACE", "proveedor_id": thales.id, "costo_unitario": 10.50, "marca": "Mastercard", "tipo": "Crédito"},
            {"id": "J14942C", "nombre": "MCI NML VOL 2 DUAL INTERFACE", "proveedor_id": thales.id, "costo_unitario": 10.50, "marca": "Mastercard", "tipo": "Crédito"},
            {"id": "J14943C", "nombre": "MCI NORMAL VOL 0 DUAL INTERFACE", "proveedor_id": thales.id, "costo_unitario": 10.50, "marca": "Mastercard", "tipo": "Crédito"},
            {"id": "J14967C", "nombre": "Volaris 1", "proveedor_id": thales.id, "costo_unitario": 10.50, "marca": "Mastercard", "tipo": "Crédito"},
            {"id": "J14968C", "nombre": "Volaris 0", "proveedor_id": thales.id, "costo_unitario": 10.50, "marca": "Mastercard", "tipo": "Crédito"},
            {"id": "J14969C", "nombre": "Volaris 2", "proveedor_id": thales.id, "costo_unitario": 10.50, "marca": "Mastercard", "tipo": "Crédito"},
            {"id": "J14984H", "nombre": "VSI NML CIBANCO DUAL INTERFACE", "proveedor_id": tgs.id, "costo_unitario": 1.80, "marca": "Visa", "tipo": "Crédito"},
            {"id": "J14986", "nombre": "MCI BC SERIGRAFÍA EN MB PRODUC DUAL IN", "proveedor_id": mycard.id, "costo_unitario": 1.20, "marca": "Mastercard", "tipo": "Débito"},
            {"id": "J14987", "nombre": "MCI BC SERIGRAFÍA EN MB DESARROLLO DUA", "proveedor_id": mycard.id, "costo_unitario": 1.20, "marca": "Mastercard", "tipo": "Débito"},
            {"id": "J15033I", "nombre": "MCI NORMAL WALMART DUAL INTERFACE", "proveedor_id": mycard.id, "costo_unitario": 1.35, "marca": "Mastercard", "tipo": "Crédito"},
            {"id": "J15034I", "nombre": "MCI NORMAL SAMS CLUB DUAL INTERFACE", "proveedor_id": mycard.id, "costo_unitario": 1.35, "marca": "Mastercard", "tipo": "Crédito"},
        ]

        for prod_data in productos_data:
            existing = db.query(Producto).filter(Producto.id == prod_data["id"]).first()
            if not existing:
                db.add(Producto(**prod_data))
        db.commit()
        print("✓ Productos creados")

        # Crear inventario
        inventarios_data = [
            {"producto_id": "J14885C", "boveda_trabajo": 98, "boveda_principal": 0},
            {"producto_id": "J14886C", "boveda_trabajo": 416, "boveda_principal": 2500},
            {"producto_id": "J14887C", "boveda_trabajo": 109, "boveda_principal": 3500},
            {"producto_id": "J14901I", "boveda_trabajo": 118, "boveda_principal": 1500},
            {"producto_id": "J14902I", "boveda_trabajo": 0, "boveda_principal": 0},
            {"producto_id": "J14910C", "boveda_trabajo": 462, "boveda_principal": 3500},
            {"producto_id": "J14941C", "boveda_trabajo": 272, "boveda_principal": 0},
            {"producto_id": "J14942C", "boveda_trabajo": 280, "boveda_principal": 0},
            {"producto_id": "J14943C", "boveda_trabajo": 268, "boveda_principal": 0},
            {"producto_id": "J14967C", "boveda_trabajo": 2862, "boveda_principal": 18000, "dist_colocacion": 2800, "dist_normal": 900, "mod_colocacion": 2200},
            {"producto_id": "J14968C", "boveda_trabajo": 607, "boveda_principal": 41000, "dist_colocacion": 3500, "dist_normal": 1200, "mod_colocacion": 2800},
            {"producto_id": "J14969C", "boveda_trabajo": 850, "boveda_principal": 21500, "dist_colocacion": 4000, "dist_normal": 1500, "mod_colocacion": 3200},
            {"producto_id": "J14984H", "boveda_trabajo": 424, "boveda_principal": 500},
            {"producto_id": "J14986", "boveda_trabajo": 9, "boveda_principal": 0},
            {"producto_id": "J14987", "boveda_trabajo": 10, "boveda_principal": 0},
            {"producto_id": "J15033I", "boveda_trabajo": 36, "boveda_principal": 1500},
            {"producto_id": "J15034I", "boveda_trabajo": 492, "boveda_principal": 28500},
        ]

        for inv_data in inventarios_data:
            existing = db.query(Inventario).filter(Inventario.producto_id == inv_data["producto_id"]).first()
            if not existing:
                db.add(Inventario(**inv_data))
        db.commit()
        print("✓ Inventario creado")

        print("✅ Seed completado exitosamente!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

# Configurar CORS - debe estar ANTES de los routers
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
print(f"CORS Origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes temporalmente
    allow_origin_regex=None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware manual para CORS
@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    if origin:
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
    return await call_next(request)

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
        "docs": "/docs",
        "status": "running"
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

@app.get("/debug/cors")
async def debug_cors():
    """Endpoint de debug para verificar configuración CORS"""
    origins = settings.CORS_ORIGINS.split(",")
    return {
        "cors_origins_env": settings.CORS_ORIGINS,
        "cors_origins_parsed": origins,
        "backend_url": settings.DATABASE_URL
    }

@app.get("/public/config")
async def public_config():
    """Endpoint público para verificar configuración sin CORS"""
    return {
        "cors_origins": settings.CORS_ORIGINS,
        "message": "If you see this, the backend is working!",
        "status": "active"
    }

@app.get("/public/health")
async def public_health():
    """Endpoint público de health check sin CORS"""
    return {"status": "healthy", "service": "invex-backend"}
