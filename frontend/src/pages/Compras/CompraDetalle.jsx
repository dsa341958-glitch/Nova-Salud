import { useEffect, useState } from 'react';
import api, { mensajeError } from '../../api/client';
import Modal from '../../components/Modal';
import { soles, fechaHora } from '../../utils/format';

export default function CompraDetalle({ id, esAdmin, onCerrar, onAnulada }) {
  const [compra, setCompra] = useState(null);
  const [error, setError] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get(`/compras/${id}`).then(({ data }) => setCompra(data.compra)).catch((e) => setError(mensajeError(e)));
  }, [id]);

  const anular = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await api.patch(`/compras/${id}/anular`, { motivo: motivo.trim() });
      window.dispatchEvent(new Event('alertas:cambio'));
      onAnulada();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal titulo={`Compra #${id}`} onCerrar={onCerrar} ancho>
      {!compra && !error && <p className="suave">Cargando…</p>}
      {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

      {compra && (
        <>
          <p>
            <strong>{compra.proveedor}</strong> · Doc. {compra.nro_documento || 's/n'} · {fechaHora(compra.fecha)}{' '}
            <span className={`etiqueta ${compra.estado === 'ANULADA' ? 'roja' : ''}`}>{compra.estado}</span>
          </p>

          <div className="tabla-wrap">
            <table className="tabla">
              <thead><tr><th>Producto</th><th>Lote</th><th>Vence</th><th>Cant.</th><th>Costo</th><th>Subtotal</th></tr></thead>
              <tbody>
                {compra.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.producto}</td><td>{it.codigo_lote}</td><td>{fechaHora(it.fecha_vencimiento)}</td>
                    <td>{it.cantidad}</td><td>{soles(it.costo_unitario)}</td><td>{soles(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="fila-total total-grande" style={{ margin: '1rem 0' }}><span>Total</span><span>{soles(compra.total)}</span></div>

          {esAdmin && compra.estado === 'REGISTRADA' && !anulando && (
            <button className="btn" onClick={() => setAnulando(true)}>Anular compra</button>
          )}

          {anulando && (
            <form onSubmit={anular}>
              <p className="suave">Solo se puede anular si no se vendió ni ajustó ninguna unidad de esta compra.</p>
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