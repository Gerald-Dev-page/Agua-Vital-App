// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { fetchAppData } from '../services/api';
import {
  Droplet, GlassWater, Star, FileDown,
  Store, Truck, DollarSign, Calendar,
  TrendingUp, ClipboardList, ChevronLeft, ChevronRight,
  Banknote, QrCode, ArrowRightLeft, PieChart
} from 'lucide-react';

const ID_CLIENTE_LOCAL = 'C-1776454908189';

const formatFechaPantalla = (fechaRaw) => {
  if (!fechaRaw) return '';
  if (typeof fechaRaw === 'string' && fechaRaw.includes(' ') && !fechaRaw.includes('T')) {
    const datePart = fechaRaw.split(' ')[0]; 
    const [year, month, day] = datePart.split('-');
    return `${day}-${month}-${year}`;
  }
  const d = new Date(fechaRaw);
  if (isNaN(d.getTime())) return fechaRaw;
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

const getLocalDataString = (date) => {
  if (!date) return '';
  if (typeof date === 'string' && date.includes(' ') && !date.includes('T')) {
    return date.split(' ')[0]; 
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return ''; 
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

// ── Componentes reutilizables ──────────────────────────────────────────────

function BarItem({ label, val, total, color, icon }) {
  const pct = total > 0 ? (val / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
          <span className={`w-5 h-5 rounded-lg ${color} flex items-center justify-center text-white`}>
            {icon}
          </span>
          {label}
        </span>
        <span className="text-xs font-bold text-gray-800">{val} u.</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
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

  useEffect(() => {
    setPaginaActual(1);
  }, [tipoFiltro, fechaSeleccionada, fechaInicio, fechaFin]);

  // ── Cálculo de métricas dinámicas ──
  const metricas = useMemo(() => {
    let ingresosFiltrados = 0, ingresosLocal = 0, ingresosVisitas = 0;
    let ventasTotales = 0;
    let countBidones = 0, countDispensers = 0, countPromos = 0;
    
    // Contadores Divididos: Local vs Reparto
    let localEfectivo = 0, localTransferencia = 0, localQR = 0;
    let repartoEfectivo = 0, repartoTransferencia = 0, repartoQR = 0;

    ventas.forEach((venta) => {
      const fechaVentaStr = getLocalDataString(venta.fecha);
      const totalVenta = parseFloat(venta.total) || 0;
      const cantidad = parseInt(venta.cantidad) || 0;
      const formaPago = venta.forma_pago || 'No especificada'; 

      const entraEnFiltro =
        tipoFiltro === 'rango'
          ? fechaVentaStr >= fechaInicio && fechaVentaStr <= fechaFin
          : fechaVentaStr === fechaSeleccionada;

      if (entraEnFiltro) {
        ingresosFiltrados += totalVenta;
        ventasTotales++;
        
        const esLocal = venta.id_cliente === ID_CLIENTE_LOCAL;

        if (esLocal) {
          ingresosLocal += totalVenta;
          if (formaPago === 'Efectivo') localEfectivo += totalVenta;
          else if (formaPago === 'Transferencia') localTransferencia += totalVenta;
          else if (formaPago === 'QR') localQR += totalVenta;
        } else {
          ingresosVisitas += totalVenta;
          if (formaPago === 'Efectivo') repartoEfectivo += totalVenta;
          else if (formaPago === 'Transferencia') repartoTransferencia += totalVenta;
          else if (formaPago === 'QR') repartoQR += totalVenta;
        }

        const producto = catalogo.find(p => p.id_producto.toString() === venta.id_producto.toString());
        if (producto) {
          if (producto.tipo === 'Bidón') countBidones += cantidad;
          else if (producto.tipo === 'Dispenser') countDispensers += cantidad;
          else if (producto.tipo === 'Promo') countPromos += cantidad;
        }
      }
    });

    return {
      ingresosFiltrados, ingresosLocal, ingresosVisitas,
      ventasTotales, countBidones, countDispensers, countPromos,
      totalArticulos: countBidones + countDispensers + countPromos || 1,
      localEfectivo, localTransferencia, localQR,
      repartoEfectivo, repartoTransferencia, repartoQR
    };
  }, [ventas, catalogo, tipoFiltro, fechaInicio, fechaFin, fechaSeleccionada]);

  const ventasFiltradas = useMemo(() => {
    return [...ventas]
      .filter((v) => {
        const f = getLocalDataString(v.fecha);
        return tipoFiltro === 'dia' ? f === fechaSeleccionada : f >= fechaInicio && f <= fechaFin;
      })
      .reverse();
  }, [ventas, tipoFiltro, fechaSeleccionada, fechaInicio, fechaFin]);

  const totalPaginas = Math.max(1, Math.ceil(ventasFiltradas.length / itemsPorPagina));
  const ventasPaginadas = ventasFiltradas.slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      <p className="text-sm font-medium text-gray-400 animate-pulse">Sincronizando datos...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-10 pb-24">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" /> Panel de Rendimiento
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <select
            value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}
            className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
          >
            <option value="dia">Día específico</option>
            <option value="rango">Rango de fechas</option>
          </select>

          {tipoFiltro === 'rango' ? (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5">
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="text-sm text-gray-700 outline-none bg-transparent font-medium" />
              <span className="text-gray-300 text-sm">→</span>
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="text-sm text-gray-700 outline-none bg-transparent font-medium" />
            </div>
          ) : (
            <input type="date" value={fechaSeleccionada} onChange={(e) => setFechaSeleccionada(e.target.value)} className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          )}

          <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold px-3 py-2 rounded-xl transition-all">
            <FileDown size={16} /> Exportar
          </button>
        </div>
      </div>

      {/* ── KPIs PRIMERA FILA (5 COLUMNAS EN PANTALLAS GRANDES) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        
        {/* 1. Recaudación Global (Ocupa 2 espacios -> Súper Grande) */}
        <div className="lg:col-span-2 bg-blue-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="relative z-10">
            <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">
              {tipoFiltro === 'dia' ? 'Total del día' : 'Total del período'}
            </p>
            <p className="text-4xl lg:text-5xl font-black tracking-tight">{formatCurrency(metricas.ingresosFiltrados)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-6 relative z-10">
            <div>
              <p className="text-[10px] text-blue-200 uppercase font-bold flex items-center gap-1"><Store size={12} /> Local</p>
              <p className="text-base font-semibold">{formatCurrency(metricas.ingresosLocal)}</p>
            </div>
            <div>
              <p className="text-[10px] text-blue-200 uppercase font-bold flex items-center gap-1"><Truck size={12} /> Reparto</p>
              <p className="text-base font-semibold">{formatCurrency(metricas.ingresosVisitas)}</p>
            </div>
          </div>
          <DollarSign className="absolute -right-6 -bottom-6 w-44 h-44 text-white/10 pointer-events-none" />
        </div>

        {/* 2. Operaciones + Ticket Promedio Juntos (Ocupa 1 espacio) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50">
                <Calendar size={18} className="text-blue-500" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
                <TrendingUp size={11} /> Ventas confirmadas
              </span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Operaciones</p>
            <p className="text-3xl font-black text-gray-800 tracking-tight">{metricas.ventasTotales}</p>
          </div>
          
          {/* Ticket Promedio Integrado Abajo */}
          <div className="border-t border-gray-100 pt-3 mt-3">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-0.5">
              <ClipboardList size={10} className="text-amber-500" /> Ticket Promedio
            </p>
            <p className="text-sm font-black text-gray-800">
              {metricas.ventasTotales > 0 ? formatCurrency(metricas.ingresosFiltrados / metricas.ventasTotales) : '$0'}
            </p>
          </div>
        </div>

        {/* 3. Desglose de Caja Dividido (Ocupa 2 espacios) */}
        <div className="lg:col-span-2 md:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><PieChart size={14} className="text-emerald-500" /></div>
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Desglose de Caja</h2>
          </div>
          
          <div className="flex flex-col gap-3 flex-grow">
            
            {/* Fila Local */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex flex-col justify-center">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 flex items-center gap-1"><Store size={12}/> Caja Local</p>
              <div className="grid grid-cols-3 gap-2 divide-x divide-gray-200">
                <div className="px-1">
                  <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5 flex items-center gap-1"><Banknote size={10} className="text-emerald-500"/> Efe.</p>
                  <p className="text-xs md:text-sm font-black text-gray-800">{formatCurrency(metricas.localEfectivo)}</p>
                </div>
                <div className="px-2">
                  <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5 flex items-center gap-1"><ArrowRightLeft size={10} className="text-blue-500"/> Transf.</p>
                  <p className="text-xs md:text-sm font-black text-gray-800">{formatCurrency(metricas.localTransferencia)}</p>
                </div>
                <div className="px-2">
                  <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5 flex items-center gap-1"><QrCode size={10} className="text-fuchsia-500"/> QR</p>
                  <p className="text-xs md:text-sm font-black text-gray-800">{formatCurrency(metricas.localQR)}</p>
                </div>
              </div>
            </div>

            {/* Fila Reparto */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex flex-col justify-center">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 flex items-center gap-1"><Truck size={12}/> Caja Reparto</p>
              <div className="grid grid-cols-3 gap-2 divide-x divide-gray-200">
                <div className="px-1">
                  <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5 flex items-center gap-1"><Banknote size={10} className="text-emerald-500"/> Efe.</p>
                  <p className="text-xs md:text-sm font-black text-gray-800">{formatCurrency(metricas.repartoEfectivo)}</p>
                </div>
                <div className="px-2">
                  <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5 flex items-center gap-1"><ArrowRightLeft size={10} className="text-blue-500"/> Transf.</p>
                  <p className="text-xs md:text-sm font-black text-gray-800">{formatCurrency(metricas.repartoTransferencia)}</p>
                </div>
                <div className="px-2">
                  <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5 flex items-center gap-1"><QrCode size={10} className="text-fuchsia-500"/> QR</p>
                  <p className="text-xs md:text-sm font-black text-gray-800">{formatCurrency(metricas.repartoQR)}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ── SEGUNDA FILA (Productos y Tabla) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Distribución compacta */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2 mb-5">
            <Droplet size={14} className="text-blue-500" /> Distribución de envases
          </h2>
          <div className="space-y-4">
            <BarItem label="Bidones" val={metricas.countBidones} total={metricas.totalArticulos} color="bg-blue-500" icon={<Droplet size={10}/>} />
            <BarItem label="Dispensers" val={metricas.countDispensers} total={metricas.totalArticulos} color="bg-cyan-400" icon={<GlassWater size={10}/>} />
            <BarItem label="Promos" val={metricas.countPromos} total={metricas.totalArticulos} color="bg-amber-400" icon={<Star size={10}/>} />
          </div>
        </div>

        {/* Tabla de ventas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 flex flex-col shadow-sm">
          <div className="p-5 pb-0 flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={14} className="text-blue-500" /> Registro de Operaciones
            </h2>
            <span className="text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded uppercase">{ventasFiltradas.length} total</span>
          </div>

          <div className="overflow-x-auto flex-grow px-5">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Fecha</th>
                  <th className="pb-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Cliente / Zona</th>
                  <th className="pb-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Monto / Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ventasPaginadas.map((v, i) => {
                  const cliente = clientes.find((c) => c.id_cliente === v.id_cliente);
                  const esLocal = v.id_cliente === ID_CLIENTE_LOCAL;
                  const formaPago = v.forma_pago || 'N/A';
                  
                  return (
                    <tr key={v.id_venta || i} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 text-xs text-gray-500 font-medium">{formatFechaPantalla(v.fecha)}</td>
                      <td className="py-3">
                        <p className="text-xs font-bold text-gray-800">{cliente?.nombre || 'Cliente Casa'}</p>
                        <p className={`text-[9px] ${esLocal ? 'text-blue-500' : 'text-amber-500'} font-bold uppercase mt-0.5`}>{esLocal ? 'Mostrador' : 'Reparto'}</p>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-xs font-black text-gray-800 block mb-1">{formatCurrency(v.total)}</span>
                        {formaPago === 'Efectivo' && <span className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase"><Banknote size={9}/> Efectivo</span>}
                        {formaPago === 'Transferencia' && <span className="inline-flex items-center gap-1 text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase"><ArrowRightLeft size={9}/> Transf.</span>}
                        {formaPago === 'QR' && <span className="inline-flex items-center gap-1 text-[8px] font-bold text-fuchsia-600 bg-fuchsia-50 px-1.5 py-0.5 rounded uppercase"><QrCode size={9}/> QR</span>}
                        {formaPago === 'N/A' && <span className="inline-flex items-center gap-1 text-[8px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">Sin Dato</span>}
                      </td>
                    </tr>
                  );
                })}

                {ventasPaginadas.length === 0 && (
                  <tr><td colSpan={3} className="py-8 text-center text-xs font-medium text-gray-400">Sin operaciones en este período.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="border-t border-gray-100 p-3 flex items-center justify-between bg-gray-50/50 rounded-b-2xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pág. {paginaActual} / {totalPaginas}</span>
              <div className="flex gap-2">
                <button onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="p-1 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50"><ChevronLeft size={14} /></button>
                <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="p-1 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}