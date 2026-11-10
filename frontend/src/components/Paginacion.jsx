import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Paginacion({ paginacion, onCambiar }) {
  if (!paginacion || paginacion.paginas <= 1) return null;
  const { pagina, paginas, total } = paginacion;
  return (
    <div className="paginacion">
      <span className="suave">{total} registros</span>
      <div className="paginacion-botones">
        <button className="btn" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)} aria-label="Anterior">
          <ChevronLeft size={16} />
        </button>
        <span>Página {pagina} de {paginas}</span>
        <button className="btn" disabled={pagina >= paginas} onClick={() => onCambiar(pagina + 1)} aria-label="Siguiente">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}