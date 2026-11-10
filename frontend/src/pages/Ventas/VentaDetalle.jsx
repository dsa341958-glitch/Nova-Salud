import { useEffect, useState } from 'react';
import api, { mensajeError } from '../../api/client';
import Modal from '../../components/Modal';
import { soles, fechaHora, duracion } from '../../utils/format';

const PAGO = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', YAPE_PLIN: 'Yape / Plin', OTRO: 'Otro' };

export default function VentaDetalle({ id, puedeAnular, onCerrar, onAnulada }) {
  const [venta, setVenta] = useState(null);
  const [error, setError] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get(`/ventas/${id}`)
      .then(({ data }) => setVenta(data.venta))
      .catch((e) => setError(mensajeError(e)));
  }, [id]);

  const anular = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await api.patch(`/ventas/${id}/anular`, { motivo: motivo.trim() });
      window.dispatchEvent(new Event('alertas:cambio'));
      onAnulada();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal titulo={venta ? `${venta.tipo_comprobante} ${venta.nro_comprobante}` : `Venta #${id}`} onCerrar={onCerrar} ancho>
      {!venta && !error && <p className="suave">Cargando…</p>}
      {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

      {venta && (
        <>
          <p>
            {fechaHora(venta.fecha)} · Cajero: <strong>{venta.cajero}</strong> · Cliente: <strong>{venta.cliente || 'Cliente general'}</strong>{' '}
            <span className={`etiqueta ${venta.estado === 'ANULADA' ? 'roja' : ''}`}>{venta.estado}</span>
          </p>
          <p className="suave">Pago: {PAGO[venta.metodo_pago]} · Tiempo de atención: {duracion(venta.tiempo_atencion_seg)}</p>

          <div className="tabla-wrap">
            <table className="tabla">
              <thead><tr><th>Producto</th><th>Lote</th><th>Cant.</th><th>P. unit.</th><th>Importe</th></tr></thead>
              <tbody>
                {venta.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.producto}</td><td>{it.codigo_lote}</td><td>{it.cantidad}</td>
                    <td>{soles(it.precio_unitario)}</td><td>{soles(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ margin: '1rem 0' }}>
            <div className="fila-total suave"><span>Subtotal</span><span>{soles(venta.subtotal)}</span></div>
            <div className="fila-total suave"><span>IGV (18%)</span><span>{soles(venta.igv)}</span></div>
            <div className="fila-total total-grande"><span>Total</span><span>{soles(venta.total)}</span></div>
          </div>

          {puedeAnular && venta.estado === 'COMPLETADA' && !anulando && (
            <button className="btn" onClick={() => setAnulando(true)}>Anular venta</button>
          )}

          {anulando && (
            <form onSubmit={anular}>
              <p className="suave">Las unidades vuelven al lote del que salieron y el movimiento queda en el kardex.</p>
              <label className="campo">Motivo * <small className="suave">(mínimo 5 caracteres)</small>
                <input className="input" required minLength={5} maxLength={255} value={motivo}
                  onChange={(e) => setMotivo(e.target.value)} autoFocus />
              </label>
              <div className="grid-2">
                <button type="button" className="btn" onClick={() => setAnulando(false)}>Cancelar</button>
                <button className="btn btn-primario" disabled={enviando}>{enviando ? 'Anulando…' : 'Confirmar anulación'}</button>
              </div>
            </form>
          )}
        </>
      )}
    </Modal>
  );
}