import { getDb, config } from '../database.js';
import { Usuario } from '../models/index.js';
import { Sesion } from '../models/Sesion.js';
import { createAccessToken, createRefreshToken, verifyToken } from '../security.js';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ detail: 'Token no proporcionado' });
  }

  const payload = verifyToken(token, 'access');
  if (!payload) {
    return res.status(401).json({ detail: 'Token inválido o expirado' });
  }

  const user = Usuario.findById(payload.sub);
  if (!user || !user.activo) {
    return res.status(401).json({ detail: 'Usuario no encontrado o inactivo' });
  }

  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ detail: 'Usuario no autenticado' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ detail: 'No tiene permisos para esta acción' });
    }
    next();
  };
}

export { authenticateToken, requireRole };
