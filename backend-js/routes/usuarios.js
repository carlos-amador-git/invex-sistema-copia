import express from 'express';
import { Usuario } from '../models/index.js';
import { getPasswordHash } from '../security.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const usuarios = await Usuario.getAll();
    res.json(usuarios.map(u => u.toJSON()));
  } catch (error) {
    console.error('Error getting usuarios:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(parseInt(req.params.id));
    if (!usuario) {
      return res.status(404).json({ detail: 'Usuario no encontrado' });
    }
    res.json(usuario.toJSON());
  } catch (error) {
    console.error('Error getting usuario:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, nombre, email, rol } = req.body;

    if (!username || !password || !nombre || !email || !rol) {
      return res.status(400).json({ detail: 'Todos los campos son requeridos' });
    }

    const existingUsername = await Usuario.findByUsername(username);
    const existingEmail = await Usuario.findByEmail(email);
    
    if (existingUsername || existingEmail) {
      return res.status(400).json({ detail: 'El usuario ya existe' });
    }

    const passwordHash = getPasswordHash(password);

    const usuario = await Usuario.create({
      username,
      password_hash: passwordHash,
      nombre,
      email,
      rol,
      face_registered: false,
      activo: true
    });

    res.status(201).json(usuario.toJSON());
  } catch (error) {
    console.error('Error creating usuario:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    let usuario = await Usuario.findById(parseInt(req.params.id));
    if (!usuario) {
      return res.status(404).json({ detail: 'Usuario no encontrado' });
    }

    const { nombre, email, rol, activo, face_registered, face_descriptor } = req.body;
    const updates = {};

    if (nombre) updates.nombre = nombre;
    if (email) updates.email = email;
    if (rol) updates.rol = rol;
    if (activo !== undefined) updates.activo = activo;
    if (face_registered !== undefined) updates.face_registered = face_registered;
    if (face_descriptor !== undefined) updates.face_descriptor = face_descriptor;

    usuario = await usuario.update(updates);
    res.json(usuario.toJSON());
  } catch (error) {
    console.error('Error updating usuario:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.put('/:id/password', authenticateToken, async (req, res) => {
  try {
    let usuario = await Usuario.findById(parseInt(req.params.id));
    if (!usuario) {
      return res.status(404).json({ detail: 'Usuario no encontrado' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ detail: 'Password requerido' });
    }

    const passwordHash = getPasswordHash(password);
    usuario = await usuario.update({ password_hash: passwordHash });

    res.json({ message: 'Password actualizado correctamente' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const usuario = await Usuario.findById(parseInt(req.params.id));
    if (!usuario) {
      return res.status(404).json({ detail: 'Usuario no encontrado' });
    }

    await usuario.update({ activo: false });
    res.json({ message: 'Usuario desactivado correctamente' });
  } catch (error) {
    console.error('Error deleting usuario:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

export default router;
