"""
Script para ejecutar seed en PostgreSQL en Render
Se ejecuta automáticamente al iniciar el servidor
"""
import sys
import os
from sqlalchemy.orm import Session
from datetime import datetime
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal, engine, Base
from app.models import Usuario, Rol, Proveedor, Producto, Inventario
from app.utils.security import get_password_hash
import json

def seed_database():
    """Crear datos iniciales si no existen"""
    db = SessionLocal()
    try:
        # Verificar si hay usuarios
        user_count = db.query(Usuario).count()
        if user_count > 0:
            print(f"Base de datos ya tiene {user_count} usuarios. No se ejecuta seed.")
            return

        print("Base de datos vacía. Ejecutando seed...")

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

        print("✅ Seed completado exitosamente!")

    except Exception as e:
        print(f"❌ Error durante el seed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
