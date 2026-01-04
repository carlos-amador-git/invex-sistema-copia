import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/capacidad-ensamble', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    
    // Obtener productos que son kits o que tienen materiales asociados
    // Esta lógica puede ser compleja, por ahora devolveremos un mock o una lógica simplificada
    // basada en los materiales disponibles
    
    // TODO: Implementar lógica real de capacidad de ensamble
    // Por ahora devolvemos un array vacío para evitar el 404
    res.json([]); 
  } catch (error) {
    console.error('Error getting capacidad ensamble:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const materiales = await db.query('SELECT * FROM materiales ORDER BY nombre');
    res.json(materiales);
  } catch (error) {
    console.error('Error getting materiales:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const material = await db.get('SELECT * FROM materiales WHERE id = ?', [parseInt(req.params.id)]);

    if (!material) {
      return res.status(404).json({ detail: 'Material no encontrado' });
    }
    res.json(material);
  } catch (error) {
    console.error('Error getting material:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { nombre, tipo, unidad, stock, stock_minimo } = req.body;

    if (!nombre) {
      return res.status(400).json({ detail: 'Nombre es requerido' });
    }

    const db = getDb();
    const existing = await db.get('SELECT * FROM materiales WHERE nombre = ?', [nombre]);
    if (existing) {
      return res.status(400).json({ detail: 'El material ya existe' });
    }

    const result = await db.run(`
      INSERT INTO materiales (nombre, tipo, unidad, stock, stock_minimo)
      VALUES (?, ?, ?, ?, ?)
    `, [nombre, tipo || null, unidad || null, stock || 0, stock_minimo || 0]);

    res.status(201).json({ id: result.lastInsertRowid, nombre, tipo, unidad, stock, stock_minimo });
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const material = await db.get('SELECT * FROM materiales WHERE id = ?', [parseInt(req.params.id)]);

    if (!material) {
      return res.status(404).json({ detail: 'Material no encontrado' });
    }

    const { nombre, tipo, unidad, stock, stock_minimo } = req.body;
    await db.run(`
      UPDATE materiales SET
        nombre = COALESCE(?, nombre),
        tipo = COALESCE(?, tipo),
        unidad = COALESCE(?, unidad),
        stock = COALESCE(?, stock),
        stock_minimo = COALESCE(?, stock_minimo)
      WHERE id = ?
    `, [nombre, tipo, unidad, stock, stock_minimo, parseInt(req.params.id)]);

    const updated = await db.get('SELECT * FROM materiales WHERE id = ?', [parseInt(req.params.id)]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

export default router;
