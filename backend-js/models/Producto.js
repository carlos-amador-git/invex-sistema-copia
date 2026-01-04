import { getDb } from '../database.js';
import { Proveedor } from './Proveedor.js';

class Producto {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.proveedor_id = data.proveedor_id;
    this.tiempo_entrega = data.tiempo_entrega;
    this.costo_unitario = data.costo_unitario;
    this.marca = data.marca;
    this.tipo = data.tipo;
    this.activo = Boolean(data.activo);
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.proveedor = null;
  }

  static async findById(id) {
    const db = getDb();
    const row = await db.get('SELECT * FROM productos WHERE id = ?', [id]);
    return row ? new Producto(row) : null;
  }

  static async getAll() {
    const db = getDb();
    const rows = await db.query('SELECT * FROM productos ORDER BY id');
    return rows.map(row => new Producto(row));
  }

  static async create(data) {
    const db = getDb();
    await db.run(`
      INSERT INTO productos (id, nombre, proveedor_id, tiempo_entrega, costo_unitario, marca, tipo, activo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      data.id,
      data.nombre,
      data.proveedor_id || null,
      data.tiempo_entrega || null,
      data.costo_unitario || null,
      data.marca || null,
      data.tipo || null,
      data.activo !== false ? 1 : 0
    ]);
    
    return this.findById(data.id);
  }

  async update(data) {
    const db = getDb();
    await db.run(`
      UPDATE productos SET
        nombre = COALESCE(?, nombre),
        proveedor_id = COALESCE(?, proveedor_id),
        tiempo_entrega = COALESCE(?, tiempo_entrega),
        costo_unitario = COALESCE(?, costo_unitario),
        marca = COALESCE(?, marca),
        tipo = COALESCE(?, tipo),
        activo = COALESCE(?, activo),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data.nombre,
      data.proveedor_id,
      data.tiempo_entrega,
      data.costo_unitario,
      data.marca,
      data.tipo,
      data.activo !== undefined ? (data.activo ? 1 : 0) : null,
      this.id
    ]);
    
    return Producto.findById(this.id);
  }

  async delete() {
    const db = getDb();
    await db.run('DELETE FROM productos WHERE id = ?', [this.id]);
  }

  async loadProveedor() {
    if (this.proveedor_id) {
      this.proveedor = await Proveedor.findById(this.proveedor_id);
    }
    return this;
  }

  toJSON() {
    const result = {
      id: this.id,
      nombre: this.nombre,
      proveedor_id: this.proveedor_id,
      tiempo_entrega: this.tiempo_entrega,
      costo_unitario: this.costo_unitario,
      marca: this.marca,
      tipo: this.tipo,
      activo: this.activo,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
    if (this.proveedor) {
      result.proveedor = this.proveedor;
    }
    return result;
  }
}

export { Producto };
