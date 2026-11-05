import { Navigate, Route, Routes } from 'react-router-dom';
import RutaProtegida from './routes/RutaProtegida';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Pendiente from './components/Pendiente';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RutaProtegida />}>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="ventas" element={<Pendiente titulo="Punto de venta" />} />
          <Route path="clientes" element={<Pendiente titulo="Clientes" />} />
          <Route path="productos" element={<Pendiente titulo="Productos" />} />
          <Route path="alertas" element={<Pendiente titulo="Alertas" />} />

          <Route element={<RutaProtegida roles={['ADMIN', 'FARMACEUTICO']} />}>
            <Route path="inventario" element={<Pendiente titulo="Inventario" />} />
            <Route path="compras" element={<Pendiente titulo="Compras" />} />
            <Route path="reportes" element={<Pendiente titulo="Reportes" />} />
          </Route>

          <Route element={<RutaProtegida roles={['ADMIN']} />}>
            <Route path="usuarios" element={<Pendiente titulo="Usuarios" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}