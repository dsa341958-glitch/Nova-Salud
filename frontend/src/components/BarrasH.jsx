// Barras horizontales simples. items: [{ etiqueta, valor, texto }]
export default function BarrasH({ items }) {
  const max = Math.max(...items.map((i) => i.valor), 1);
  return (
    <div className="barras-h">
      {items.map((i) => (
        <div key={i.etiqueta} className="barra-h-fila">
          <span className="barra-h-etq" title={i.etiqueta}>{i.etiqueta}</span>
          <div className="barra-h-pista"><div className="barra-h" style={{ width: `${(i.valor / max) * 100}%` }} /></div>
          <span className="barra-h-val">{i.texto ?? i.valor}</span>
        </div>
      ))}
    </div>
  );
}