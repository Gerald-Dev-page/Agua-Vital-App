// src/pages/Stock.jsx
import { useState } from 'react';
import { 
  Package, AlertTriangle, CheckCircle, 
  XCircle, BarChart2, RefreshCw, Lock 
} from 'lucide-react';
import '../styles/stock.css';

// ── Mock Data ──────────────────────────────────────────────
const MOCK_STOCK = [
  { id: 'SKU-001', nombre: 'Producto A',   categoria: 'Categoría 1', stock: 142, minimo: 20,  costo: 800  },
  { id: 'SKU-002', nombre: 'Producto B',   categoria: 'Categoría 1', stock: 8,   minimo: 15,  costo: 2100 },
  { id: 'SKU-003', nombre: 'Producto C',   categoria: 'Categoría 2', stock: 0,   minimo: 10,  costo: 500  },
  { id: 'SKU-004', nombre: 'Producto D',   categoria: 'Categoría 2', stock: 55,  minimo: 10,  costo: 9000 },
  { id: 'SKU-005', nombre: 'Servicio A',   categoria: 'Servicio',    stock: 30,  minimo: 5,   costo: 3200 },
  { id: 'SKU-006', nombre: 'Servicio B',   categoria: 'Servicio',    stock: 4,   minimo: 8,   costo: 6500 },
  { id: 'SKU-007', nombre: 'Promo Pack 1', categoria: 'Promoción',   stock: 22,  minimo: 10,  costo: 2800 },
];

const getEstado = (stock, minimo) => {
  if (stock === 0)           return { label: 'Sin stock',  color: 'error',   Icon: XCircle        };
  if (stock <= minimo)       return { label: 'Stock bajo', color: 'warning', Icon: AlertTriangle   };
  return                            { label: 'Normal',     color: 'success', Icon: CheckCircle     };
};

const formatPrice = (n) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
// ──────────────────────────────────────────────────────────

export default function Stock() {
  const [stock, setStock]       = useState(MOCK_STOCK);
  const [showToast, setShowToast] = useState(false);
  const [filtro, setFiltro]     = useState('todos');

  // Stats
  const sinStock   = stock.filter(p => p.stock === 0).length;
  const stockBajo  = stock.filter(p => p.stock > 0 && p.stock <= p.minimo).length;
  const normal     = stock.filter(p => p.stock > p.minimo).length;
  const valorTotal = stock.reduce((a, p) => a + p.stock * p.costo, 0);

  // Filtrado
  const productosFiltrados = stock.filter(p => {
    if (filtro === 'error')   return p.stock === 0;
    if (filtro === 'warning') return p.stock > 0 && p.stock <= p.minimo;
    if (filtro === 'success') return p.stock > p.minimo;
    return true;
  });

  // Demo: simula reposición de stock
  const handleReposicion = (id) => {
    setStock(prev => prev.map(p =>
      p.id === id ? { ...p, stock: p.minimo * 3 } : p
    ));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  return (
    <div className="page-container">

      {/* ── Header ── */}
      <header className="page-header">
        <div>
          <h2>Control de Stock</h2>
          <p>Monitoreo en tiempo real del inventario disponible.</p>
        </div>
        <div className="header-badge">
          <BarChart2 size={14} />
          {formatPrice(valorTotal)} en inventario
        </div>
      </header>

      {/* ── Demo Banner ── */}
      <div className="demo-banner">
        <Lock size={14} />
        <span>Modo demo — las reposiciones no afectan datos reales.</span>
      </div>

      {showToast && (
        <div className="demo-toast">
          ✓ Stock repuesto visualmente. En el sistema real actualizaría la base de datos.
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="stats-row stock-stats">
        <div
          className={`stat-card stat-clickable ${filtro === 'success' ? 'stat-active-success' : ''}`}
          onClick={() => setFiltro(filtro === 'success' ? 'todos' : 'success')}
        >
          <span className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
            <CheckCircle size={18} />
          </span>
          <div>
            <p className="stat-label">Normal</p>
            <p className="stat-value">{normal}</p>
          </div>
        </div>

        <div
          className={`stat-card stat-clickable ${filtro === 'warning' ? 'stat-active-warning' : ''}`}
          onClick={() => setFiltro(filtro === 'warning' ? 'todos' : 'warning')}
        >
          <span className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <p className="stat-label">Stock bajo</p>
            <p className="stat-value">{stockBajo}</p>
          </div>
        </div>

        <div
          className={`stat-card stat-clickable ${filtro === 'error' ? 'stat-active-error' : ''}`}
          onClick={() => setFiltro(filtro === 'error' ? 'todos' : 'error')}
        >
          <span className="stat-icon" style={{ background: 'rgba(220,38,38,0.12)', color: '#DC2626' }}>
            <XCircle size={18} />
          </span>
          <div>
            <p className="stat-label">Sin stock</p>
            <p className="stat-value">{sinStock}</p>
          </div>
        </div>
      </div>

      {/* ── Filtro activo label ── */}
      {filtro !== 'todos' && (
        <div className="filtro-activo">
          Mostrando: <strong>{filtro === 'error' ? 'Sin stock' : filtro === 'warning' ? 'Stock bajo' : 'Normal'}</strong>
          <button className="filtro-clear" onClick={() => setFiltro('todos')}>✕ Ver todos</button>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="card table-card">
        <h3 className="table-title">
          <Package size={16} />
          Inventario actual
          <span className="table-count">{productosFiltrados.length} productos</span>
        </h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((p) => {
                const estado = getEstado(p.stock, p.minimo);
                const pct    = Math.min((p.stock / (p.minimo * 3)) * 100, 100);
                return (
                  <tr key={p.id}>
                    <td><span className="id-badge">{p.id}</span></td>
                    <td className="td-nombre">{p.nombre}</td>
                    <td className="td-muted">{p.categoria}</td>
                    <td>
                      <div className="stock-cell">
                        <span className={`stock-num estado-${estado.color}`}>{p.stock}</span>
                        <div className="stock-bar-track">
                          <div
                            className={`stock-bar-fill fill-${estado.color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="td-muted">{p.minimo}</td>
                    <td>
                      <span className={`estado-badge-stock color-${estado.color}`}>
                        <estado.Icon size={12} />
                        {estado.label}
                      </span>
                    </td>
                    <td>
                      {p.stock <= p.minimo && (
                        <button
                          className="btn-reponer"
                          onClick={() => handleReposicion(p.id)}
                        >
                          <RefreshCw size={13} />
                          Reponer
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}