import { Navigate, Route, Routes } from 'react-router-dom';
import RutaProtegida from './routes/RutaProtegida';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Ventas from './pages/Ventas/Ventas';
import Productos from './pages/Productos/Productos';
import Alertas from './pages/Alertas/Alertas';
import Clientes from './pages/Clientes/Clientes';
import Inventario from './pages/Inventario/Inventario';
import Compras from './pages/Compras/Compras';
import Reportes from './pages/Reportes/Reportes';
import Usuarios from './pages/Usuarios/Usuarios';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RutaProtegida />}>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="productos" element={<Productos />} />
          <Route path="alertas" element={<Alertas />} /> 

          <Route element={<RutaProtegida roles={['ADMIN', 'FARMACEUTICO']} />}>
            <Route path="inventario" element={<Inventario />} />
            <Route path="compras" element={<Compras />} />
            <Route path="reportes" element={<Reportes />} />
          </Route>

          <Route element={<RutaProtegida roles={['ADMIN']} />}>
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}