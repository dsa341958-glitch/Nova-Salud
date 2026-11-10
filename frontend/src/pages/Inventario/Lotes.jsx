import { useEffect, useState } from 'react';
import { SlidersHorizontal, History } from 'lucide-react';
import api, { mensajeError } from '../../api/client';
import { soles, fechaHora } from '../../utils/format';
import Paginacion from '../../components/Paginacion';
import AjusteModal from './AjusteModal';

const DIAS_ALERTA = 60;

function estadoLote(l) {
  if (l.stock_actual === 0) return { texto: 'Agotado', clase: 'gris' };
  if (l.dias_restantes <= 0) return { texto: 'Vencido', clase: 'roja' };
  if (l.dias_restantes <= DIAS_ALERTA) return { texto: 'Por vencer', clase: 'alerta' };
  return { texto: 'Vigente', clase: '' };
}

export default function Lotes({ onVerKardex }) {
  const [estado, setEstado] = useState('vigentes');
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState({ lotes: [], paginacion: null });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [ajustando, setAjustando] = useState(null);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    api.get('/inventario/lotes', { params: { estado: estado || undefined, pagina, limite: 15 } })
      .then(({ data }) => { if (vigente) { setDatos(data); setError(''); } })
      .catch((e) => vigente && setError(mensajeError(e)))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [estado, pagina, recarga]);

  const guardado = () => { setAjustando(null); setRecarga((n) => n + 1); };

  return (
    <div className="card">
      <div className="filtros">
        <select className="input" value={estado} onChange={(e) => { setEstado(e.target.value); setPagina(1); }}>
          <option value="vigentes">Vigentes con stock</option>
          <option value="porVencer">Por vencer (próximos {DIAS_ALERTA} días)</option>
          <option value="vencidos">Vencidos con stock</option>
          <option value="">Todos los lotes</option>
        </select>
        <span className="suave">Ordenados por vencimiento: lo que vence antes se vende primero (FEFO).</span>
      </div>

      {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

      <div className="tabla-wrap">
        <table className="tabla">
          <thead>
            <tr><th>Producto</th><th>Lote</th><th>Vence</th><th>Estado</th><th>Inicial</th><th>Stock</th><th>Costo</th><th></th></tr>
          </thead>
          <tbody>
            {datos.lotes.map((l) => {
              const e = estadoLote(l);
              return (
                <tr key={l.id}>
                  <td><strong>{l.producto}</strong></td>
                  <td>{l.codigo_lote}</td>
                  <td>
                    {fechaHora(l.fecha_vencimiento)}
                    <div className="suave">{l.dias_restantes > 0 ? `en ${l.dias_restantes} días` : 'vencido'}</div>
                  </td>
                  <td><span className={`etiqueta ${e.clase}`}>{e.texto}</span></td>
                  <td>{l.cantidad_inicial}</td>
                  <td><strong>{l.stock_actual}</strong></td>
                  <td>{soles(l.costo_unitario)}</td>
                  <td>
                    <div className="acciones">
                      <button className="btn-icono" title="Ajustar stock" aria-label="Ajustar stock" onClick={() => setAjustando(l)}>
                        <SlidersHorizontal size={16} />
                      </button>
                      <button className="btn-icono" title="Ver kardex del lote" aria-label="Ver kardex" onClick={() => onVerKardex(l)}>
                        <History size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!cargando && datos.lotes.length === 0 && <p className="suave vacio">No hay lotes en esta categoría.</p>}
        {cargando && <p className="suave vacio">Cargando…</p>}
      </div>

      <Paginacion paginacion={datos.paginacion} onCambiar={setPagina} />
      {ajustando && <AjusteModal lote={ajustando} onGuardado={guardado} onCerrar={() => setAjustando(null)} />}
    </div>
  );
}