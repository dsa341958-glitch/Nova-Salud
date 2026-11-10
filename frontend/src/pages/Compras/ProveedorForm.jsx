import { useState } from 'react';
import api, { mensajeError } from '../../api/client';
import Modal from '../../components/Modal';

const inicial = (p) => ({
  razonSocial: p?.razon_social ?? '',
  ruc: p?.ruc ?? '',
  telefono: p?.telefono ?? '',
  email: p?.email ?? '',
  direccion: p?.direccion ?? '',
});

export default function ProveedorForm({ proveedor, onGuardado, onCerrar }) {
  const [f, setF] = useState(inicial(proveedor));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => setF({ ...f, [campo]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const payload = {
        razonSocial: f.razonSocial.trim(),
        ruc: f.ruc.trim(),
        telefono: f.telefono.trim(),
        email: f.email.trim(),
        direccion: f.direccion.trim(),
      };
      if (proveedor) await api.put(`/proveedores/${proveedor.id}`, payload);
      else await api.post('/proveedores', payload);
      onGuardado();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo={proveedor ? 'Editar proveedor' : 'Nuevo proveedor'} onCerrar={onCerrar}>
      <form onSubmit={enviar}>
        <label className="campo">Razón social *
          <input className="input" required maxLength={150} value={f.razonSocial} onChange={cambiar('razonSocial')} autoFocus />
        </label>
        <div className="grid-2">
          <label className="campo">RUC * <small className="suave">(11 dígitos)</small>
            <input className="input" required maxLength={11} pattern="\d{11}" inputMode="numeric"
              value={f.ruc} onChange={cambiar('ruc')} />
          </label>
          <label className="campo">Teléfono
            <input className="input" maxLength={20} value={f.telefono} onChange={cambiar('telefono')} />
          </label>
        </div>
        <label className="campo">Correo
          <input className="input" type="email" maxLength={120} value={f.email} onChange={cambiar('email')} />
        </label>
        <label className="campo">Dirección
          <input className="input" maxLength={200} value={f.direccion} onChange={cambiar('direccion')} />
        </label>

        {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

        <div className="grid-2">
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-primario" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}