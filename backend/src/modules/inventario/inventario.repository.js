import { pool } from '../../config/db.js';

export const inventarioRepository = {
  // ---- Funciones con conexión de transacción (las usan compras, ajustes y luego ventas) ----
  async crearMovimiento(conn, { loteId, usuarioId, tipo, cantidad, stockResultante, referencia, motivo }) {
    await conn.query(
      `INSERT INTO movimientos_inventario (lote_id, usuario_id, tipo, cantidad, stock_resultante, referencia, motivo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [loteId, usuarioId, tipo, cantidad, stockResultante, referencia || null, motivo || null]);
  },

  async auditarTx(conn, { usuarioId, accion, tabla, registroId, detalle, ip }) {
    await conn.query(
      'INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, detalle, ip) VALUES (?, ?, ?, ?, ?, ?)',
      [usuarioId, accion, tabla, String(registroId), detalle ? JSON.stringify(detalle) : null, ip]);
  },

  async loteParaActualizar(conn, id) {
    const [rows] = await conn.query(
      `SELECT id, producto_id, stock_actual, cantidad_inicial, activo,
              (fecha_vencimiento <= CURDATE()) AS vencido
       FROM lotes WHERE id = ? FOR UPDATE`, [id]);
    return rows[0] || null;
  },

  async actualizarStockLote(conn, id, stockActual, cantidadInicial) {
    await conn.query('UPDATE lotes SET stock_actual = ?, cantidad_inicial = ? WHERE id = ?',
      [stockActual, cantidadInicial, id]);
  },

  // ---- Consultas ----
  async listarLotes({ productoId, estado, dias, pagina, limite }) {
    const where = ['l.activo = 1'];
    const params = [];
    if (productoId) { where.push('l.producto_id = ?'); params.push(productoId); }
    if (estado === 'vigentes') where.push('l.fecha_vencimiento > CURDATE() AND l.stock_actual > 0');
    if (estado === 'porVencer') {
      where.push('l.stock_actual > 0 AND l.fecha_vencimiento > CURDATE() AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL ? DAY)');
      params.push(dias);
    }
    if (estado === 'vencidos') where.push('l.fecha_vencimiento <= CURDATE() AND l.stock_actual > 0');
    const whereSql = `WHERE ${where.join(' AND ')}`;

    const [filas] = await pool.query(
      `SELECT l.id, l.producto_id, p.nombre AS producto, l.codigo_lote, l.fecha_vencimiento,
              l.cantidad_inicial, l.stock_actual, l.costo_unitario,
              DATEDIFF(l.fecha_vencimiento, CURDATE()) AS dias_restantes
       FROM lotes l JOIN productos p ON p.id = l.producto_id
       ${whereSql} ORDER BY l.fecha_vencimiento, l.id LIMIT ? OFFSET ?`,
      [...params, limite, (pagina - 1) * limite]);
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM lotes l ${whereSql}`, params);
    return { filas, total };
  },

  async kardex({ productoId, loteId, tipo, desde, hasta, pagina, limite }) {
    const where = [];
    const params = [];
    if (productoId) { where.push('p.id = ?'); params.push(productoId); }
    if (loteId) { where.push('m.lote_id = ?'); params.push(loteId); }
    if (tipo) { where.push('m.tipo = ?'); params.push(tipo); }
    if (desde) { where.push('m.fecha >= ?'); params.push(desde); }
    if (hasta) { where.push('m.fecha < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(hasta); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const from = `FROM movimientos_inventario m
      JOIN lotes l ON l.id = m.lote_id JOIN productos p ON p.id = l.producto_id
      JOIN usuarios u ON u.id = m.usuario_id`;

    const [filas] = await pool.query(
      `SELECT m.id, m.fecha, m.tipo, m.cantidad, m.stock_resultante, m.referencia, m.motivo,
              l.codigo_lote, p.id AS producto_id, p.nombre AS producto,
              CONCAT(u.nombres, ' ', u.apellidos) AS usuario
       ${from} ${whereSql} ORDER BY m.fecha DESC, m.id DESC LIMIT ? OFFSET ?`,
      [...params, limite, (pagina - 1) * limite]);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${from} ${whereSql}`, params);
    return { filas, total };
  },
};