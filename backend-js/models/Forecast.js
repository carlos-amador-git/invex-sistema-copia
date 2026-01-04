import { getDb } from '../database.js';

class Forecast {
  constructor(data) {
    this.id = data.id;
    this.producto_id = data.producto_id;
    this.mes = data.mes;
    this.anio = data.anio; // Deprecated in new schema but kept for compatibility if needed
    this.colocacion = data.colocacion || 0;
    this.trasco_rep = data.trasco_rep || 0;
    this.btb = data.btb || 0;
    this.renov_anticipada = data.renov_anticipada || 0;
    this.forecast_total = data.forecast_total || data.cantidad || 0;
    this.disponible_con_compra = data.disponible_con_compra || 0;
    this.disponible_sin_compra = data.disponible_sin_compra || 0;
    this.atiende_con_compra = data.atiende_con_compra;
    this.atiende_sin_compra = data.atiende_sin_compra;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findById(id) {
    const db = getDb();
    const row = await db.get('SELECT * FROM forecast WHERE id = ?', [id]);
    return row ? new Forecast(row) : null;
  }

  static async findByProductoId(productoId) {
    const db = getDb();
    const rows = await db.query('SELECT * FROM forecast WHERE producto_id = ? ORDER BY id', [productoId]);
    return rows.map(row => new Forecast(row));
  }

  static async getAll() {
    const db = getDb();
    const rows = await db.query('SELECT * FROM forecast ORDER BY anio DESC, mes DESC');
    return rows.map(row => new Forecast(row));
  }

  static async create(data) {
    const db = getDb();
    const result = await db.run(`
      INSERT INTO forecast (producto_id, mes, anio, cantidad, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      data.producto_id,
      data.mes,
      data.anio,
      data.cantidad || 0
    ]);
    
    return this.findById(result.lastInsertRowid);
  }

  async update(data) {
    const db = getDb();
    await db.run(`
      UPDATE forecast SET
        producto_id = COALESCE(?, producto_id),
        mes = COALESCE(?, mes),
        anio = COALESCE(?, anio),
        cantidad = COALESCE(?, cantidad),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data.producto_id,
      data.mes,
      data.anio,
      data.cantidad,
      this.id
    ]);
    
    return Forecast.findById(this.id);
  }

  async delete() {
    const db = getDb();
    await db.run('DELETE FROM forecast WHERE id = ?', [this.id]);
  }

  toJSON() {
    return {
      id: this.id,
      producto_id: this.producto_id,
      mes: this.mes,
      anio: this.anio,
      colocacion: this.colocacion,
      trasco_rep: this.trasco_rep,
      btb: this.btb,
      renov_anticipada: this.renov_anticipada,
      forecast_total: this.forecast_total,
      disponible_con_compra: this.disponible_con_compra,
      disponible_sin_compra: this.disponible_sin_compra,
      atiende_con_compra: this.atiende_con_compra,
      atiende_sin_compra: this.atiende_sin_compra,
      cantidad: this.forecast_total, // Backward compatibility
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export { Forecast };
