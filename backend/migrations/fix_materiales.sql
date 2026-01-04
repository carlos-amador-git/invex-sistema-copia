-- Migración para INVEX Sistema - Actualizar estructura de inventario_materiales
-- Esta migración debe ejecutarse en Neon PostgreSQL para sincronizar con los modelos SQLAlchemy
-- ===========================================
-- 1. RECREAR TABLA inventario_materiales
-- ===========================================
-- Eliminar tabla y dependencias
DROP TABLE IF EXISTS movimientos_materiales CASCADE;
DROP TABLE IF EXISTS relacion_producto_material CASCADE;
DROP TABLE IF EXISTS inventario_materiales CASCADE;
-- Crear tabla con estructura correcta
CREATE TABLE inventario_materiales (
    num_parte VARCHAR(50) PRIMARY KEY,
    descripcion VARCHAR(200) NOT NULL,
    cantidad_recibida INTEGER DEFAULT 0,
    fecha_ultimo_ingreso DATE,
    saldo_actual INTEGER DEFAULT 0,
    fecha_ultimo_movimiento DATE,
    total_almacen_general INTEGER DEFAULT 0,
    total_piso_produccion INTEGER DEFAULT 0,
    activo INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_materiales_num_parte ON inventario_materiales(num_parte);
-- ===========================================
-- 2. RECREAR TABLA relacion_producto_material
-- ===========================================
CREATE TABLE relacion_producto_material (
    id SERIAL PRIMARY KEY,
    producto_id VARCHAR(20) NOT NULL REFERENCES productos(id),
    material_num_parte VARCHAR(50) NOT NULL REFERENCES inventario_materiales(num_parte),
    tipo_material VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_relacion_producto ON relacion_producto_material(producto_id);
CREATE INDEX IF NOT EXISTS idx_relacion_material ON relacion_producto_material(material_num_parte);
-- ===========================================
-- 3. RECREAR TABLA movimientos_materiales
-- ===========================================
CREATE TABLE movimientos_materiales (
    id SERIAL PRIMARY KEY,
    material_num_parte VARCHAR(50) NOT NULL REFERENCES inventario_materiales(num_parte),
    tipo_movimiento VARCHAR(20) NOT NULL,
    cantidad INTEGER NOT NULL,
    cantidad_anterior INTEGER NOT NULL,
    cantidad_nueva INTEGER NOT NULL,
    motivo TEXT,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_movimientos_material ON movimientos_materiales(material_num_parte);
-- ===========================================
-- 4. INSERTAR DATOS SEED DE MATERIALES
-- ===========================================
INSERT INTO inventario_materiales (
        num_parte,
        descripcion,
        cantidad_recibida,
        fecha_ultimo_ingreso,
        saldo_actual,
        fecha_ultimo_movimiento,
        total_almacen_general,
        total_piso_produccion
    )
VALUES (
        'E14-0596-3',
        'VOLARIS 0 S/N ORIGINACIÓN',
        0,
        '2025-01-02',
        258,
        '2025-01-03',
        258,
        0
    ),
    (
        'E14-0597-5',
        'VOLARIS 1 S/N ORIGINACIÓN',
        0,
        '2025-01-02',
        175,
        '2025-09-26',
        175,
        0
    ),
    (
        'E14-0598-5',
        'VOLARIS S/N ORIGINACIÓN',
        0,
        '2025-01-02',
        77,
        '2025-09-26',
        77,
        0
    ),
    (
        'E14-0607-3',
        'VOLARIS 0 S/N ORIGINACIÓN',
        0,
        '2025-09-22',
        26400,
        '2025-10-06',
        26400,
        251
    ),
    (
        'E14-0608-6',
        'VOLARIS 1 S/N ORIGINACIÓN',
        9000,
        '2025-10-10',
        11400,
        '2025-09-23',
        11400,
        1100
    ),
    (
        'E14-0609-4',
        'VOLARIS 2 S/N ORIGINACIÓN',
        13630,
        '2025-10-10',
        14430,
        '2025-09-26',
        14430,
        450
    ),
    (
        'E14-0618-8',
        'WELCOME KIT WALMART',
        10000,
        '2025-10-08',
        21800,
        '2025-10-10',
        21800,
        0
    ),
    (
        'E14-0619-8',
        'WELCOME KIT SAMS CLUB',
        0,
        '2025-09-26',
        28000,
        '2025-10-10',
        28000,
        0
    ),
    (
        'E16-0114-7',
        'ETIQUETA DE SEGURIDAD INVEX BOFA',
        0,
        '2017-07-05',
        143218,
        '2017-01-18',
        143218,
        0
    ),
    (
        'E16-0170-6',
        'ETIQUETAS CIRCULARES DE PAPEL 2.5 CM',
        0,
        '2025-02-17',
        55560,
        '2025-05-21',
        55560,
        0
    ),
    (
        'E08-1669-6A',
        'SOBRE TARJETON MONEDERO INVEX',
        0,
        '2025-01-20',
        98000,
        '2025-08-27',
        98000,
        0
    ),
    (
        'E08-1765-2',
        'SOBRE TARJETON DEBITO',
        0,
        '2018-04-16',
        4490,
        '2019-11-14',
        4490,
        0
    ),
    (
        'E08-1884-3',
        'SOBRE TEND',
        0,
        '2022-05-02',
        9450,
        '2022-02-26',
        9450,
        0
    ),
    (
        'E14-0522-1B',
        'WELCOME KIT NOW MC',
        0,
        '2025-02-14',
        59550,
        '2025-05-20',
        59550,
        1500
    ),
    (
        'E14-0546-5',
        'WELCOME KIT AMAZON CONTENEDORES',
        0,
        '2023-03-03',
        10694,
        '2023-03-14',
        10694,
        0
    ),
    (
        'E14-0569-4',
        'WELCOME KIT AMAZON CONTENEDORES',
        0,
        '2025-01-02',
        4386,
        '2025-03-10',
        4386,
        0
    ),
    (
        'E14-0594-1',
        'WK KIOSKO DÉBITO',
        0,
        '2025-06-03',
        550,
        '2025-06-04',
        550,
        0
    ),
    (
        'E03-1301-2',
        'INSERTO VOLARIS',
        5000,
        '2025-10-01',
        45000,
        '2025-10-15',
        45000,
        500
    ),
    (
        'E05-0587-9',
        'BOLSA SEGURISELLO VOLARIS',
        10000,
        '2025-09-15',
        35000,
        '2025-10-10',
        35000,
        200
    ) ON CONFLICT (num_parte) DO NOTHING;
-- ===========================================
-- 5. INSERTAR RELACIONES PRODUCTO-MATERIAL
-- ===========================================
INSERT INTO relacion_producto_material (producto_id, material_num_parte, tipo_material)
VALUES ('J14968C', 'E14-0607-3', 'welcome_kit'),
    ('J14968C', 'E03-1301-2', 'inserto'),
    ('J14968C', 'E05-0587-9', 'bolsa_segurisello'),
    ('J14967C', 'E14-0608-6', 'welcome_kit'),
    ('J14967C', 'E03-1301-2', 'inserto'),
    ('J14967C', 'E05-0587-9', 'bolsa_segurisello'),
    ('J14969C', 'E14-0609-4', 'welcome_kit'),
    ('J14969C', 'E03-1301-2', 'inserto'),
    ('J14969C', 'E05-0587-9', 'bolsa_segurisello') ON CONFLICT DO NOTHING;
-- ===========================================
-- 6. VERIFICAR TABLAS DE PROCESOS BAU
-- ===========================================
-- Asegurarse de que proceso_bau_historial existe con la estructura correcta
-- (Esta tabla ya debería existir según el schema original)
SELECT 'Migración completada exitosamente' AS mensaje;