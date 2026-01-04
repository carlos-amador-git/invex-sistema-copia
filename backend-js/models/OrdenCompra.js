import { getDb } from '../database.js';

class OrdenCompra {
  constructor(data) {
    this.id = data.id;
    this.producto_id = data.producto_id;
    this.proveedor_id = data.proveedor_id;
    this.cantidad = data.cantidad;
    this.presupuesto = data.presupuesto;
    this.estatus = data.estatus;
    this.fecha_orden = data.fecha_orden;
    this.fecha_entrega = data.fecha_entrega;
    this.costo_total = data.costo_total;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.costo_unitario = data.costo_unitario;
    this.descuento = data.descuento;
    this.requi = data.requi;
    this.provision = data.provision;
    this.validacion = data.validacion;
    this.tipo_material = data.tipo_material;
    this.caracteristica = data.caracteristica;
    this.nombre_producto = data.nombre_producto;
  }

  static async findById(id) {
    const db = getDb();
    const row = await db.get('SELECT * FROM ordenes_compra WHERE id = ?', [id]);
    return row ? new OrdenCompra(row) : null;
  }

  static async getAll() {
    const db = getDb();
    const rows = await db.query('SELECT * FROM ordenes_compra ORDER BY created_at DESC');
    return rows.map(row => new OrdenCompra(row));
  }

  static async create(data) {
    const db = getDb();
    await db.run(`
      INSERT INTO ordenes_compra (
        id, producto_id, proveedor_id, cantidad, presupuesto, estatus,
        fecha_orden, fecha_entrega, costo_total, created_at, updated_at,
        costo_unitario, descuento, requi, provision, validacion, tipo_material, caracteristica, nombre_producto
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.id,
      data.producto_id,
      data.proveedor_id || null,
      data.cantidad,
      data.presupuesto || null,
      data.estatus || 'PENDIENTE',
      data.fecha_orden || null,
      data.fecha_entrega || null,
      data.costo_total || 0,
      data.costo_unitario || null,
      data.descuento || null,
      data.requi || null,
      data.provision || null,
      data.validacion || null,
      data.tipo_material || null,
      data.caracteristica || null,
      data.nombre_producto || null
    ]);
    
    return this.findById(data.id);
  }

  async update(data) {
    const db = getDb();
    await db.run(`
      UPDATE ordenes_compra SET
        producto_id = COALESCE(?, producto_id),
        proveedor_id = COALESCE(?, proveedor_id),
        cantidad = COALESCE(?, cantidad),
        presupuesto = COALESCE(?, presupuesto),
        estatus = COALESCE(?, estatus),
        fecha_orden = COALESCE(?, fecha_orden),
        fecha_entrega = COALESCE(?, fecha_entrega),
        costo_total = COALESCE(?, costo_total),
        updated_at = CURRENT_TIMESTAMP,
        costo_unitario = COALESCE(?, costo_unitario),
        descuento = COALESCE(?, descuento),
        requi = COALESCE(?, requi),
        provision = COALESCE(?, provision),
        validacion = COALESCE(?, validacion),
        tipo_material = COALESCE(?, tipo_material),
        caracteristica = COALESCE(?, caracteristica),
        nombre_producto = COALESCE(?, nombre_producto)
      WHERE id = ?
    `, [
      data.producto_id,
      data.proveedor_id,
      data.cantidad,
      data.presupuesto,
      data.estatus,
      data.fecha_orden,
      data.fecha_entrega,
      data.costo_total,
      data.costo_unitario,
      data.descuento,
      data.requi,
      data.provision,
      data.validacion,
      data.tipo_material,
      data.caracteristica,
      data.nombre_producto,
      this.id
    ]);
    
    return OrdenCompra.findById(this.id);
  }

  async delete() {
    const db = getDb();
    await db.run('DELETE FROM ordenes_compra WHERE id = ?', [this.id]);
  }

  toJSON() {
    return {
      id: this.id,
      producto_id: this.producto_id,
      proveedor_id: this.proveedor_id,
      cantidad: this.cantidad,
      presupuesto: this.presupuesto,
      estatus: this.estatus,
      fecha_orden: this.fecha_orden,
      fecha_entrega: this.fecha_entrega,
      costo_total: this.costo_total,
      created_at: this.created_at,
      updated_at: this.updated_at,
      costo_unitario: this.costo_unitario,
      descuento: this.descuento,
      requi: this.requi,
      provision: this.provision,
      validacion: this.validacion,
      tipo_material: this.tipo_material,
      caracteristica: this.caracteristica,
      nombre_producto: this.nombre_producto
    };
  }
}

export { OrdenCompra };
