import { getDb } from '../database.js';
import { Producto } from './Producto.js';

class ProcesoBAU {
  constructor(data) {
    this.id = data.id;
    this.producto_id = data.producto_id;
    this.tipo_proceso = data.tipo_proceso;
    this.mes = data.mes;
    this.anio = data.anio;
    this.cantidad = data.cantidad || 0;
    this.presupuesto_id = data.presupuesto_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findById(id) {
    const db = getDb();
    const row = await db.get('SELECT * FROM procesos_bau WHERE id = ?', [id]);
    return row ? new ProcesoBAU(row) : null;
  }

  static async findOne(producto_id, tipo_proceso, mes, anio) {
    const db = getDb();
    const row = await db.get(`
      SELECT * FROM procesos_bau
      WHERE producto_id = ? AND tipo_proceso = ? AND mes = ? AND anio = ?
    `, [producto_id, tipo_proceso, mes, anio]);
    return row ? new ProcesoBAU(row) : null;
  }

  static async getAll() {
    const db = getDb();
    const rows = await db.query('SELECT * FROM procesos_bau ORDER BY anio DESC, mes DESC');
    return rows.map(row => new ProcesoBAU(row));
  }

  static async create(data) {
    const db = getDb();
    const now = db.isPostgres ? 'CURRENT_TIMESTAMP' : "datetime('now')";
    
    // For Postgres compatibility, use manual current timestamp in SQL or let DB handle it?
    // Let's rely on DB adapter handling or explicit SQL if simple.
    // Actually, datetime('now') is SQLite specific. CURRENT_TIMESTAMP is standard.
    // Let's switch to CURRENT_TIMESTAMP in SQL.
    
    const result = await db.run(`
      INSERT INTO procesos_bau (producto_id, tipo_proceso, mes, anio, cantidad, presupuesto_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      data.producto_id,
      data.tipo_proceso,
      data.mes,
      data.anio,
      data.cantidad || 0,
      data.presupuesto_id || null
    ]);
    
    // lastInsertRowid is provided by our adapter
    return this.findById(result.lastInsertRowid);
  }

  async update(data) {
    const db = getDb();
    // COALESCE is standard SQL.
    // datetime('now') -> CURRENT_TIMESTAMP
    await db.run(`
      UPDATE procesos_bau SET
        producto_id = COALESCE(?, producto_id),
        tipo_proceso = COALESCE(?, tipo_proceso),
        mes = COALESCE(?, mes),
        anio = COALESCE(?, anio),
        cantidad = COALESCE(?, cantidad),
        presupuesto_id = COALESCE(?, presupuesto_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data.producto_id,
      data.tipo_proceso,
      data.mes,
      data.anio,
      data.cantidad,
      data.presupuesto_id,
      this.id
    ]);
    
    return ProcesoBAU.findById(this.id);
  }

  async delete() {
    const db = getDb();
    await db.run('DELETE FROM procesos_bau WHERE id = ?', [this.id]);
  }

  toJSON() {
    return {
      id: this.id,
      producto_id: this.producto_id,
      tipo_proceso: this.tipo_proceso,
      mes: this.mes,
      anio: this.anio,
      cantidad: this.cantidad,
      presupuesto_id: this.presupuesto_id,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export { ProcesoBAU };
