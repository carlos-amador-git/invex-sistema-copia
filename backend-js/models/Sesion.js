import { getDb } from '../database.js';

class Sesion {
  constructor(data) {
    this.id = data.id;
    this.usuario_id = data.usuario_id;
    this.refresh_token = data.refresh_token;
    this.expires_at = data.expires_at;
    this.revoked = Boolean(data.revoked);
    this.created_at = data.created_at;
  }

  static async findByRefreshToken(token) {
    const db = getDb();
    const row = await db.get('SELECT * FROM sesiones WHERE refresh_token = ?', [token]);
    return row ? new Sesion(row) : null;
  }

  static async findActiveByUsuarioId(usuario_id) {
    const db = getDb();
    const rows = await db.query('SELECT * FROM sesiones WHERE usuario_id = ? AND revoked = 0', [usuario_id]);
    return rows.map(row => new Sesion(row));
  }

  static async create(data) {
    const db = getDb();
    const result = await db.run(`
      INSERT INTO sesiones (usuario_id, refresh_token, expires_at, revoked, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      data.usuario_id,
      data.refresh_token,
      data.expires_at,
      data.revoked ? 1 : 0
    ]);
    
    return this.findById(result.lastInsertRowid);
  }

  static async findById(id) {
    const db = getDb();
    const row = await db.get('SELECT * FROM sesiones WHERE id = ?', [id]);
    return row ? new Sesion(row) : null;
  }

  async revoke() {
    const db = getDb();
    await db.run('UPDATE sesiones SET revoked = 1 WHERE id = ?', [this.id]);
    this.revoked = true;
  }

  static async revokeAllForUser(usuario_id) {
    const db = getDb();
    await db.run('UPDATE sesiones SET revoked = 1 WHERE usuario_id = ? AND revoked = 0', [usuario_id]);
  }

  static async cleanExpired() {
    const db = getDb();
    await db.run("DELETE FROM sesiones WHERE expires_at < CURRENT_TIMESTAMP");
  }
}

export { Sesion };
