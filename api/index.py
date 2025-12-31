import os
import sys
from pathlib import Path

# Agregar backend al path
current_dir = Path(__file__).parent
backend_dir = current_dir.parent / "backend"
sys.path.insert(0, str(backend_dir))

# Importar aplicación FastAPI
from app.main import app

# Handler para Vercel - ASGI application
# Vercel espera un handler que sea callable
handler = app
