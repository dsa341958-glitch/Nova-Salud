import { pool } from '../../config/db.js';

export const usuariosRepository = {
  async buscarPorEmail(email) {
    const [rows] = await pool.query(
      `SELECT u.id, u.nombres, u.apellidos, u.email, u.password_hash, u.activo, r.nombre AS rol
       FROM usuarios u JOIN roles r ON r.id = u.rol_id
       WHERE u.email = ? LIMIT 1`, [email]);
    return rows[0] || null;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT u.id, u.nombres, u.apellidos, u.email, u.activo, u.ultimo_acceso, r.nombre AS rol
       FROM usuarios u JOIN roles r ON r.id = u.rol_id
       WHERE u.id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  },

  async listar() {
    const [rows] = await pool.query(
      `SELECT u.id, u.nombres, u.apellidos, u.email, u.activo, u.ultimo_acceso, r.nombre AS rol
       FROM usuarios u JOIN roles r ON r.id = u.rol_id
       ORDER BY u.id`);
    return rows;
  },

  async idDeRol(nombre) {
    const [rows] = await pool.query('SELECT id FROM roles WHERE nombre = ?', [nombre]);
    return rows[0]?.id || null;
  },

  async crear({ rolId, nombres, apellidos, email, passwordHash }) {
    const [res] = await pool.query(
      `INSERT INTO usuarios (rol_id, nombres, apellidos, email, password_hash)
       VALUES (?, ?, ?, ?, ?)`, [rolId, nombres, apellidos, email, passwordHash]);
    return res.insertId;
  },

  async cambiarEstado(id, activo) {
    const [res] = await pool.query('UPDATE usuarios SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
    return res.affectedRows > 0;
  },

  async registrarAcceso(id) {
    await pool.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [id]);
  },

  async auditar({ usuarioId, accion, detalle, ip }) {
    await pool.query(
      'INSERT INTO auditoria (usuario_id, accion, tabla_afectada, detalle, ip) VALUES (?, ?, ?, ?, ?)',
      [usuarioId, accion, 'usuarios', detalle ? JSON.stringify(detalle) : null, ip]);
  },
};