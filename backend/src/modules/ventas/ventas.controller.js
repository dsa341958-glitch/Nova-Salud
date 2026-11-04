import { HttpError, asyncHandler, paginar } from '../../utils/helpers.js';
import { ventasRepository as repo } from './ventas.repository.js';
import { ventasService } from './ventas.service.js';

export const registrar = asyncHandler(async (req, res) => {
  const id = await ventasService.registrar(req.body, req.user.id, req.ip);
  res.status(201).json({ ok: true, venta: await repo.obtener(id) });
});

export const listar = asyncHandler(async (req, res) => {
  const pag = paginar(req.query);
  const { filas, total } = await repo.listar({
    desde: req.query.desde || null,
    hasta: req.query.hasta || null,
    estado: req.query.estado || null,
    // El cajero solo ve sus propias ventas
    usuarioId: req.user.rol === 'CAJERO' ? req.user.id : null,
    ...pag,
  });
  res.json({ ok: true, ventas: filas, paginacion: { ...pag, total, paginas: Math.ceil(total / pag.limite) } });
});

export const obtener = asyncHandler(async (req, res) => {
  const venta = await repo.obtener(Number(req.params.id));
  if (!venta) throw new HttpError(404, 'Venta no encontrada');
  if (req.user.rol === 'CAJERO' && venta.usuario_id !== req.user.id) {
    throw new HttpError(403, 'No tienes permisos para ver esta venta');
  }
  res.json({ ok: true, venta });
});

export const anular = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await ventasService.anular(id, req.body.motivo, req.user.id, req.ip);
  res.json({ ok: true, venta: await repo.obtener(id) });
});