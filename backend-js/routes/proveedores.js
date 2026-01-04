import express from 'express';
import { Proveedor } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const proveedores = await Proveedor.getAll();
    res.json(proveedores.map(p => p.toJSON()));
  } catch (error) {
    console.error('Error getting proveedores:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const proveedor = await Proveedor.findById(parseInt(req.params.id));
    if (!proveedor) {
      return res.status(404).json({ detail: 'Proveedor no encontrado' });
    }
    res.json(proveedor.toJSON());
  } catch (error) {
    console.error('Error getting proveedor:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, tiempo_entrega, contacto, email, telefono } = req.body;

    if (!nombre) {
      return res.status(400).json({ detail: 'Nombre es requerido' });
    }

    const existing = await Proveedor.findByNombre(nombre);
    if (existing) {
      return res.status(400).json({ detail: 'El proveedor ya existe' });
    }

    const proveedor = await Proveedor.create({ nombre, tiempo_entrega, contacto, email, telefono });
    res.status(201).json(proveedor.toJSON());
  } catch (error) {
    console.error('Error creating proveedor:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    let proveedor = await Proveedor.findById(parseInt(req.params.id));
    if (!proveedor) {
      return res.status(404).json({ detail: 'Proveedor no encontrado' });
    }

    const { nombre, tiempo_entrega, contacto, email, telefono, activo } = req.body;
    const updates = {};
    if (nombre) updates.nombre = nombre;
    if (tiempo_entrega !== undefined) updates.tiempo_entrega = tiempo_entrega;
    if (contacto !== undefined) updates.contacto = contacto;
    if (email !== undefined) updates.email = email;
    if (telefono !== undefined) updates.telefono = telefono;
    if (activo !== undefined) updates.activo = activo;

    proveedor = await proveedor.update(updates);
    res.json(proveedor.toJSON());
  } catch (error) {
    console.error('Error updating proveedor:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const proveedor = await Proveedor.findById(parseInt(req.params.id));
    if (!proveedor) {
      return res.status(404).json({ detail: 'Proveedor no encontrado' });
    }

    await proveedor.delete();
    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting proveedor:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

export default router;
