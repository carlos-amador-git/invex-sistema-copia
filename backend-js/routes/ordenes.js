import express from 'express';
import { OrdenCompra } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const ordenes = await OrdenCompra.getAll();
    res.json(ordenes.map(o => o.toJSON()));
  } catch (error) {
    console.error('Error getting ordenes:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const orden = await OrdenCompra.findById(req.params.id);
    if (!orden) {
      return res.status(404).json({ detail: 'Orden no encontrada' });
    }
    res.json(orden.toJSON());
  } catch (error) {
    console.error('Error getting orden:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id, producto_id, proveedor_id, cantidad, presupuesto, estatus, fecha_orden, fecha_entrega, costo_total, costo_unitario, requi, provision, validacion, tipo_material, caracteristica, nombre_producto } = req.body;

    if (!id || !producto_id) {
      return res.status(400).json({ detail: 'ID y producto_id son requeridos' });
    }

    const existing = await OrdenCompra.findById(id);
    if (existing) {
      return res.status(400).json({ detail: 'La orden ya existe' });
    }

    const orden = await OrdenCompra.create({
      id,
      producto_id,
      proveedor_id,
      cantidad,
      presupuesto,
      estatus,
      fecha_orden,
      fecha_entrega,
      costo_total,
      costo_unitario,
      requi,
      provision,
      validacion,
      tipo_material,
      caracteristica,
      nombre_producto
    });

    res.status(201).json(orden.toJSON());
  } catch (error) {
    console.error('Error creating orden:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    let orden = await OrdenCompra.findById(req.params.id);
    if (!orden) {
      return res.status(404).json({ detail: 'Orden no encontrada' });
    }

    orden = await orden.update(req.body);
    res.json(orden.toJSON());
  } catch (error) {
    console.error('Error updating orden:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const orden = await OrdenCompra.findById(req.params.id);
    if (!orden) {
      return res.status(404).json({ detail: 'Orden no encontrada' });
    }

    await orden.delete();
    res.json({ message: 'Orden eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting orden:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

export default router;
