// src/pages/Ventas.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAppData, insertRecord } from '../services/api';
import { Droplet, Package, Zap, Loader2, CheckCircle, AlertCircle, Calculator, X } from 'lucide-react';

const ID_CLIENTE_CASA = 'C-1781124386494'; // Cliente Casa hardcodeado

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

export default function Ventas() {
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState({});
  const [notificaciones, setNotificaciones] = useState([]);

  const [calcModal, setCalcModal] = useState({ show: false, prod: null, cantidad: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAppData();
        setCatalogo(data?.catalogo || []);
      } catch {
        agregarNotificacion('error', 'Error de conexión.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filtramos solo los productos de calle (que NO digan "negocio")
  const productosCalle = useMemo(() =>
    catalogo.filter(p => !(p.nombre || '').toLowerCase().includes('negocio')),
    [catalogo]
  );

  const agregarNotificacion = useCallback((type, msg) => {
    const id = crypto.randomUUID();
    setNotificaciones(prev => [...prev, { id, type, msg }]);
    setTimeout(() => setNotificaciones(prev => prev.filter(n => n.id !== id)), 3000);
  }, []);

  const enviarVenta = async (idVenta, prodId, cantidadReal, totalReal, nombre) => {
    setProcesando(prev => ({ ...prev, [prodId]: (prev[prodId] || 0) + 1 }));
    try {
      await insertRecord('insertVenta', {
        id_venta: idVenta,
        fecha: getLocalISOTime(),
        id_cliente: ID_CLIENTE_CASA, // Siempre va a Cliente Casa
        id_producto: prodId,
        cantidad: cantidadReal,
        precio_unitario: totalReal / cantidadReal,
        total: totalReal,
      });
      agregarNotificacion('success', `${nombre} registrado.`);
    } catch {
      agregarNotificacion('error', `Falló el registro de ${nombre}.`);
    } finally {
      setProcesando(prev => ({ ...prev, [prodId]: Math.max(0, (prev[prodId] || 1) - 1) }));
    }
  };

  const handleVentaRapida = (producto) => {
    enviarVenta(crypto.randomUUID(), producto.id_producto, 1, parseFloat(producto.precio), producto.nombre);
  };

  const handleVentaCalculada = (e) => {
    e.preventDefault();
    const { prod, cantidad } = calcModal;
    const uniPromo = getUnidadesPorPromo(prod.nombre);
    const cantBidones = parseInt(cantidad, 10);
    const cantPromos = cantBidones / uniPromo;
    const totalVenta = cantPromos * parseFloat(prod.precio);

    enviarVenta(crypto.randomUUID(), prod.id_producto, cantPromos, totalVenta, prod.nombre);
    setCalcModal({ show: false, prod: null, cantidad: '' });
  };

  // Variables para la vista del modal
  const uniModal = calcModal.prod ? getUnidadesPorPromo(calcModal.prod.nombre) : 1;
  const cantIngresada = parseInt(calcModal.cantidad) || 0;
  const esMultiplo = cantIngresada > 0 && cantIngresada % uniModal === 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      <p className="text-sm font-medium text-gray-400 animate-pulse">Cargando catálogo...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 md:px-10 pb-24 relative">

      {/* Modal Calculadora */}
      {calcModal.show && calcModal.prod && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-sm font-bold text-gray-800">Cantidad Entregada</h2>
                <p className="text-xs text-blue-600 font-medium">{calcModal.prod.nombre}</p>
              </div>
              <button onClick={() => setCalcModal({ show: false, prod: null, cantidad: '' })} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-full shadow-sm">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleVentaCalculada} className="p-5 space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block text-center">
                  Bidones físicos entregados
                </label>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  placeholder={`Ej: ${uniModal * 2}`}
                  value={calcModal.cantidad}
                  onChange={e => setCalcModal({...calcModal, cantidad: e.target.value})}
                  className="w-full px-4 py-4 text-3xl font-black text-center bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-gray-800"
                />
              </div>
              {calcModal.cantidad && (
                <div className={`p-4 rounded-2xl text-center ${esMultiplo ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                  {esMultiplo ? (
                    <>
                      <p className="text-xs font-semibold uppercase opacity-80 mb-1">Total a cobrar</p>
                      <p className="text-2xl font-black">{formatCurrency((cantIngresada / uniModal) * calcModal.prod.precio)}</p>
                    </>
                  ) : (
                    <p className="text-xs font-bold">¡Ojo! Debe ser múltiplo de {uniModal}.</p>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={!esMultiplo}
                className="w-full bg-blue-600 active:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-colors disabled:opacity-50"
              >
                Registrar Entrega
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notificaciones */}
      <div className="fixed top-5 right-4 left-4 md:left-auto md:right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {notificaciones.map(noti => (
          <div key={noti.id} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-bold shadow-xl animate-fade-in-up ${noti.type === 'success' ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-red-500 border-red-600 text-white'}`}>
            {noti.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {noti.msg}
          </div>
        ))}
      </div>

      {/* Header Mobile */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2 tracking-tight">
            <Zap size={22} className="text-blue-500 fill-blue-500" /> Reparto en Calle
          </h1>
          <p className="text-sm text-gray-500 font-medium">Ventas a Cliente Casa</p>
        </div>
        {Object.values(procesando).some(v => v > 0) && (
          <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 text-[10px] uppercase font-black px-3 py-2 rounded-full animate-pulse shadow-sm">
            <Loader2 size={12} className="animate-spin" />
          </div>
        )}
      </div>

      {/* Grid estilo Botonera App */}
      {productosCalle.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {productosCalle.map((producto) => {
            const enProceso = (procesando[producto.id_producto] || 0) > 0;
            const esPromo = producto.tipo === 'Promo';

            return (
              <div 
                key={producto.id_producto} 
                className="relative bg-white rounded-[24px] shadow-sm flex flex-col overflow-hidden border border-gray-100"
              >
                {/* Indicador de guardado */}
                {enProceso && (
                  <div className="absolute top-3 right-3 bg-amber-400 w-3 h-3 rounded-full animate-pulse border-2 border-white z-10" />
                )}

                {/* Zona Principal (Venta Rápida 1 Clic) */}
                <button 
                  onClick={() => handleVentaRapida(producto)}
                  className="w-full flex-grow p-5 flex flex-col items-center justify-center gap-2 active:bg-gray-50 transition-colors text-center"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${esPromo ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                    {esPromo ? <Package size={24} /> : <Droplet size={24} />}
                  </div>
                  
                  <h3 className="text-sm font-bold text-gray-700 leading-tight line-clamp-2">
                    {producto.nombre}
                  </h3>
                  
                  <span className={`text-xl font-black ${esPromo ? 'text-amber-600' : 'text-blue-600'}`}>
                    {formatCurrency(producto.precio)}
                  </span>
                </button>

                {/* Botón Calculadora */}
                <button 
                  onClick={() => setCalcModal({ show: true, prod: producto, cantidad: '' })}
                  className="w-full bg-gray-50 py-3 text-xs font-bold text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 border-t border-gray-100"
                >
                  <Calculator size={14} /> Varios
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center shadow-sm">
          <Droplet size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-500">Catálogo de reparto vacío</p>
        </div>
      )}

    </div>
  );
}