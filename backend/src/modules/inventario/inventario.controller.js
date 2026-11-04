import { asyncHandler, paginar } from '../../utils/helpers.js';
import { inventarioRepository as repo } from './inventario.repository.js';
import { inventarioService } from './inventario.service.js';
import { alertasService } from '../alertas/alertas.service.js';

const respuestaPaginada = (clave, { filas, total }, { pagina, limite }) => ({
  ok: true,
  [clave]: filas,
  paginacion: { pagina, limite, total, paginas: Math.ceil(total / limite) },
});

export const listarLotes = asyncHandler(async (req, res) => {
  const pag = paginar(req.query);
  const data = await repo.listarLotes({
    productoId: Number(req.query.producto) || null,
    estado: req.query.estado,                       // vigentes | porVencer | vencidos
    dias: Number(req.query.dias) || 60,
    ...pag,
  });
  res.json(respuestaPaginada('lotes', data, pag));
});

export const kardex = asyncHandler(async (req, res) => {
  const pag = paginar(req.query);
  const data = await repo.kardex({
    productoId: Number(req.query.producto) || null,
    loteId: Number(req.query.lote) || null,
    tipo: req.query.tipo || null,
    desde: req.query.desde || null,
    hasta: req.query.hasta || null,
    ...pag,
  });
  res.json(respuestaPaginada('movimientos', data, pag));
});

export const ajustar = asyncHandler(async (req, res) => {
  const resultado = await inventarioService.ajustar(req.body, req.user.id, req.ip);
  alertasService.refrescar(); 
  res.status(201).json({ ok: true, ...resultado });
});