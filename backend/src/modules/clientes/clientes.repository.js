import { pool } from '../../config/db.js';

const COLS = 'id, tipo_documento, nro_documento, nombres, telefono, email, activo';

export const clientesRepository = {
  async listar({ q, pagina, limite }) {
    const where = [];
    const params = [];
    if (q) {
      where.push('(nombres LIKE ? OR nro_documento LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [filas] = await pool.query(
      `SELECT ${COLS} FROM clientes ${whereSql} ORDER BY nombres LIMIT ? OFFSET ?`,
      [...params, limite, (pagina - 1) * limite]);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM clientes ${whereSql}`, params);
    return { filas, total };
  },

  // Búsqueda ligera para el POS: solo clientes activos
  async buscarRapido(q, limite = 10) {
    const [rows] = await pool.query(
      `SELECT ${COLS} FROM clientes
       WHERE activo = 1 AND (nro_documento LIKE ? OR nombres LIKE ?)
       ORDER BY (nro_documento = ?) DESC, nombres LIMIT ?`,
      [`${q}%`, `%${q}%`, q, limite]);
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(`SELECT ${COLS} FROM clientes WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  async buscarPorDocumento(nroDocumento) {
    const [rows] = await pool.query('SELECT id FROM clientes WHERE nro_documento = ?', [nroDocumento]);
    return rows[0] || null;
  },

  async crear(d) {
    const [res] = await pool.query(
      'INSERT INTO clientes (tipo_documento, nro_documento, nombres, telefono, email) VALUES (?, ?, ?, ?, ?)',
      [d.tipoDocumento, d.nroDocumento, d.nombres, d.telefono || null, d.email || null]);
    return res.insertId;
  },

  async actualizar(id, d) {
    const [res] = await pool.query(
      `UPDATE clientes SET tipo_documento = ?, nro_documento = ?, nombres = ?, telefono = ?, email = ?
       WHERE id = ?`,
      [d.tipoDocumento, d.nroDocumento, d.nombres, d.telefono || null, d.email || null, id]);
    return res.affectedRows > 0;
  },

  async cambiarEstado(id, activo) {
    const [res] = await pool.query('UPDATE clientes SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
    return res.affectedRows > 0;
  },
};