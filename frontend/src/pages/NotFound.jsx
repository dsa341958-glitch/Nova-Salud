import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="card" style={{ maxWidth: 520, margin: '2rem auto', textAlign: 'center' }}>
      <SearchX size={44} color="#64748b" />
      <h1>Página no encontrada</h1>
      <p className="suave">La dirección que escribiste no existe o fue movida.</p>
      <Link to="/" className="btn btn-primario">Volver al inicio</Link>
    </div>
  );
}