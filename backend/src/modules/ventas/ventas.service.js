import { conTransaccion } from '../../config/db.js';
import { HttpError } from '../../utils/helpers.js';
import { ventasRepository as repo } from './ventas.repository.js';
import { inventarioRepository as inventario } from '../inventario/inventario.repository.js';

const IGV_TASA = 0.18;
const PREFIJO = { TICKET: 'T001', BOLETA: 'B001', FACTURA: 'F001' };
const redondear = (n) => Math.round(n * 100) / 100;

export const ventasService = {
  async registrar(datos, usuarioId, ip) {
    const {
      clienteId = null, tipoComprobante = 'TICKET', metodoPago,
      duracionSegundos = 0, recetaVerificada = false, items,
    } = datos;

    // Si el mismo producto viene repetido, se suman las cantidades
    const pedido = new Map();
    for (const it of items) pedido.set(it.productoId, (pedido.get(it.productoId) || 0) + it.cantidad);
    // Orden fijo de productos: evita bloqueos cruzados (deadlocks) entre dos cajeros
    const productoIds = [...pedido.keys()].sort((a, b) => a - b);

    return conTransaccion(async (conn) => {
      if (clienteId) {
        const cliente = await repo.clienteParaVenta(conn, clienteId);
        if (!cliente || !cliente.activo) throw new HttpError(400, 'El cliente no existe o está inactivo');
        if (tipoComprobante === 'FACTURA' && cliente.tipo_documento !== 'RUC') {
          throw new HttpError(400, 'La factura requiere un cliente con RUC');
        }
      } else if (tipoComprobante === 'FACTURA') {
        throw new HttpError(400, 'La factura requiere un cliente con RUC');
      }

      // 1) Validar todo y bloquear lotes ANTES de escribir nada
      const lineas = [];
      for (const productoId of productoIds) {
        const prod = await repo.productoParaVenta(conn, productoId);
        if (!prod || !prod.activo) throw new HttpError(400, `El producto ${productoId} no existe o está inactivo`);
        if (prod.requiere_receta && !recetaVerificada) {
          throw new HttpError(400, `"${prod.nombre}" requiere receta. Confirma que se verificó la receta`);
        }
        const cantidad = pedido.get(productoId);
        const lotes = await repo.lotesFEFO(conn, productoId);
        const disponible = lotes.reduce((s, l) => s + l.stock_actual, 0);
        if (disponible < cantidad) {
          throw new HttpError(409, `Stock insuficiente de "${prod.nombre}". Disponible: ${disponible}`);
        }
        lineas.push({ prod, cantidad, lotes });
      }

      // 2) Registrar la venta
      const ventaId = await repo.crearCabecera(conn, {
        clienteId, usuarioId, tipoComprobante, metodoPago, duracionSegundos,
      });
      let total = 0;

      for (const { prod, cantidad, lotes } of lineas) {
        const precio = Number(prod.precio_venta);
        let pendiente = cantidad;

        for (const lote of lotes) {                     // ya vienen ordenados FEFO
          if (pendiente === 0) break;
          const tomar = Math.min(pendiente, lote.stock_actual);
          const nuevoStock = lote.stock_actual - tomar;
          const subtotal = redondear(tomar * precio);

          await repo.fijarStockLote(conn, lote.id, nuevoStock);
          await repo.crearDetalle(conn, {
            ventaId, productoId: prod.id, loteId: lote.id,
            cantidad: tomar, precioUnitario: precio, subtotal,    // precio congelado
          });
          await inventario.crearMovimiento(conn, {
            loteId: lote.id, usuarioId, tipo: 'SALIDA_VENTA', cantidad: -tomar,
            stockResultante: nuevoStock, referencia: `VENTA-${ventaId}`,
          });
          total += subtotal;
          pendiente -= tomar;
        }
      }

      total = redondear(total);
      const subtotalBase = redondear(total / (1 + IGV_TASA));
      const igv = redondear(total - subtotalBase);
      const nroComprobante = `${PREFIJO[tipoComprobante]}-${String(ventaId).padStart(8, '0')}`;

      await repo.actualizarTotales(conn, ventaId, { subtotal: subtotalBase, igv, total, nroComprobante });
      await inventario.auditarTx(conn, {
        usuarioId, accion: 'REGISTRAR_VENTA', tabla: 'ventas', registroId: ventaId,
        detalle: { total, metodoPago, items: lineas.length }, ip,
      });
      return ventaId;
    });
  },

  async anular(ventaId, motivo, usuarioId, ip) {
    return conTransaccion(async (conn) => {
      const venta = await repo.ventaParaActualizar(conn, ventaId);
      if (!venta) throw new HttpError(404, 'Venta no encontrada');
      if (venta.estado === 'ANULADA') throw new HttpError(409, 'La venta ya está anulada');

      const detalle = await repo.detalleParaAnular(conn, ventaId);
      for (const d of detalle) {
        const lote = await inventario.loteParaActualizar(conn, d.lote_id);   // bloquea el lote
        const nuevoStock = lote.stock_actual + d.cantidad;
        await inventario.actualizarStockLote(conn, lote.id, nuevoStock, lote.cantidad_inicial);
        await inventario.crearMovimiento(conn, {
          loteId: lote.id, usuarioId, tipo: 'ANULACION_VENTA', cantidad: d.cantidad,
          stockResultante: nuevoStock, referencia: `ANULA-VENTA-${ventaId}`, motivo,
        });
      }

      await repo.marcarAnulada(conn, ventaId);
      await inventario.auditarTx(conn, {
        usuarioId, accion: 'ANULAR_VENTA', tabla: 'ventas', registroId: ventaId, detalle: { motivo }, ip,
      });
    });
  },
};