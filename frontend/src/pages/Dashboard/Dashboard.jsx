import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, TrendingUp, Timer, PackageX, CalendarClock, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api, { mensajeError } from '../../api/client';
import { soles, duracion, diaCorto } from '../../utils/format';

function Stat({ icono: Icono, titulo, valor, detalle, to }) {
  const cuerpo = (
    <div className="card stat">
      <div className="stat-icono"><Icono size={20} /></div>
      <div>
        <div className="suave">{titulo}</div>
        <div className="stat-valor">{valor}</div>
        {detalle && <div className="suave">{detalle}</div>}
      </div>
    </div>
  );
  return to ? <Link to={to} className="sin-subrayado">{cuerpo}</Link> : cuerpo;
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const gestiona = usuario.rol !== 'CAJERO';
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!gestiona) return;
    api.get('/reportes/dashboard')
      .then(({ data }) => setD(data.dashboard))
      .catch((e) => setError(mensajeError(e)));
  }, [gestiona]);

  if (!gestiona) {
    return (
      <div className="card">
        <h1>Hola, {usuario.nombre}</h1>
        <p className="suave">Listo para atender. Entra al punto de venta para registrar una venta.</p>
        <Link to="/ventas" className="btn btn-primario">Ir al punto de venta</Link>
      </div>
    );
  }

  if (error) return <div className="error">{error}</div>;
  if (!d) return <p className="suave">Cargando panel…</p>;

  const maxDia = Math.max(...d.ultimos7Dias.map((x) => x.total), 1);

  return (
    <>
      <h1>Panel general</h1>
      <div className="grid-stats">
        <Stat icono={ShoppingCart} titulo="Ventas de hoy" valor={soles(d.hoy.total)} detalle={`${d.hoy.ventas} ventas`} to="/ventas" />
        <Stat icono={TrendingUp} titulo="Ventas del mes" valor={soles(d.mes.total)} detalle={`${d.mes.ventas} ventas`} to="/reportes" />
        <Stat icono={Timer} titulo="Atención promedio (hoy)" valor={duracion(d.hoy.tiempo_promedio_seg)} />
        <Stat icono={PackageX} titulo="Productos bajo stock" valor={d.productosBajoStock} to="/alertas" />
        <Stat icono={CalendarClock} titulo="Lotes por vencer" valor={d.lotesPorVencer} to="/alertas" />
        <Stat icono={Bell} titulo="Alertas activas" valor={d.alertasActivas} to="/alertas" />
      </div>

      <div className="card">
        <h2>Ventas de los últimos 7 días</h2>
        {d.ultimos7Dias.length === 0 ? (
          <p className="suave">Aún no hay ventas en este período.</p>
        ) : (
          <div className="barras">
            {d.ultimos7Dias.map((x) => (
              <div key={x.dia} className="barra-col" title={`${soles(x.total)} (${x.cantidad} ventas)`}>
                <div className="barra" style={{ height: `${(x.total / maxDia) * 100}%` }} />
                <small>{diaCorto(x.dia)}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}