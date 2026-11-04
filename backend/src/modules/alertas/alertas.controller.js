import { HttpError, asyncHandler, paginar } from '../../utils/helpers.js';
import { alertasRepository as repo } from './alertas.repository.js';
import { alertasService } from './alertas.service.js';

export const listar = asyncHandler(async (req, res) => {
  const pag = paginar(req.query);
  const { filas, total } = await repo.listar({
    estado: req.query.estado,                // activas (por defecto) | NUEVA | VISTA | ATENDIDA
    tipo: req.query.tipo || null,
    ...pag,
  });
  res.json({ ok: true, alertas: filas, paginacion: { ...pag, total, paginas: Math.ceil(total / pag.limite) } });
});

export const resumen = asyncHandler(async (req, res) => {
  const { porTipo, nuevas } = await repo.resumen();
  const conteo = { SIN_STOCK: 0, STOCK_BAJO: 0, POR_VENCER: 0, VENCIDO: 0 };
  porTipo.forEach((r) => { conteo[r.tipo] = r.cantidad; });
  const activas = Object.values(conteo).reduce((s, n) => s + n, 0);
  res.json({ ok: true, resumen: { activas, nuevas, ...conteo } });
});

export const marcarVista = asyncHandler(async (req, res) => {
  const alerta = await repo.buscarPorId(Number(req.params.id));
  if (!alerta) throw new HttpError(404, 'Alerta no encontrada');
  if (alerta.estado === 'ATENDIDA') throw new HttpError(409, 'La alerta ya fue atendida');
  await repo.marcarVista(alerta.id);
  res.json({ ok: true });
});

export const marcarTodasVistas = asyncHandler(async (req, res) => {
  res.json({ ok: true, marcadas: await repo.marcarTodasVistas() });
});

export const generarAhora = asyncHandler(async (req, res) => {
  const resultado = await alertasService.generar();
  if (!resultado) throw new HttpError(409, 'Ya hay una revisión de alertas en curso');
  res.json({ ok: true, ...resultado });
});