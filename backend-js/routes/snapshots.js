import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const snapshots = await db.query('SELECT * FROM snapshots ORDER BY created_at DESC');
    res.json(snapshots);
  } catch (error) {
    console.error('Error getting snapshots:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { tipo, data } = req.body;

    if (!tipo || !data) {
      return res.status(400).json({ detail: 'tipo y data son requeridos' });
    }

    const db = getDb();
    const result = await db.run(
      'INSERT INTO snapshots (tipo, data, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)', 
      [tipo, JSON.stringify(data)]
    );

    res.status(201).json({ id: result.lastInsertRowid, tipo, created_at: new Date().toISOString() });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/:tipo/latest', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.get('SELECT * FROM snapshots WHERE tipo = ? ORDER BY created_at DESC LIMIT 1', [req.params.tipo]);

    if (!snapshot) {
      return res.status(404).json({ detail: 'Snapshot no encontrado' });
    }

    snapshot.data = JSON.parse(snapshot.data);
    res.json(snapshot);
  } catch (error) {
    console.error('Error getting snapshot:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

export default router;
