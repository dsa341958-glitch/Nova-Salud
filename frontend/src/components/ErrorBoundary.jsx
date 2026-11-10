import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error de pantalla:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card" style={{ maxWidth: 520, margin: '2rem auto', textAlign: 'center' }}>
        <h1>Algo salió mal</h1>
        <p className="suave">Esta pantalla tuvo un error inesperado. Puedes seguir usando el menú o recargar.</p>
        <button className="btn btn-primario" onClick={() => window.location.reload()}>Recargar página</button>
      </div>
    );
  }
}