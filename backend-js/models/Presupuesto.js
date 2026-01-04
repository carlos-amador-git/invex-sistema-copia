import { getDb } from '../database.js';

class Presupuesto {
  constructor(data) {
    this.id = data.id;
    this.codigo = data.codigo;
    this.descripcion = data.descripcion;
    this.activo = data.activo;
    this.created_at = data.created_at;
  }

  static async findById(id) {
    const db = getDb();
    const row = await db.get('SELECT * FROM presupuestos WHERE id = ?', [id]);
    return row ? new Presupuesto(row) : null;
  }

  static async getAll(activosOnly = false) {
    const db = getDb();
    let query = 'SELECT * FROM presupuestos';
    if (activosOnly) {
      query += ' WHERE activo = 1';
    }
    query += ' ORDER BY codigo';
    const rows = await db.query(query);
    return rows.map(row => new Presupuesto(row));
  }

  static async create(data) {
    const db = getDb();
    const result = await db.run(`
      INSERT INTO presupuestos (codigo, descripcion, activo, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      data.codigo,
      data.descripcion,
      data.activo !== undefined ? (data.activo ? 1 : 0) : 1
    ]);
    
    return this.findById(result.lastInsertRowid);
  }

  async update(data) {
    const db = getDb();
    await db.run(`
      UPDATE presupuestos SET
        codigo = COALESCE(?, codigo),
        descripcion = COALESCE(?, descripcion),
        activo = COALESCE(?, activo)
      WHERE id = ?
    `, [
      data.codigo,
      data.descripcion,
      data.activo !== undefined ? (data.activo ? 1 : 0) : null,
      this.id
    ]);
    
    return Presupuesto.findById(this.id);
  }

  toJSON() {
    return {
      id: this.id,
      codigo: this.codigo,
      descripcion: this.descripcion,
      activo: !!this.activo,
      created_at: this.created_at
    };
  }
}

export { Presupuesto };
