import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Power } from 'lucide-react';
import api, { mensajeError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import useDebounce from '../../hooks/useDebounce';
import Paginacion from '../../components/Paginacion';
import ClienteForm from './ClienteForm';

export default function Clientes() {
  const { usuario } = useAuth();
  const gestiona = usuario.rol !== 'CAJERO';

  const [q, setQ] = useState('');
  const qDeb = useDebounce(q, 300);
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState({ clientes: [], paginacion: null });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [editando, setEditando] = useState(undefined);   // undefined = cerrado, null = nuevo, objeto = editar

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    api.get('/clientes', { params: { q: qDeb.trim() || undefined, pagina, limite: 15 } })
      .then(({ data }) => { if (vigente) { setDatos(data); setError(''); } })
      .catch((e) => vigente && setError(mensajeError(e)))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [qDeb, pagina, recarga]);

  const alternarEstado = async (c) => {
    const accion = c.activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Seguro que deseas ${accion} a "${c.nombres}"?`)) return;
    try {
      await api.patch(`/clientes/${c.id}/estado`, { activo: !c.activo });
      setRecarga((n) => n + 1);
    } catch (e) { setError(mensajeError(e)); }
  };

  const guardado = () => { setEditando(undefined); setRecarga((n) => n + 1); };

  return (
    <>
      <div className="cabecera">
        <h1>Clientes</h1>
        <button className="btn btn-primario" onClick={() => setEditando(null)}><Plus size={16} /> Nuevo cliente</button>
      </div>

      <div className="card">
        <div className="filtros">
          <div className="input-icono filtro-buscar">
            <Search size={16} />
            <input className="input" placeholder="Buscar por nombre o documento" value={q}
              onChange={(e) => { setQ(e.target.value); setPagina(1); }} />
          </div>
        </div>

        {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr><th>Documento</th><th>Nombres</th><th>Teléfono</th><th>Correo</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {datos.clientes.map((c) => (
                <tr key={c.id} style={{ opacity: c.activo ? 1 : .55 }}>
                  <td>{c.tipo_documento} {c.nro_documento}</td>
                  <td><strong>{c.nombres}</strong></td>
                  <td>{c.telefono || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td><span className={`etiqueta ${c.activo ? '' : 'gris'}`}>{c.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div className="acciones">
                      <button className="btn-icono" title="Editar" aria-label="Editar" onClick={() => setEditando(c)}><Pencil size={16} /></button>
                      {gestiona && (
                        <button className="btn-icono" title={c.activo ? 'Desactivar' : 'Activar'} aria-label="Cambiar estado" onClick={() => alternarEstado(c)}>
                          <Power size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cargando && datos.clientes.length === 0 && <p className="suave vacio">No hay clientes con ese criterio.</p>}
          {cargando && <p className="suave vacio">Cargando…</p>}
        </div>

        <Paginacion paginacion={datos.paginacion} onCambiar={setPagina} />
      </div>

      {editando !== undefined && (
        <ClienteForm cliente={editando} onGuardado={guardado} onCerrar={() => setEditando(undefined)} />
      )}
    </>
  );
}