import { pool } from '../../config/db.js';

export const comprasRepository = {
  // ---- Con conexión de transacción ----
  async hoy(conn) {
    const [[r]] = await conn.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy");
    return r.hoy;
  },
  async proveedorActivo(conn, id) {
    const [rows] = await conn.query('SELECT id FROM proveedores WHERE id = ? AND activo = 1', [id]);
    return rows.length > 0;
  },
  async productoActivo(conn, id) {
    const [rows] = await conn.query('SELECT id FROM productos WHERE id = ? AND activo = 1', [id]);
    return rows.length > 0;
  },
  async crearCabecera(conn, { proveedorId, usuarioId, nroDocumento }) {
    const [res] = await conn.query(
      'INSERT INTO compras (proveedor_id, usuario_id, nro_documento) VALUES (?, ?, ?)',
      [proveedorId, usuarioId, nroDocumento || null]);
    return res.insertId;
  },
  async loteExiste(conn, productoId, codigoLote) {
    const [rows] = await conn.query('SELECT id FROM lotes WHERE producto_id = ? AND codigo_lote = ?', [productoId, codigoLote]);
    return rows.length > 0;
  },
  async crearLote(conn, d) {
    const [res] = await conn.query(
      `INSERT INTO lotes (producto_id, compra_id, codigo_lote, fecha_vencimiento, cantidad_inicial, stock_actual, costo_unitario)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [d.productoId, d.compraId, d.codigoLote, d.fechaVencimiento, d.cantidad, d.cantidad, d.costoUnitario]);
    return res.insertId;
  },
  async crearDetalle(conn, d) {
    await conn.query(
      'INSERT INTO detalle_compras (compra_id, lote_id, cantidad, costo_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
      [d.compraId, d.loteId, d.cantidad, d.costoUnitario, d.subtotal]);
  },
  async actualizarTotal(conn, id, total) {
    await conn.query('UPDATE compras SET total = ? WHERE id = ?', [total, id]);
  },
  async compraParaActualizar(conn, id) {
    const [rows] = await conn.query('SELECT id, estado FROM compras WHERE id = ? FOR UPDATE', [id]);
    return rows[0] || null;
  },
  async lotesDeCompra(conn, compraId) {
    const [rows] = await conn.query(
      'SELECT id, stock_actual, cantidad_inicial FROM lotes WHERE compra_id = ? FOR UPDATE', [compraId]);
    return rows;
  },
  async desactivarLote(conn, id) {
    await conn.query('UPDATE lotes SET stock_actual = 0, activo = 0 WHERE id = ?', [id]);
  },
  async marcarAnulada(conn, id) {
    await conn.query("UPDATE compras SET estado = 'ANULADA' WHERE id = ?", [id]);
  },

  // ---- Consultas ----
  async listar({ pagina, limite }) {
    const [filas] = await pool.query(
      `SELECT c.id, c.nro_documento, c.fecha, c.total, c.estado, pr.razon_social AS proveedor,
              CONCAT(u.nombres, ' ', u.apellidos) AS usuario
       FROM compras c JOIN proveedores pr ON pr.id = c.proveedor_id JOIN usuarios u ON u.id = c.usuario_id
       ORDER BY c.fecha DESC, c.id DESC LIMIT ? OFFSET ?`, [limite, (pagina - 1) * limite]);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM compras');
    return { filas, total };
  },

  async obtener(id) {
    const [cab] = await pool.query(
      `SELECT c.id, c.nro_documento, c.fecha, c.total, c.estado, c.proveedor_id, pr.razon_social AS proveedor
       FROM compras c JOIN proveedores pr ON pr.id = c.proveedor_id WHERE c.id = ?`, [id]);
    if (!cab[0]) return null;
    const [items] = await pool.query(
      `SELECT d.id, p.id AS producto_id, p.nombre AS producto, l.codigo_lote, l.fecha_vencimiento,
              d.cantidad, d.costo_unitario, d.subtotal
       FROM detalle_compras d JOIN lotes l ON l.id = d.lote_id JOIN productos p ON p.id = l.producto_id
       WHERE d.compra_id = ?`, [id]);
    return { ...cab[0], items };
  },
};