import express from 'express';
import { Producto } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const productos = await Producto.getAll();
    const productosWithProveedor = await Promise.all(productos.map(async p => {
      await p.loadProveedor();
      return p.toJSON();
    }));
    res.json(productosWithProveedor);
  } catch (error) {
    console.error('Error getting productos:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ detail: 'Producto no encontrado' });
    }
    await producto.loadProveedor();
    res.json(producto.toJSON());
  } catch (error) {
    console.error('Error getting producto:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id, nombre, proveedor_id, tiempo_entrega, costo_unitario, marca, tipo } = req.body;

    if (!id || !nombre) {
      return res.status(400).json({ detail: 'ID y nombre son requeridos' });
    }

    const existing = await Producto.findById(id);
    if (existing) {
      return res.status(400).json({ detail: 'El producto ya existe' });
    }

    const producto = await Producto.create({ id, nombre, proveedor_id, tiempo_entrega, costo_unitario, marca, tipo });
    res.status(201).json(producto.toJSON());
  } catch (error) {
    console.error('Error creating producto:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    let producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ detail: 'Producto no encontrado' });
    }

    const { nombre, proveedor_id, tiempo_entrega, costo_unitario, marca, tipo, activo } = req.body;
    const updates = {};
    if (nombre) updates.nombre = nombre;
    if (proveedor_id !== undefined) updates.proveedor_id = proveedor_id;
    if (tiempo_entrega !== undefined) updates.tiempo_entrega = tiempo_entrega;
    if (costo_unitario !== undefined) updates.costo_unitario = costo_unitario;
    if (marca !== undefined) updates.marca = marca;
    if (tipo !== undefined) updates.tipo = tipo;
    if (activo !== undefined) updates.activo = activo;

    producto = await producto.update(updates);
    res.json(producto.toJSON());
  } catch (error) {
    console.error('Error updating producto:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ detail: 'Producto no encontrado' });
    }

    await producto.delete();
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting producto:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

export default router;
