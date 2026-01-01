-- Schema para INVEX Sistema - Base de datos PostgreSQL (Neon)
-- Ejecutar: psql "postgresql://..." -f schema.sql

-- Tabla de Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(100),
    area VARCHAR(50),
    color VARCHAR(7),
    modulos TEXT NOT NULL,
    permisos TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    rol VARCHAR(20) NOT NULL,
    face_registered BOOLEAN DEFAULT FALSE,
    face_descriptor TEXT,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Tabla de Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tiempo_entrega INTEGER DEFAULT 8,
    contacto VARCHAR(100),
    email VARCHAR(100),
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
    id VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),
    tiempo_entrega INTEGER DEFAULT 8,
    costo_unitario FLOAT,
    marca VARCHAR(50),
    tipo VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id);

-- Tabla de Precios por Proveedor
CREATE TABLE IF NOT EXISTS precios_proveedor (
    id SERIAL PRIMARY KEY,
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),
    producto_id VARCHAR(20) NOT NULL REFERENCES productos(id),
    costo_unitario FLOAT NOT NULL,
    moneda VARCHAR(10) DEFAULT 'MXN',
    vigente_desde DATE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Inventario
CREATE TABLE IF NOT EXISTS inventario (
    id SERIAL PRIMARY KEY,
    producto_id VARCHAR(20) NOT NULL UNIQUE REFERENCES productos(id),

    -- TSYS (Almacén)
    boveda_trabajo INTEGER DEFAULT 0,
    boveda_principal INTEGER DEFAULT 0,
    trasco_rep INTEGER DEFAULT 0,

    -- En Proceso
    en_proceso_cantidad INTEGER DEFAULT 0,
    ordenes_activas INTEGER DEFAULT 0,

    -- Distribución
    dist_colocacion INTEGER DEFAULT 0,
    dist_normal INTEGER DEFAULT 0,
    dist_devoluciones INTEGER DEFAULT 0,

    -- Módulos
    mod_colocacion INTEGER DEFAULT 0,
    mod_normal INTEGER DEFAULT 0,
    mod_stock INTEGER DEFAULT 0,

    -- Datos de compra sugerida
    fecha_compra_sugerida VARCHAR(20),
    fecha_entrega_estimada VARCHAR(20),
    mes_alerta VARCHAR(20),
    presupuesto_pym01 INTEGER DEFAULT 0,
    presupuesto_adq7 INTEGER DEFAULT 0,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Historial de Capturas
CREATE TABLE IF NOT EXISTS historial_capturas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    producto_id VARCHAR(20) NOT NULL REFERENCES productos(id),
    area VARCHAR(50) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    valores TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estatus VARCHAR(20) DEFAULT 'Aprobado',
    ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_historial_capturas_usuario ON historial_capturas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_capturas_producto ON historial_capturas(producto_id);
CREATE INDEX IF NOT EXISTS idx_historial_capturas_fecha ON historial_capturas(fecha);

-- Tabla de Órdenes de Compra
CREATE TABLE IF NOT EXISTS ordenes_compra (
    id VARCHAR(20) PRIMARY KEY,
    producto_id VARCHAR(20) NOT NULL REFERENCES productos(id),
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),

    -- Datos de requisición
    requi VARCHAR(20),
    provision VARCHAR(50),
    validacion VARCHAR(20),

    -- Clasificación
    tipo_material VARCHAR(50),
    presupuesto VARCHAR(50),
    caracteristica VARCHAR(50),
    nombre_producto VARCHAR(100),

    -- Cantidades y costos
    cantidad INTEGER NOT NULL,
    costo_unitario FLOAT,
    costo_total FLOAT,
    descuento FLOAT,

    -- Estado
    estatus VARCHAR(50) DEFAULT 'PENDIENTE',

    -- Fechas
    fecha_orden DATE,
    fecha_entrega DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ordenes_compra_producto ON ordenes_compra(producto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor ON ordenes_compra(proveedor_id);

-- Tabla de Entregas Parciales
CREATE TABLE IF NOT EXISTS entregas_parciales (
    id SERIAL PRIMARY KEY,
    orden_id VARCHAR(20) NOT NULL REFERENCES ordenes_compra(id),
    numero_entrega INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    contra_recibo VARCHAR(50),
    factura VARCHAR(50),
    fecha_pago DATE,
    estatus VARCHAR(30),
    fecha_entrega DATE,
    costo FLOAT,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Forecast
CREATE TABLE IF NOT EXISTS forecast (
    id SERIAL PRIMARY KEY,
    producto_id VARCHAR(20) NOT NULL REFERENCES productos(id),
    mes VARCHAR(7) NOT NULL,  -- YYYY-MM
    anio INTEGER NOT NULL,
    mes_numero INTEGER NOT NULL,
    tipo_demanda VARCHAR(50),  -- colocacion_mensual, normal, total
    cantidad INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(producto_id, mes, tipo_demanda)
);

CREATE INDEX IF NOT EXISTS idx_forecast_producto ON forecast(producto_id);
CREATE INDEX IF NOT EXISTS idx_forecast_mes ON forecast(mes);

-- Tabla de Sesiones
CREATE TABLE IF NOT EXISTS sesiones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    token VARCHAR(500) NOT NULL,
    refresh_token VARCHAR(500),
    expires_at TIMESTAMP NOT NULL,
    refresh_expires_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones(token);

-- Tabla de Snapshots de Inventario
CREATE TABLE IF NOT EXISTS inventario_snapshots (
    id SERIAL PRIMARY KEY,
    producto_id VARCHAR(20) NOT NULL REFERENCES productos(id),
    fecha DATE NOT NULL,
    boveda_trabajo INTEGER,
    boveda_principal INTEGER,
    trasco_rep INTEGER,
    en_proceso_cantidad INTEGER,
    dist_colocacion INTEGER,
    dist_normal INTEGER,
    mod_colocacion INTEGER,
    mod_normal INTEGER,
    total_general INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snapshots_producto ON inventario_snapshots(producto_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_fecha ON inventario_snapshots(fecha);

-- Tabla de Auditoría de Capturas
CREATE TABLE IF NOT EXISTS captura_auditoria (
    id SERIAL PRIMARY KEY,
    captura_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    accion VARCHAR(20) NOT NULL,
    valores_anteriores TEXT,
    valores_nuevos TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Inventario Material
CREATE TABLE IF NOT EXISTS inventario_materiales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    stock_maximo INTEGER DEFAULT 0,
    costo_unitario FLOAT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Relación Producto-Material
CREATE TABLE IF NOT EXISTS relacion_producto_material (
    id SERIAL PRIMARY KEY,
    producto_id VARCHAR(20) NOT NULL REFERENCES productos(id),
    material_id INTEGER NOT NULL REFERENCES inventario_materiales(id),
    cantidad_requerida INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Movimientos de Material
CREATE TABLE IF NOT EXISTS movimiento_materiales (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES inventario_materiales(id),
    tipo_movimiento VARCHAR(20) NOT NULL,
    cantidad INTEGER NOT NULL,
    referencia VARCHAR(100),
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movimientos_material ON movimiento_materiales(material_id);

-- Tabla de Presupuesto BAU
CREATE TABLE IF NOT EXISTS presupuesto (
    id SERIAL PRIMARY KEY,
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    area VARCHAR(50) NOT NULL,
    tipo_tarjeta VARCHAR(50),
    presupuesto DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(anio, mes, area, tipo_tarjeta)
);

-- Tabla de Procesos BAU
CREATE TABLE IF NOT EXISTS procesos_bau (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estatus VARCHAR(30) DEFAULT 'ACTIVO',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Historial Procesos BAU
CREATE TABLE IF NOT EXISTS proceso_bau_historial (
    id SERIAL PRIMARY KEY,
    proceso_id INTEGER NOT NULL REFERENCES procesos_bau(id),
    producto_id VARCHAR(20) NOT NULL REFERENCES productos(id),
    tipo VARCHAR(50) NOT NULL,
    cantidad INTEGER DEFAULT 0,
    costo_unitario FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Colocación Historial
CREATE TABLE IF NOT EXISTS colocacion_historial (
    id SERIAL PRIMARY KEY,
    producto_id VARCHAR(20) NOT NULL REFERENCES productos(id),
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    area VARCHAR(50) NOT NULL,
    colocacion INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(producto_id, anio, mes, area)
);

-- Tabla de Inventario Historial
CREATE TABLE IF NOT EXISTS inventario_historial (
    id SERIAL PRIMARY KEY,
    producto_id VARCHAR(20) NOT NULL REFERENCES productos(id),
    fecha DATE NOT NULL,
    boveda_trabajo INTEGER,
    boveda_principal INTEGER,
    total_tsys INTEGER,
    dist_colocacion INTEGER,
    dist_normal INTEGER,
    total_distribucion INTEGER,
    mod_colocacion INTEGER,
    mod_normal INTEGER,
    total_modulos INTEGER,
    total_general INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Auditoría Inventario Historial
CREATE TABLE IF NOT EXISTS inventario_historial_auditoria (
    id SERIAL PRIMARY KEY,
    historial_id INTEGER NOT NULL REFERENCES inventario_historial(id),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    accion VARCHAR(20) NOT NULL,
    campo_modificado VARCHAR(50),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Solicitudes de Compra
CREATE TABLE IF NOT EXISTS solicitudes_compra (
    id SERIAL PRIMARY KEY,
    producto_id VARCHAR(20) NOT NULL REFERENCES productos(id),
    solicitante_id INTEGER NOT NULL REFERENCES usuarios(id),
    cantidad INTEGER NOT NULL,
    justificacion TEXT,
    prioridad VARCHAR(20) DEFAULT 'NORMAL',
    estatus VARCHAR(30) DEFAULT 'PENDIENTE',
    fecha_requerida DATE,
    aprobada_por INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_compra_producto ON solicitudes_compra(producto_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_compra_estatus ON solicitudes_compra(estatus);

-- Tabla de Órdenes Historial (auditoría)
CREATE TABLE IF NOT EXISTS ordenes_historial (
    id SERIAL PRIMARY KEY,
    orden_id VARCHAR(50) NOT NULL REFERENCES ordenes_compra(id),
    campo VARCHAR(50) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_id INTEGER,
    usuario_nombre VARCHAR(100),
    ip_address VARCHAR(45),
    accion VARCHAR(20) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
