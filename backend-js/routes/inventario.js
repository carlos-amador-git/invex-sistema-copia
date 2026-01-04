import express from 'express';
import { Inventario, Forecast } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const inventarios = await Inventario.getAllWithProducto();
    res.json(inventarios);
  } catch (error) {
    console.error('Error getting inventarios:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/:id/forecast', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const forecast = await Forecast.findByProductoId(id);
    res.json(forecast.map(f => f.toJSON()));
  } catch (error) {
    console.error('Error getting forecast:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/:id/resumen', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    let inventario = await Inventario.findByProductoId(id);
    
    if (!inventario && /^\d+$/.test(id)) {
      inventario = await Inventario.findById(parseInt(id));
    }

    if (!inventario) {
      return res.status(404).json({ detail: 'Inventario no encontrado' });
    }

    // Calcular resumen
    const tsys = (inventario.boveda_trabajo || 0) + (inventario.boveda_principal || 0);
    const proceso = (inventario.en_proceso_cantidad || 0) + (inventario.ordenes_activas || 0);
    const virgen = tsys + proceso;
    const venta = inventario.dist_colocacion || 0;
    const cadena = inventario.dist_normal || 0;

    res.json({
      tsys,
      proceso,
      virgen,
      venta,
      cadena
    });
  } catch (error) {
    console.error('Error getting resumen:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    let inventario = null;

    // Si es un número, buscar por ID de inventario
    if (/^\d+$/.test(id)) {
      inventario = await Inventario.findById(parseInt(id));
    }

    // Si no se encontró o no es número, buscar por ID de producto
    if (!inventario) {
      inventario = await Inventario.findByProductoId(id);
    }

    if (!inventario) {
      return res.status(404).json({ detail: 'Inventario no encontrado' });
    }
    await inventario.loadProducto();
    res.json(inventario.toJSON());
  } catch (error) {
    console.error('Error getting inventario:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { producto_id, boveda_trabajo, boveda_principal, en_proceso_cantidad, ordenes_activas, dist_colocacion, dist_normal, dist_devoluciones, mod_colocacion, mod_stock } = req.body;

    if (!producto_id) {
      return res.status(400).json({ detail: 'Producto ID es requerido' });
    }

    const existing = await Inventario.findByProductoId(producto_id);
    if (existing) {
      return res.status(400).json({ detail: 'El inventario para este producto ya existe' });
    }

    const inventario = await Inventario.create({
      producto_id,
      boveda_trabajo,
      boveda_principal,
      en_proceso_cantidad,
      ordenes_activas,
      dist_colocacion,
      dist_normal,
      dist_devoluciones,
      mod_colocacion,
      mod_stock
    });

    res.status(201).json(inventario.toJSON());
  } catch (error) {
    console.error('Error creating inventario:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    let inventario = await Inventario.findById(parseInt(req.params.id));
    if (!inventario) {
      return res.status(404).json({ detail: 'Inventario no encontrado' });
    }

    const updates = req.body;
    inventario = await inventario.update(updates);
    res.json(inventario.toJSON());
  } catch (error) {
    console.error('Error updating inventario:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/update-balance', authenticateToken, async (req, res) => {
  try {
    const { producto_id, boveda_trabajo, boveda_principal, dist_colocacion, mod_colocacion, mod_normal } = req.body;

    let inventario = await Inventario.findByProductoId(producto_id);
    if (!inventario) {
      return res.status(404).json({ detail: 'Inventario no encontrado' });
    }

    const updates = {};
    if (boveda_trabajo !== undefined) updates.boveda_trabajo = boveda_trabajo;
    if (boveda_principal !== undefined) updates.boveda_principal = boveda_principal;
    if (dist_colocacion !== undefined) updates.dist_colocacion = dist_colocacion;
    if (mod_colocacion !== undefined) updates.mod_colocacion = mod_colocacion;
    if (mod_normal !== undefined) updates.mod_normal = mod_normal;

    inventario = await inventario.update(updates);
    res.json(inventario.toJSON());
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

export default router;
