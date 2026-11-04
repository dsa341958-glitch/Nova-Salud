import { pool } from '../../config/db.js';

// Stock vigente = suma de lotes activos, con stock y no vencidos
const STOCK_SQL = `(SELECT COALESCE(SUM(l.stock_actual), 0) FROM lotes l
   WHERE l.producto_id = p.id AND l.activo = 1 AND l.fecha_vencimiento > CURDATE())`;

const COLUMNAS = `p.id, p.codigo_barras, p.nombre, p.principio_activo, p.laboratorio, p.presentacion,
  p.requiere_receta, p.precio_venta, p.stock_minimo, p.activo, p.categoria_id,
  c.nombre AS categoria, ${STOCK_SQL} AS stock_total`;

export const productosRepository = {
  async listar({ q, categoriaId, estado, bajoStock, pagina, limite }) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(p.nombre LIKE ? OR p.principio_activo LIKE ? OR p.codigo_barras = ?)');
      params.push(`%${q}%`, `%${q}%`, q);
    }
    if (categoriaId) { where.push('p.categoria_id = ?'); params.push(categoriaId); }
    if (estado === 'activos') where.push('p.activo = 1');
    if (estado === 'inactivos') where.push('p.activo = 0');

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const having = bajoStock ? 'HAVING stock_total <= p.stock_minimo' : '';

    const [filas] = await pool.query(
      `SELECT ${COLUMNAS} FROM productos p JOIN categorias c ON c.id = p.categoria_id
       ${whereSql} ${having} ORDER BY p.nombre LIMIT ? OFFSET ?`,
      [...params, limite, (pagina - 1) * limite]);

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM (
         SELECT p.id, ${STOCK_SQL} AS stock_total, p.stock_minimo
         FROM productos p ${whereSql} ${having}
       ) t`, params);

    return { filas, total };
  },

  // Búsqueda ligera para el POS: solo productos activos
  async buscarPOS(q, limite = 15) {
    const [exacto] = await pool.query(
      `SELECT ${COLUMNAS} FROM productos p JOIN categorias c ON c.id = p.categoria_id
       WHERE p.activo = 1 AND p.codigo_barras = ? LIMIT 1`, [q]);
    if (exacto.length) return exacto;

    const [rows] = await pool.query(
      `SELECT ${COLUMNAS} FROM productos p JOIN categorias c ON c.id = p.categoria_id
       WHERE p.activo = 1 AND (p.nombre LIKE ? OR p.principio_activo LIKE ?)
       ORDER BY (p.nombre LIKE ?) DESC, p.nombre LIMIT ?`,
      [`%${q}%`, `%${q}%`, `${q}%`, limite]);
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT ${COLUMNAS} FROM productos p JOIN categorias c ON c.id = p.categoria_id
       WHERE p.id = ?`, [id]);
    return rows[0] || null;
  },

  async buscarPorCodigoBarras(codigo) {
    const [rows] = await pool.query('SELECT id FROM productos WHERE codigo_barras = ?', [codigo]);
    return rows[0] || null;
  },

  async crear(d) {
    const [res] = await pool.query(
      `INSERT INTO productos (categoria_id, codigo_barras, nombre, principio_activo, laboratorio,
        presentacion, requiere_receta, precio_venta, stock_minimo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.categoriaId, d.codigoBarras || null, d.nombre, d.principioActivo || null, d.laboratorio || null,
       d.presentacion || null, d.requiereReceta ? 1 : 0, d.precioVenta, d.stockMinimo]);
    return res.insertId;
  },

  async actualizar(id, d) {
    const [res] = await pool.query(
      `UPDATE productos SET categoria_id = ?, codigo_barras = ?, nombre = ?, principio_activo = ?,
        laboratorio = ?, presentacion = ?, requiere_receta = ?, precio_venta = ?, stock_minimo = ?
       WHERE id = ?`,
      [d.categoriaId, d.codigoBarras || null, d.nombre, d.principioActivo || null, d.laboratorio || null,
       d.presentacion || null, d.requiereReceta ? 1 : 0, d.precioVenta, d.stockMinimo, id]);
    return res.affectedRows > 0;
  },

  async cambiarEstado(id, activo) {
    const [res] = await pool.query('UPDATE productos SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
    return res.affectedRows > 0;
  },

  async categoriaActiva(id) {
    const [rows] = await pool.query('SELECT id FROM categorias WHERE id = ? AND activo = 1', [id]);
    return rows.length > 0;
  },

  async auditar({ usuarioId, accion, registroId, detalle, ip }) {
    await pool.query(
      `INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, detalle, ip)
       VALUES (?, ?, 'productos', ?, ?, ?)`,
      [usuarioId, accion, String(registroId), detalle ? JSON.stringify(detalle) : null, ip]);
  },
};