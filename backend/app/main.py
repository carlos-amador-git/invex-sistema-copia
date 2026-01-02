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
from .models import Usuario, Rol, Proveedor, Producto, Inventario, Forecast, HistorialCaptura, OrdenCompra, InventarioMaterial, RelacionProductoMaterial, ProcesoBAU, Presupuesto
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
    # Ejecutar seed siempre (verifica si ya existen datos internamente)
    try:
        seed_database()
    except Exception as e:
        print(f"Error seeding database: {e}")

def seed_database():
    """Crear datos iniciales si no existen"""
    from .models import Proveedor, Producto, Inventario, Usuario, Rol, OrdenCompra, ProcesoBAU, Presupuesto
    import os
    import json
    from datetime import datetime, date

    db = SessionLocal()
    try:
        print("Iniciando seed de base de datos...")
        
        # Cargar datos del archivo JSON
        seed_file_path = os.path.join(os.path.dirname(__file__), "seed_data.json")
        if not os.path.exists(seed_file_path):
            print(f"Advertencia: No se encontró {seed_file_path}. Se omitirá el seed masivo.")
            return

        with open(seed_file_path, "r") as f:
            seed_data = json.load(f)

        print(f"Cargando datos desde {seed_file_path}...")

        # Helper para convertir fechas
        def parse_date(date_str):
            if not date_str: return None
            try:
                if "T" in date_str:
                    return datetime.fromisoformat(date_str).date()
                return datetime.strptime(date_str, "%Y-%m-%d").date()
            except:
                return None

        def parse_datetime(dt_str):
            if not dt_str: return None
            try:
                return datetime.fromisoformat(dt_str)
            except:
                try:
                    return datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
                except:
                    return None

        # 1. Roles
        if "roles" in seed_data:
            for item in seed_data["roles"]:
                existing = db.query(Rol).filter(Rol.nombre == item["nombre"]).first()
                if not existing:
                    # Limpiar campos extra si es necesario
                    data = item.copy()
                    if "id" in data: del data["id"] # Dejar que la BD asigne ID para evitar conflictos de secuencia, o buscar por nombre
                    if "created_at" in data: del data["created_at"]
                    db.add(Rol(**data))
            db.commit()
            print("✓ Roles verificados/creados")

        # 2. Usuarios
        if "usuarios" in seed_data:
            for item in seed_data["usuarios"]:
                existing = db.query(Usuario).filter(Usuario.username == item["username"]).first()
                if not existing:
                    data = item.copy()
                    if "id" in data: del data["id"]
                    if "created_at" in data: del data["created_at"]
                    if "updated_at" in data: del data["updated_at"]
                    if "ultimo_acceso" in data: del data["ultimo_acceso"]
                    db.add(Usuario(**data))
            db.commit()
            print("✓ Usuarios verificados/creados")

        # 3. Proveedores
        if "proveedores" in seed_data:
            for item in seed_data["proveedores"]:
                existing = db.query(Proveedor).filter(Proveedor.nombre == item["nombre"]).first()
                if not existing:
                    data = item.copy()
                    # Mantener ID si es posible para mantener relaciones, pero si ya existen otros con esos IDs...
                    # Mejor buscar por nombre y actualizar mapeo si fuera necesario, pero asumimos DB limpia o consistente.
                    # Si usamos IDs explícitos en SQLite/Postgres puede haber problemas con secuencias.
                    # Dado que OrdenCompra usa proveedor_id (Integer), necesitamos que coincidan.
                    # Intentaremos insertar con ID si no existe conflicto.
                    if "created_at" in data: del data["created_at"]
                    
                    # Verificar si existe ID
                    existing_id = db.query(Proveedor).filter(Proveedor.id == item["id"]).first()
                    if not existing_id:
                        db.add(Proveedor(**data))
                    else:
                        # Si existe el ID pero con otro nombre? Raro.
                        pass
            db.commit()
            print("✓ Proveedores verificados/creados")

        # 4. Productos
        if "productos" in seed_data:
            for item in seed_data["productos"]:
                existing = db.query(Producto).filter(Producto.id == item["id"]).first()
                if not existing:
                    data = item.copy()
                    if "created_at" in data: del data["created_at"]
                    if "updated_at" in data: del data["updated_at"]
                    db.add(Producto(**data))
            db.commit()
            print("✓ Productos verificados/creados")

        # 5. Presupuestos
        if "presupuestos" in seed_data:
            for item in seed_data["presupuestos"]:
                existing = db.query(Presupuesto).filter(Presupuesto.codigo == item["codigo"]).first()
                if not existing:
                    data = item.copy()
                    if "id" in data: del data["id"]
                    if "created_at" in data: del data["created_at"]
                    db.add(Presupuesto(**data))
            db.commit()
            print("✓ Presupuestos verificados/creados")

        # 6. Inventario
        if "inventario" in seed_data:
            for item in seed_data["inventario"]:
                existing = db.query(Inventario).filter(Inventario.producto_id == item["producto_id"]).first()
                if not existing:
                    data = item.copy()
                    if "id" in data: del data["id"]
                    if "created_at" in data: del data["created_at"]
                    if "updated_at" in data: del data["updated_at"]
                    # Fechas
                    if "fecha_ultimo_movimiento" in data: 
                        data["fecha_ultimo_movimiento"] = parse_datetime(data["fecha_ultimo_movimiento"])
                    db.add(Inventario(**data))
            db.commit()
            print("✓ Inventario verificado/creado")

        # 7. Procesos BAU
        if "procesos_bau" in seed_data:
            for item in seed_data["procesos_bau"]:
                existing = db.query(ProcesoBAU).filter_by(
                    producto_id=item["producto_id"], 
                    tipo_proceso=item["tipo_proceso"], 
                    mes=item["mes"], 
                    anio=item["anio"]
                ).first()
                if not existing:
                    data = item.copy()
                    if "id" in data: del data["id"]
                    if "created_at" in data: del data["created_at"]
                    db.add(ProcesoBAU(**data))
            db.commit()
            print("✓ Procesos BAU verificados/creados")

        # 8. Ordenes de Compra
        if "ordenes_compra" in seed_data:
            for item in seed_data["ordenes_compra"]:
                existing = db.query(OrdenCompra).filter(OrdenCompra.id == item["id"]).first()
                if not existing:
                    data = item.copy()
                    # Fechas
                    if "fecha_orden" in data: data["fecha_orden"] = parse_date(data["fecha_orden"])
                    if "fecha_entrega" in data: data["fecha_entrega"] = parse_date(data["fecha_entrega"])
                    if "created_at" in data: del data["created_at"]
                    if "updated_at" in data: del data["updated_at"]
                    
                    db.add(OrdenCompra(**data))
            db.commit()
            print("✓ Ordenes de Compra verificadas/creadas")

        print("✅ Seed completado exitosamente con datos reales!")

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


@app.get("/debug/hash/{password}")
async def debug_hash(password: str):
    """Endpoint temporal para generar hash de contraseña"""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hash_value = pwd_context.hash(password)
    return {"password": password, "hash": hash_value}

@app.get("/public/health")
async def public_health():
    """Endpoint público de health check sin CORS"""
    return {"status": "healthy", "service": "invex-backend"}
