import { useEffect, useState } from 'react';
import api, { mensajeError } from '../../api/client';
import { soles } from '../../utils/format';

const TIPOS = {
  ENTRADA_COMPRA: 'Entradas por compra', SALIDA_VENTA: 'Salidas por venta',
  AJUSTE_POSITIVO: 'Ajustes (+)', AJUSTE_NEGATIVO: 'Ajustes (−)',
  MERMA_VENCIMIENTO: 'Mermas por vencimiento', ANULACION_VENTA: 'Anulaciones de venta',
};

export default function RepInventario({ desde, hasta }) {
  const [d, setD] = useState(null);
  const [repo, setRepo] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    setD(null);
    Promise.all([
      api.get('/reportes/inventario', { params: { desde: desde || undefined, hasta: hasta || undefined } }),
      api.get('/reportes/reposicion'),
    ])
      .then(([inv, rep]) => { if (vigente) { setD(inv.data.reporte); setRepo(rep.data.productos); setError(''); } })
      .catch((e) => vigente && setError(mensajeError(e)));
    return () => { vigente = false; };
  }, [desde, hasta]);

  if (error) return <div className="error">{error}</div>;
  if (!d) return <p className="suave">Cargando…</p>;
  const ind = d.indicadoresDeError;

  return (
    <>
      <div className="grid-stats">
        <div className="card stat"><div><div className="suave">Valor del stock vigente</div><div className="stat-valor">{soles(d.valorizado.valor_vigente)}</div></div></div>
        <div className="card stat"><div><div className="suave">Valor vencido sin dar de baja</div><div className="stat-valor">{soles(d.valorizado.valor_vencido)}</div></div></div>
        <div className="card stat"><div><div className="suave">Mermas del período</div><div className="stat-valor">{soles(d.mermas.valor)}</div><div className="suave">{d.mermas.unidades} unidades</div></div></div>
      </div>

      <div className="card">
        <h2>Indicadores de error de inventario</h2>
        <div className="grid-stats" style={{ marginBottom: 0 }}>
          <div><div className="suave">Ajustes manuales</div><div className="stat-valor">{ind.ajustesManuales}</div></div>
          <div><div className="suave">Total de movimientos</div><div className="stat-valor">{ind.totalMovimientos}</div></div>
          <div><div className="suave">Tasa de ajustes</div><div className="stat-valor">{ind.tasaAjustesPct}%</div><div className="suave">menor es mejor</div></div>
          <div><div className="suave">Quiebres de stock</div><div className="stat-valor">{ind.quiebresDeStock}</div><div className="suave">veces que un producto llegó a 0</div></div>
        </div>
      </div>

      <div className="card">
        <h2>Movimientos por tipo</h2>
        {d.movimientos.length === 0 ? <p className="suave">Sin movimientos.</p> : (
          <div className="tabla-wrap">
            <table className="tabla">
              <thead><tr><th>Tipo</th><th>Movimientos</th><th>Unidades</th></tr></thead>
              <tbody>
                {d.movimientos.map((m) => (
                  <tr key={m.tipo}><td>{TIPOS[m.tipo] || m.tipo}</td><td>{m.movimientos}</td><td>{m.unidades}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Reposición sugerida</h2>
        <p className="suave">Productos en o bajo su stock mínimo. Sugerencia: reponer hasta el doble del mínimo.</p>
        {repo.length === 0 ? <p className="suave">Todo el inventario está sobre el mínimo.</p> : (
          <div className="tabla-wrap">
            <table className="tabla">
              <thead><tr><th>Producto</th><th>Stock</th><th>Mínimo</th><th>Comprar</th></tr></thead>
              <tbody>
                {repo.map((p) => (
                  <tr key={p.producto_id}>
                    <td><strong>{p.nombre}</strong></td><td>{p.stock_total}</td><td>{p.stock_minimo}</td>
                    <td><span className="etiqueta alerta">{p.cantidad_sugerida} u.</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}