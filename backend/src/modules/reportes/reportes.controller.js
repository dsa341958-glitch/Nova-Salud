import { HttpError, asyncHandler } from '../../utils/helpers.js';
import { reportesRepository as repo } from './reportes.repository.js';

// Lee y valida el rango de fechas (opcional)
function rango(query) {
  const desde = query.desde || null;
  const hasta = query.hasta || null;
  if (desde && hasta && desde > hasta) throw new HttpError(400, '"desde" no puede ser mayor que "hasta"');
  return { desde, hasta };
}

export const dashboard = asyncHandler(async (req, res) => {
  res.json({ ok: true, dashboard: await repo.dashboard() });
});

export const ventas = asyncHandler(async (req, res) => {
  res.json({ ok: true, reporte: await repo.ventas(rango(req.query)) });
});

export const masVendidos = asyncHandler(async (req, res) => {
  const limite = Math.min(Math.max(Number(req.query.limite) || 10, 1), 50);
  res.json({ ok: true, productos: await repo.masVendidos({ ...rango(req.query), limite }) });
});

export const tiempoAtencion = asyncHandler(async (req, res) => {
  const meta = Number(req.query.meta) || 120;      // meta de atención: 2 minutos por defecto
  const reporte = await repo.tiempoAtencion({ ...rango(req.query), meta });
  res.json({ ok: true, metaSegundos: meta, reporte });
});

export const inventario = asyncHandler(async (req, res) => {
  const d = await repo.inventario(rango(req.query));

  const totalMovimientos = d.movimientos.reduce((s, m) => s + m.movimientos, 0);
  const tasaAjustes = totalMovimientos
    ? Math.round((d.ajustesManuales / totalMovimientos) * 1000) / 10
    : 0;

  res.json({
    ok: true,
    reporte: {
      valorizado: d.valor,
      movimientos: d.movimientos,
      mermas: d.mermas,
      indicadoresDeError: {
        ajustesManuales: d.ajustesManuales,
        totalMovimientos,
        tasaAjustesPct: tasaAjustes,      // menor = mejor control de inventario
        quiebresDeStock: d.quiebres,      // veces que un producto se quedó en 0
      },
    },
  });
});

export const reposicion = asyncHandler(async (req, res) => {
  res.json({ ok: true, productos: await repo.reposicion() });
});