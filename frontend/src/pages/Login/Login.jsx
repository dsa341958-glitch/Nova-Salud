import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Pill } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mensajeError } from '../../api/client';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const expirada = sessionStorage.getItem('sesion_expirada') === '1';

  if (usuario) return <Navigate to="/" replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await entrar(email.trim(), password);
      sessionStorage.removeItem('sesion_expirada');
      navigate(location.state?.desde?.pathname || '/', { replace: true });
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={enviar}>
        <div className="login-logo"><Pill size={28} /></div>
        <h1>Nova Salud</h1>
        <p className="suave">Sistema de gestión de inventario y ventas</p>

        <label>Correo
          <input className="input" type="email" value={email} autoFocus required
            onChange={(e) => setEmail(e.target.value)} placeholder="usuario@novasalud.com" />
        </label>
        <label>Contraseña
          <input className="input" type="password" value={password} required
            onChange={(e) => setPassword(e.target.value)} />
        </label>

        {expirada && !error && (
          <div className="aviso">Tu sesión expiró. Ingresa de nuevo para continuar.</div>
        )}
        {error && <div className="error" role="alert">{error}</div>}

        <button className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}