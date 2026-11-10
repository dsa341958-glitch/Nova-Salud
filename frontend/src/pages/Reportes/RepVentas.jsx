import { useEffect, useState } from 'react';
import api, { mensajeError } from '../../api/client';
import { soles, diaCorto } from '../../utils/format';
import BarrasH from '../../components/BarrasH';

const PAGO = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', YAPE_PLIN: 'Yape / Plin', OTRO: 'Otro' };

export default function RepVentas({ desde, hasta }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    setD(null);
    api.get('/reportes/ventas', { params: { desde: desde || undefined, hasta: hasta || undefined } })
      .then(({ data }) => { if (vigente) { setD(data.reporte); setError(''); } })
      .catch((e) => vigente && setError(mensajeError(e)));
    return () => { vigente = false; };
  }, [desde, hasta]);

  if (error) return <div className="error">{error}</div>;
  if (!d) return <p className="suave">Cargando…</p>;

  const maxDia = Math.max(...d.porDia.map((x) => x.total), 1);

  return (
    <>
      <div className="grid-stats">
        <div className="card stat"><div><div className="suave">Ventas</div><div className="stat-valor">{d.resumen.ventas}</div></div></div>
        <div className="card stat"><div><div className="suave">Total vendido</div><div className="stat-valor">{soles(d.resumen.total)}</div></div></div>
        <div className="card stat"><div><div className="suave">Ticket promedio</div><div className="stat-valor">{soles(d.resumen.ticket_promedio)}</div></div></div>
        <div className="card stat"><div><div className="suave">Ventas anuladas</div><div className="stat-valor">{d.anuladas}</div></div></div>
      </div>

      <div className="card">
        <h2>Ventas por día</h2>
        {d.porDia.length === 0 ? <p className="suave">Sin ventas en este período.</p> : (
          <div className="barras">
            {d.porDia.map((x) => (
              <div key={x.dia} className="barra-col" title={`${soles(x.total)} (${x.cantidad} ventas)`}>
                <div className="barra" style={{ height: `${(x.total / maxDia) * 100}%` }} />
                <small>{diaCorto(x.dia)}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Por método de pago</h2>
        {d.porMetodo.length === 0 ? <p className="suave">Sin datos.</p> : (
          <BarrasH items={d.porMetodo.map((m) => ({ etiqueta: PAGO[m.metodo_pago], valor: m.total, texto: `${soles(m.total)} (${m.cantidad})` }))} />
        )}
      </div>
    </>
  );
}