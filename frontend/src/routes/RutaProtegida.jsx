import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RutaProtegida({ roles }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <div className="pantalla-centro">Cargando…</div>;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location }} />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />;
  return <Outlet />;
}