import { LayoutDashboard, ShoppingCart, Users, Pill, Boxes, Truck, Bell, BarChart3, Shield } from 'lucide-react';

const TODOS = ['ADMIN', 'FARMACEUTICO', 'CAJERO'];
const GESTION = ['ADMIN', 'FARMACEUTICO'];

export const MENU = [
  { to: '/', texto: 'Inicio', icono: LayoutDashboard, roles: TODOS, fin: true },
  { to: '/ventas', texto: 'Punto de venta', icono: ShoppingCart, roles: TODOS },
  { to: '/clientes', texto: 'Clientes', icono: Users, roles: TODOS },
  { to: '/productos', texto: 'Productos', icono: Pill, roles: TODOS },
  { to: '/inventario', texto: 'Inventario', icono: Boxes, roles: GESTION },
  { to: '/compras', texto: 'Compras', icono: Truck, roles: GESTION },
  { to: '/alertas', texto: 'Alertas', icono: Bell, roles: TODOS, badge: true },
  { to: '/reportes', texto: 'Reportes', icono: BarChart3, roles: GESTION },
  { to: '/usuarios', texto: 'Usuarios', icono: Shield, roles: ['ADMIN'] },
];