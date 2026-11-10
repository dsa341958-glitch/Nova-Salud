import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Pill } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { MENU } from '../routes/menu';

export default function MainLayout() {
  const { usuario, salir } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [nuevas, setNuevas] = useState(0);

  // En celular, el menú se cierra al navegar
  useEffect(() => { setAbierto(false); }, [pathname]);

  // Globito de alertas nuevas (se refresca cada minuto)
  useEffect(() => {
    let activo = true;
    const cargar = () =>
      api.get('/alertas/resumen')
        .then(({ data }) => activo && setNuevas(data.resumen.nuevas))
        .catch(() => {});
    cargar();
    const id = setInterval(cargar, 60000);
    window.addEventListener('alertas:cambio', cargar);
    return () => {
      activo = false;
      clearInterval(id);
      window.removeEventListener('alertas:cambio', cargar);
    };
  }, [pathname]);

  const items = MENU.filter((i) => i.roles.includes(usuario.rol));

  const cerrarSesion = () => { salir(); navigate('/login', { replace: true }); };

  return (
    <div className="app">
      {abierto && <div className="overlay" onClick={() => setAbierto(false)} />}

      <aside className={`sidebar ${abierto ? 'abierto' : ''}`}>
        <div className="marca"><Pill size={22} /> Nova Salud</div>
        <nav>
          {items.map(({ to, texto, icono: Icono, fin, badge }) => (
            <NavLink key={to} to={to} end={fin} className="nav-item">
              <Icono size={18} />
              <span>{texto}</span>
              {badge && nuevas > 0 && <span className="badge">{nuevas}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="usuario">
          <div>
            <strong>{usuario.nombre}</strong>
            <small>{usuario.rol}</small>
          </div>
          <button className="btn-icono" onClick={cerrarSesion} title="Cerrar sesión" aria-label="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <div className="contenido">
        <header className="topbar">
          <button className="btn-icono menu-btn" onClick={() => setAbierto(true)} aria-label="Abrir menú">
            <Menu size={22} />
          </button>
          <span className="topbar-titulo">Nova Salud</span>
        </header>
        <main className="main"><Outlet /></main>
      </div>
    </div>
  );
}