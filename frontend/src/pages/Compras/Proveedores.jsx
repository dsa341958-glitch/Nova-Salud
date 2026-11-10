import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Power } from 'lucide-react';
import api, { mensajeError } from '../../api/client';
import useDebounce from '../../hooks/useDebounce';
import ProveedorForm from './ProveedorForm';

export default function Proveedores() {
  const [q, setQ] = useState('');
  const qDeb = useDebounce(q, 300);
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [editando, setEditando] = useState(undefined);   // undefined = cerrado, null = nuevo

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    api.get('/proveedores', { params: { q: qDeb.trim() || undefined } })
      .then(({ data }) => { if (vigente) { setLista(data.proveedores); setError(''); } })
      .catch((e) => vigente && setError(mensajeError(e)))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [qDeb, recarga]);

  const alternar = async (p) => {
    if (!window.confirm(`¿Seguro que deseas ${p.activo ? 'desactivar' : 'activar'} a "${p.razon_social}"?`)) return;
    try {
      await api.patch(`/proveedores/${p.id}/estado`, { activo: !p.activo });
      setRecarga((n) => n + 1);
    } catch (e) { setError(mensajeError(e)); }
  };

  return (
    <div className="card">
      <div className="filtros">
        <div className="input-icono filtro-buscar">
          <Search size={16} />
          <input className="input" placeholder="Buscar por razón social o RUC" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="btn btn-primario" onClick={() => setEditando(null)}><Plus size={16} /> Nuevo proveedor</button>
      </div>

      {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

      <div className="tabla-wrap">
        <table className="tabla">
          <thead><tr><th>Razón social</th><th>RUC</th><th>Teléfono</th><th>Correo</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id} style={{ opacity: p.activo ? 1 : .55 }}>
                <td><strong>{p.razon_social}</strong><div className="suave">{p.direccion || ''}</div></td>
                <td>{p.ruc}</td>
                <td>{p.telefono || '—'}</td>
                <td>{p.email || '—'}</td>
                <td><span className={`etiqueta ${p.activo ? '' : 'gris'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <div className="acciones">
                    <button className="btn-icono" title="Editar" aria-label="Editar" onClick={() => setEditando(p)}><Pencil size={16} /></button>
                    <button className="btn-icono" title={p.activo ? 'Desactivar' : 'Activar'} aria-label="Cambiar estado" onClick={() => alternar(p)}><Power size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!cargando && lista.length === 0 && <p className="suave vacio">No hay proveedores. Registra el primero.</p>}
        {cargando && <p className="suave vacio">Cargando…</p>}
      </div>

      {editando !== undefined && (
        <ProveedorForm proveedor={editando}
          onGuardado={() => { setEditando(undefined); setRecarga((n) => n + 1); }}
          onCerrar={() => setEditando(undefined)} />
      )}
    </div>
  );
}