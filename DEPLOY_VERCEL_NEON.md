# Despliegue en Vercel con Neon PostgreSQL

## Pasos para configurar:

### 1. Crear base de datos en Neon (si no tienes una)

1. Ve a https://console.neon.tech
2. Crea un nuevo proyecto
3. Copia la cadena de conexión (connection string)

### 2. Configurar variables de entorno en Vercel

Ve a https://vercel.com/dashboard > Tu Proyecto > Settings > Environment Variables

Agrega:
- `DATABASE_URL`: Tu URL de Neon (postgresql://...)
- `SECRET_KEY`: Una clave secreta segura (genera una aleatoria)
- `CORS_ORIGINS`: Tu dominio de Vercel (ej: https://invex.vercel.app)
- `BCRYPT_ROUNDS`: 12 (o menor si hay problemas de rendimiento)

### 3. Configurar Neon para Serverless

En la consola de Neon, ve a **Settings > Connection Pooling**:
- Habilita el **Pooler** (recomendado para serverless)
- Usa el endpoint del pooler en lugar del directo

Ejemplo de URL con pooler:
```
postgresql://user:pass@ep-xxx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 4. Desplegar

```bash
# Instalar Vercel CLI si no la tienes
npm i -g vercel

# Desplegar a producción
vercel --prod
```

### 5. Crear tablas en Neon

```bash
# Conectarte a Neon y ejecutar el schema
psql "postgresql://neondb_owner:TU_PASS@ep-hidden-glitter-adojmeql-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f backend/migrations/schema.sql
```

O desde la consola de Neon:
1. Ve a **SQL Editor** en https://console.neon.tech
2. Copia y ejecuta el contenido de `backend/migrations/schema.sql`

## Notas importantes:

- Neon tiene un **pool de conexiones integrado** que debes usar en Vercel
- El plan gratuito incluye 10GB de almacenamiento y 100 horas de compute/month
- Para serverless, usa SIEMPRE el endpoint del pooler
- Ajusta `BCRYPT_ROUNDS` según el rendimiento (menor = más rápido)

## Solución de problemas:

### Error de conexión:
- Verifica que el pooler esté habilitado en Neon
- Asegúrate de usar `sslmode=require`

### Timeout en conexiones:
- Neon cierra conexiones inactivas; usa el pooler
- Ajusta el timeout de conexión en `config.py`
