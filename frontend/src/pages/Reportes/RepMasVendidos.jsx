import { useEffect, useState } from 'react';
import api, { mensajeError } from '../../api/client';
import { soles } from '../../utils/format';
import BarrasH from '../../components/BarrasH';

export default function RepMasVendidos({ desde, hasta }) {
  const [lista, setLista] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    setLista(null);
    api.get('/reportes/mas-vendidos', { params: { desde: desde || undefined, hasta: hasta || undefined, limite: 10 } })
      .then(({ data }) => { if (vigente) { setLista(data.productos); setError(''); } })
      .catch((e) => vigente && setError(mensajeError(e)));
    return () => { vigente = false; };
  }, [desde, hasta]);

  if (error) return <div className="error">{error}</div>;
  if (!lista) return <p className="suave">Cargando…</p>;

  return (
    <div className="card">
      <h2>Top 10 por unidades vendidas</h2>
      {lista.length === 0 ? <p className="suave">Sin ventas en este período.</p> : (
        <BarrasH items={lista.map((p) => ({ etiqueta: p.nombre, valor: p.unidades, texto: `${p.unidades} u. · ${soles(p.ingresos)}` }))} />
      )}
    </div>
  );
}