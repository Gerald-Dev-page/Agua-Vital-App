// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { fetchAppData } from '../services/api';
import {
  Droplet, GlassWater, Star, FileDown,
  Store, Truck, DollarSign, Calendar,
  TrendingUp, ClipboardList, ChevronLeft, ChevronRight
} from 'lucide-react';

// FIX: ID real del cliente local según la base de datos
const ID_CLIENTE_LOCAL = 'C-1776454908189';

const formatFechaPantalla = (fechaIso) => {
  if (!fechaIso) return '';
  const d = new Date(fechaIso);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

// FIX: Manejo robusto de fechas ISO para evitar desfases de zona horaria
const getLocalDataString = (date) => {
  if (!date) return '';
  if (typeof date === 'string' && date.includes('T')) {
    return date.split('T')[0]; // Extrae "YYYY-MM-DD" directo del string ISO
  }
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

// ── Componentes reutilizables ──────────────────────────────────────────────

function KpiCard({ icon: Icon, iconBg, iconColor, label, value, footnote, footnoteColor = 'text-gray-400' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
      </div>
      {footnote && (
        <p className={`text-[11px] font-medium ${footnoteColor} flex items-center gap-1`}>
          {footnote}
        </p>
      )}
    </div>
  );
}

function BarItem({ label, val, total, color, icon }) {
  const pct = total > 0 ? (val / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <span className={`w-6 h-6 rounded-lg ${color} flex items-center justify-center text-white`}>
            {icon}
          </span>
          {label}
        </span>
        <span className="text-sm font-semibold text-gray-800">{val} u.</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [clientes, setClientes] = useState([]);

  const hoyStr = getLocalDataString(new Date());
  const primerDiaMes = new Date();
  primerDiaMes.setDate(1);
  const primerDiaMesStr = getLocalDataString(primerDiaMes);

  const [tipoFiltro, setTipoFiltro] = useState('dia');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyStr);
  const [fechaInicio, setFechaInicio] = useState(primerDiaMesStr);
  const [fechaFin, setFechaFin] = useState(hoyStr);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 5;

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await fetchAppData();
        setVentas(data.ventas || []);
        setCatalogo(data.catalogo || []);
        setClientes(data.clientes || []);
      } catch (error) {
        console.error('Error al cargar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  // Resetear página a 1 cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [tipoFiltro, fechaSeleccionada, fechaInicio, fechaFin]);

  // ── Cálculo de métricas dinámicas según el filtro ──
  const metricas = useMemo(() => {
    let ingresosFiltrados = 0, ingresosLocal = 0, ingresosVisitas = 0;
    let ventasTotales = 0;
    let countBidones = 0, countDispensers = 0, countPromos = 0;

    ventas.forEach((venta) => {
      const fechaVentaStr = getLocalDataString(venta.fecha);
      const totalVenta = parseFloat(venta.total) || 0;
      const cantidad = parseInt(venta.cantidad) || 0;

      const entraEnFiltro =
        tipoFiltro === 'rango'
          ? fechaVentaStr >= fechaInicio && fechaVentaStr <= fechaFin
          : fechaVentaStr === fechaSeleccionada;

      if (entraEnFiltro) {
        ingresosFiltrados += totalVenta;
        ventasTotales++;
        
        // FIX: Acumular Local vs Visita BASADO EN EL PERÍODO SELECCIONADO
        if (venta.id_cliente === ID_CLIENTE_LOCAL) {
          ingresosLocal += totalVenta;
        } else {
          ingresosVisitas += totalVenta;
        }

        const producto = catalogo.find(
          (p) => p.id_producto.toString() === venta.id_producto.toString()
        );
        if (producto) {
          if (producto.tipo === 'Bidón') countBidones += cantidad;
          else if (producto.tipo === 'Dispenser') countDispensers += cantidad;
          else if (producto.tipo === 'Promo') countPromos += cantidad;
        }
      }
    });

    return {
      ingresosFiltrados, ingresosLocal, ingresosVisitas,
      ventasTotales,
      countBidones, countDispensers, countPromos,
      totalArticulos: countBidones + countDispensers + countPromos || 1,
    };
  }, [ventas, catalogo, tipoFiltro, fechaInicio, fechaFin, fechaSeleccionada]);

  // ── Filtrado y Paginado de Ventas ──
  const ventasFiltradas = useMemo(() => {
    return [...ventas]
      .filter((v) => {
        const f = getLocalDataString(v.fecha);
        return tipoFiltro === 'dia'
          ? f === fechaSeleccionada
          : f >= fechaInicio && f <= fechaFin;
      })
      .reverse();
  }, [ventas, tipoFiltro, fechaSeleccionada, fechaInicio, fechaFin]);

  const totalPaginas = Math.max(1, Math.ceil(ventasFiltradas.length / itemsPorPagina));
  const ventasPaginadas = ventasFiltradas.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      <p className="text-sm font-medium text-gray-400 animate-pulse">Sincronizando datos...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            Panel de Rendimiento
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Análisis de ventas y gestión de rutas.</p>
        </div>

        {/* Controles de filtro */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2.5
              focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 cursor-pointer transition-all"
          >
            <option value="dia">Día específico</option>
            <option value="rango">Rango de fechas</option>
          </select>

          {tipoFiltro === 'rango' ? (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="text-sm text-gray-700 outline-none bg-transparent"
              />
              <span className="text-gray-300 text-sm">→</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="text-sm text-gray-700 outline-none bg-transparent"
              />
            </div>
          ) : (
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2.5
                focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98]
              text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200"
          >
            <FileDown size={16} />
            Exportar
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* Card grande — Dinámica según filtro */}
        <div className="lg:col-span-2 bg-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <p className="text-[11px] font-semibold text-blue-200 uppercase tracking-widest mb-1">
            {tipoFiltro === 'dia' ? 'Ingresos del día' : 'Ingresos del período'}
          </p>
          <p className="text-4xl font-semibold mb-6">{formatCurrency(metricas.ingresosFiltrados)}</p>

          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
            <div>
              <p className="text-[10px] text-blue-300 uppercase font-semibold mb-1 flex items-center gap-1">
                <Store size={11} /> Venta local
              </p>
              <p className="text-lg font-semibold">{formatCurrency(metricas.ingresosLocal)}</p>
            </div>
            <div>
              <p className="text-[10px] text-blue-300 uppercase font-semibold mb-1 flex items-center gap-1">
                <Truck size={11} /> Visitas (Reparto)
              </p>
              <p className="text-lg font-semibold">{formatCurrency(metricas.ingresosVisitas)}</p>
            </div>
          </div>

          <DollarSign className="absolute -right-3 -bottom-3 w-32 h-32 text-white/5" />
        </div>

        <KpiCard
          icon={Calendar}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          label="Operaciones"
          value={metricas.ventasTotales}
          footnote={<><TrendingUp size={11} /> Ventas confirmadas</>}
          footnoteColor="text-emerald-500"
        />

        <KpiCard
          icon={ClipboardList}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          label="Ticket Promedio"
          value={metricas.ventasTotales > 0 ? formatCurrency(metricas.ingresosFiltrados / metricas.ventasTotales) : '$0'}
          footnote="Por operación"
        />
      </div>

      {/* ── Segunda fila ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Distribución */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-6">
            <Droplet size={16} className="text-blue-500" />
            Distribución de productos
          </h2>
          <div className="space-y-5">
            <BarItem label="Bidones"   val={metricas.countBidones}    total={metricas.totalArticulos} color="bg-blue-500"  icon={<Droplet size={12}/>} />
            <BarItem label="Dispensers" val={metricas.countDispensers} total={metricas.totalArticulos} color="bg-cyan-400"  icon={<GlassWater size={12}/>} />
            <BarItem label="Promos"    val={metricas.countPromos}     total={metricas.totalArticulos} color="bg-amber-400" icon={<Star size={12}/>} />
          </div>
        </div>

        {/* Registro de ventas con paginación */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 flex flex-col">
          <div className="p-6 pb-0 flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ClipboardList size={16} className="text-blue-500" />
              Detalle de operaciones
            </h2>
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wide">
              {ventasFiltradas.length} registros
            </span>
          </div>

          <div className="overflow-x-auto flex-grow px-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Fecha', 'Cliente', 'Monto'].map((h) => (
                    <th
                      key={h}
                      className={`pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest ${h === 'Monto' ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ventasPaginadas.map((v, i) => {
                  const cliente = clientes.find((c) => c.id_cliente === v.id_cliente);
                  const esLocal = v.id_cliente === ID_CLIENTE_LOCAL;
                  return (
                    <tr key={v.id_venta || i} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 text-xs text-gray-500 font-medium">
                        {formatFechaPantalla(v.fecha)}
                      </td>
                      <td className="py-3.5">
                        <p className="text-xs font-semibold text-gray-800">
                          {cliente?.nombre || 'Cliente Final'}
                        </p>
                        <p className={`text-[10px] ${esLocal ? 'text-blue-400' : 'text-gray-400'} font-medium`}>
                          {esLocal ? 'Venta en local' : 'Entrega a domicilio'}
                        </p>
                      </td>
                      <td className="py-3.5 text-right">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                          {formatCurrency(v.total)}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {ventasPaginadas.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-sm text-gray-300">
                      Sin operaciones en este período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginación */}
          {totalPaginas > 1 && (
            <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-gray-50/50 rounded-b-2xl">
              <span className="text-xs text-gray-400 font-medium">
                Página {paginaActual} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}