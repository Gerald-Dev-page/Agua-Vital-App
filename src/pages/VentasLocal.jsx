// src/pages/VentasLocal.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAppData, insertRecord } from '../services/api';
import { Store, Droplet, Zap, Loader2, CheckCircle, AlertCircle, Package, Calculator, X, Banknote, QrCode, ArrowRightLeft } from 'lucide-react';

const ID_CLIENTE_LOCAL = 'C-1776454908189';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);

const getLocalISOTime = () => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, -1);
};

const getUnidadesPorPromo = (nombre) => {
  const match = nombre.match(/^(\d+)/);
  return match ? parseInt(match[0], 10) : 1;
};

// Colores
const CARD_STYLES = {
  Bidón: { card: 'border-blue-100 hover:border-blue-300 hover:shadow-blue-100', iconBg: 'bg-blue-100', iconColor:'text-blue-600', price: 'text-blue-700', bar: 'bg-gradient-to-r from-blue-400 to-blue-600' },
  Dispenser: { card: 'border-cyan-100 hover:border-cyan-300 hover:shadow-cyan-100', iconBg: 'bg-cyan-100', iconColor:'text-cyan-600', price: 'text-cyan-700', bar: 'bg-gradient-to-r from-cyan-400 to-cyan-500' },
  Promo: { card: 'border-amber-100 hover:border-amber-300 hover:shadow-amber-100', iconBg: 'bg-amber-100', iconColor:'text-amber-600', price: 'text-amber-700', bar: 'bg-gradient-to-r from-amber-400 to-orange-400' },
};
const DEFAULT_STYLE = CARD_STYLES['Bidón'];

