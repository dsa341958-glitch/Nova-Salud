import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const leerUsuario = () => {
  try { return JSON.parse(localStorage.getItem('usuario')); } catch { return null; }
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuario);
  const [cargando, setCargando] = useState(!!localStorage.getItem('token'));

  const salir = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }, []);

  // El interceptor avisa cuando el token expira
  useEffect(() => {
    window.addEventListener('auth:expirada', salir);
    return () => window.removeEventListener('auth:expirada', salir);
  }, [salir]);

  // Al abrir la app, valida el token guardado contra el servidor
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/auth/me')
      .then(({ data }) => {
        const u = data.usuario;
        const actual = { id: u.id, nombre: `${u.nombres} ${u.apellidos}`, email: u.email, rol: u.rol };
        localStorage.setItem('usuario', JSON.stringify(actual));
        setUsuario(actual);
      })
      .catch(() => salir())
      .finally(() => setCargando(false));
  }, [salir]);

  const entrar = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, entrar, salir }}>
      {children}
    </AuthContext.Provider>
  );
}