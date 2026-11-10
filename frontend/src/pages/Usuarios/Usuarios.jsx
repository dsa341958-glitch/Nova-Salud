import { useEffect, useState } from 'react';
import { Plus, Power } from 'lucide-react';
import api, { mensajeError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { fechaHora } from '../../utils/format';
import UsuarioForm from './UsuarioForm';

const ROL = { ADMIN: 'Administrador', FARMACEUTICO: 'Farmacéutico', CAJERO: 'Cajero' };

export default function Usuarios() {
  const { usuario } = useAuth();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [nuevo, setNuevo] = useState(false);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    api.get('/usuarios')
      .then(({ data }) => { if (vigente) { setLista(data.usuarios); setError(''); } })
      .catch((e) => vigente && setError(mensajeError(e)))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [recarga]);

  const alternar = async (u) => {
    if (!window.confirm(`¿Seguro que deseas ${u.activo ? 'desactivar' : 'activar'} a ${u.nombres} ${u.apellidos}?`)) return;
    try {
      await api.patch(`/usuarios/${u.id}/estado`, { activo: !u.activo });
      setRecarga((n) => n + 1);
    } catch (e) { setError(mensajeError(e)); }
  };

  return (
    <>
      <div className="cabecera">
        <h1>Usuarios</h1>
        <button className="btn btn-primario" onClick={() => setNuevo(true)}><Plus size={16} /> Nuevo usuario</button>
      </div>

      <div className="card">
        {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}
        <div className="tabla-wrap">
          <table className="tabla">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Último acceso</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id} style={{ opacity: u.activo ? 1 : .55 }}>
                  <td><strong>{u.nombres} {u.apellidos}</strong>{u.id === usuario.id && <span className="etiqueta" style={{ marginLeft: '.4rem' }}>Tú</span>}</td>
                  <td>{u.email}</td>
                  <td>{ROL[u.rol]}</td>
                  <td>{u.ultimo_acceso ? fechaHora(u.ultimo_acceso) : 'Nunca'}</td>
                  <td><span className={`etiqueta ${u.activo ? '' : 'gris'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    {u.id !== usuario.id && (
                      <button className="btn-icono" title={u.activo ? 'Desactivar' : 'Activar'} aria-label="Cambiar estado" onClick={() => alternar(u)}>
                        <Power size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cargando && <p className="suave vacio">Cargando…</p>}
        </div>
      </div>

      {nuevo && <UsuarioForm onGuardado={() => { setNuevo(false); setRecarga((n) => n + 1); }} onCerrar={() => setNuevo(false)} />}
    </>
  );
}