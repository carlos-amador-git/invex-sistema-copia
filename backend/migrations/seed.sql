-- Seed Data para INVEX Sistema - Neon PostgreSQL
-- Ejecutar después de schema.sql

-- Insertar Roles
INSERT INTO roles (nombre, descripcion, area, color, modulos, permisos) VALUES
('admin', 'Admin Inventario', 'Inventario', '#8b5cf6', '["dashboard", "balance", "forecast", "productos", "ordenes", "usuarios", "configuracion"]', '{"verTodo": true, "editarTodo": true, "crearOrdenes": true, "gestionarUsuarios": true, "verDashboard": true}'),
('tsys', 'Usuario TSYS', 'Almacén (TSYS)', '#3b82f6', '["captura-tsys", "mi-historial", "dashboard-lectura"]', '{"editarInventarioTSYS": true, "verDashboard": true}'),
('distribucion', 'Distribución', 'Distribución', '#f59e0b', '["captura-distribucion", "mi-historial", "dashboard-lectura"]', '{"editarDemandaDistribucion": true, "verDashboard": true}'),
('modulos', 'Módulos', 'Módulos', '#10b981', '["captura-modulos", "mi-historial", "dashboard-lectura"]', '{"editarDemandaModulos": true, "verDashboard": true}'),
('consulta', 'Directivo', 'Dirección', '#64748b', '["dashboard-lectura"]', '{"verDashboard": true, "soloLectura": true}');

-- Insertar Proveedores
INSERT INTO proveedores (nombre, tiempo_entrega, contacto, email) VALUES
('Thales', 8, 'ventas@thales.com', 'ventas@thales.com'),
('MyCard', 6, 'ventas@mycard.com', 'ventas@mycard.com'),
('TGS', 10, 'ventas@tgs.com', 'ventas@tgs.com');

-- Insertar Productos (asegúrate de que los proveedores existan)
INSERT INTO productos (id, nombre, proveedor_id, costo_unitario, marca, tipo) VALUES
('J14885C', 'MCI INMEDIATA VOYAGE PLATINUM DUAL INT', 1, 2.17, 'Mastercard', 'Crédito'),
('J14886C', 'MCI NORMAL VOYAGE GOLD DUAL INTERFACE', 1, 2.17, 'Mastercard', 'Crédito'),
('J14887C', 'MCI NORMAL VOYAGE PLATINUM DUAL INTERF', 1, 2.17, 'Mastercard', 'Crédito'),
('J14901I', 'MCI INMEDIATO HEJCARD (IKEA) DUAL INTE', 2, 1.43, 'Mastercard', 'Crédito'),
('J14902I', 'MCI SINGLE PANEL HEJCARD (IKEA) DUAL I', 2, 1.43, 'Mastercard', 'Crédito'),
('J14910C', 'MCI AMAZON TDD DUAL INTERFACE', 2, 1.50, 'Mastercard', 'Débito'),
('J14941C', 'MCI NORMAL VOLARIS 1 DUAL INTERFACE', 1, 10.50, 'Mastercard', 'Crédito'),
('J14942C', 'MCI NML VOL 2 DUAL INTERFACE', 1, 10.50, 'Mastercard', 'Crédito'),
('J14943C', 'MCI NORMAL VOL 0 DUAL INTERFACE', 1, 10.50, 'Mastercard', 'Crédito'),
('J14967C', 'Volaris 1', 1, 10.50, 'Mastercard', 'Crédito'),
('J14968C', 'Volaris 0', 1, 10.50, 'Mastercard', 'Crédito'),
('J14969C', 'Volaris 2', 1, 10.50, 'Mastercard', 'Crédito'),
('J14984H', 'VSI NML CIBANCO DUAL INTERFACE', 3, 1.80, 'Visa', 'Crédito'),
('J14986', 'MCI BC SERIGRAFÍA EN MB PRODUC DUAL IN', 2, 1.20, 'Mastercard', 'Débito'),
('J14987', 'MCI BC SERIGRAFÍA EN MB DESARROLLO DUA', 2, 1.20, 'Mastercard', 'Débito'),
('J15033I', 'MCI NORMAL WALMART DUAL INTERFACE', 2, 1.35, 'Mastercard', 'Crédito'),
('J15034I', 'MCI NORMAL SAMS CLUB DUAL INTERFACE', 2, 1.35, 'Mastercard', 'Crédito');

-- Insertar Inventario
INSERT INTO inventario (producto_id, boveda_trabajo, boveda_principal, dist_colocacion, dist_normal, mod_colocacion) VALUES
('J14885C', 98, 0, 0, 0, 0),
('J14886C', 416, 2500, 0, 0, 0),
('J14887C', 109, 3500, 0, 0, 0),
('J14901I', 118, 1500, 0, 0, 0),
('J14902I', 0, 0, 0, 0, 0),
('J14910C', 462, 3500, 0, 0, 0),
('J14941C', 272, 0, 0, 0, 0),
('J14942C', 280, 0, 0, 0, 0),
('J14943C', 268, 0, 0, 0, 0),
('J14967C', 2862, 18000, 2800, 900, 2200),
('J14968C', 607, 41000, 3500, 1200, 2800),
('J14969C', 850, 21500, 4000, 1500, 3200),
('J14984H', 424, 500, 0, 0, 0),
('J14986', 9, 0, 0, 0, 0),
('J14987', 10, 0, 0, 0, 0),
('J15033I', 36, 1500, 0, 0, 0),
('J15034I', 492, 28500, 0, 0, 0);

-- Insertar Usuarios (contraseña: bcrypt hash de 'admin123', 'tsys123', etc.)
-- NOTA: Genera los hashes correctamente en la aplicación
INSERT INTO usuarios (username, password_hash, nombre, email, rol, activo) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.ZKTS5py9w7JzXW', 'Carlos Mendoza', 'carlos.mendoza@banco.com', 'admin', true),
('tsys_user', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'María García', 'maria.garcia@banco.com', 'tsys', true),
('dist_user', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Roberto Sánchez', 'roberto.sanchez@banco.com', 'distribucion', true),
('mod_user', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ana López', 'ana.lopez@banco.com', 'modulos', true),
('director', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Fernando Ruiz', 'fernando.ruiz@banco.com', 'consulta', true);

-- NOTA: Las contraseñas son:
-- admin123, tsys123, dist123, mod123, dir123
-- Los hashes de ejemplo no son válidos, cámbialos en la app
