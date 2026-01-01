# Despliegue en Vercel con Turso Cloud

## Pasos para configurar:

### 1. Crear base de datos en Turso

```bash
# Instalar Turso CLI
brew install tursodatabase/tap/turso

# Iniciar sesión
turso auth signup

# Crear base de datos
turso db create invex-db --region iad

# Obtener URL de conexión
turso db show invex-db --url
```

### 2. Configurar variables de entorno en Vercel

Ve a https://vercel.com/dashboard > Tu Proyecto > Settings > Environment Variables

Agrega:
- `DATABASE_URL`: URL de Turso (libsql://...)
- `TURSO_AUTH_TOKEN`: Token de autenticación (turso db tokens create invex-db)
- `SECRET_KEY`: Una clave secreta segura
- `CORS_ORIGINS`: Tu dominio de Vercel

### 3. Desplegar

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel --prod
```

### 4. Sincronizar esquema con Turso

```bash
turso db shell invex-db < backend/migrations/schema.sql
```

## Notas importantes:

- Turso usa libSQL, compatible con SQLite
- Para Vercel serverless, usar replication HTTP de Turso
- El seed de datos se ejecuta automáticamente en el primer inicio
