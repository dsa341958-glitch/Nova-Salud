import { useEffect, useState } from 'react';
import api, { mensajeError } from '../../api/client';
import { duracion, diaCorto } from '../../utils/format';
import BarrasH from '../../components/BarrasH';

export default function RepAtencion({ desde, hasta }) {
  const [meta, setMeta] = useState(120);
  const metaDeb = useDebouncedValue(meta);
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    api.get('/reportes/tiempo-atencion', { params: { desde: desde || undefined, hasta: hasta || undefined, meta: metaDeb } })
      .then(({ data }) => { if (vigente) { setD(data.reporte); setError(''); } })
      .catch((e) => vigente && setError(mensajeError(e)));
    return () => { vigente = false; };
  }, [desde, hasta, metaDeb]);

  if (error) return <div className="error">{error}</div>;
  if (!d) return <p className="suave">Cargando…</p>;
  const r = d.resumen;

  return (
    <>
      <div className="card filtros">
        <label className="check-simple">Meta de atención (segundos)
          <input className="input" type="number" min="1" max="7200" value={meta}
            onChange={(e) => setMeta(Math.min(Math.max(Number(e.target.value) || 1, 1), 7200))} />
        </label>
        <span className="suave">Solo cuentan ventas con tiempo registrado por el cronómetro del POS.</span>
      </div>

      <div className="grid-stats">
        <div className="card stat"><div><div className="suave">Ventas medidas</div><div className="stat-valor">{r.ventas_medidas}</div></div></div>
        <div className="card stat"><div><div className="suave">Tiempo promedio</div><div className="stat-valor">{duracion(r.promedio_seg)}</div></div></div>
        <div className="card stat"><div><div className="suave">Más rápida / más lenta</div><div className="stat-valor" style={{ fontSize: '1.05rem' }}>{duracion(r.minimo_seg)} / {duracion(r.maximo_seg)}</div></div></div>
        <div className="card stat"><div><div className="suave">Dentro de la meta</div><div className="stat-valor">{r.pct_dentro_meta}%</div></div></div>
      </div>

      <div className="card">
        <h2>Promedio por cajero</h2>
        {d.porCajero.length === 0 ? <p className="suave">Sin datos.</p> : (
          <BarrasH items={d.porCajero.map((c) => ({ etiqueta: c.cajero, valor: c.promedio_seg, texto: `${duracion(c.promedio_seg)} (${c.ventas} ventas)` }))} />
        )}
      </div>

      <div className="card">
        <h2>Promedio por día</h2>
        {d.porDia.length === 0 ? <p className="suave">Sin datos.</p> : (
          <BarrasH items={d.porDia.map((x) => ({ etiqueta: diaCorto(x.dia), valor: x.promedio_seg, texto: `${duracion(x.promedio_seg)} (${x.ventas})` }))} />
        )}
      </div>
    </>
  );
}

// Espera a que el usuario termine de escribir la meta
function useDebouncedValue(valor, ms = 400) {
  const [v, setV] = useState(valor);
  useEffect(() => { const id = setTimeout(() => setV(valor), ms); return () => clearTimeout(id); }, [valor, ms]);
  return v;
}