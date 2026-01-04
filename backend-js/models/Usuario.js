import { getDb } from '../database.js';
import { verifyPassword, getPasswordHash } from '../security.js';

class Usuario {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.password_hash = data.password_hash;
    this.nombre = data.nombre;
    this.email = data.email;
    this.rol = data.rol;
    this.face_registered = Boolean(data.face_registered);
    this.face_descriptor = data.face_descriptor;
    this.activo = Boolean(data.activo);
    this.ultimo_acceso = data.ultimo_acceso;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findByUsername(username) {
    const db = getDb();
    const row = await db.get('SELECT * FROM usuarios WHERE username = ?', [username]);
    return row ? new Usuario(row) : null;
  }

  static async findById(id) {
    const db = getDb();
    const row = await db.get('SELECT * FROM usuarios WHERE id = ?', [id]);
    return row ? new Usuario(row) : null;
  }

  static async findByEmail(email) {
    const db = getDb();
    const row = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);
    return row ? new Usuario(row) : null;
  }

  static async getAll() {
    const db = getDb();
    const rows = await db.query('SELECT * FROM usuarios ORDER BY id');
    return rows.map(row => new Usuario(row));
  }

  static async create(data) {
    const db = getDb();
    const result = await db.run(`
      INSERT INTO usuarios (username, password_hash, nombre, email, rol, face_registered, face_descriptor, activo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      data.username,
      data.password_hash,
      data.nombre,
      data.email,
      data.rol,
      data.face_registered ? 1 : 0,
      data.face_descriptor || null,
      data.activo !== false ? 1 : 0
    ]);
    
    return this.findById(result.lastInsertRowid);
  }

  async update(data) {
    const db = getDb();
    await db.run(`
      UPDATE usuarios SET
        username = COALESCE(?, username),
        password_hash = COALESCE(?, password_hash),
        nombre = COALESCE(?, nombre),
        email = COALESCE(?, email),
        rol = COALESCE(?, rol),
        face_registered = COALESCE(?, face_registered),
        face_descriptor = COALESCE(?, face_descriptor),
        activo = COALESCE(?, activo),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data.username,
      data.password_hash,
      data.nombre,
      data.email,
      data.rol,
      data.face_registered !== undefined ? (data.face_registered ? 1 : 0) : null,
      data.face_descriptor,
      data.activo !== undefined ? (data.activo ? 1 : 0) : null,
      this.id
    ]);
    
    return Usuario.findById(this.id);
  }

  async updateLastAccess() {
    const db = getDb();
    await db.run('UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [this.id]);
  }

  verifyPassword(password) {
    return verifyPassword(password, this.password_hash);
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      nombre: this.nombre,
      email: this.email,
      rol: this.rol,
      face_registered: this.face_registered,
      activo: this.activo,
      ultimo_acceso: this.ultimo_acceso,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export { Usuario };
