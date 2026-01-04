import { getDb } from '../database.js';

class Rol {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.area = data.area;
    this.color = data.color;
    this.modulos = data.modulos;
    this.permisos = data.permisos;
    this.created_at = data.created_at;
  }

  static async findById(id) {
    const db = getDb();
    const row = await db.get('SELECT * FROM roles WHERE id = ?', [id]);
    return row ? new Rol(row) : null;
  }

  static async findByNombre(nombre) {
    const db = getDb();
    const row = await db.get('SELECT * FROM roles WHERE nombre = ?', [nombre]);
    return row ? new Rol(row) : null;
  }

  static async getAll() {
    const db = getDb();
    const rows = await db.query('SELECT * FROM roles ORDER BY id');
    return rows.map(row => new Rol(row));
  }

  static async create(data) {
    const db = getDb();
    const result = await db.run(`
      INSERT INTO roles (nombre, descripcion, area, color, modulos, permisos, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      data.nombre,
      data.descripcion || null,
      data.area || null,
      data.color || null,
      data.modulos || null,
      data.permisos || null
    ]);
    
    return this.findById(result.lastInsertRowid);
  }

  async update(data) {
    const db = getDb();
    await db.run(`
      UPDATE roles SET
        nombre = COALESCE(?, nombre),
        descripcion = COALESCE(?, descripcion),
        area = COALESCE(?, area),
        color = COALESCE(?, color),
        modulos = COALESCE(?, modulos),
        permisos = COALESCE(?, permisos)
      WHERE id = ?
    `, [
      data.nombre,
      data.descripcion,
      data.area,
      data.color,
      data.modulos,
      data.permisos,
      this.id
    ]);
    
    return Rol.findById(this.id);
  }

  async delete() {
    const db = getDb();
    await db.run('DELETE FROM roles WHERE id = ?', [this.id]);
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      area: this.area,
      color: this.color,
      modulos: this.modulos,
      permisos: this.permisos,
      created_at: this.created_at
    };
  }
}

export { Rol };
