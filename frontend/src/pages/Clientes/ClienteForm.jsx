import { useState } from 'react';
import api, { mensajeError } from '../../api/client';
import Modal from '../../components/Modal';

const LARGO = { DNI: 8, RUC: 11, CE: 15, OTRO: 15 };

const inicial = (c) => ({
  tipoDocumento: c?.tipo_documento ?? 'DNI',
  nroDocumento: c?.nro_documento ?? '',
  nombres: c?.nombres ?? '',
  telefono: c?.telefono ?? '',
  email: c?.email ?? '',
});

export default function ClienteForm({ cliente, onGuardado, onCerrar }) {
  const [f, setF] = useState(inicial(cliente));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => setF({ ...f, [campo]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const payload = {
        ...f,
        nroDocumento: f.nroDocumento.trim(),
        nombres: f.nombres.trim(),
        telefono: f.telefono.trim(),
        email: f.email.trim(),
      };
      if (cliente) await api.put(`/clientes/${cliente.id}`, payload);
      else await api.post('/clientes', payload);
      onGuardado();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo={cliente ? 'Editar cliente' : 'Nuevo cliente'} onCerrar={onCerrar}>
      <form onSubmit={enviar}>
        <div className="grid-2">
          <label className="campo">Tipo de documento
            <select className="input" value={f.tipoDocumento} onChange={cambiar('tipoDocumento')}>
              <option value="DNI">DNI</option>
              <option value="RUC">RUC</option>
              <option value="CE">C. Extranjería</option>
              <option value="OTRO">Otro</option>
            </select>
          </label>
          <label className="campo">N.º de documento *
            <input className="input" required maxLength={LARGO[f.tipoDocumento]} value={f.nroDocumento}
              onChange={cambiar('nroDocumento')} autoFocus />
          </label>
        </div>

        <label className="campo">Nombres o razón social *
          <input className="input" required maxLength={150} value={f.nombres} onChange={cambiar('nombres')} />
        </label>

        <div className="grid-2">
          <label className="campo">Teléfono
            <input className="input" maxLength={20} value={f.telefono} onChange={cambiar('telefono')} />
          </label>
          <label className="campo">Correo
            <input className="input" type="email" maxLength={120} value={f.email} onChange={cambiar('email')} />
          </label>
        </div>

        {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

        <div className="grid-2">
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-primario" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}