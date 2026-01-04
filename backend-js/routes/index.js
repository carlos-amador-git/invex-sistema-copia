import express from 'express';
import { getDb, config } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const db = getDb();

    const totalProducts = await db.get('SELECT COUNT(*) as count FROM productos WHERE activo = 1');
    const totalInventory = await db.get('SELECT COUNT(*) as count FROM inventarios');
    const totalOrders = await db.get("SELECT COUNT(*) as count FROM ordenes_compra WHERE estatus NOT IN ('COMPLETADA', 'CANCELADA')");
    const totalProviders = await db.get('SELECT COUNT(*) as count FROM proveedores WHERE activo = 1');

    const lowStock = await db.get(`
      SELECT COUNT(*) as count FROM inventarios
      WHERE boveda_principal < 1000 OR boveda_trabajo < 100
    `);

    const pendingOrders = await db.get(`
      SELECT COUNT(*) as count FROM ordenes_compra WHERE estatus = 'PENDIENTE'
    `);

    res.json({
      total_products: totalProducts?.count || 0,
      total_inventory: totalInventory?.count || 0,
      total_orders: totalOrders?.count || 0,
      total_providers: totalProviders?.count || 0,
      low_stock_alerts: lowStock?.count || 0,
      pending_orders: pendingOrders?.count || 0
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/dashboard/summary', authenticateToken, async (req, res) => {
  try {
    const db = getDb();

    const inventoryByProduct = await db.query(`
      SELECT i.*, p.nombre as producto_nombre, p.marca
      FROM inventarios i
      LEFT JOIN productos p ON i.producto_id = p.id
      ORDER BY i.boveda_principal DESC
      LIMIT 10
    `);

    const recentOrders = await db.query(`
      SELECT * FROM ordenes_compra ORDER BY created_at DESC LIMIT 5
    `);

    const orderStats = await db.get(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN estatus = 'PENDIENTE' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN estatus = 'EN PROCESO' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN estatus = 'COMPLETADA' THEN 1 ELSE 0 END) as completed
      FROM ordenes_compra
    `);

    res.json({
      top_inventory: inventoryByProduct,
      recent_orders: recentOrders,
      order_stats: orderStats
    });
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/public/health', (req, res) => {
  res.json({ status: 'healthy', service: 'invex-backend-js' });
});

router.get('/public/config', (req, res) => {
  res.json({
    cors_origins: config.corsOrigins.join(','),
    message: 'If you see this, the backend is working!',
    status: 'active'
  });
});

export default router;
