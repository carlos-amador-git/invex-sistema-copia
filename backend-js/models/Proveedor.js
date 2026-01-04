import { getDb } from '../database.js';

class Proveedor {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.tiempo_entrega = data.tiempo_entrega;
    this.contacto = data.contacto;
    this.email = data.email;
    this.telefono = data.telefono;
    this.activo = Boolean(data.activo);
    this.created_at = data.created_at;
  }

  static async findById(id) {
    const db = getDb();
    const row = await db.get('SELECT * FROM proveedores WHERE id = ?', [id]);
    return row ? new Proveedor(row) : null;
  }

  static async findByNombre(nombre) {
    const db = getDb();
    const row = await db.get('SELECT * FROM proveedores WHERE nombre = ?', [nombre]);
    return row ? new Proveedor(row) : null;
  }

  static async getAll() {
    const db = getDb();
    const rows = await db.query('SELECT * FROM proveedores ORDER BY nombre');
    return rows.map(row => new Proveedor(row));
  }

  static async create(data) {
    const db = getDb();
    const result = await db.run(`
      INSERT INTO proveedores (nombre, tiempo_entrega, contacto, email, telefono, activo, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      data.nombre,
      data.tiempo_entrega || null,
      data.contacto || null,
      data.email || null,
      data.telefono || null,
      data.activo !== false ? 1 : 0
    ]);
    
    return this.findById(result.lastInsertRowid);
  }

  async update(data) {
    const db = getDb();
    await db.run(`
      UPDATE proveedores SET
        nombre = COALESCE(?, nombre),
        tiempo_entrega = COALESCE(?, tiempo_entrega),
        contacto = COALESCE(?, contacto),
        email = COALESCE(?, email),
        telefono = COALESCE(?, telefono),
        activo = COALESCE(?, activo)
      WHERE id = ?
    `, [
      data.nombre,
      data.tiempo_entrega,
      data.contacto,
      data.email,
      data.telefono,
      data.activo !== undefined ? (data.activo ? 1 : 0) : null,
      this.id
    ]);
    
    return Proveedor.findById(this.id);
  }

  async delete() {
    const db = getDb();
    await db.run('DELETE FROM proveedores WHERE id = ?', [this.id]);
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      tiempo_entrega: this.tiempo_entrega,
      contacto: this.contacto,
      email: this.email,
      telefono: this.telefono,
      activo: this.activo,
      created_at: this.created_at
    };
  }
}

export { Proveedor };
