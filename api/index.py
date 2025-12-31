import os
import sys
from pathlib import Path

# Agregar backend al path
current_dir = Path(__file__).parent
backend_dir = current_dir.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app

# Vercel handler - required for deployment
app_handler = app
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))

