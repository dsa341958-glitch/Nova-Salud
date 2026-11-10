import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageX, CalendarClock, Boxes, RefreshCw, CheckCheck } from 'lucide-react';
import api, { mensajeError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { fechaHora } from '../../utils/format';
import Paginacion from '../../components/Paginacion';

// Orden = severidad
const TIPOS = {
  VENCIDO: { titulo: 'Vencidos', clase: 'roja', icono: CalendarClock, accion: { texto: 'Registrar merma', to: '/inventario' } },
  SIN_STOCK: { titulo: 'Sin stock', clase: 'roja', icono: PackageX, accion: { texto: 'Reponer', to: '/compras' } },
  POR_VENCER: { titulo: 'Por vencer', clase: 'alerta', icono: CalendarClock, accion: { texto: 'Ver lotes', to: '/inventario' } },
  STOCK_BAJO: { titulo: 'Stock bajo', clase: 'alerta', icono: Boxes, accion: { texto: 'Reponer', to: '/compras' } },
};

const avisarMenu = () => window.dispatchEvent(new Event('alertas:cambio'));

export default function Alertas() {
  const { usuario } = useAuth();
  const gestiona = usuario.rol !== 'CAJERO';

  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('activas');
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState({ alertas: [], paginacion: null });
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [trabajando, setTrabajando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [lista, res] = await Promise.all([
        api.get('/alertas', { params: { estado, tipo: tipo || undefined, pagina, limite: 20 } }),
        api.get('/alertas/resumen'),
      ]);
      setDatos(lista.data);
      setResumen(res.data.resumen);
      setError('');
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [estado, tipo, pagina]);

  // Carga inicial y refresco cada minuto
  useEffect(() => {
    setCargando(true);
    cargar();
    const id = setInterval(cargar, 60000);
    return () => clearInterval(id);
  }, [cargar]);

  const ejecutar = async (fn) => {
    setError(''); setInfo(''); setTrabajando(true);
    try { await fn(); await cargar(); avisarMenu(); }
    catch (e) { setError(mensajeError(e)); }
    finally { setTrabajando(false); }
  };

  const marcarVista = (a) => ejecutar(() => api.patch(`/alertas/${a.id}/vista`));
  const marcarTodas = () => ejecutar(() => api.patch('/alertas/vistas'));
  const revisarAhora = () => ejecutar(async () => {
    const { data } = await api.post('/alertas/generar');
    const nuevas = Object.values(data.nuevas).reduce((s, n) => s + n, 0);
    setInfo(`Revisión completa: ${nuevas} alertas nuevas y ${data.cerradas} cerradas.`);
  });

  const elegirTipo = (t) => { setTipo(tipo === t ? '' : t); setPagina(1); };

  return (
    <>
      <div className="cabecera">
        <h1>Alertas</h1>
        {gestiona && (
          <div className="acciones">
            <button className="btn" disabled={trabajando || !resumen?.nuevas} onClick={marcarTodas}>
              <CheckCheck size={16} /> Marcar todas como vistas
            </button>
            <button className="btn btn-primario" disabled={trabajando} onClick={revisarAhora}>
              <RefreshCw size={16} /> Revisar ahora
            </button>
          </div>
        )}
      </div>

      {resumen && (
        <div className="resumen-alertas">
          {Object.entries(TIPOS).map(([clave, t]) => {
            const Icono = t.icono;
            return (
              <button key={clave} className={`card resumen-item ${tipo === clave ? 'activo' : ''}`} onClick={() => elegirTipo(clave)}>
                <div className={`resumen-icono ${t.clase}`}><Icono size={20} /></div>
                <div>
                  <div className="resumen-num">{resumen[clave]}</div>
                  <div className="suave">{t.titulo}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="card">
        <div className="filtros">
          <select className="input" value={estado} onChange={(e) => { setEstado(e.target.value); setPagina(1); }}>
            <option value="activas">Activas (nuevas y vistas)</option>
            <option value="NUEVA">Solo nuevas</option>
            <option value="VISTA">Solo vistas</option>
            <option value="ATENDIDA">Atendidas (historial)</option>
          </select>
          <select className="input" value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(1); }}>
            <option value="">Todos los tipos</option>
            {Object.entries(TIPOS).map(([k, t]) => <option key={k} value={k}>{t.titulo}</option>)}
          </select>
        </div>

        {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}
        {info && <div className="aviso" style={{ marginBottom: '.75rem' }}>{info}</div>}

        {cargando && <p className="suave vacio">Cargando…</p>}
        {!cargando && datos.alertas.length === 0 && <p className="suave vacio">No hay alertas con estos filtros. ¡Todo en orden!</p>}

        {datos.alertas.map((a) => {
          const t = TIPOS[a.tipo];
          const Icono = t.icono;
          return (
            <div key={a.id} className={`alerta-item ${a.estado === 'NUEVA' ? 'nueva' : ''}`}>
              <div className={`resumen-icono ${t.clase}`}><Icono size={18} /></div>
              <div className="alerta-texto">
                <div>
                  <span className={`etiqueta ${t.clase}`}>{t.titulo}</span>
                  {a.estado === 'NUEVA' && <span className="etiqueta" style={{ marginLeft: '.4rem' }}>Nueva</span>}
                  {a.estado === 'ATENDIDA' && <span className="etiqueta gris" style={{ marginLeft: '.4rem' }}>Atendida</span>}
                </div>
                <div style={{ margin: '.3rem 0' }}>{a.mensaje}</div>
                <small className="suave">{fechaHora(a.creada_en)}</small>
              </div>
              {gestiona && a.estado !== 'ATENDIDA' && (
                <div className="acciones">
                  <Link className="btn" to={t.accion.to}>{t.accion.texto}</Link>
                  {a.estado === 'NUEVA' && (
                    <button className="btn" disabled={trabajando} onClick={() => marcarVista(a)}>Marcar vista</button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <Paginacion paginacion={datos.paginacion} onCambiar={setPagina} />
      </div>
    </>
  );
}