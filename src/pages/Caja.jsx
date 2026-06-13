// src/pages/Caja.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchAppData, insertRecord } from '../services/api';
import { Lock, Unlock, Banknote, QrCode, ArrowRightLeft, Loader2, CheckCircle, AlertCircle, FileText, Store, Truck, ClipboardList, DollarSign } from 'lucide-react';

const ID_CLIENTE_LOCAL = 'C-1776454908189';

const formatCurrency = (val) => {
  const num = parseFloat(val) || 0;
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);
};

const getLocalISOTime = () => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, -1);
};

const formatHora = (fechaRaw) => {
  if (!fechaRaw) return '';
  try {
    const fechaStr = String(fechaRaw);
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return fechaStr.split(' ')[1] || fechaStr; 
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch (e) {
    return '';
  }
};

export default function Caja() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ventas, setVentas] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);

  const [montoInicial, setMontoInicial] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAppData();
      setVentas(data?.ventas || []);
      setCajas(data?.caja || []);
      setCatalogo(data?.catalogo || []);
    } catch {
      agregarNotificacion('error', 'Error al sincronizar datos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const agregarNotificacion = (type, msg) => {
    const id = crypto.randomUUID();
    setNotificaciones(prev => [...prev, { id, type, msg }]);
    setTimeout(() => setNotificaciones(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const cajaActiva = useMemo(() => {
    return cajas.find(c => c.estado === 'Abierta') || null;
  }, [cajas]);

  const metricasTurno = useMemo(() => {
    let localEfectivo = 0, localTransferencia = 0, localQR = 0;
    let repartoEfectivo = 0, repartoTransferencia = 0, repartoQR = 0;
    let ventasDelTurno = [];
    
    if (!cajaActiva) return { 
      localEfectivo, localTransferencia, localQR, totalLocal: 0,
      repartoEfectivo, repartoTransferencia, repartoQR, totalReparto: 0,
      totalEfectivo: 0, totalTransf: 0, totalQR: 0, totalRecaudado: 0, ventasDelTurno 
    };

    ventas.forEach(v => {
      if (v.fecha >= cajaActiva.fecha_apertura) {
        ventasDelTurno.push(v);
        
        const total = parseFloat(v.total) || 0;
        const esLocal = String(v.id_cliente) === String(ID_CLIENTE_LOCAL);
        const formaPago = v.forma_pago || 'No especificada';

        if (esLocal) {
          if (formaPago === 'Efectivo') localEfectivo += total;
          else if (formaPago === 'Transferencia') localTransferencia += total;
          else if (formaPago === 'QR') localQR += total;
        } else {
          if (formaPago === 'Efectivo') repartoEfectivo += total;
          else if (formaPago === 'Transferencia') repartoTransferencia += total;
          else if (formaPago === 'QR') repartoQR += total;
        }
      }
    });

    ventasDelTurno.reverse();

    const totalLocal = localEfectivo + localTransferencia + localQR;
    const totalReparto = repartoEfectivo + repartoTransferencia + repartoQR;
    const totalEfectivo = localEfectivo + repartoEfectivo;
    const totalTransf = localTransferencia + repartoTransferencia;
    const totalQR = localQR + repartoQR;
    const totalRecaudado = totalLocal + totalReparto;

    return { 
      localEfectivo, localTransferencia, localQR, totalLocal,
      repartoEfectivo, repartoTransferencia, repartoQR, totalReparto,
      totalEfectivo, totalTransf, totalQR, totalRecaudado,
      ventasDelTurno
    };
  }, [ventas, cajaActiva]);

  const handleAbrirCaja = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await insertRecord('abrirCaja', {
        id_caja: 'CAJA-' + Date.now(),
        fecha_apertura: getLocalISOTime(),
        monto_inicial: parseFloat(montoInicial) || 0
      });
      agregarNotificacion('success', 'Caja abierta con éxito.');
      setMontoInicial('');
      await loadData();
    } catch {
      agregarNotificacion('error', 'No se pudo abrir la caja.');
    } finally {
      setSaving(false);
    }
  };

  const handleCerrarCaja = async () => {
    if(!window.confirm('¿Estás seguro de cerrar la caja de este turno?')) return;
    
    setSaving(true);
    try {
      await insertRecord('cerrarCaja', {
        id_caja: cajaActiva.id_caja,
        fecha_apertura: cajaActiva.fecha_apertura,
        monto_inicial: parseFloat(cajaActiva.monto_inicial) || 0,
        fecha_cierre: getLocalISOTime(),
        total_efectivo: metricasTurno.totalEfectivo,
        total_transferencia: metricasTurno.totalTransf,
        total_qr: metricasTurno.totalQR,
        observaciones: observaciones
      });
      agregarNotificacion('success', 'Caja cerrada y guardada en el historial.');
      setObservaciones('');
      await loadData();
    } catch {
      agregarNotificacion('error', 'No se pudo cerrar la caja.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-gray-800 animate-spin" />
      <p className="text-sm font-medium text-gray-400 animate-pulse">Sincronizando caja...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-10 pb-24 relative">
      
      {/* Notificaciones */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {notificaciones.map(noti => (
          <div key={noti.id} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-bold shadow-xl animate-fade-in-up ${noti.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {noti.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />} {noti.msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {cajaActiva ? <Unlock size={20} className="text-emerald-500" /> : <Lock size={20} className="text-gray-400" />}
            Control de Caja
            {cajaActiva && (
              <span className="text-xs font-normal text-gray-400 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full uppercase ml-2 tracking-wide">
                Turno abierto: {formatHora(cajaActiva.fecha_apertura)} hs
              </span>
            )}
          </h1>
        </div>
      </div>

      {!cajaActiva ? (
        /* PANTALLA CAJA CERRADA */
        <div className="bg-white border border-gray-100 rounded-2xl p-8 lg:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 mt-8 animate-fade-in-up">
          
          <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100">
              <Lock size={32} className="text-gray-400" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-800 mb-3 tracking-tight">La caja está cerrada</h2>
            <p className="text-sm lg:text-base text-gray-500 max-w-md font-medium leading-relaxed">
              Ingresá el monto de cambio inicial (billetes físicos en la gaveta) para abrir el turno del día y habilitar el sistema.
            </p>
          </div>
          
          <div className="w-full md:max-w-md bg-gray-50 p-6 lg:p-8 rounded-2xl border border-gray-100">
            <form onSubmit={handleAbrirCaja} className="space-y-5">
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Dinero Inicial (Cambio)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-2xl">$</span>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={montoInicial}
                    onChange={e => setMontoInicial(e.target.value)}
                    placeholder="0"
                    className="w-full pl-14 pr-5 py-5 text-3xl font-black text-left bg-white border border-gray-200 rounded-xl focus:border-gray-400 outline-none text-gray-800 transition-colors shadow-sm"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={saving}
                className="w-full flex justify-center items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 text-base shadow-sm"
              >
                {saving ? <Loader2 size={20} className="animate-spin"/> : <Unlock size={20} />}
                Abrir Caja General
              </button>
            </form>
          </div>

        </div>
      ) : (
        /* PANTALLA CAJA ABIERTA */
        <div className="space-y-6 animate-fade-in">
          
          {/* PRIMERA FILA: TOTAL GLOBAL Y CAJA FÍSICA */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            
            {/* Recaudación Total (Color Negro/Bóveda) */}
            <div className="lg:col-span-2 bg-gray-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Recaudación del Turno</p>
                <p className="text-4xl lg:text-5xl font-black tracking-tight">{formatCurrency(metricasTurno.totalRecaudado)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-6 relative z-10">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><Store size={12} /> Local</p>
                  <p className="text-base font-semibold">{formatCurrency(metricasTurno.totalLocal)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><Truck size={12} /> Reparto</p>
                  <p className="text-base font-semibold">{formatCurrency(metricasTurno.totalReparto)}</p>
                </div>
              </div>
              <DollarSign className="absolute -right-5 -bottom-5 w-36 h-36 text-white/5 pointer-events-none" />
            </div>

            {/* Efectivo Físico Esperado */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
              <div className="flex flex-col justify-center flex-grow">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Banknote size={15} className="text-emerald-500"/> Efectivo Esperado en Gaveta</p>
                <p className="text-4xl lg:text-5xl font-black text-emerald-600 tracking-tight">
                  {formatCurrency((parseFloat(cajaActiva.monto_inicial) || 0) + metricasTurno.totalEfectivo)}
                </p>
                <p className="text-[11px] font-semibold text-gray-400 mt-2">
                  Arranque: <span className="text-gray-600 font-bold">{formatCurrency(cajaActiva.monto_inicial)}</span> • Entró hoy: <span className="text-gray-600 font-bold">{formatCurrency(metricasTurno.totalEfectivo)}</span>
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-500 md:min-w-[210px] flex flex-col justify-center gap-2">
                <div className="flex justify-between text-gray-400 font-semibold"><span>Monto Inicial:</span> <span className="text-gray-700">{formatCurrency(cajaActiva.monto_inicial)}</span></div>
                <div className="flex justify-between"><span>+ Efec. Local:</span> <span className="text-emerald-600">{formatCurrency(metricasTurno.localEfectivo)}</span></div>
                <div className="flex justify-between border-b border-gray-200/60 pb-2"><span>+ Efec. Reparto:</span> <span className="text-emerald-600">{formatCurrency(metricasTurno.repartoEfectivo)}</span></div>
                <div className="flex justify-between text-gray-700 font-black pt-0.5"><span>Billetes Totales:</span> <span>{formatCurrency(metricasTurno.totalEfectivo)}</span></div>
              </div>
            </div>

          </div>

          {/* SEGUNDA FILA: DESGLOSE POR CANALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* DESGLOSE CAJA LOCAL */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-gray-50 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Store size={16}/></div>
                  <h3 className="text-sm font-bold text-gray-700">Canales de Venta Local</h3>
                </div>
                <span className="text-base font-black text-blue-600">{formatCurrency(metricasTurno.totalLocal)}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center justify-center gap-1"><Banknote size={11} className="text-emerald-500"/> Efectivo</p>
                  <p className="text-sm md:text-base font-black text-gray-800">{formatCurrency(metricasTurno.localEfectivo)}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center justify-center gap-1"><ArrowRightLeft size={11} className="text-blue-500"/> Transf.</p>
                  <p className="text-sm md:text-base font-black text-gray-800">{formatCurrency(metricasTurno.localTransferencia)}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center justify-center gap-1"><QrCode size={11} className="text-fuchsia-500"/> QR</p>
                  <p className="text-sm md:text-base font-black text-gray-800">{formatCurrency(metricasTurno.localQR)}</p>
                </div>
              </div>
            </div>

            {/* DESGLOSE CAJA REPARTO */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-gray-50 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><Truck size={16}/></div>
                  <h3 className="text-sm font-bold text-gray-700">Canales de Venta Reparto</h3>
                </div>
                <span className="text-base font-black text-amber-600">{formatCurrency(metricasTurno.totalReparto)}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center justify-center gap-1"><Banknote size={11} className="text-emerald-500"/> Efectivo</p>
                  <p className="text-sm md:text-base font-black text-gray-800">{formatCurrency(metricasTurno.repartoEfectivo)}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center justify-center gap-1"><ArrowRightLeft size={11} className="text-blue-500"/> Transf.</p>
                  <p className="text-sm md:text-base font-black text-gray-800">{formatCurrency(metricasTurno.repartoTransferencia)}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center justify-center gap-1"><QrCode size={11} className="text-fuchsia-500"/> QR</p>
                  <p className="text-sm md:text-base font-black text-gray-800">{formatCurrency(metricasTurno.repartoQR)}</p>
                </div>
              </div>
            </div>

          </div>

          {/* TERCERA FILA: HISTORIAL DE VENTAS Y CAJA DE COMENTARIOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Tabla con el detalle de ventas */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 flex flex-col shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <ClipboardList size={14} className="text-gray-700"/> Auditoría de Ventas del Turno
                </h3>
                <span className="text-[9px] font-bold text-gray-400 bg-white border border-gray-200 px-2.5 py-1 rounded uppercase">
                  {metricasTurno.ventasDelTurno.length} operaciones
                </span>
              </div>
              
              <div className="max-h-[290px] overflow-y-auto px-4">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="border-b border-gray-100">
                      <th className="py-2.5 pb-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Hora</th>
                      <th className="py-2.5 pb-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Detalle / Canal</th>
                      <th className="py-2.5 pb-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Monto / Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {metricasTurno.ventasDelTurno.map((v, i) => {
                      const esLocal = String(v.id_cliente) === String(ID_CLIENTE_LOCAL);
                      const prod = catalogo.find(p => String(p.id_producto) === String(v.id_producto));
                      
                      return (
                        <tr key={v.id_venta || i} className="hover:bg-gray-50/40 transition-colors">
                          <td className="py-3 text-xs text-gray-500 font-bold">{formatHora(v.fecha)} hs</td>
                          <td className="py-3">
                            <p className="text-xs font-bold text-gray-800 line-clamp-1">{prod?.nombre || 'Producto'}</p>
                            <p className={`text-[9px] font-bold uppercase mt-0.5 flex items-center gap-1 ${esLocal ? 'text-blue-500' : 'text-amber-500'}`}>
                              {esLocal ? <Store size={9}/> : <Truck size={9}/>} {esLocal ? 'Mostrador' : 'Reparto'}
                            </p>
                          </td>
                          <td className="py-3 text-right">
                            <span className="text-xs font-black text-gray-800 block mb-0.5">{formatCurrency(v.total)}</span>
                            {v.forma_pago === 'Efectivo' && <span className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">Efectivo</span>}
                            {v.forma_pago === 'Transferencia' && <span className="inline-flex items-center gap-1 text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">Transf.</span>}
                            {v.forma_pago === 'QR' && <span className="inline-flex items-center gap-1 text-[8px] font-bold text-fuchsia-600 bg-fuchsia-50 px-1.5 py-0.5 rounded uppercase">QR</span>}
                          </td>
                        </tr>
                      );
                    })}
                    {metricasTurno.ventasDelTurno.length === 0 && (
                      <tr><td colSpan={3} className="py-8 text-center text-xs font-bold text-gray-400">Ninguna operación registrada en este turno.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Observaciones y Cierre */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <FileText size={14} className="text-gray-400"/> Observaciones de cierre
                </h3>
                <textarea 
                  placeholder="Escribí acá comentarios sobre faltantes, gastos del día, etc..."
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-700 outline-none focus:border-gray-400 min-h-[120px] resize-none transition-colors placeholder:text-gray-400"
                />
              </div>
              
              <button 
                onClick={handleCerrarCaja}
                disabled={saving}
                className="w-full bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 mt-4 shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin"/> : <Lock size={14} />}
                Cerrar Turno Actual
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}