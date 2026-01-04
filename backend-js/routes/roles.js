import express from 'express';
import { Rol } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const roles = await Rol.getAll();
    res.json(roles.map(r => r.toJSON()));
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const rol = await Rol.findById(parseInt(req.params.id));
    if (!rol) {
      return res.status(404).json({ detail: 'Rol no encontrado' });
    }
    res.json(rol.toJSON());
  } catch (error) {
    console.error('Error getting rol:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, descripcion, area, color, modulos, permisos } = req.body;

    if (!nombre) {
      return res.status(400).json({ detail: 'Nombre es requerido' });
    }

    const existing = await Rol.findByNombre(nombre);
    if (existing) {
      return res.status(400).json({ detail: 'El rol ya existe' });
    }

    const rol = await Rol.create({ nombre, descripcion, area, color, modulos, permisos });
    res.status(201).json(rol.toJSON());
  } catch (error) {
    console.error('Error creating rol:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    let rol = await Rol.findById(parseInt(req.params.id));
    if (!rol) {
      return res.status(404).json({ detail: 'Rol no encontrado' });
    }

    const { nombre, descripcion, area, color, modulos, permisos } = req.body;
    const updates = {};
    if (nombre) updates.nombre = nombre;
    if (descripcion !== undefined) updates.descripcion = descripcion;
    if (area !== undefined) updates.area = area;
    if (color !== undefined) updates.color = color;
    if (modulos !== undefined) updates.modulos = modulos;
    if (permisos !== undefined) updates.permisos = permisos;

    rol = await rol.update(updates);
    res.json(rol.toJSON());
  } catch (error) {
    console.error('Error updating rol:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const rol = await Rol.findById(parseInt(req.params.id));
    if (!rol) {
      return res.status(404).json({ detail: 'Rol no encontrado' });
    }

    await rol.delete();
    res.json({ message: 'Rol eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting rol:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

export default router;
