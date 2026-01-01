# Guía para Resolver Problemas de Deploy en Render

## Problema: Servicio Suspendido

Si tu servicio `invex-backend` está suspendido, significa que excedió el límite gratuito de 750 horas/mes.

### Solución 1: Reactivar Servicio (Recomendado)

1. Ve a tu dashboard en Render: https://render.com
2. Encuentra el servicio `invex-backend`
3. Si ves "Suspended", busca un botón "Unsuspend" o "Reactivate"
4. Si no hay botón, elimina el servicio y crea uno nuevo

### Solución 2: Crear Nuevo Backend

1. En Render, haz clic en **New** → **Web Service**
2. Conecta tu repo: `carlos-amador-git/invex-sistema`
3. Configuración:
   - **Name**: `invex-backend-v2`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3.11
4. Variables de entorno:
   - `CORS_ORIGINS` = `https://invex-sistema.onrender.com`
   - `SECRET_KEY` = genera uno aleatorio (opcional)
   - `DATABASE_URL` = conecta a tu base de datos existente `invex-db`
5. **Create Web Service**

### Solución 3: Usar Servicios Gratuitos Alternativos

Si Render continúa suspendiendo, puedes usar:

#### Railway (Recomendado como alternativa)
1. Ve a [railway.app](https://railway.app)
2. Conecta tu repo GitHub
3. Deploy automático
4. Base de datos PostgreSQL gratuita incluida

#### Heroku
1. Ve a [heroku.com](https://heroku.com)
2. Create new app
3. Deploy desde GitHub
4. PostgreSQL add-on gratuito (hasta 10,000 filas)

### Verificación

Una vez reactivado o creado nuevo backend:

1. **Verificar backend:**
   ```
   https://tu-backend-url.onrender.com/public/health
   ```
   Debería mostrar: `{"status": "healthy", "service": "invex-backend"}`

2. **Verificar CORS:**
   ```
   https://tu-backend-url.onrender.com/public/config
   ```
   Debería mostrar los orígenes CORS configurados

3. **Acceder al frontend:**
   ```
   https://invex-sistema.onrender.com
   ```

### Actualizar URL del Frontend

Si creas un nuevo backend con URL diferente, actualiza la variable en el frontend:

En Render → `invex-frontend` → **Environment**:
```
REACT_APP_API_URL = https://tu-nueva-backend-url.onrender.com
```

¿Necesitas ayuda creando el nuevo servicio en Render o prefieres usar Railway? 🚀