// src/pages/Ventas.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { fetchAppData, insertRecord } from '../services/api';
import {
  Droplet, Users, Package, Hash,
  CheckCircle, AlertCircle, ShoppingCart, ChevronDown
} from 'lucide-react';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);

// Función para obtener la fecha y hora local manteniendo el formato ISO
const getLocalISOTime = () => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, -1);
};

const FORM_INITIAL = {
  id_cliente: '',
  id_producto: '',
  cantidad: 1,
  precio_unitario: 0,
  total: 0,
};

export default function Ventas() {
  const [clientes, setClientes] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: 'success', msg: '' });

  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const dropdownRef = useRef(null);
  const toastTimeout = useRef(null);

  const [formData, setFormData] = useState(FORM_INITIAL);

  const showToast = useCallback((type, msg) => {
    setToast({ show: true, type, msg });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast({ show: false, type: 'success', msg: '' }), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAppData();
      setClientes(data?.clientes || []);
      setCatalogo(data?.catalogo || []);
    } catch {
      showToast('error', 'Error al cargar los datos. Revisá la conexión.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // ACÁ ESTABA EL BUG: Ahora, si busquedaCliente está vacío, devuelve todos los clientes.
  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente) return clientes;
    return clientes.filter((c) =>
      (c.nombre || '').toLowerCase().includes(busquedaCliente.toLowerCase())
    );
  }, [clientes, busquedaCliente]);

  const handleClienteInput = (e) => {
    setBusquedaCliente(e.target.value);
    setFormData((prev) => ({ ...prev, id_cliente: '' }));
    setDropdownAbierto(true);
  };

  const seleccionarCliente = (cliente) => {
    setBusquedaCliente(cliente.nombre);
    setFormData((prev) => ({ ...prev, id_cliente: cliente.id_cliente }));
    setDropdownAbierto(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'id_producto') {
        const prod = catalogo.find((p) => String(p.id_producto) === value);
        next.precio_unitario = prod ? parseFloat(prod.precio || 0) : 0;
        next.total = next.precio_unitario * next.cantidad;
      }
      if (name === 'cantidad') {
        const qty = Math.max(1, parseInt(value) || 1);
        next.cantidad = qty;
        next.total = next.precio_unitario * qty;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_cliente) {
      showToast('error', 'Seleccioná un cliente válido de la lista.');
      return;
    }
    if (!formData.id_producto || formData.cantidad <= 0) {
      showToast('error', 'Completá el producto y la cantidad correctamente.');
      return;
    }
    setSaving(true);
    try {
      await insertRecord('insertVenta', {
        id_venta: crypto.randomUUID(),
        fecha: getLocalISOTime(),
        id_cliente: formData.id_cliente,
        id_producto: formData.id_producto,
        cantidad: formData.cantidad,
        precio_unitario: formData.precio_unitario,
        total: formData.total,
      });
      showToast('success', '¡Venta registrada con éxito!');
      setBusquedaCliente('');
      setFormData(FORM_INITIAL);
    } catch {
      showToast('error', 'Error al guardar la venta.');
    } finally {
      setSaving(false);
    }
  };

  const productoActual = useMemo(() => 
    catalogo.find((p) => String(p.id_producto) === formData.id_producto),
    [catalogo, formData.id_producto]
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      <p className="text-sm font-medium text-gray-400 animate-pulse">Cargando sistema...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-16 md:py-10 max-w-4xl mx-auto w-full">

      {toast.show && (
        <div className={`
          fixed top-5 right-5 z-50 flex items-center gap-3
          px-4 py-3 rounded-xl border text-sm font-medium shadow-lg animate-fade-in-up
          ${toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'}
        `}>
          {toast.type === 'success'
            ? <CheckCircle size={16} className="text-emerald-500 shrink-0" />
            : <AlertCircle size={16} className="text-red-400 shrink-0" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-2xl mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Droplet size={18} className="text-blue-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Registrar Nueva Venta</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">
          Completá los datos para registrar una venta en el sistema.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible"
      >
        <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-t-2xl" />

        <div className="p-6 md:p-8 space-y-6">

          <div className="space-y-1.5" ref={dropdownRef}>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Cliente
            </label>
            <div className="relative">
              <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Buscá por nombre o razón social..."
                value={busquedaCliente}
                onChange={handleClienteInput}
                onFocus={() => setDropdownAbierto(true)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="w-full pl-10 pr-4 py-3 text-base bg-gray-50 border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                  placeholder:text-gray-300 text-gray-800 transition-all"
              />

              {dropdownAbierto && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200
                  rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto scrollbar-thin">
                  {clientesFiltrados.length > 0 ? (
                    <ul>
                      {clientesFiltrados.map((c) => (
                        <li
                          key={c.id_cliente}
                          onMouseDown={() => seleccionarCliente(c)}
                          onTouchEnd={() => seleccionarCliente(c)}
                          className="px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700
                            cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                        >
                          <p className="font-medium">{c.nombre}</p>
                          {c.direccion && (
                            <p className="text-xs text-gray-400 mt-0.5">{c.direccion}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-3">
                      <p className="text-sm text-gray-400">Sin resultados para "{busquedaCliente}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="h-5 flex items-center">
              {busquedaCliente && !formData.id_cliente && (
                <p className="text-[11px] text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle size={11} /> Seleccioná un cliente de la lista.
                </p>
              )}
              {formData.id_cliente && (
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle size={11} /> Cliente vinculado correctamente.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Producto
              </label>
              <div className="relative">
                <Package size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  name="id_producto"
                  value={formData.id_producto}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-8 py-3 text-base bg-gray-50 border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                    text-gray-800 appearance-none cursor-pointer transition-all"
                >
                  <option value="">Seleccioná un producto</option>
                  {catalogo.map((p) => (
                    <option key={p.id_producto} value={p.id_producto}>
                      {p.nombre} — {p.tipo}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Cantidad
              </label>
              <div className="relative">
                <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="cantidad"
                  min="1"
                  value={formData.cantidad}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 text-base bg-gray-50 border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                    text-gray-800 transition-all"
                />
              </div>
            </div>
          </div>

          {productoActual ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Precio unitario</span>
                <span className="text-sm font-semibold text-gray-700">
                  {formatCurrency(formData.precio_unitario)}
                </span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Cantidad</span>
                <span className="text-sm font-semibold text-gray-700">{formData.cantidad} u.</span>
              </div>
              <div className="flex justify-between items-center px-5 py-4 bg-blue-600">
                <span className="text-sm font-semibold text-blue-100">Total a cobrar</span>
                <span className="text-xl font-semibold text-white">
                  {formatCurrency(formData.total)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-6 text-center">
              <p className="text-xs text-gray-400 font-medium">
                Seleccioná un producto para ver el resumen de precio.
              </p>
            </div>
          )}

          <div className="border-t border-gray-100" />

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2
              bg-blue-600 hover:bg-blue-700 active:scale-[0.98]
              text-white text-sm font-semibold
              py-3 rounded-xl transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Registrando venta...
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                Confirmar Venta
              </>
            )}
          </button>

        </div>
      </form>
    </div>
  );
}