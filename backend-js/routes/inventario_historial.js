import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const historial = await db.query('SELECT * FROM inventario_historial ORDER BY created_at DESC LIMIT 100');
    res.json(historial);
  } catch (error) {
    console.error('Error getting historial:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/producto/:productoId', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const historial = await db.query('SELECT * FROM inventario_historial WHERE producto_id = ? ORDER BY created_at DESC', [req.params.productoId]);
    res.json(historial);
  } catch (error) {
    console.error('Error getting historial:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { producto_id, tipo_movimiento, cantidad, observaciones } = req.body;

    if (!producto_id || !tipo_movimiento) {
      return res.status(400).json({ detail: 'producto_id y tipo_movimiento son requeridos' });
    }

    const db = getDb();
    const result = await db.run(`
      INSERT INTO inventario_historial (producto_id, tipo_movimiento, cantidad, usuario_id, observaciones, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [producto_id, tipo_movimiento, cantidad || 0, req.user.id, observaciones || null]);

    res.status(201).json({
      id: result.lastInsertRowid,
      producto_id,
      tipo_movimiento,
      cantidad,
      usuario_id: req.user.id,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating historial:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

export default router;
