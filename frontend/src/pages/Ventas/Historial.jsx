import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import api, { mensajeError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { soles, fechaHora, duracion } from '../../utils/format';
import Paginacion from '../../components/Paginacion';
import VentaDetalle from './VentaDetalle';

const PAGO = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', YAPE_PLIN: 'Yape / Plin', OTRO: 'Otro' };

export default function Historial() {
  const { usuario } = useAuth();
  const esCajero = usuario.rol === 'CAJERO';

  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [estado, setEstado] = useState('');
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState({ ventas: [], paginacion: null });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [detalleId, setDetalleId] = useState(null);

  const rangoInvalido = desde && hasta && desde > hasta;

  useEffect(() => {
    if (rangoInvalido) return;
    let vigente = true;
    setCargando(true);
    api.get('/ventas', {
      params: { desde: desde || undefined, hasta: hasta || undefined, estado: estado || undefined, pagina, limite: 15 },
    })
      .then(({ data }) => { if (vigente) { setDatos(data); setError(''); } })
      .catch((e) => vigente && setError(mensajeError(e)))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [desde, hasta, estado, pagina, recarga, rangoInvalido]);

  const filtro = (setter) => (e) => { setter(e.target.value); setPagina(1); };

  return (
    <>
      <h1>Historial de ventas</h1>
      <div className="card">
        {esCajero && <p className="suave">Aquí ves solo las ventas que registraste tú.</p>}
        <div className="filtros">
          <label className="check-simple">Desde <input className="input" type="date" value={desde} onChange={filtro(setDesde)} /></label>
          <label className="check-simple">Hasta <input className="input" type="date" value={hasta} onChange={filtro(setHasta)} /></label>
          <select className="input" value={estado} onChange={filtro(setEstado)}>
            <option value="">Todas</option>
            <option value="COMPLETADA">Completadas</option>
            <option value="ANULADA">Anuladas</option>
          </select>
          {(desde || hasta || estado) && (
            <button className="btn" onClick={() => { setDesde(''); setHasta(''); setEstado(''); setPagina(1); }}>Limpiar</button>
          )}
        </div>

        {rangoInvalido && <div className="error" style={{ marginBottom: '.75rem' }}>La fecha "Desde" no puede ser posterior a "Hasta".</div>}
        {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr><th>Comprobante</th><th>Fecha</th><th>Cliente</th><th>Cajero</th><th>Pago</th><th>Atención</th><th>Total</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {datos.ventas.map((v) => (
                <tr key={v.id} style={{ opacity: v.estado === 'ANULADA' ? .55 : 1 }}>
                  <td><strong>{v.nro_comprobante}</strong><div className="suave">{v.tipo_comprobante}</div></td>
                  <td>{fechaHora(v.fecha)}</td>
                  <td>{v.cliente || 'Cliente general'}</td>
                  <td>{v.cajero}</td>
                  <td>{PAGO[v.metodo_pago]}</td>
                  <td>{duracion(v.tiempo_atencion_seg)}</td>
                  <td><strong>{soles(v.total)}</strong></td>
                  <td><span className={`etiqueta ${v.estado === 'ANULADA' ? 'roja' : ''}`}>{v.estado}</span></td>
                  <td>
                    <button className="btn-icono" title="Ver detalle" aria-label="Ver detalle" onClick={() => setDetalleId(v.id)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cargando && datos.ventas.length === 0 && !rangoInvalido && <p className="suave vacio">No hay ventas con esos filtros.</p>}
          {cargando && !rangoInvalido && <p className="suave vacio">Cargando…</p>}
        </div>

        <Paginacion paginacion={datos.paginacion} onCambiar={setPagina} />
      </div>

      {detalleId && (
        <VentaDetalle id={detalleId} puedeAnular={!esCajero} onCerrar={() => setDetalleId(null)}
          onAnulada={() => { setDetalleId(null); setRecarga((n) => n + 1); }} />
      )}
    </>
  );
}