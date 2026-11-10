import { useState } from 'react';
import api, { mensajeError } from '../../api/client';
import Modal from '../../components/Modal';
import { fechaHora } from '../../utils/format';

export default function AjusteModal({ lote, onGuardado, onCerrar }) {
  const vencido = lote.dias_restantes <= 0;
  const [tipo, setTipo] = useState(vencido && lote.stock_actual > 0 ? 'MERMA_VENCIMIENTO' : 'AJUSTE_NEGATIVO');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const resta = tipo !== 'AJUSTE_POSITIVO';
  const nuevoStock = (Number(cantidad) || 0) * (resta ? -1 : 1) + lote.stock_actual;

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await api.post('/inventario/ajustes', {
        loteId: lote.id, tipo, cantidad: Number(cantidad), motivo: motivo.trim(),
      });
      window.dispatchEvent(new Event('alertas:cambio'));   // el backend recalcula alertas al ajustar
      onGuardado();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Ajustar stock del lote" onCerrar={onCerrar}>
      <div className="aviso" style={{ background: '#f0fdfa', borderColor: '#99f6e4', color: '#0b4f4a' }}>
        <strong>{lote.producto}</strong><br />
        Lote {lote.codigo_lote} · vence {fechaHora(lote.fecha_vencimiento)} · stock actual: <strong>{lote.stock_actual}</strong>
      </div>

      <form onSubmit={enviar}>
        <label className="campo">Tipo de ajuste
          <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="AJUSTE_NEGATIVO">Salida por ajuste (rotura, pérdida, conteo)</option>
            <option value="AJUSTE_POSITIVO">Ingreso por ajuste (conteo a favor)</option>
            <option value="MERMA_VENCIMIENTO" disabled={!vencido}>
              Merma por vencimiento {!vencido ? '(el lote aún no vence)' : ''}
            </option>
          </select>
        </label>

        <label className="campo">Cantidad *
          <input className="input" type="number" required min="1" step="1"
            max={resta ? lote.stock_actual : undefined} value={cantidad}
            onChange={(e) => setCantidad(e.target.value)} autoFocus />
        </label>

        <label className="campo">Motivo * <small className="suave">(mínimo 5 caracteres, queda en el kardex)</small>
          <input className="input" required minLength={5} maxLength={255} value={motivo}
            onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: caja dañada en almacén" />
        </label>

        {cantidad !== '' && (
          <p className={nuevoStock < 0 ? 'texto-error' : 'suave'}>
            Stock resultante: <strong>{nuevoStock}</strong>
          </p>
        )}

        {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

        <div className="grid-2">
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-primario" disabled={guardando || nuevoStock < 0}>
            {guardando ? 'Guardando…' : 'Registrar ajuste'}
          </button>
        </div>
      </form>
    </Modal>
  );
}