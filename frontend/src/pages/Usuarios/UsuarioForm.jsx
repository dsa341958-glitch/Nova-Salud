import { useState } from 'react';
import api, { mensajeError } from '../../api/client';
import Modal from '../../components/Modal';

export default function UsuarioForm({ onGuardado, onCerrar }) {
  const [f, setF] = useState({ nombres: '', apellidos: '', email: '', password: '', rol: 'CAJERO' });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => setF({ ...f, [campo]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await api.post('/usuarios', { ...f, nombres: f.nombres.trim(), apellidos: f.apellidos.trim(), email: f.email.trim() });
      onGuardado();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Nuevo usuario" onCerrar={onCerrar}>
      <form onSubmit={enviar}>
        <div className="grid-2">
          <label className="campo">Nombres *
            <input className="input" required maxLength={100} value={f.nombres} onChange={cambiar('nombres')} autoFocus />
          </label>
          <label className="campo">Apellidos *
            <input className="input" required maxLength={100} value={f.apellidos} onChange={cambiar('apellidos')} />
          </label>
        </div>
        <label className="campo">Correo *
          <input className="input" type="email" required maxLength={120} value={f.email} onChange={cambiar('email')} />
        </label>
        <div className="grid-2">
          <label className="campo">Contraseña * <small className="suave">(mín. 8 caracteres)</small>
            <input className="input" type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={cambiar('password')} />
          </label>
          <label className="campo">Rol *
            <select className="input" value={f.rol} onChange={cambiar('rol')}>
              <option value="CAJERO">Cajero</option>
              <option value="FARMACEUTICO">Farmacéutico</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>
        </div>

        {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

        <div className="grid-2">
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-primario" disabled={guardando}>{guardando ? 'Guardando…' : 'Crear usuario'}</button>
        </div>
      </form>
    </Modal>
  );
}