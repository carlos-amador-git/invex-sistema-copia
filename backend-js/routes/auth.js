import express from 'express';
import { Usuario } from '../models/index.js';
import { Sesion } from '../models/Sesion.js';
import { createAccessToken, createRefreshToken, verifyToken } from '../security.js';
import { authenticateToken } from '../middleware/auth.js';
import { config } from '../database.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ detail: 'Username y password son requeridos' });
    }

    const user = await Usuario.findByUsername(username);
    if (!user || !user.activo) {
      return res.status(401).json({ detail: 'Usuario o contraseña incorrectos' });
    }

    if (!user.verifyPassword(password)) {
      return res.status(401).json({ detail: 'Usuario o contraseña incorrectos' });
    }

    await user.updateLastAccess();

    const accessToken = createAccessToken({ sub: user.id, username: user.username });
    const refreshToken = createRefreshToken({ sub: user.id });

    const expiresAt = new Date(Date.now() + config.refreshTokenExpireDays * 24 * 60 * 60 * 1000).toISOString();
    await Sesion.create({
      usuario_id: user.id,
      refresh_token: refreshToken,
      expires_at: expiresAt
    });

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: config.accessTokenExpireMinutes * 60,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        face_registered: user.face_registered
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/login/facial', async (req, res) => {
  try {
    const { face_descriptor } = req.body;

    if (!face_descriptor || !Array.isArray(face_descriptor)) {
      return res.status(400).json({ detail: 'Descriptor facial requerido' });
    }

    const allUsers = await Usuario.getAll();
    const users = allUsers.filter(u => u.face_registered && u.activo);
    if (users.length === 0) {
      return res.status(404).json({ detail: 'No hay usuarios con reconocimiento facial registrado' });
    }

    const THRESHOLD = 0.6;
    let matchedUser = null;
    let minDistance = Infinity;

    for (const user of users) {
      if (user.face_descriptor) {
        try {
          const storedDescriptor = JSON.parse(user.face_descriptor);
          const distance = Math.sqrt(
            face_descriptor.reduce((sum, val, i) => sum + Math.pow(val - (storedDescriptor[i] || 0), 2), 0)
          );
          if (distance < minDistance && distance < THRESHOLD) {
            minDistance = distance;
            matchedUser = user;
          }
        } catch (e) {
          console.error('Error parsing face descriptor:', e);
        }
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ detail: 'No se pudo verificar el rostro' });
    }

    await matchedUser.updateLastAccess();

    const accessToken = createAccessToken({ sub: matchedUser.id, username: matchedUser.username });
    const refreshToken = createRefreshToken({ sub: matchedUser.id });

    const expiresAt = new Date(Date.now() + config.refreshTokenExpireDays * 24 * 60 * 60 * 1000).toISOString();
    await Sesion.create({
      usuario_id: matchedUser.id,
      refresh_token: refreshToken,
      expires_at: expiresAt
    });

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: config.accessTokenExpireMinutes * 60,
      user: {
        id: matchedUser.id,
        username: matchedUser.username,
        nombre: matchedUser.nombre,
        email: matchedUser.email,
        rol: matchedUser.rol,
        face_registered: matchedUser.face_registered
      }
    });
  } catch (error) {
    console.error('Error en login facial:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ detail: 'Refresh token requerido' });
    }

    const payload = verifyToken(refresh_token, 'refresh');
    if (!payload) {
      return res.status(401).json({ detail: 'Token de refresco inválido' });
    }

    const session = await Sesion.findByRefreshToken(refresh_token);
    if (!session || session.revoked) {
      return res.status(401).json({ detail: 'Sesión no válida' });
    }

    const user = await Usuario.findById(payload.sub);
    if (!user || !user.activo) {
      return res.status(401).json({ detail: 'Usuario no encontrado o inactivo' });
    }

    const accessToken = createAccessToken({ sub: user.id, username: user.username });

    res.json({
      access_token: accessToken,
      refresh_token: refresh_token,
      expires_in: config.accessTokenExpireMinutes * 60,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        face_registered: user.face_registered
      }
    });
  } catch (error) {
    console.error('Error en refresh:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await Sesion.revokeAllForUser(req.user.id);
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  res.json(req.user.toJSON());
});

export default router;
