import { HttpError, asyncHandler, paginar } from '../../utils/helpers.js';
import { comprasRepository as repo } from './compras.repository.js';
import { comprasService } from './compras.service.js';
import { alertasService } from '../alertas/alertas.service.js';

export const registrar = asyncHandler(async (req, res) => {
  const id = await comprasService.registrar(req.body, req.user.id, req.ip);
  alertasService.refrescar(); 
  res.status(201).json({ ok: true, compra: await repo.obtener(id) });
});

export const listar = asyncHandler(async (req, res) => {
  const pag = paginar(req.query);
  const { filas, total } = await repo.listar(pag);
  res.json({ ok: true, compras: filas, paginacion: { ...pag, total, paginas: Math.ceil(total / pag.limite) } });
});

export const obtener = asyncHandler(async (req, res) => {
  const compra = await repo.obtener(Number(req.params.id));
  if (!compra) throw new HttpError(404, 'Compra no encontrada');
  res.json({ ok: true, compra });
});

export const anular = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await comprasService.anular(id, req.body.motivo, req.user.id, req.ip);
  res.json({ ok: true, compra: await repo.obtener(id) });
});