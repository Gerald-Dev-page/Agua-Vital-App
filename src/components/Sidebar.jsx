// src/components/Sidebar.jsx
import logoAgua from '../public/Logo.png';
import logoGerald from '../public/logo-Gerald.png';
import {
  LayoutDashboard,
  Droplet,
  Package,
  Users,
  Store // <-- Agregamos el ícono para el local
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage }) {
  const menuItems = [
    { id: 'dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
    { id: 'ventas-local', label: 'Ventas Local', Icon: Store }, // <-- Nueva vista
    { id: 'ventas',       label: 'Ventas',       Icon: Droplet },
    { id: 'productos',    label: 'Productos',    Icon: Package },
    { id: 'clientes',     label: 'Clientes',     Icon: Users },
  ];

  return (
    <nav className="
      fixed bottom-0 left-0 z-50
      w-full bg-white border-t border-gray-200
      flex items-center
      md:top-0 md:left-0 md:h-screen md:w-56
      md:flex-col md:border-t-0 md:border-r md:border-gray-200
      md:justify-start
    ">

      {/* Logo Agua Vital — solo desktop */}
      <div className="hidden md:flex flex-col items-center w-full px-6 pt-8 pb-6 border-b border-gray-200">
        <img
          src={logoAgua}
          alt="Agua Vital"
          className="h-auto max-w-[120px] object-contain"
        />
        <span className="mt-2 text-[10px] font-semibold tracking-widest text-gray-500 uppercase">
          Panel de gestión
        </span>
      </div>

      {/* Menú */}
      <ul className="
        flex w-full justify-around items-center
        md:flex-col md:justify-start md:gap-1
        md:px-3 md:pt-4 md:flex-1
      ">
        {menuItems.map(({ id, label, Icon }) => {
          const isActive = currentPage === id;

          return (
            <li
              key={id}
              onClick={() => setCurrentPage(id)}
              className={`
                relative flex flex-col items-center justify-center
                py-3 px-2 cursor-pointer select-none
                transition-all duration-200 w-full
                md:flex-row md:justify-start md:gap-3
                md:px-4 md:py-3 md:rounded-xl
                ${isActive
                  ? 'text-blue-700 md:bg-blue-50 md:text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 md:hover:bg-gray-100 md:hover:text-gray-900'
                }
              `}
            >
              {/* Línea activa — móvil */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full md:hidden" />
              )}

              {/* Barra lateral activa — desktop */}
              {isActive && (
                <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
              )}

              {/* Ícono */}
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                className="shrink-0"
              />

              {/* Label móvil */}
              <span className={`
                mt-1 text-[10px] tracking-wide md:hidden whitespace-nowrap
                ${isActive ? 'font-semibold text-blue-700' : 'font-medium text-gray-600'}
              `}>
                {label}
              </span>

              {/* Label desktop */}
              <span className={`
                hidden md:block text-sm
                ${isActive ? 'font-semibold text-blue-700' : 'font-medium text-gray-700'}
              `}>
                {label}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Logo Gerald — solo desktop, pegado abajo */}
      <div className="hidden md:flex flex-col items-center w-full px-6 py-5 border-t border-gray-200 gap-2">
        <span className="text-[9px] font-semibold tracking-widest text-gray-400 uppercase">
          Desarrollado por
        </span>
        <img
          src={logoGerald}
          alt="Gerald Dev"
          className="h-auto max-w-[90px] object-contain opacity-70 hover:opacity-100 transition-opacity duration-200"
        />
      </div>

    </nav>
  );
}