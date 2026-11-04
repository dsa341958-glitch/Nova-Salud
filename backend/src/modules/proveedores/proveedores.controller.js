import { HttpError, asyncHandler } from '../../utils/helpers.js';
import { proveedoresRepository as repo } from './proveedores.repository.js';

export const listar = asyncHandler(async (req, res) => {
  const proveedores = await repo.listar({ q: req.query.q?.trim() || null, soloActivos: req.query.activos === 'true' });
  res.json({ ok: true, proveedores });
});

export const obtener = asyncHandler(async (req, res) => {
  const proveedor = await repo.buscarPorId(Number(req.params.id));
  if (!proveedor) throw new HttpError(404, 'Proveedor no encontrado');
  res.json({ ok: true, proveedor });
});

export const crear = asyncHandler(async (req, res) => {
  if (await repo.buscarPorRuc(req.body.ruc)) throw new HttpError(409, 'Ya existe un proveedor con ese RUC');
  const id = await repo.crear(req.body);
  res.status(201).json({ ok: true, proveedor: await repo.buscarPorId(id) });
});

export const actualizar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const dup = await repo.buscarPorRuc(req.body.ruc);
  if (dup && dup.id !== id) throw new HttpError(409, 'Ya existe un proveedor con ese RUC');
  if (!(await repo.actualizar(id, req.body))) throw new HttpError(404, 'Proveedor no encontrado');
  res.json({ ok: true, proveedor: await repo.buscarPorId(id) });
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!(await repo.cambiarEstado(id, req.body.activo))) throw new HttpError(404, 'Proveedor no encontrado');
  res.json({ ok: true, proveedor: await repo.buscarPorId(id) });
});