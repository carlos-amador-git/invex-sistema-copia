import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from './database.js';

const pwdContext = bcrypt;

function verifyPassword(plainPassword, hashedPassword) {
  return pwdContext.compareSync(plainPassword, hashedPassword);
}

function getPasswordHash(password) {
  return pwdContext.hashSync(password, config.bcryptRounds);
}

function createAccessToken(data, expiresIn = null) {
  const toEncode = { ...data };
  if (toEncode.sub !== undefined && typeof toEncode.sub !== 'string') {
    toEncode.sub = String(toEncode.sub);
  }
  
  const expiration = expiresIn || (config.accessTokenExpireMinutes * 60);
  toEncode.exp = Math.floor(Date.now() / 1000) + expiration;
  toEncode.type = 'access';
  
  return jwt.sign(toEncode, config.secretKey, { algorithm: config.algorithm });
}

function createRefreshToken(data, expiresIn = null) {
  const toEncode = { ...data };
  if (toEncode.sub !== undefined && typeof toEncode.sub !== 'string') {
    toEncode.sub = String(toEncode.sub);
  }
  
  const expiration = expiresIn || (config.refreshTokenExpireDays * 24 * 60 * 60);
  toEncode.exp = Math.floor(Date.now() / 1000) + expiration;
  toEncode.type = 'refresh';
  
  return jwt.sign(toEncode, config.secretKey, { algorithm: config.algorithm });
}

function verifyToken(token, tokenType = 'access') {
  try {
    const payload = jwt.verify(token, config.secretKey, { algorithms: [config.algorithm] });
    if (payload.type !== tokenType) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

export { verifyPassword, getPasswordHash, createAccessToken, createRefreshToken, verifyToken };
