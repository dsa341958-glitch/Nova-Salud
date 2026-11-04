import { pool } from '../../config/db.js';

export const categoriasRepository = {
  async listar({ soloActivas = false } = {}) {
    const [rows] = await pool.query(
      `SELECT id, nombre, descripcion, activo FROM categorias
       ${soloActivas ? 'WHERE activo = 1' : ''} ORDER BY nombre`);
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      'SELECT id, nombre, descripcion, activo FROM categorias WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async buscarPorNombre(nombre) {
    const [rows] = await pool.query('SELECT id FROM categorias WHERE nombre = ?', [nombre]);
    return rows[0] || null;
  },

  async crear({ nombre, descripcion }) {
    const [res] = await pool.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion || null]);
    return res.insertId;
  },

  async actualizar(id, { nombre, descripcion }) {
    const [res] = await pool.query(
      'UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?',
      [nombre, descripcion || null, id]);
    return res.affectedRows > 0;
  },

  async cambiarEstado(id, activo) {
    const [res] = await pool.query('UPDATE categorias SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
    return res.affectedRows > 0;
  },
};