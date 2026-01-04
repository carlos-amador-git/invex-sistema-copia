import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './database.js';
import { getDb } from './database.js';
import { Rol, Usuario, Proveedor, Producto, Inventario, OrdenCompra, ProcesoBAU, Forecast } from './models/index.js';
import { getPasswordHash } from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || config.corsOrigins.some(o => origin.includes(o) || o === '*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', (await import('./routes/auth.js')).default);
app.use('/api/usuarios', (await import('./routes/usuarios.js')).default);
app.use('/api/roles', (await import('./routes/roles.js')).default);
app.use('/api/proveedores', (await import('./routes/proveedores.js')).default);
app.use('/api/productos', (await import('./routes/productos.js')).default);
app.use('/api/inventario', (await import('./routes/inventario.js')).default);
app.use('/api/ordenes', (await import('./routes/ordenes.js')).default);
app.use('/api/procesos_bau', (await import('./routes/procesos_bau.js')).default);
app.use('/api/forecast', (await import('./routes/forecast.js')).default);
app.use('/api/snapshots', (await import('./routes/snapshots.js')).default);
app.use('/api/capturas', (await import('./routes/capturas.js')).default);
app.use('/api/materiales', (await import('./routes/materiales.js')).default);
app.use('/api/inventario_historial', (await import('./routes/inventario_historial.js')).default);
app.use('/api', (await import('./routes/index.js')).default);

