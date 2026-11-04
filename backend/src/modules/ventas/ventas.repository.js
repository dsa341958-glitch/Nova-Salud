import { pool } from '../../config/db.js';

export const ventasRepository = {
  // ---- Con conexión de transacción ----
  async productoParaVenta(conn, id) {
    const [rows] = await conn.query(
      'SELECT id, nombre, precio_venta, requiere_receta, activo FROM productos WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async clienteParaVenta(conn, id) {
    const [rows] = await conn.query('SELECT id, tipo_documento, activo FROM clientes WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // Lotes vendibles ordenados FEFO (primero en vencer, primero en salir). FOR UPDATE bloquea las filas.
  async lotesFEFO(conn, productoId) {
    const [rows] = await conn.query(
      `SELECT id, codigo_lote, stock_actual FROM lotes
       WHERE producto_id = ? AND activo = 1 AND stock_actual > 0 AND fecha_vencimiento > CURDATE()
       ORDER BY fecha_vencimiento, id FOR UPDATE`, [productoId]);
    return rows;
  },

  async crearCabecera(conn, { clienteId, usuarioId, tipoComprobante, metodoPago, duracionSegundos }) {
    const [res] = await conn.query(
      `INSERT INTO ventas (cliente_id, usuario_id, tipo_comprobante, metodo_pago, estado, fecha_inicio_atencion, fecha)
       VALUES (?, ?, ?, ?, 'COMPLETADA', DATE_SUB(NOW(), INTERVAL ? SECOND), NOW())`,
      [clienteId || null, usuarioId, tipoComprobante, metodoPago, duracionSegundos]);
    return res.insertId;
  },

  async crearDetalle(conn, d) {
    await conn.query(
      `INSERT INTO detalle_ventas (venta_id, producto_id, lote_id, cantidad, precio_unitario, subtotal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [d.ventaId, d.productoId, d.loteId, d.cantidad, d.precioUnitario, d.subtotal]);
  },

  async fijarStockLote(conn, id, stock) {
    await conn.query('UPDATE lotes SET stock_actual = ? WHERE id = ?', [stock, id]);
  },

  async actualizarTotales(conn, id, { subtotal, igv, total, nroComprobante }) {
    await conn.query(
      'UPDATE ventas SET subtotal = ?, igv = ?, total = ?, nro_comprobante = ? WHERE id = ?',
      [subtotal, igv, total, nroComprobante, id]);
  },

  async ventaParaActualizar(conn, id) {
    const [rows] = await conn.query('SELECT id, estado FROM ventas WHERE id = ? FOR UPDATE', [id]);
    return rows[0] || null;
  },

  async detalleParaAnular(conn, ventaId) {
    const [rows] = await conn.query(
      'SELECT lote_id, cantidad FROM detalle_ventas WHERE venta_id = ? ORDER BY lote_id', [ventaId]);
    return rows;
  },

  async marcarAnulada(conn, id) {
    await conn.query("UPDATE ventas SET estado = 'ANULADA' WHERE id = ?", [id]);
  },

  // ---- Consultas ----
  async listar({ desde, hasta, estado, usuarioId, pagina, limite }) {
    const where = [];
    const params = [];
    if (desde) { where.push('v.fecha >= ?'); params.push(desde); }
    if (hasta) { where.push('v.fecha < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(hasta); }
    if (estado) { where.push('v.estado = ?'); params.push(estado); }
    if (usuarioId) { where.push('v.usuario_id = ?'); params.push(usuarioId); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [filas] = await pool.query(
      `SELECT v.id, v.nro_comprobante, v.tipo_comprobante, v.fecha, v.total, v.metodo_pago, v.estado,
              TIMESTAMPDIFF(SECOND, v.fecha_inicio_atencion, v.fecha) AS tiempo_atencion_seg,
              c.nombres AS cliente, CONCAT(u.nombres, ' ', u.apellidos) AS cajero
       FROM ventas v
       LEFT JOIN clientes c ON c.id = v.cliente_id
       JOIN usuarios u ON u.id = v.usuario_id
       ${whereSql} ORDER BY v.fecha DESC, v.id DESC LIMIT ? OFFSET ?`,
      [...params, limite, (pagina - 1) * limite]);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM ventas v ${whereSql}`, params);
    return { filas, total };
  },

  async obtener(id) {
    const [cab] = await pool.query(
      `SELECT v.id, v.nro_comprobante, v.tipo_comprobante, v.fecha, v.subtotal, v.igv, v.total,
              v.metodo_pago, v.estado, v.usuario_id, v.cliente_id,
              TIMESTAMPDIFF(SECOND, v.fecha_inicio_atencion, v.fecha) AS tiempo_atencion_seg,
              c.nombres AS cliente, c.nro_documento AS cliente_documento,
              CONCAT(u.nombres, ' ', u.apellidos) AS cajero
       FROM ventas v
       LEFT JOIN clientes c ON c.id = v.cliente_id
       JOIN usuarios u ON u.id = v.usuario_id
       WHERE v.id = ?`, [id]);
    if (!cab[0]) return null;
    const [items] = await pool.query(
      `SELECT d.id, p.id AS producto_id, p.nombre AS producto, l.codigo_lote,
              d.cantidad, d.precio_unitario, d.subtotal
       FROM detalle_ventas d
       JOIN productos p ON p.id = d.producto_id
       JOIN lotes l ON l.id = d.lote_id
       WHERE d.venta_id = ? ORDER BY d.id`, [id]);
    return { ...cab[0], items };
  },
};