import { HttpError, asyncHandler } from '../../utils/helpers.js';
import { categoriasRepository as repo } from './categorias.repository.js';

export const listar = asyncHandler(async (req, res) => {
  const soloActivas = req.query.activas === 'true';
  res.json({ ok: true, categorias: await repo.listar({ soloActivas }) });
});

export const crear = asyncHandler(async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (await repo.buscarPorNombre(nombre)) throw new HttpError(409, 'Ya existe una categoría con ese nombre');
  const id = await repo.crear({ nombre, descripcion });
  res.status(201).json({ ok: true, categoria: await repo.buscarPorId(id) });
});

export const actualizar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, descripcion } = req.body;

  const duplicada = await repo.buscarPorNombre(nombre);
  if (duplicada && duplicada.id !== id) throw new HttpError(409, 'Ya existe una categoría con ese nombre');
  if (!(await repo.actualizar(id, { nombre, descripcion }))) throw new HttpError(404, 'Categoría no encontrada');

  res.json({ ok: true, categoria: await repo.buscarPorId(id) });
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!(await repo.cambiarEstado(id, req.body.activo))) throw new HttpError(404, 'Categoría no encontrada');
  res.json({ ok: true, categoria: await repo.buscarPorId(id) });
});