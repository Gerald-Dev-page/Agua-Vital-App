// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { fetchAppData } from '../services/api';
import { Droplet, GlassWater, Star, FileDown } from 'lucide-react';
import '../styles/dashboard.css';

// Función auxiliar para formatear fechas locales a YYYY-MM-DD y evitar bugs de zona horaria
const getLocalDataString = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  
  // Inicialización de fechas por defecto
  const hoyStr = getLocalDataString(new Date());
  const primerDiaMes = new Date();
  primerDiaMes.setDate(1);
  const primerDiaMesStr = getLocalDataString(primerDiaMes);

  // Estados de los filtros
  const [tipoFiltro, setTipoFiltro] = useState('dia'); // 'rango' o 'dia'
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyStr);
  const [fechaInicio, setFechaInicio] = useState(primerDiaMesStr);
  const [fechaFin, setFechaFin] = useState(hoyStr);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await fetchAppData();
        setVentas(data.ventas || []);
        setCatalogo(data.catalogo || []);
      } catch (error) {
        console.error("Error al cargar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const metricas = useMemo(() => {
    let ingresosHoy = 0;
    let ingresosFiltrados = 0;
    let ventasTotales = 0;
    
    let countBidones = 0;
    let countDispensers = 0;
    let countPromos = 0;

    ventas.forEach(venta => {
      const fechaVentaStr = getLocalDataString(venta.fecha);
      const totalVenta = parseFloat(venta.total) || 0;
      const cantidad = parseInt(venta.cantidad) || 0;

      let entraEnFiltro = false;

      // Lógica de evaluación de fechas
      if (tipoFiltro === 'rango') {
        // En formato YYYY-MM-DD la comparación de strings es matemáticamente exacta
        entraEnFiltro = fechaVentaStr >= fechaInicio && fechaVentaStr <= fechaFin;
      } else if (tipoFiltro === 'dia') {
        entraEnFiltro = fechaVentaStr === fechaSeleccionada;
      }

      // El acumulador "Hoy" se mantiene inmutable a los filtros
      if (fechaVentaStr === hoyStr) {
        ingresosHoy += totalVenta;
      }

      // Procesamiento de datos si cumplen el criterio de búsqueda
      if (entraEnFiltro) {
        ingresosFiltrados += totalVenta;
        ventasTotales++;

        const producto = catalogo.find(p => p.id_producto.toString() === venta.id_producto.toString());
        if (producto) {
          if (producto.tipo === 'Bidón') countBidones += cantidad;
          else if (producto.tipo === 'Dispenser') countDispensers += cantidad;
          else if (producto.tipo === 'Promo') countPromos += cantidad;
        }
      }
    });

    const totalArticulos = countBidones + countDispensers + countPromos;

    return {
      ingresosHoy,
      ingresosFiltrados,
      ventasTotales,
      countBidones,
      countDispensers,
      countPromos,
      totalArticulos: totalArticulos > 0 ? totalArticulos : 1 
    };
  }, [ventas, catalogo, tipoFiltro, fechaInicio, fechaFin, fechaSeleccionada, hoyStr]);

  const handleImprimirPDF = () => {
    window.print();
  };

  if (loading) return <div className="loading">Analizando métricas financieras...</div>;

  return (
    <div className="page-container dashboard-page">
      <header className="page-header dashboard-header">
        <div>
          <h2>Panel de Rendimiento</h2>
          <p>Reporte analítico de ventas e ingresos.</p>
        </div>
        
        <div className="dashboard-controls no-print">
          <select 
            className="filtro-selector"
            value={tipoFiltro} 
            onChange={(e) => setTipoFiltro(e.target.value)}
          >
             <option value="dia">Día Específico</option>
            <option value="rango">Rango de Fechas</option>
          </select>

          {tipoFiltro === 'rango' ? (
            <div className="rango-fechas">
              <input 
                type="date" 
                className="fecha-selector"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
              <span className="rango-separador"> hasta </span>
              <input 
                type="date" 
                className="fecha-selector"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          ) : (
            <input 
              type="date" 
              className="fecha-selector"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
            />
          )}

          <button 
            className="btn-secondary" 
            onClick={handleImprimirPDF}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FileDown size={18} /> Exportar PDF
          </button>
        </div>
      </header>

      <div className="kpi-grid">
        <div className="kpi-card highlight">
          <div className="kpi-title">Ingresos de Hoy</div>
          <div className="kpi-value">${metricas.ingresosHoy.toFixed(2)}</div>
          <div className="kpi-subtitle">Caja actual (cierre a las 00:00)</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Ingresos del Periodo</div>
          <div className="kpi-value text-primary">${metricas.ingresosFiltrados.toFixed(2)}</div>
          <div className="kpi-subtitle">
            {tipoFiltro === 'rango' 
              ? `Del ${fechaInicio} al ${fechaFin}` 
              : `Fecha: ${fechaSeleccionada}`}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Volumen de Operaciones</div>
          <div className="kpi-value">{metricas.ventasTotales}</div>
          <div className="kpi-subtitle">Transacciones en el periodo</div>
        </div>
      </div>

      <div className="dashboard-modules">
        <div className="module-card">
          <h3>Rendimiento Operativo por Tipo de Producto</h3>
          <p className="text-muted" style={{marginBottom: '1.5rem'}}>
            Distribución de unidades comercializadas en el periodo seleccionado.
          </p>
          
          <div className="custom-chart">
            <div className="chart-row">
              <div className="chart-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Droplet size={18} /> Bidones
                </span>
                <strong>{metricas.countBidones} u.</strong>
              </div>
              <div className="chart-bar-bg">
                <div 
                  className="chart-bar-fill bg-blue" 
                  style={{ width: `${(metricas.countBidones / metricas.totalArticulos) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="chart-row">
              <div className="chart-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <GlassWater size={18} /> Dispensers
                </span>
                <strong>{metricas.countDispensers} u.</strong>
              </div>
              <div className="chart-bar-bg">
                <div 
                  className="chart-bar-fill bg-cyan" 
                  style={{ width: `${(metricas.countDispensers / metricas.totalArticulos) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="chart-row">
              <div className="chart-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={18} /> Promos
                </span>
                <strong>{metricas.countPromos} u.</strong>
              </div>
              <div className="chart-bar-bg">
                <div 
                  className="chart-bar-fill bg-orange" 
                  style={{ width: `${(metricas.countPromos / metricas.totalArticulos) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="print-footer only-print">
        Reporte Oficial - Sistema Agua Vital. Generado el {new Date().toLocaleDateString()}.
        {tipoFiltro === 'rango' 
          ? ` Periodo analizado: ${fechaInicio} a ${fechaFin}.` 
          : ` Fecha analizada: ${fechaSeleccionada}.`}
      </div>
    </div>
  );
}