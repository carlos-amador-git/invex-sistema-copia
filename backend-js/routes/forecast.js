import express from 'express';
import { Forecast } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const forecasts = await Forecast.getAll();
    res.json(forecasts.map(f => f.toJSON()));
  } catch (error) {
    console.error('Error getting forecast:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { producto_id, mes, anio, cantidad } = req.body;

    if (!producto_id || !mes || !anio) {
      return res.status(400).json({ detail: 'producto_id, mes y anio son requeridos' });
    }

    const forecast = await Forecast.create({ producto_id, mes, anio, cantidad });
    res.status(201).json(forecast.toJSON());
  } catch (error) {
    console.error('Error creating forecast:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    let forecast = await Forecast.findById(parseInt(req.params.id));
    if (!forecast) {
      return res.status(404).json({ detail: 'Forecast no encontrado' });
    }

    forecast = await forecast.update(req.body);
    res.json(forecast.toJSON());
  } catch (error) {
    console.error('Error updating forecast:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const forecast = await Forecast.findById(parseInt(req.params.id));
    if (!forecast) {
      return res.status(404).json({ detail: 'Forecast no encontrado' });
    }

    await forecast.delete();
    res.json({ message: 'Forecast eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting forecast:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

export default router;
