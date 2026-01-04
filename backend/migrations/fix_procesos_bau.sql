-- Migración para INVEX Sistema - Corregir tablas procesos_bau y presupuestos
-- Ejecutar en Neon PostgreSQL
-- ===========================================
-- 1. CREAR TABLA presupuestos (catálogo)
-- ===========================================
DROP TABLE IF EXISTS procesos_bau_historial CASCADE;
DROP TABLE IF EXISTS procesos_bau CASCADE;
DROP TABLE IF EXISTS presupuestos CASCADE;
CREATE TABLE presupuestos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    descripcion VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO presupuestos (codigo, descripcion)
VALUES ('PYM01', 'Presupuesto PYM01 - Colocación'),
    ('ADQ7', 'Presupuesto ADQ7 - Adquisiciones'),
    ('BAU', 'Presupuesto BAU - Business As Usual');
-- ===========================================
-- 2. RECREAR TABLA procesos_bau
-- ===========================================
CREATE TABLE procesos_bau (
    id SERIAL PRIMARY KEY,
    producto_id VARCHAR(20) NOT NULL REFERENCES productos(id),
    tipo_proceso VARCHAR(50) NOT NULL,
    mes INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 0,
    presupuesto_id INTEGER REFERENCES presupuestos(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(producto_id, tipo_proceso, mes, anio)
);
CREATE INDEX idx_procesos_bau_producto ON procesos_bau(producto_id);
CREATE INDEX idx_procesos_bau_periodo ON procesos_bau(anio, mes);
-- ===========================================
-- 3. RECREAR TABLA procesos_bau_historial
-- ===========================================
CREATE TABLE procesos_bau_historial (
    id SERIAL PRIMARY KEY,
    proceso_id INTEGER NOT NULL REFERENCES procesos_bau(id),
    cantidad_anterior INTEGER NOT NULL,
    cantidad_nueva INTEGER NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);
-- ===========================================
-- 4. INSERTAR DATOS SEED DE PROCESOS BAU
-- ===========================================
-- Datos de ejemplo para procesos BAU 2026
INSERT INTO procesos_bau (producto_id, tipo_proceso, mes, anio, cantidad)
VALUES ('J14967C', 'trascodificacion', 1, 2026, 1500),
    ('J14967C', 'renovacion_anticipada', 1, 2026, 800),
    ('J14967C', 'btb', 1, 2026, 300),
    ('J14968C', 'trascodificacion', 1, 2026, 2000),
    (
        'J14968C',
        'renovacion_anticipada',
        1,
        2026,
        1200
    ),
    ('J14968C', 'btb', 1, 2026, 500),
    ('J14969C', 'trascodificacion', 1, 2026, 1800),
    (
        'J14969C',
        'renovacion_anticipada',
        1,
        2026,
        1000
    ),
    ('J14969C', 'btb', 1, 2026, 400) ON CONFLICT DO NOTHING;
-- ===========================================
-- 5. VERIFICAR TABLA forecast
-- ===========================================
-- El endpoint de forecast puede no existir como router separado
-- Verificamos que la tabla existe y tiene la estructura correcta
-- Ya existe en el schema original, solo verificamos
SELECT 'Tabla forecast' AS tabla,
    COUNT(*) AS registros
FROM forecast;
SELECT 'Migración de procesos BAU completada exitosamente' AS mensaje;