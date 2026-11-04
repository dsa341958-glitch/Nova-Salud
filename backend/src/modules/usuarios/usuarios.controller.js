import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';
import { HttpError, asyncHandler } from '../../utils/helpers.js';
import { usuariosRepository as repo } from './usuarios.repository.js';

export const listar = asyncHandler(async (req, res) => {
  res.json({ ok: true, usuarios: await repo.listar() });
});

export const crear = asyncHandler(async (req, res) => {
  const { nombres, apellidos, email, password, rol } = req.body;

  if (await repo.buscarPorEmail(email)) throw new HttpError(409, 'Ya existe un usuario con ese correo');

  const rolId = await repo.idDeRol(rol);
  if (!rolId) throw new HttpError(400, 'Rol inválido');

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  const id = await repo.crear({ rolId, nombres, apellidos, email, passwordHash });
  await repo.auditar({ usuarioId: req.user.id, accion: 'CREAR_USUARIO', detalle: { id, email, rol }, ip: req.ip });

  res.status(201).json({ ok: true, usuario: await repo.buscarPorId(id) });
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { activo } = req.body;

  if (id === req.user.id) throw new HttpError(400, 'No puedes desactivar tu propia cuenta');
  if (!(await repo.cambiarEstado(id, activo))) throw new HttpError(404, 'Usuario no encontrado');

  await repo.auditar({ usuarioId: req.user.id, accion: activo ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO', detalle: { id }, ip: req.ip });
  res.json({ ok: true, usuario: await repo.buscarPorId(id) });
});