export default function VentasLocal() {
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState({});
  const [notificaciones, setNotificaciones] = useState([]);

  const [calcModal, setCalcModal] = useState({ show: false, prod: null, cantidad: '' });
  
  // NUEVO: Estado para el modal de Forma de Pago
  const [pagoModal, setPagoModal] = useState({ show: false, ventaData: null });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAppData();
        setCatalogo(data?.catalogo || []);
      } catch {
        agregarNotificacion('error', 'Error al cargar el catálogo.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const productosLocal = useMemo(() =>
    catalogo.filter(p => (p.nombre || '').toLowerCase().includes('negocio')),
    [catalogo]
  );

  const agregarNotificacion = useCallback((type, msg) => {
    const id = crypto.randomUUID();
    setNotificaciones(prev => [...prev, { id, type, msg }]);
    setTimeout(() => setNotificaciones(prev => prev.filter(n => n.id !== id)), 3000);
  }, []);

  // Función final que hace el envío a la DB
  const ejecutarVenta = async (formaPago) => {
    const { prod, cantidadReal, totalReal, nombre } = pagoModal.ventaData;
    const prodId = prod.id_producto;
    
    setPagoModal({ show: false, ventaData: null }); // Cerramos modal al toque
    setProcesando(prev => ({ ...prev, [prodId]: (prev[prodId] || 0) + 1 }));
    
    try {
      await insertRecord('insertVenta', {
        id_venta: crypto.randomUUID(),
        fecha: getLocalISOTime(),
        id_cliente: ID_CLIENTE_LOCAL,
        id_producto: prodId,
        cantidad: cantidadReal,
        precio_unitario: totalReal / cantidadReal,
        total: totalReal,
        forma_pago: formaPago // Mandamos la forma de pago
      });
      agregarNotificacion('success', `${nombre} (${formaPago}) registrado.`);
    } catch {
      agregarNotificacion('error', `Falló el registro de ${nombre}.`);
    } finally {
      setProcesando(prev => ({ ...prev, [prodId]: Math.max(0, (prev[prodId] || 1) - 1) }));
    }
  };

  // Venta Rápida: Ahora abre el modal de pago en vez de enviar directo
  const handleVentaRapida = (producto) => {
    setPagoModal({
      show: true,
      ventaData: { prod: producto, cantidadReal: 1, totalReal: parseFloat(producto.precio), nombre: producto.nombre }
    });
  };

  // Venta Calculada: Cierra modal calc y abre modal pago
  const handleVentaCalculada = (e) => {
    e.preventDefault();
    const { prod, cantidad } = calcModal;
    const uniPromo = getUnidadesPorPromo(prod.nombre);
    const cantPromos = parseInt(cantidad, 10) / uniPromo;
    const totalVenta = cantPromos * parseFloat(prod.precio);

    setCalcModal({ show: false, prod: null, cantidad: '' });
    setPagoModal({
      show: true,
      ventaData: { prod, cantidadReal: cantPromos, totalReal: totalVenta, nombre: prod.nombre }
    });
  };

  const uniModal = calcModal.prod ? getUnidadesPorPromo(calcModal.prod.nombre) : 1;
  const cantIngresada = parseInt(calcModal.cantidad) || 0;
  const esMultiplo = cantIngresada > 0 && cantIngresada % uniModal === 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      <p className="text-sm font-medium text-gray-400 animate-pulse">Abriendo caja...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-10 pb-24 relative">

      {/* MODAL 1: FORMAS DE PAGO (Nuevo) */}
      {pagoModal.show && pagoModal.ventaData && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden pb-4 md:pb-0 animate-fade-in-up md:animate-none">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-sm font-bold text-gray-800">¿Cómo paga?</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Cobrar <span className="font-bold text-blue-600">{formatCurrency(pagoModal.ventaData.totalReal)}</span>
                </p>
              </div>
              <button onClick={() => setPagoModal({ show: false, ventaData: null })} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-3">
              <button onClick={() => ejecutarVenta('Efectivo')} className="w-full flex items-center gap-3 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 p-4 rounded-2xl transition-colors text-emerald-700">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0"><Banknote size={20} /></div>
                <div className="text-left"><p className="font-bold text-lg leading-none">Efectivo</p><p className="text-xs font-medium text-emerald-600/80 mt-1">Billetes físicos</p></div>
              </button>

              <button onClick={() => ejecutarVenta('Transferencia')} className="w-full flex items-center gap-3 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 p-4 rounded-2xl transition-colors text-blue-700">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0"><ArrowRightLeft size={20} /></div>
                <div className="text-left"><p className="font-bold text-lg leading-none">Transferencia</p><p className="text-xs font-medium text-blue-600/80 mt-1">CBU / CVU / Alias</p></div>
              </button>

              <button onClick={() => ejecutarVenta('QR')} className="w-full flex items-center gap-3 bg-fuchsia-50 hover:bg-fuchsia-100 active:bg-fuchsia-200 border border-fuchsia-200 p-4 rounded-2xl transition-colors text-fuchsia-700">
                <div className="w-10 h-10 bg-fuchsia-500 rounded-full flex items-center justify-center text-white shrink-0"><QrCode size={20} /></div>
                <div className="text-left"><p className="font-bold text-lg leading-none">Código QR</p><p className="text-xs font-medium text-fuchsia-600/80 mt-1">MercadoPago / Modo</p></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Calculadora (Simplificada) */}
      {calcModal.show && calcModal.prod && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-sm font-bold text-gray-800">Vender varias unidades</h2>
                <p className="text-xs text-blue-600 font-medium mt-0.5">{calcModal.prod.nombre}</p>
              </div>
              <button onClick={() => setCalcModal({ show: false, prod: null, cantidad: '' })} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleVentaCalculada} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between">
                  <span>¿Cuántos bidones físicos se lleva?</span>
                  <span className="text-blue-500 font-bold">(Múltiplos de {uniModal})</span>
                </label>
                <input type="number" min="1" autoFocus placeholder={`Ej: ${uniModal * 2}...`} value={calcModal.cantidad} onChange={e => setCalcModal({...calcModal, cantidad: e.target.value})} required className="w-full px-4 py-3 text-xl font-bold bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none text-gray-800 text-center" />
              </div>
              {calcModal.cantidad && (
                <div className={`p-4 rounded-xl border ${esMultiplo ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  {esMultiplo ? (
                    <div className="flex justify-between items-center">
                      <div><p className="text-xs text-emerald-600 font-semibold uppercase">Equivale a</p><p className="text-sm text-emerald-800 font-bold">{cantIngresada / uniModal} Promos</p></div>
                      <span className="text-xl font-black text-emerald-700">{formatCurrency((cantIngresada / uniModal) * calcModal.prod.precio)}</span>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-red-600 flex items-center gap-2 justify-center"><AlertCircle size={16} /> ¡Cuidado! {cantIngresada} no es múltiplo de {uniModal}.</p>
                  )}
                </div>
              )}
              <button type="submit" disabled={!esMultiplo} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Continuar a Pagar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notificaciones apilables */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {notificaciones.map(noti => (
          <div key={noti.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg animate-fade-in-up ${noti.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {noti.type === 'success' ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-red-400" />}
            {noti.msg}
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div><h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><Store size={20} className="text-blue-500" /> Caja Rápida</h1></div>
        {Object.values(procesando).some(v => v > 0) && (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-semibold px-4 py-2 rounded-xl animate-pulse border border-amber-100">
            <Loader2 size={14} className="animate-spin" /> Guardando en sistema...
          </div>
        )}
      </div>

      {productosLocal.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productosLocal.map((producto) => {
            const enProceso = (procesando[producto.id_producto] || 0) > 0;
            const style = CARD_STYLES[producto.tipo] || DEFAULT_STYLE;

            return (
              <div key={producto.id_producto} className={`relative bg-white rounded-2xl border-2 shadow-sm flex flex-col overflow-hidden transition-colors ${style.card}`}>
                <div className={`absolute top-0 left-0 right-0 h-1 ${style.bar}`} />
                {enProceso && <span className="absolute top-3.5 right-3.5 flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 border border-amber-200"><Loader2 size={10} className="text-amber-600 animate-spin" /></span>}
                <button onClick={() => handleVentaRapida(producto)} className="w-full text-left p-5 pb-4 flex flex-col items-start gap-3 active:bg-gray-50/50">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg}`}>{producto.tipo === 'Promo' ? <Package size={18} className={style.iconColor} /> : <Droplet size={18} className={style.iconColor} />}</div>
                  <div className="w-full">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{producto.tipo}</p>
                    <p className="text-sm font-semibold text-gray-800 leading-snug my-1 line-clamp-2 min-h-[40px]">{producto.nombre}</p>
                    <p className={`text-xl font-bold ${style.price}`}>{formatCurrency(producto.precio)}</p>
                  </div>
                </button>
                <div className="w-full border-t border-gray-100 p-2.5 bg-gray-50 flex items-center justify-between mt-auto">
                  <button onClick={() => setCalcModal({ show: true, prod: producto, cantidad: '' })} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-blue-600 bg-white border border-gray-200 hover:border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors shadow-sm">
                    <Calculator size={13} /> Varios
                  </button>
                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Zap size={10} className="text-amber-400" /> 1 Clic</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 flex flex-col items-center justify-center text-center">
          <Store size={40} className="text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-600">Sin productos de mostrador</p>
        </div>
      )}
    </div>
  );
}