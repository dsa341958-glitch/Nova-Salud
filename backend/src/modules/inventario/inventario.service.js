import { conTransaccion } from '../../config/db.js';
import { HttpError } from '../../utils/helpers.js';
import { inventarioRepository as repo } from './inventario.repository.js';

export const inventarioService = {
  async ajustar({ loteId, tipo, cantidad, motivo }, usuarioId, ip) {
    return conTransaccion(async (conn) => {
      const lote = await repo.loteParaActualizar(conn, loteId);   // bloquea la fila
      if (!lote) throw new HttpError(404, 'Lote no encontrado');
      if (!lote.activo) throw new HttpError(400, 'El lote está inactivo');

      let stock = lote.stock_actual;
      let inicial = lote.cantidad_inicial;

      if (tipo === 'AJUSTE_POSITIVO') {
        stock += cantidad;
        inicial += cantidad;      // el schema exige stock_actual <= cantidad_inicial
      } else {
        if (cantidad > stock) throw new HttpError(400, `Solo hay ${stock} unidades en el lote`);
        if (tipo === 'MERMA_VENCIMIENTO' && !lote.vencido) {
          throw new HttpError(400, 'El lote aún no vence. Usa AJUSTE_NEGATIVO');
        }
        stock -= cantidad;
      }

      await repo.actualizarStockLote(conn, loteId, stock, inicial);
      await repo.crearMovimiento(conn, {
        loteId, usuarioId, tipo,
        cantidad: tipo === 'AJUSTE_POSITIVO' ? cantidad : -cantidad,
        stockResultante: stock, referencia: `AJUSTE-LOTE-${loteId}`, motivo,
      });
      await repo.auditarTx(conn, { usuarioId, accion: tipo, tabla: 'lotes', registroId: loteId, detalle: { cantidad, motivo }, ip });
      return { loteId, stock_actual: stock };
    });
  },
};