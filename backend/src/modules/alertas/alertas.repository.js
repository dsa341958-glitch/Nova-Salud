import { pool } from '../../config/db.js';

// Un solo helper para los INSERT ... SELECT: devuelve cuántas alertas se crearon
const ejecutar = async (sql, params = []) => (await pool.query(sql, params))[0].affectedRows;

export const alertasRepository = {
  // ---------- Cierre automático (el problema ya se resolvió) ----------
  cerrarStockBajo: () => ejecutar(
    `UPDATE alertas SET estado = 'ATENDIDA'
     WHERE tipo = 'STOCK_BAJO' AND estado <> 'ATENDIDA'
       AND producto_id NOT IN (
         SELECT producto_id FROM v_stock_producto WHERE stock_total > 0 AND stock_total <= stock_minimo)`),

  cerrarSinStock: () => ejecutar(
    `UPDATE alertas SET estado = 'ATENDIDA'
     WHERE tipo = 'SIN_STOCK' AND estado <> 'ATENDIDA'
       AND producto_id NOT IN (SELECT producto_id FROM v_stock_producto WHERE stock_total = 0)`),

  cerrarPorVencer: (dias) => ejecutar(
    `UPDATE alertas SET estado = 'ATENDIDA'
     WHERE tipo = 'POR_VENCER' AND estado <> 'ATENDIDA'
       AND lote_id NOT IN (
         SELECT id FROM lotes
         WHERE activo = 1 AND stock_actual > 0 AND fecha_vencimiento > CURDATE()
           AND fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL ? DAY))`, [dias]),

  cerrarVencidos: () => ejecutar(
    `UPDATE alertas SET estado = 'ATENDIDA'
     WHERE tipo = 'VENCIDO' AND estado <> 'ATENDIDA'
       AND lote_id NOT IN (
         SELECT id FROM lotes WHERE activo = 1 AND stock_actual > 0 AND fecha_vencimiento <= CURDATE())`),

  // ---------- Creación (solo si no hay una alerta abierta para lo mismo) ----------
  crearSinStock: () => ejecutar(
    `INSERT INTO alertas (tipo, producto_id, lote_id, mensaje)
     SELECT 'SIN_STOCK', s.producto_id, NULL,
            LEFT(CONCAT('Sin stock: "', s.nombre, '" no tiene unidades disponibles'), 255)
     FROM v_stock_producto s
     WHERE s.stock_total = 0
       AND NOT EXISTS (SELECT 1 FROM alertas a
                       WHERE a.tipo = 'SIN_STOCK' AND a.producto_id = s.producto_id AND a.estado <> 'ATENDIDA')`),

  crearStockBajo: () => ejecutar(
    `INSERT INTO alertas (tipo, producto_id, lote_id, mensaje)
     SELECT 'STOCK_BAJO', s.producto_id, NULL,
            LEFT(CONCAT('Stock bajo: "', s.nombre, '" tiene ', s.stock_total, ' unidades (mínimo ', s.stock_minimo, ')'), 255)
     FROM v_stock_producto s
     WHERE s.stock_total > 0 AND s.stock_total <= s.stock_minimo
       AND NOT EXISTS (SELECT 1 FROM alertas a
                       WHERE a.tipo = 'STOCK_BAJO' AND a.producto_id = s.producto_id AND a.estado <> 'ATENDIDA')`),

  crearPorVencer: (dias) => ejecutar(
    `INSERT INTO alertas (tipo, producto_id, lote_id, mensaje)
     SELECT 'POR_VENCER', l.producto_id, l.id,
            LEFT(CONCAT('Por vencer: "', p.nombre, '" lote ', l.codigo_lote, ' vence el ', l.fecha_vencimiento,
                        ' (', DATEDIFF(l.fecha_vencimiento, CURDATE()), ' días, ', l.stock_actual, ' unidades)'), 255)
     FROM lotes l JOIN productos p ON p.id = l.producto_id
     WHERE l.activo = 1 AND p.activo = 1 AND l.stock_actual > 0
       AND l.fecha_vencimiento > CURDATE()
       AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       AND NOT EXISTS (SELECT 1 FROM alertas a
                       WHERE a.tipo = 'POR_VENCER' AND a.lote_id = l.id AND a.estado <> 'ATENDIDA')`, [dias]),

  crearVencidos: () => ejecutar(
    `INSERT INTO alertas (tipo, producto_id, lote_id, mensaje)
     SELECT 'VENCIDO', l.producto_id, l.id,
            LEFT(CONCAT('Vencido: "', p.nombre, '" lote ', l.codigo_lote, ' venció el ', l.fecha_vencimiento,
                        ' y aún tiene ', l.stock_actual, ' unidades. Registrar merma'), 255)
     FROM lotes l JOIN productos p ON p.id = l.producto_id
     WHERE l.activo = 1 AND l.stock_actual > 0 AND l.fecha_vencimiento <= CURDATE()
       AND NOT EXISTS (SELECT 1 FROM alertas a
                       WHERE a.tipo = 'VENCIDO' AND a.lote_id = l.id AND a.estado <> 'ATENDIDA')`),

  // ---------- Consultas ----------
  async listar({ estado, tipo, pagina, limite }) {
    const where = [];
    const params = [];
    if (!estado || estado === 'activas') where.push("a.estado <> 'ATENDIDA'");
    else { where.push('a.estado = ?'); params.push(estado); }
    if (tipo) { where.push('a.tipo = ?'); params.push(tipo); }
    const whereSql = `WHERE ${where.join(' AND ')}`;

    const [filas] = await pool.query(
      `SELECT a.id, a.tipo, a.estado, a.mensaje, a.creada_en, a.producto_id, p.nombre AS producto,
              a.lote_id, l.codigo_lote
       FROM alertas a
       JOIN productos p ON p.id = a.producto_id
       LEFT JOIN lotes l ON l.id = a.lote_id
       ${whereSql}
       ORDER BY (a.estado = 'NUEVA') DESC,
                FIELD(a.tipo, 'VENCIDO', 'SIN_STOCK', 'POR_VENCER', 'STOCK_BAJO'),
                a.creada_en DESC
       LIMIT ? OFFSET ?`,
      [...params, limite, (pagina - 1) * limite]);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM alertas a ${whereSql}`, params);
    return { filas, total };
  },

  async resumen() {
    const [porTipo] = await pool.query(
      `SELECT tipo, COUNT(*) AS cantidad FROM alertas WHERE estado <> 'ATENDIDA' GROUP BY tipo`);
    const [[{ nuevas }]] = await pool.query(
      "SELECT COUNT(*) AS nuevas FROM alertas WHERE estado = 'NUEVA'");
    return { porTipo, nuevas };
  },

  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT id, estado FROM alertas WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async marcarVista(id) {
    const [res] = await pool.query("UPDATE alertas SET estado = 'VISTA' WHERE id = ? AND estado = 'NUEVA'", [id]);
    return res.affectedRows > 0;
  },

  async marcarTodasVistas() {
    const [res] = await pool.query("UPDATE alertas SET estado = 'VISTA' WHERE estado = 'NUEVA'");
    return res.affectedRows;
  },
};