import express from 'express';
import { ProcesoBAU, Presupuesto } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { getDb } from '../database.js';

const router = express.Router();

router.get('/presupuestos', authenticateToken, async (req, res) => {
  try {
    const activosOnly = req.query.activos_only === 'true';
    const presupuestos = await Presupuesto.getAll(activosOnly);
    res.json(presupuestos.map(p => p.toJSON()));
  } catch (error) {
    console.error('Error getting presupuestos:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/presupuestos', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { codigo, descripcion } = req.body;
    if (!codigo) {
      return res.status(400).json({ detail: 'El código es requerido' });
    }

    const allPresupuestos = await Presupuesto.getAll();
    const existing = allPresupuestos.find(p => p.codigo === codigo);
    if (existing) {
      return res.status(400).json({ detail: 'El código de presupuesto ya existe' });
    }

    const presupuesto = await Presupuesto.create({ codigo, descripcion, activo: true });
    res.status(201).json(presupuesto.toJSON());
  } catch (error) {
    console.error('Error creating presupuesto:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.delete('/presupuestos/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const presupuesto = await Presupuesto.findById(parseInt(req.params.id));
    if (!presupuesto) {
      return res.status(404).json({ detail: 'Presupuesto no encontrado' });
    }

    // Update to inactive instead of hard delete
    await presupuesto.update({ activo: false });
    res.json({ message: 'Presupuesto desactivado' });
  } catch (error) {
    console.error('Error deleting presupuesto:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/upload-batch', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ detail: 'Se espera un array de items' });
    }

    let creados = 0;
    let actualizados = 0;
    let errores = 0;

    const db = getDb();

    // Start transaction manually
    await db.exec('BEGIN');

    try {
      // Load all budgets once to avoid repeated queries
      const allPresupuestos = await Presupuesto.getAll();
      
      for (const item of items) {
        try {
          const { producto_id, tipo_proceso, mes, anio, cantidad, presupuesto_codigo } = item;
          
          if (!producto_id || !tipo_proceso || !mes || !anio) {
            errores++;
            continue;
          }

          // Resolve presupuesto_id if code provided
          let presupuesto_id = null;
          if (presupuesto_codigo) {
            let presupuesto = allPresupuestos.find(p => p.codigo === presupuesto_codigo);
            if (!presupuesto) {
              // Create new budget on the fly? 
              // Better to create it if it doesn't exist, but we need to update our local list
              presupuesto = await Presupuesto.create({ codigo: presupuesto_codigo, descripcion: 'Auto-created from upload' });
              allPresupuestos.push(presupuesto);
            }
            presupuesto_id = presupuesto.id;
          }

          const existing = await ProcesoBAU.findOne(producto_id, tipo_proceso, mes, anio);
          
          if (existing) {
            await existing.update({ cantidad, presupuesto_id });
            actualizados++;
          } else {
            await ProcesoBAU.create({ producto_id, tipo_proceso, mes, anio, cantidad, presupuesto_id });
            creados++;
          }
        } catch (err) {
          console.error('Error processing item:', err);
          errores++;
        }
      }
      
      await db.exec('COMMIT');
      res.json({ creados, actualizados, errores });
      
    } catch (transactionError) {
      await db.exec('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Error processing batch:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const procesos = await ProcesoBAU.getAll();
    res.json(procesos.map(p => p.toJSON()));
  } catch (error) {
    console.error('Error getting procesos:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const proceso = await ProcesoBAU.findById(parseInt(req.params.id));
    if (!proceso) {
      return res.status(404).json({ detail: 'Proceso no encontrado' });
    }
    res.json(proceso.toJSON());
  } catch (error) {
    console.error('Error getting proceso:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { producto_id, tipo_proceso, mes, anio, cantidad, presupuesto_id } = req.body;

    if (!producto_id || !tipo_proceso || !mes || !anio) {
      return res.status(400).json({ detail: 'producto_id, tipo_proceso, mes y anio son requeridos' });
    }

    const existing = await ProcesoBAU.findOne(producto_id, tipo_proceso, mes, anio);
    if (existing) {
      return res.status(400).json({ detail: 'El proceso ya existe para este producto, tipo, mes y año' });
    }

    const proceso = await ProcesoBAU.create({ producto_id, tipo_proceso, mes, anio, cantidad, presupuesto_id });
    res.status(201).json(proceso.toJSON());
  } catch (error) {
    console.error('Error creating proceso:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    let proceso = await ProcesoBAU.findById(parseInt(req.params.id));
    if (!proceso) {
      return res.status(404).json({ detail: 'Proceso no encontrado' });
    }

    proceso = await proceso.update(req.body);
    res.json(proceso.toJSON());
  } catch (error) {
    console.error('Error updating proceso:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const proceso = await ProcesoBAU.findById(parseInt(req.params.id));
    if (!proceso) {
      return res.status(404).json({ detail: 'Proceso no encontrado' });
    }

    await proceso.delete();
    res.json({ message: 'Proceso eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting proceso:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

export default router;
