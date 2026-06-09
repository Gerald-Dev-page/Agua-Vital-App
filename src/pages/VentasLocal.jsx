// src/pages/VentasLocal.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAppData, insertRecord } from '../services/api';
import { Store, Droplet, Zap, Loader2, CheckCircle, AlertCircle, Package } from 'lucide-react';

const ID_CLIENTE_LOCAL = 'C-1776454908189';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);

const getLocalISOTime = () => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, -1);
};

// Paleta de colores por tipo de producto
const CARD_STYLES = {
  Bidón:     {
    card:    'border-blue-100 hover:border-blue-300 hover:shadow-blue-100',
    iconBg:  'bg-blue-100',
    iconColor:'text-blue-600',
    price:   'text-blue-700',
    pill:    'bg-blue-100 text-blue-700',
    bar:     'bg-gradient-to-r from-blue-400 to-blue-600',
    active:  'active:bg-blue-50',
  },
  Dispenser: {
    card:    'border-cyan-100 hover:border-cyan-300 hover:shadow-cyan-100',
    iconBg:  'bg-cyan-100',
    iconColor:'text-cyan-600',
    price:   'text-cyan-700',
    pill:    'bg-cyan-100 text-cyan-700',
    bar:     'bg-gradient-to-r from-cyan-400 to-cyan-500',
    active:  'active:bg-cyan-50',
  },
  Promo:     {
    card:    'border-amber-100 hover:border-amber-300 hover:shadow-amber-100',
    iconBg:  'bg-amber-100',
    iconColor:'text-amber-600',
    price:   'text-amber-700',
    pill:    'bg-amber-100 text-amber-700',
    bar:     'bg-gradient-to-r from-amber-400 to-orange-400',
    active:  'active:bg-amber-50',
  },
};

const DEFAULT_STYLE = CARD_STYLES['Bidón'];

export default function VentasLocal() {
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState({});
  const [notificaciones, setNotificaciones] = useState([]);

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
    setTimeout(() => {
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const handleVentaRapida = async (producto) => {
    const idVenta = crypto.randomUUID();
    const prodId = producto.id_producto;
    setProcesando(prev => ({ ...prev, [prodId]: (prev[prodId] || 0) + 1 }));
    try {
      await insertRecord('insertVenta', {
        id_venta: idVenta,
        fecha: getLocalISOTime(),
        id_cliente: ID_CLIENTE_LOCAL,
        id_producto: prodId,
        cantidad: 1,
        precio_unitario: parseFloat(producto.precio),
        total: parseFloat(producto.precio),
      });
      agregarNotificacion('success', `${producto.nombre} registrado.`);
    } catch {
      agregarNotificacion('error', `No se pudo registrar ${producto.nombre}.`);
    } finally {
      setProcesando(prev => ({ ...prev, [prodId]: Math.max(0, (prev[prodId] || 1) - 1) }));
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      <p className="text-sm font-medium text-gray-400 animate-pulse">Cargando caja...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-10">

      {/* Notificaciones apilables */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {notificaciones.map(noti => (
          <div
            key={noti.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg animate-fade-in-up
              ${noti.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'}
            `}
          >
            {noti.type === 'success'
              ? <CheckCircle size={16} className="text-emerald-500 shrink-0" />
              : <AlertCircle size={16} className="text-red-400 shrink-0" />}
            {noti.msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Store size={20} className="text-blue-500" />
            Caja Rápida
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Tocá un producto para registrar la venta al instante.
          </p>
        </div>

        {Object.values(procesando).some(v => v > 0) && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold px-4 py-2.5 rounded-xl self-start md:self-auto">
            <Loader2 size={13} className="animate-spin" />
            Sincronizando ventas...
          </div>
        )}
      </div>

      {/* Grid de productos */}
      {productosLocal.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productosLocal.map((producto) => {
            const enProceso = (procesando[producto.id_producto] || 0) > 0;
            const style = CARD_STYLES[producto.tipo] || DEFAULT_STYLE;

            return (
              <button
                key={producto.id_producto}
                onClick={() => handleVentaRapida(producto)}
                className={`
                  relative bg-white rounded-2xl border-2 p-5
                  flex flex-col items-start gap-4
                  shadow-sm hover:shadow-md
                  active:scale-[0.97] transition-all duration-150 ease-out text-left group
                  ${style.card} ${style.active}
                `}
              >
                {/* Barra de color superior */}
                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${style.bar}`} />

                {/* Indicador de guardado */}
                {enProceso && (
                  <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}

                {/* Ícono */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mt-1 ${style.iconBg}`}>
                  {producto.tipo === 'Promo'
                    ? <Package size={20} className={style.iconColor} />
                    : <Droplet  size={20} className={style.iconColor} />}
                </div>

                {/* Info */}
                <div className="w-full">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                    {producto.tipo}
                  </p>
                  <p className="text-sm font-semibold text-gray-800 leading-snug mb-3">
                    {producto.nombre}
                  </p>
                  <p className={`text-2xl font-semibold ${style.price}`}>
                    {formatCurrency(producto.precio)}
                  </p>
                </div>

                {/* Footer */}
                <div className="w-full border-t border-gray-100 pt-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                    <Zap size={11} className="text-amber-400" />
                    Venta inmediata
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${style.pill}`}>
                    Registrar
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-6 py-14 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
            <Store size={20} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-600 mb-1">Sin productos de mostrador</p>
          <p className="text-xs text-gray-400 max-w-xs">
            Agregá la palabra "negocio" al nombre del producto en el catálogo para que aparezca acá.
          </p>
        </div>
      )}

    </div>
  );
}