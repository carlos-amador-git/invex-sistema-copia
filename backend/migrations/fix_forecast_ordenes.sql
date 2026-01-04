-- Migración para INVEX Sistema - Corregir tabla forecast e insertar órdenes
-- Ejecutar en Neon PostgreSQL
-- ===========================================
-- 1. RECREAR TABLA forecast CON ESTRUCTURA CORRECTA
-- ===========================================
DROP TABLE IF EXISTS forecast CASCADE;
CREATE TABLE forecast (
    id SERIAL PRIMARY KEY,
    producto_id VARCHAR(20) NOT NULL REFERENCES productos(id),
    mes VARCHAR(10) NOT NULL,
    colocacion INTEGER DEFAULT 0,
    trasco_rep INTEGER DEFAULT 0,
    btb INTEGER DEFAULT 0,
    renov_anticipada INTEGER DEFAULT 0,
    forecast_total INTEGER DEFAULT 0,
    disponible_con_compra INTEGER DEFAULT 0,
    disponible_sin_compra INTEGER DEFAULT 0,
    atiende_con_compra BOOLEAN DEFAULT TRUE,
    atiende_sin_compra BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_forecast_producto ON forecast(producto_id);
CREATE INDEX idx_forecast_mes ON forecast(mes);
-- ===========================================
-- 2. INSERTAR DATOS DE FORECAST
-- ===========================================
-- Volaris 0 (J14968C)
INSERT INTO forecast (
        producto_id,
        mes,
        colocacion,
        trasco_rep,
        btb,
        renov_anticipada,
        forecast_total,
        disponible_con_compra,
        disponible_sin_compra,
        atiende_con_compra,
        atiende_sin_compra
    )
VALUES (
        'J14968C',
        'Oct-25',
        5000,
        200,
        100,
        300,
        5600,
        10000,
        8000,
        TRUE,
        TRUE
    ),
    (
        'J14968C',
        'Nov-25',
        5500,
        220,
        110,
        330,
        6160,
        9200,
        7000,
        TRUE,
        TRUE
    ),
    (
        'J14968C',
        'Dic-25',
        6000,
        240,
        120,
        360,
        6720,
        8400,
        6000,
        TRUE,
        TRUE
    ),
    (
        'J14968C',
        'Ene-26',
        6500,
        260,
        130,
        390,
        7280,
        7600,
        5000,
        TRUE,
        FALSE
    ),
    (
        'J14968C',
        'Feb-26',
        7000,
        280,
        140,
        420,
        7840,
        6800,
        4000,
        TRUE,
        FALSE
    ),
    (
        'J14968C',
        'Mar-26',
        7500,
        300,
        150,
        450,
        8400,
        6000,
        3000,
        TRUE,
        FALSE
    );
-- Volaris 2 (J14969C)
INSERT INTO forecast (
        producto_id,
        mes,
        colocacion,
        trasco_rep,
        btb,
        renov_anticipada,
        forecast_total,
        disponible_con_compra,
        disponible_sin_compra,
        atiende_con_compra,
        atiende_sin_compra
    )
VALUES (
        'J14969C',
        'Oct-25',
        5000,
        200,
        100,
        300,
        5600,
        10000,
        8000,
        TRUE,
        TRUE
    ),
    (
        'J14969C',
        'Nov-25',
        5500,
        220,
        110,
        330,
        6160,
        9200,
        7000,
        TRUE,
        TRUE
    ),
    (
        'J14969C',
        'Dic-25',
        6000,
        240,
        120,
        360,
        6720,
        8400,
        6000,
        TRUE,
        TRUE
    ),
    (
        'J14969C',
        'Ene-26',
        6500,
        260,
        130,
        390,
        7280,
        7600,
        5000,
        TRUE,
        FALSE
    ),
    (
        'J14969C',
        'Feb-26',
        7000,
        280,
        140,
        420,
        7840,
        6800,
        4000,
        TRUE,
        FALSE
    ),
    (
        'J14969C',
        'Mar-26',
        7500,
        300,
        150,
        450,
        8400,
        6000,
        3000,
        TRUE,
        FALSE
    );
-- Volaris 1 (J14967C)
INSERT INTO forecast (
        producto_id,
        mes,
        colocacion,
        trasco_rep,
        btb,
        renov_anticipada,
        forecast_total,
        disponible_con_compra,
        disponible_sin_compra,
        atiende_con_compra,
        atiende_sin_compra
    )
VALUES (
        'J14967C',
        'Oct-25',
        4500,
        180,
        90,
        270,
        5040,
        9000,
        7500,
        TRUE,
        TRUE
    ),
    (
        'J14967C',
        'Nov-25',
        5000,
        200,
        100,
        300,
        5600,
        8200,
        6500,
        TRUE,
        TRUE
    ),
    (
        'J14967C',
        'Dic-25',
        5500,
        220,
        110,
        330,
        6160,
        7400,
        5500,
        TRUE,
        TRUE
    ),
    (
        'J14967C',
        'Ene-26',
        6000,
        240,
        120,
        360,
        6720,
        6600,
        4500,
        TRUE,
        FALSE
    ),
    (
        'J14967C',
        'Feb-26',
        6500,
        260,
        130,
        390,
        7280,
        5800,
        3500,
        TRUE,
        FALSE
    ),
    (
        'J14967C',
        'Mar-26',
        7000,
        280,
        140,
        420,
        7840,
        5000,
        2500,
        TRUE,
        FALSE
    );
-- ===========================================
-- 3. INSERTAR ÓRDENES DE COMPRA
-- ===========================================
-- Obtener ID del proveedor Thales (debería ser 1)
INSERT INTO ordenes_compra (
        id,
        producto_id,
        proveedor_id,
        cantidad,
        presupuesto,
        estatus,
        fecha_orden,
        fecha_entrega,
        costo_total
    )
VALUES (
        'OC-250136',
        'J14968C',
        1,
        50000,
        'PYM01',
        'En Produccion',
        '2025-09-15',
        '2025-11-15',
        525000.00
    ),
    (
        'OC-250137',
        'J14969C',
        1,
        40000,
        'ADQ7',
        'Nueva Compra',
        '2025-10-01',
        '2025-12-01',
        420000.00
    ),
    (
        'OC-250138',
        'J14967C',
        1,
        60000,
        'PYM01',
        'En Produccion',
        '2025-09-20',
        '2025-11-20',
        630000.00
    ) ON CONFLICT (id) DO NOTHING;
-- ===========================================
-- 4. VERIFICACIÓN
-- ===========================================
SELECT 'Forecast' AS tabla,
    COUNT(*) AS registros
FROM forecast
UNION ALL
SELECT 'Ordenes' AS tabla,
    COUNT(*) AS registros
FROM ordenes_compra;
SELECT 'Migración de forecast y órdenes completada exitosamente' AS mensaje;