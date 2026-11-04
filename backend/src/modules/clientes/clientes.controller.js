import { HttpError, asyncHandler, paginar } from '../../utils/helpers.js';
import { clientesRepository as repo } from './clientes.repository.js';

export const listar = asyncHandler(async (req, res) => {
  const pag = paginar(req.query);
  const { filas, total } = await repo.listar({ q: req.query.q?.trim() || null, ...pag });
  res.json({ ok: true, clientes: filas, paginacion: { ...pag, total, paginas: Math.ceil(total / pag.limite) } });
});

export const buscar = asyncHandler(async (req, res) => {
  const q = req.query.q?.trim();
  if (!q || q.length < 2) return res.json({ ok: true, clientes: [] });
  res.json({ ok: true, clientes: await repo.buscarRapido(q) });
});

export const obtener = asyncHandler(async (req, res) => {
  const cliente = await repo.buscarPorId(Number(req.params.id));
  if (!cliente) throw new HttpError(404, 'Cliente no encontrado');
  res.json({ ok: true, cliente });
});

export const crear = asyncHandler(async (req, res) => {
  if (await repo.buscarPorDocumento(req.body.nroDocumento)) {
    throw new HttpError(409, 'Ya existe un cliente con ese documento');
  }
  const id = await repo.crear(req.body);
  res.status(201).json({ ok: true, cliente: await repo.buscarPorId(id) });
});

export const actualizar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const dup = await repo.buscarPorDocumento(req.body.nroDocumento);
  if (dup && dup.id !== id) throw new HttpError(409, 'Ya existe un cliente con ese documento');
  if (!(await repo.actualizar(id, req.body))) throw new HttpError(404, 'Cliente no encontrado');
  res.json({ ok: true, cliente: await repo.buscarPorId(id) });
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!(await repo.cambiarEstado(id, req.body.activo))) throw new HttpError(404, 'Cliente no encontrado');
  res.json({ ok: true, cliente: await repo.buscarPorId(id) });
});