app.get('/', (req, res) => {
  res.json({
    message: 'INVEX API - Sistema de Control de Inventario',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/debug/users', async (req, res) => {
  try {
    const users = await Usuario.getAll();
    res.json({
      count: users.length,
      users: users.map(u => ({
        username: u.username,
        nombre: u.nombre,
        rol: u.rol,
        activo: u.activo
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/debug/hash/:password', (req, res) => {
  const hash = getPasswordHash(req.params.password);
  res.json({ password: req.params.password, hash });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ detail: 'Internal server error' });
});

async function seedDatabase() {
  console.log('Iniciando seed de base de datos...');

  const db = getDb();

  try {
    // Check if roles exist
    const existingRoles = await db.get('SELECT COUNT(*) as count FROM roles');
    // Postgres returns count as string sometimes, or number.
    const count = existingRoles ? parseInt(existingRoles.count) : 0;
    
    if (count > 0) {
      console.log('La base de datos ya contiene datos. Saltando seed.');
      return;
    }

    const defaultRoles = [
      { nombre: 'admin', descripcion: 'Admin Inventario', area: 'Inventario', color: '#8b5cf6', modulos: JSON.stringify(['dashboard', 'balance', 'forecast', 'productos', 'ordenes', 'usuarios', 'configuracion']), permisos: JSON.stringify({ verTodo: true, editarTodo: true, crearOrdenes: true, gestionarUsuarios: true, verDashboard: true }) },
      { nombre: 'tsys', descripcion: 'Usuario TSYS', area: 'Almacén (TSYS)', color: '#3b82f6', modulos: JSON.stringify(['captura-tsys', 'mi-historial', 'dashboard-lectura']), permisos: JSON.stringify({ editarInventarioTSYS: true, verDashboard: true }) },
      { nombre: 'distribucion', descripcion: 'Distribución', area: 'Distribución', color: '#f59e0b', modulos: JSON.stringify(['captura-distribucion', 'mi-historial', 'dashboard-lectura']), permisos: JSON.stringify({ editarDemandaDistribucion: true, verDashboard: true }) },
      { nombre: 'modulos', descripción: 'Módulos', area: 'Módulos', color: '#10b981', modulos: JSON.stringify(['captura-modulos', 'mi-historial', 'dashboard-lectura']), permisos: JSON.stringify({ editarDemandaModulos: true, verDashboard: true }) },
      { nombre: 'consulta', descripcion: 'Directivo', area: 'Dirección', color: '#64748b', modulos: JSON.stringify(['dashboard-lectura']), permisos: JSON.stringify({ verDashboard: true, soloLectura: true }) }
    ];

    const insertRoleSQL = 'INSERT INTO roles (nombre, descripcion, area, color, modulos, permisos) VALUES (?, ?, ?, ?, ?, ?)';
    for (const rol of defaultRoles) {
      await db.run(insertRoleSQL, [rol.nombre, rol.descripcion, rol.area, rol.color, rol.modulos, rol.permisos]);
    }
    console.log('✓ Roles creados');

    const defaultUsers = [
      { username: 'admin', password_hash: '$2b$12$ncV1k9mmekgCI..aFh62aOJ6VXQRxVCExl/LBrcxXMJK631MUkfFi', nombre: 'Carlos Mendoza', email: 'carlos.mendoza@banco.com', rol: 'admin' },
      { username: 'tsys_user', password_hash: '$2b$12$EuNvIPx9ldyX/nVFXHa1TeB8S3FnBjISgUOFNv4FHBUsENBp3wAsa', nombre: 'María García', email: 'maria.garcia@banco.com', rol: 'tsys' },
      { username: 'dist_user', password_hash: '$2b$12$zQMFliMpCFfIzPX5rWLulOGWKftIeHUP87W7OB356wpG3.8nCHMMO', nombre: 'Roberto Sánchez', email: 'roberto.sanchez@banco.com', rol: 'distribucion' },
      { username: 'mod_user', password_hash: '$2b$12$7OW392NfEg1mgSe0PUtMXuP7X/7WaHe1kXD//YZs1edZx1uD2Rua6', nombre: 'Ana López', email: 'ana.lopez@banco.com', rol: 'modulos' },
      { username: 'director', password_hash: '$2b$12$jbzFQpH9yC3rFFoTJOUG2OsKCTxsHlt6vBhhOPRp0RXw2UL4T8dBG', nombre: 'Fernando Ruiz', email: 'fernando.ruiz@banco.com', rol: 'consulta' }
    ];

    const insertUserSQL = 'INSERT INTO usuarios (username, password_hash, nombre, email, rol, face_registered, activo) VALUES (?, ?, ?, ?, ?, 0, 1)';
    for (const user of defaultUsers) {
      await db.run(insertUserSQL, [user.username, user.password_hash, user.nombre, user.email, user.rol]);
    }
    console.log('✓ Usuarios creados');

    const defaultProviders = [
      { nombre: 'Thales', tiempo_entrega: 8, contacto: 'ventas@thales.com' },
      { nombre: 'MyCard', tiempo_entrega: 6, contacto: 'ventas@mycard.com' },
      { nombre: 'TGS', tiempo_entrega: 10, contacto: 'ventas@tgs.com' },
      { nombre: 'COLOR PRINTING', tiempo_entrega: 8 },
      { nombre: 'MEXTRIM GROUP', tiempo_entrega: 8 }
    ];

    const insertProviderSQL = 'INSERT INTO proveedores (nombre, tiempo_entrega, contacto, activo) VALUES (?, ?, ?, 1)';
    for (const provider of defaultProviders) {
      await db.run(insertProviderSQL, [provider.nombre, provider.tiempo_entrega, provider.contacto || null]);
    }
    console.log('✓ Proveedores creados');

    const defaultProducts = [
      { id: 'J14968C', nombre: 'Volaris 0', proveedor_id: 1, tiempo_entrega: 8, costo_unitario: 10.5, marca: 'Mastercard', tipo: 'Crédito' },
      { id: 'J14969C', nombre: 'Volaris 2', proveedor_id: 1, tiempo_entrega: 8, costo_unitario: 10.5, marca: 'Mastercard', tipo: 'Crédito' },
      { id: 'J14970C', nombre: 'Volaris 2', proveedor_id: 1, tiempo_entrega: 8, costo_unitario: 10.5, marca: 'Visa', tipo: 'Crédito' },
      { id: 'J14901I', nombre: 'MCI INMEDIATO HEJCARD (IKEA) DUAL INTE', proveedor_id: 2, tiempo_entrega: 8, costo_unitario: 1.43, marca: 'Mastercard', tipo: 'Crédito' },
      { id: 'J15033I', nombre: 'MCI NORMAL WALMART DUAL INTERFACE', proveedor_id: 2, tiempo_entrega: 8, costo_unitario: 1.35, marca: 'Mastercard', tipo: 'Crédito' }
    ];

    const insertProductSQL = 'INSERT INTO productos (id, nombre, proveedor_id, tiempo_entrega, costo_unitario, marca, tipo, activo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)';
    for (const product of defaultProducts) {
      await db.run(insertProductSQL, [product.id, product.nombre, product.proveedor_id, product.tiempo_entrega, product.costo_unitario, product.marca, product.tipo]);
    }
    console.log('✓ Productos creados');

    const defaultInventory = [
      { producto_id: 'J14968C', boveda_trabajo: 607, boveda_principal: 41000, ordenes_activas: 83000 },
      { producto_id: 'J14969C', boveda_trabajo: 850, boveda_principal: 21500, ordenes_activas: 1 },
      { producto_id: 'J14970C', boveda_trabajo: 4500, boveda_principal: 18000, ordenes_activas: 2 },
      { producto_id: 'J14901I', boveda_trabajo: 118, boveda_principal: 1500 },
      { producto_id: 'J15033I', boveda_trabajo: 36, boveda_principal: 1500 }
    ];

    const insertInventorySQL = 'INSERT INTO inventarios (producto_id, boveda_trabajo, boveda_principal, ordenes_activas) VALUES (?, ?, ?, ?)';
    for (const inv of defaultInventory) {
      await db.run(insertInventorySQL, [inv.producto_id, inv.boveda_trabajo, inv.boveda_principal, inv.ordenes_activas || 0]);
    }
    console.log('✓ Inventario creado');

    const insertPresupuestoSQL = 'INSERT INTO presupuestos (codigo, descripcion, activo) VALUES (?, ?, 1)';
    await db.run(insertPresupuestoSQL, ['PYM01', 'Presupuesto para BAU']);
    console.log('✓ Presupuesto creado');

    console.log('✅ Seed completado exitosamente!');

  } catch (error) {
    console.error('Error en seed:', error);
  }
}

const PORT = config.port;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
    seedDatabase();
  });
} else {
  // En entorno Vercel/Producción, aseguramos que la DB esté inicializada
  // pero sin bloquear el puerto con app.listen
  try {
    await seedDatabase();
  } catch (error) {
    console.error('Error inicializando DB en serverless:', error);
  }
}

export default app;
