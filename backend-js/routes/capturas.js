import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const capturas = await db.query('SELECT * FROM capturas ORDER BY created_at DESC LIMIT 100');
    res.json(capturas);
  } catch (error) {
    console.error('Error getting capturas:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { producto_id, tipo_captura, cantidad, observaciones } = req.body;

    if (!tipo_captura) {
      return res.status(400).json({ detail: 'tipo_captura es requerido' });
    }

    const db = getDb();
    const result = await db.run(`
      INSERT INTO capturas (usuario_id, producto_id, tipo_captura, cantidad, observaciones, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [req.user.id, producto_id || null, tipo_captura, cantidad || 0, observaciones || null]);

    res.status(201).json({ id: result.lastInsertRowid, usuario_id: req.user.id, tipo_captura, cantidad, created_at: new Date().toISOString() });
  } catch (error) {
    console.error('Error creating captura:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/usuario/:userId', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const capturas = await db.query('SELECT * FROM capturas WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 50', [parseInt(req.params.userId)]);
    res.json(capturas);
  } catch (error) {
    console.error('Error getting capturas:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/mis-capturas', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const capturas = await db.query('SELECT * FROM capturas WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    res.json(capturas);
  } catch (error) {
    console.error('Error getting mis capturas:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

export default router;
