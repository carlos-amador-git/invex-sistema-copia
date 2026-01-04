import { getDb } from '../database.js';
import { Producto } from './Producto.js';

class Inventario {
  constructor(data) {
    this.id = data.id;
    this.producto_id = data.producto_id;
    this.boveda_trabajo = data.boveda_trabajo || 0;
    this.boveda_principal = data.boveda_principal || 0;
    this.en_proceso_cantidad = data.en_proceso_cantidad || 0;
    this.ordenes_activas = data.ordenes_activas || 0;
    this.dist_colocacion = data.dist_colocacion || 0;
    this.dist_normal = data.dist_normal || 0;
    this.dist_devoluciones = data.dist_devoluciones || 0;
    this.mod_colocacion = data.mod_colocacion || 0;
    this.mod_stock = data.mod_stock || 0;
    this.fecha_compra_sugerida = data.fecha_compra_sugerida;
    this.fecha_entrega_estimada = data.fecha_entrega_estimada;
    this.mes_alerta = data.mes_alerta;
    this.presupuesto_pym01 = data.presupuesto_pym01 || 0;
    this.presupuesto_adq7 = data.presupuesto_adq7 || 0;
    this.updated_at = data.updated_at;
    this.trasco_rep = data.trasco_rep || 0;
    this.mod_normal = data.mod_normal || 0;
    this.producto = null;
  }

  static async findById(id) {
    const db = getDb();
    const row = await db.get('SELECT * FROM inventarios WHERE id = ?', [id]);
    return row ? new Inventario(row) : null;
  }

  static async findByProductoId(producto_id) {
    const db = getDb();
    const row = await db.get('SELECT * FROM inventarios WHERE producto_id = ?', [producto_id]);
    return row ? new Inventario(row) : null;
  }

  static async getAll() {
    const db = getDb();
    const rows = await db.query('SELECT * FROM inventarios ORDER BY id');
    return rows.map(row => new Inventario(row));
  }

  static async getAllWithProducto() {
    const db = getDb();
    const rows = await db.query(`
      SELECT i.*, p.nombre as producto_nombre, p.marca, p.tipo
      FROM inventarios i
      LEFT JOIN productos p ON i.producto_id = p.id
      ORDER BY i.id
    `);
    return rows.map(row => ({
      ...new Inventario(row),
      producto_nombre: row.producto_nombre,
      marca: row.marca,
      tipo: row.tipo
    }));
  }

  static async create(data) {
    const db = getDb();
    const result = await db.run(`
      INSERT INTO inventarios (
        producto_id, boveda_trabajo, boveda_principal, en_proceso_cantidad,
        ordenes_activas, dist_colocacion, dist_normal, dist_devoluciones,
        mod_colocacion, mod_stock, fecha_compra_sugerida, fecha_entrega_estimada,
        mes_alerta, presupuesto_pym01, presupuesto_adq7, updated_at, trasco_rep, mod_normal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    `, [
      data.producto_id,
      data.boveda_trabajo || 0,
      data.boveda_principal || 0,
      data.en_proceso_cantidad || 0,
      data.ordenes_activas || 0,
      data.dist_colocacion || 0,
      data.dist_normal || 0,
      data.dist_devoluciones || 0,
      data.mod_colocacion || 0,
      data.mod_stock || 0,
      data.fecha_compra_sugerida || null,
      data.fecha_entrega_estimada || null,
      data.mes_alerta || null,
      data.presupuesto_pym01 || 0,
      data.presupuesto_adq7 || 0,
      data.trasco_rep || 0,
      data.mod_normal || 0
    ]);
    
    return this.findById(result.lastInsertRowid);
  }

  async update(data) {
    const db = getDb();
    await db.run(`
      UPDATE inventarios SET
        boveda_trabajo = COALESCE(?, boveda_trabajo),
        boveda_principal = COALESCE(?, boveda_principal),
        en_proceso_cantidad = COALESCE(?, en_proceso_cantidad),
        ordenes_activas = COALESCE(?, ordenes_activas),
        dist_colocacion = COALESCE(?, dist_colocacion),
        dist_normal = COALESCE(?, dist_normal),
        dist_devoluciones = COALESCE(?, dist_devoluciones),
        mod_colocacion = COALESCE(?, mod_colocacion),
        mod_stock = COALESCE(?, mod_stock),
        fecha_compra_sugerida = COALESCE(?, fecha_compra_sugerida),
        fecha_entrega_estimada = COALESCE(?, fecha_entrega_estimada),
        mes_alerta = COALESCE(?, mes_alerta),
        presupuesto_pym01 = COALESCE(?, presupuesto_pym01),
        presupuesto_adq7 = COALESCE(?, presupuesto_adq7),
        updated_at = CURRENT_TIMESTAMP,
        trasco_rep = COALESCE(?, trasco_rep),
        mod_normal = COALESCE(?, mod_normal)
      WHERE id = ?
    `, [
      data.boveda_trabajo,
      data.boveda_principal,
      data.en_proceso_cantidad,
      data.ordenes_activas,
      data.dist_colocacion,
      data.dist_normal,
      data.dist_devoluciones,
      data.mod_colocacion,
      data.mod_stock,
      data.fecha_compra_sugerida,
      data.fecha_entrega_estimada,
      data.mes_alerta,
      data.presupuesto_pym01,
      data.presupuesto_adq7,
      data.trasco_rep,
      data.mod_normal,
      this.id
    ]);
    
    return Inventario.findById(this.id);
  }

  async loadProducto() {
    if (this.producto_id) {
      this.producto = await Producto.findById(this.producto_id);
    }
    return this;
  }

  toJSON() {
    const result = {
      id: this.id,
      producto_id: this.producto_id,
      boveda_trabajo: this.boveda_trabajo,
      boveda_principal: this.boveda_principal,
      en_proceso_cantidad: this.en_proceso_cantidad,
      ordenes_activas: this.ordenes_activas,
      dist_colocacion: this.dist_colocacion,
      dist_normal: this.dist_normal,
      dist_devoluciones: this.dist_devoluciones,
      mod_colocacion: this.mod_colocacion,
      mod_stock: this.mod_stock,
      fecha_compra_sugerida: this.fecha_compra_sugerida,
      fecha_entrega_estimada: this.fecha_entrega_estimada,
      mes_alerta: this.mes_alerta,
      presupuesto_pym01: this.presupuesto_pym01,
      presupuesto_adq7: this.presupuesto_adq7,
      updated_at: this.updated_at,
      trasco_rep: this.trasco_rep,
      mod_normal: this.mod_normal
    };
    if (this.producto) {
      result.producto = this.producto;
    }
    return result;
  }
}

export { Inventario };
