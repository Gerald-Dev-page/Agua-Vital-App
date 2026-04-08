import '../styles/sidebar.css';
import logoAgua from '../public/Logo-Agua.png'; 
import { 
  LayoutDashboard, 
  Droplet, 
  Package, 
  Users, 
  Truck 
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage }) {
  // Se reemplazan los strings de emojis por referencias a los componentes de Lucide
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'ventas', label: 'Ventas', Icon: Droplet },
    { id: 'productos', label: 'Productos', Icon: Package },
    { id: 'clientes', label: 'Clientes', Icon: Users },
    { id: 'stock', label: 'Stock', Icon: Truck },
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <img src={logoAgua} alt="Agua Vital" className="nav-logo" />
      </div>
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li 
            key={item.id} 
            className={currentPage === item.id ? 'active' : ''}
            onClick={() => setCurrentPage(item.id)}
          >
            {/* Renderizamos el componente de icono dinámicamente con un tamaño estándar */}
            <span className="menu-icon">
              <item.Icon size={20} strokeWidth={2} />
            </span>
            <span className="menu-label">{item.label}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
}