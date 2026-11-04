import { pool } from '../../config/db.js';

const COLS = 'id, razon_social, ruc, telefono, email, direccion, activo';

export const proveedoresRepository = {
  async listar({ q, soloActivos }) {
    const where = [];
    const params = [];
    if (q) { where.push('(razon_social LIKE ? OR ruc LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
    if (soloActivos) where.push('activo = 1');
    const [rows] = await pool.query(
      `SELECT ${COLS} FROM proveedores ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY razon_social`, params);
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(`SELECT ${COLS} FROM proveedores WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  async buscarPorRuc(ruc) {
    const [rows] = await pool.query('SELECT id FROM proveedores WHERE ruc = ?', [ruc]);
    return rows[0] || null;
  },

  async crear(d) {
    const [res] = await pool.query(
      'INSERT INTO proveedores (razon_social, ruc, telefono, email, direccion) VALUES (?, ?, ?, ?, ?)',
      [d.razonSocial, d.ruc, d.telefono || null, d.email || null, d.direccion || null]);
    return res.insertId;
  },

  async actualizar(id, d) {
    const [res] = await pool.query(
      'UPDATE proveedores SET razon_social = ?, ruc = ?, telefono = ?, email = ?, direccion = ? WHERE id = ?',
      [d.razonSocial, d.ruc, d.telefono || null, d.email || null, d.direccion || null, id]);
    return res.affectedRows > 0;
  },

  async cambiarEstado(id, activo) {
    const [res] = await pool.query('UPDATE proveedores SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
    return res.affectedRows > 0;
  },
};