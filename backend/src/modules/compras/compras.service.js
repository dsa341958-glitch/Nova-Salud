import { conTransaccion } from '../../config/db.js';
import { HttpError } from '../../utils/helpers.js';
import { comprasRepository as repo } from './compras.repository.js';
import { inventarioRepository as inventario } from '../inventario/inventario.repository.js';

const redondear = (n) => Math.round(n * 100) / 100;

export const comprasService = {
  async registrar({ proveedorId, nroDocumento, items }, usuarioId, ip) {
    return conTransaccion(async (conn) => {
      if (!(await repo.proveedorActivo(conn, proveedorId))) {
        throw new HttpError(400, 'El proveedor no existe o está inactivo');
      }
      const hoy = await repo.hoy(conn);
      const compraId = await repo.crearCabecera(conn, { proveedorId, usuarioId, nroDocumento });
      let total = 0;

      for (const it of items) {
        if (it.fechaVencimiento <= hoy) {
          throw new HttpError(400, `El lote ${it.codigoLote} está vencido o vence hoy`);
        }
        if (!(await repo.productoActivo(conn, it.productoId))) {
          throw new HttpError(400, `El producto ${it.productoId} no existe o está inactivo`);
        }
        if (await repo.loteExiste(conn, it.productoId, it.codigoLote)) {
          throw new HttpError(409, `El lote ${it.codigoLote} ya existe para el producto ${it.productoId}`);
        }

        const subtotal = redondear(it.cantidad * it.costoUnitario);
        const loteId = await repo.crearLote(conn, { ...it, compraId });
        await repo.crearDetalle(conn, { compraId, loteId, cantidad: it.cantidad, costoUnitario: it.costoUnitario, subtotal });
        await inventario.crearMovimiento(conn, {
          loteId, usuarioId, tipo: 'ENTRADA_COMPRA', cantidad: it.cantidad,
          stockResultante: it.cantidad, referencia: `COMPRA-${compraId}`,
        });
        total += subtotal;
      }

      await repo.actualizarTotal(conn, compraId, redondear(total));
      await inventario.auditarTx(conn, {
        usuarioId, accion: 'REGISTRAR_COMPRA', tabla: 'compras', registroId: compraId,
        detalle: { proveedorId, nroDocumento, items: items.length }, ip,
      });
      return compraId;
    });
  },

  async anular(compraId, motivo, usuarioId, ip) {
    return conTransaccion(async (conn) => {
      const compra = await repo.compraParaActualizar(conn, compraId);
      if (!compra) throw new HttpError(404, 'Compra no encontrada');
      if (compra.estado === 'ANULADA') throw new HttpError(409, 'La compra ya está anulada');

      const lotes = await repo.lotesDeCompra(conn, compraId);
      if (lotes.some((l) => l.stock_actual !== l.cantidad_inicial)) {
        throw new HttpError(409, 'No se puede anular: ya se vendieron o ajustaron unidades de esta compra');
      }

      for (const l of lotes) {
        await repo.desactivarLote(conn, l.id);
        await inventario.crearMovimiento(conn, {
          loteId: l.id, usuarioId, tipo: 'AJUSTE_NEGATIVO', cantidad: -l.stock_actual,
          stockResultante: 0, referencia: `ANULA-COMPRA-${compraId}`, motivo,
        });
      }
      await repo.marcarAnulada(conn, compraId);
      await inventario.auditarTx(conn, { usuarioId, accion: 'ANULAR_COMPRA', tabla: 'compras', registroId: compraId, detalle: { motivo }, ip });
    });
  },
};