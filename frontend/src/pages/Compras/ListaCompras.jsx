import { useEffect, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import api, { mensajeError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { soles, fechaHora } from '../../utils/format';
import Paginacion from '../../components/Paginacion';
import CompraForm from './CompraForm';
import CompraDetalle from './CompraDetalle';

export default function ListaCompras() {
  const { usuario } = useAuth();
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState({ compras: [], paginacion: null });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [nueva, setNueva] = useState(false);
  const [detalleId, setDetalleId] = useState(null);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    api.get('/compras', { params: { pagina, limite: 15 } })
      .then(({ data }) => { if (vigente) { setDatos(data); setError(''); } })
      .catch((e) => vigente && setError(mensajeError(e)))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [pagina, recarga]);

  return (
    <div className="card">
      <div className="filtros">
        <span className="suave" style={{ flex: 1 }}>Cada compra crea los lotes y el ingreso al kardex automáticamente.</span>
        <button className="btn btn-primario" onClick={() => setNueva(true)}><Plus size={16} /> Nueva compra</button>
      </div>

      {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

      <div className="tabla-wrap">
        <table className="tabla">
          <thead><tr><th>N.º</th><th>Fecha</th><th>Proveedor</th><th>Documento</th><th>Total</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {datos.compras.map((c) => (
              <tr key={c.id} style={{ opacity: c.estado === 'ANULADA' ? .55 : 1 }}>
                <td>#{c.id}</td>
                <td>{fechaHora(c.fecha)}</td>
                <td><strong>{c.proveedor}</strong><div className="suave">{c.usuario}</div></td>
                <td>{c.nro_documento || '—'}</td>
                <td>{soles(c.total)}</td>
                <td><span className={`etiqueta ${c.estado === 'ANULADA' ? 'roja' : ''}`}>{c.estado}</span></td>
                <td>
                  <button className="btn-icono" title="Ver detalle" aria-label="Ver detalle" onClick={() => setDetalleId(c.id)}><Eye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!cargando && datos.compras.length === 0 && <p className="suave vacio">Aún no hay compras registradas.</p>}
        {cargando && <p className="suave vacio">Cargando…</p>}
      </div>

      <Paginacion paginacion={datos.paginacion} onCambiar={setPagina} />

      {nueva && <CompraForm onGuardado={() => { setNueva(false); setPagina(1); setRecarga((n) => n + 1); }} onCerrar={() => setNueva(false)} />}
      {detalleId && (
        <CompraDetalle id={detalleId} esAdmin={usuario.rol === 'ADMIN'} onCerrar={() => setDetalleId(null)}
          onAnulada={() => { setDetalleId(null); setRecarga((n) => n + 1); }} />
      )}
    </div>
  );
}