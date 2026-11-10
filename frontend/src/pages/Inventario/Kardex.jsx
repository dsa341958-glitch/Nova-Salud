import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api, { mensajeError } from '../../api/client';
import { fechaHora } from '../../utils/format';
import Paginacion from '../../components/Paginacion';

const TIPOS = {
  ENTRADA_COMPRA: 'Entrada por compra',
  SALIDA_VENTA: 'Salida por venta',
  AJUSTE_POSITIVO: 'Ajuste (+)',
  AJUSTE_NEGATIVO: 'Ajuste (−)',
  MERMA_VENCIMIENTO: 'Merma por vencimiento',
  ANULACION_VENTA: 'Anulación de venta',
};

export default function Kardex({ lote, onQuitarLote }) {
  const [tipo, setTipo] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState({ movimientos: [], paginacion: null });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    api.get('/inventario/kardex', {
      params: {
        lote: lote?.id || undefined, tipo: tipo || undefined,
        desde: desde || undefined, hasta: hasta || undefined, pagina, limite: 20,
      },
    })
      .then(({ data }) => { if (vigente) { setDatos(data); setError(''); } })
      .catch((e) => vigente && setError(mensajeError(e)))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [lote, tipo, desde, hasta, pagina]);

  const filtro = (setter) => (e) => { setter(e.target.value); setPagina(1); };

  return (
    <div className="card">
      <div className="filtros">
        {lote && (
          <span className="chip-filtro">
            Lote {lote.codigo_lote} · {lote.producto}
            <button className="btn-icono" onClick={onQuitarLote} aria-label="Quitar filtro de lote"><X size={14} /></button>
          </span>
        )}
        <select className="input" value={tipo} onChange={filtro(setTipo)}>
          <option value="">Todos los movimientos</option>
          {Object.entries(TIPOS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
        </select>
        <label className="check-simple">Desde <input className="input" type="date" value={desde} onChange={filtro(setDesde)} /></label>
        <label className="check-simple">Hasta <input className="input" type="date" value={hasta} onChange={filtro(setHasta)} /></label>
      </div>

      {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

      <div className="tabla-wrap">
        <table className="tabla">
          <thead>
            <tr><th>Fecha</th><th>Producto / lote</th><th>Movimiento</th><th>Cant.</th><th>Stock</th><th>Referencia</th><th>Usuario</th></tr>
          </thead>
          <tbody>
            {datos.movimientos.map((m) => (
              <tr key={m.id}>
                <td>{fechaHora(m.fecha)}</td>
                <td><strong>{m.producto}</strong><div className="suave">Lote {m.codigo_lote}</div></td>
                <td>
                  {TIPOS[m.tipo]}
                  {m.motivo && <div className="suave">{m.motivo}</div>}
                </td>
                <td className={m.cantidad > 0 ? 'cant-pos' : 'cant-neg'}>{m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}</td>
                <td>{m.stock_resultante}</td>
                <td className="suave">{m.referencia || '—'}</td>
                <td>{m.usuario}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!cargando && datos.movimientos.length === 0 && <p className="suave vacio">No hay movimientos con esos filtros.</p>}
        {cargando && <p className="suave vacio">Cargando…</p>}
      </div>

      <Paginacion paginacion={datos.paginacion} onCambiar={setPagina} />
    </div>
  );
}