import { useEffect, useState, useCallback } from 'react';
import { Plus, Power } from 'lucide-react';
import api, { mensajeError } from '../../api/client';
import Modal from '../../components/Modal';

export default function CategoriasModal({ onCerrar, onCambio }) {
  const [lista, setLista] = useState([]);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    api.get('/categorias').then(({ data }) => setLista(data.categorias)).catch((e) => setError(mensajeError(e)));
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/categorias', { nombre: nombre.trim() });
      setNombre('');
      cargar(); onCambio();
    } catch (err) { setError(mensajeError(err)); }
  };

  const alternar = async (c) => {
    setError('');
    try {
      await api.patch(`/categorias/${c.id}/estado`, { activo: !c.activo });
      cargar(); onCambio();
    } catch (err) { setError(mensajeError(err)); }
  };

  return (
    <Modal titulo="Categorías" onCerrar={onCerrar}>
      <form onSubmit={crear} className="fila-form">
        <input className="input" required maxLength={80} placeholder="Nueva categoría" value={nombre}
          onChange={(e) => setNombre(e.target.value)} />
        <button className="btn btn-primario"><Plus size={16} /> Agregar</button>
      </form>

      {error && <div className="error" role="alert" style={{ margin: '.75rem 0' }}>{error}</div>}

      <div style={{ marginTop: '.75rem' }}>
        {lista.map((c) => (
          <div key={c.id} className="linea-simple">
            <span style={{ opacity: c.activo ? 1 : .5 }}>{c.nombre}</span>
            <button className="btn" onClick={() => alternar(c)}>
              <Power size={14} /> {c.activo ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}