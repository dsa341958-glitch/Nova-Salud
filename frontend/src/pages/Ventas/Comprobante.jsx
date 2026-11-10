import { Printer, CheckCircle2 } from 'lucide-react';
import { soles, duracion } from '../../utils/format';

const PAGO = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', YAPE_PLIN: 'Yape / Plin', OTRO: 'Otro' };

export default function Comprobante({ venta, onCerrar }) {
  const vuelto = venta.recibido ? Math.max(venta.recibido - venta.total, 0) : null;

  return (
    <div className="modal-fondo">
      <div className="modal">
        <div className="exito no-imprimir">
          <CheckCircle2 size={28} /> <strong>Venta registrada</strong>
        </div>

        <div className="ticket-imprimible">
          <div className="ticket-cab">
            <strong>NOVA SALUD</strong>
            <div>{venta.tipo_comprobante} {venta.nro_comprobante}</div>
            <small>{venta.fecha}</small>
          </div>
          <div className="ticket-datos">
            <div>Cajero: {venta.cajero}</div>
            <div>Cliente: {venta.cliente || 'Cliente general'}</div>
          </div>

          <table>
            <thead>
              <tr><th>Producto</th><th>Cant.</th><th>P. unit.</th><th>Importe</th></tr>
            </thead>
            <tbody>
              {venta.items.map((it) => (
                <tr key={it.id}>
                  <td>{it.producto}<br /><small className="suave">Lote {it.codigo_lote}</small></td>
                  <td>{it.cantidad}</td>
                  <td>{soles(it.precio_unitario)}</td>
                  <td>{soles(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ticket-totales">
            <div className="fila-total"><span>Subtotal</span><span>{soles(venta.subtotal)}</span></div>
            <div className="fila-total"><span>IGV (18%)</span><span>{soles(venta.igv)}</span></div>
            <div className="fila-total total-grande"><span>TOTAL</span><span>{soles(venta.total)}</span></div>
            <div className="fila-total"><span>Pago</span><span>{PAGO[venta.metodo_pago]}</span></div>
            {vuelto !== null && (
              <>
                <div className="fila-total"><span>Recibido</span><span>{soles(venta.recibido)}</span></div>
                <div className="fila-total"><span>Vuelto</span><span>{soles(vuelto)}</span></div>
              </>
            )}
          </div>
          <p className="ticket-pie">¡Gracias por su compra!</p>
        </div>

        <p className="suave no-imprimir">Tiempo de atención: {duracion(venta.tiempo_atencion_seg)}</p>

        <div className="grid-2 no-imprimir">
          <button className="btn" onClick={() => window.print()}><Printer size={16} /> Imprimir</button>
          <button className="btn btn-primario" onClick={onCerrar}>Nueva venta</button>
        </div>
      </div>
    </div>
  );
}