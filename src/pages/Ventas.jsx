// src/pages/Ventas.jsx
import { useState, useEffect } from 'react';
import { fetchAppData, insertRecord } from '../services/api';
import {
  Droplet, Users, Package, Hash,
  CheckCircle, AlertCircle, ShoppingCart
} from 'lucide-react';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

export default function Ventas() {
  const [clientes, setClientes] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [formData, setFormData] = useState({
    id_cliente: '',
    id_producto: '',
    cantidad: 1,
    precio_unitario: 0,
    total: 0,
  });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAppData();
        setClientes(data.clientes || []);
        setCatalogo(data.catalogo || []);
      } catch {
        showToast('error', 'Error al cargar los datos. Revisá la consola.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleClienteBuscador = (e) => {
    const valor = e.target.value;
    setBusquedaCliente(valor);
    const encontrado = clientes.find((c) => c.nombre === valor);
    setFormData((prev) => ({ ...prev, id_cliente: encontrado?.id_cliente || '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let next = { ...formData, [name]: value };

    if (name === 'id_producto') {
      const prod = catalogo.find((p) => p.id_producto.toString() === value);
      const precio = prod ? parseFloat(prod.precio) : 0;
      next.precio_unitario = precio;
      next.total = precio * next.cantidad;
    }
    if (name === 'cantidad') {
      const cant = parseInt(value) || 0;
      next.total = next.precio_unitario * cant;
    }
    setFormData(next);
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
        fecha: new Date().toISOString(),
        id_cliente: formData.id_cliente,
        id_producto: formData.id_producto,
        cantidad: formData.cantidad,
        precio_unitario: formData.precio_unitario,
        total: formData.total,
      });
      showToast('success', '¡Venta registrada con éxito!');
      setBusquedaCliente('');
      setFormData({ id_cliente: '', id_producto: '', cantidad: 1, precio_unitario: 0, total: 0 });
    } catch {
      showToast('error', 'Error al guardar la venta.');
    } finally {
      setSaving(false);
    }
  };

  // Producto seleccionado actualmente
  const productoActual = catalogo.find(
    (p) => p.id_producto.toString() === formData.id_producto
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      <p className="text-sm font-medium text-gray-400 animate-pulse">Cargando sistema...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-16 md:py-10 max-w-4xl mx-auto w-full">

      {/* Toast */}
      {toast && (
        <div className={`
          fixed top-5 right-5 z-50 flex items-center gap-3
          px-4 py-3 rounded-xl border text-sm font-medium shadow-lg transition-all duration-300
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

      {/* Header */}
      <div className="max-w-2xl mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Droplet size={18} className="text-blue-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Registrar Nueva Venta</h1>
        </div>
        <p className="text-sm text-gray-400 ml-12">
          Completá los datos para registrar una venta en el sistema.
        </p>
      </div>

      {/* Card formulario */}
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600" />

        <div className="p-6 md:p-8 space-y-6">

          {/* Buscador de cliente */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Cliente
            </label>
            <div className="relative">
              <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <input
                list="lista-clientes"
                placeholder="Buscá por nombre o razón social..."
                value={busquedaCliente}
                onChange={handleClienteBuscador}
                autoComplete="off"
                required
                className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                  placeholder:text-gray-300 text-gray-700 transition-all"
              />
              <datalist id="lista-clientes">
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.nombre} />
                ))}
              </datalist>
            </div>

            {/* Feedback cliente */}
            <div className="h-5 flex items-center">
              {busquedaCliente && !formData.id_cliente && (
                <p className="text-[11px] text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle size={11} /> Cliente no encontrado — seleccioná uno de la lista.
                </p>
              )}
              {formData.id_cliente && (
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle size={11} /> Cliente vinculado correctamente.
                </p>
              )}
            </div>
          </div>

          {/* Producto + Cantidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Producto
              </label>
              <div className="relative">
                <Package size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <select
                  name="id_producto"
                  value={formData.id_producto}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-8 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                    text-gray-700 appearance-none cursor-pointer transition-all"
                >
                  <option value="">Seleccioná un producto</option>
                  {catalogo.map((p) => (
                    <option key={p.id_producto} value={p.id_producto}>
                      {p.nombre} — {p.tipo}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Cantidad
              </label>
              <div className="relative">
                <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="number"
                  name="cantidad"
                  min="1"
                  value={formData.cantidad}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                    text-gray-700 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Resumen de precio — solo si hay producto seleccionado */}
          {productoActual ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
              {/* Detalle unitario */}
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-100">
                <span className="text-xs text-gray-400 font-medium">Precio unitario</span>
                <span className="text-sm font-semibold text-gray-600">
                  {formatCurrency(formData.precio_unitario)}
                </span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-100">
                <span className="text-xs text-gray-400 font-medium">Cantidad</span>
                <span className="text-sm font-semibold text-gray-600">{formData.cantidad} u.</span>
              </div>
              {/* Total destacado */}
              <div className="flex justify-between items-center px-5 py-4 bg-blue-600">
                <span className="text-sm font-semibold text-blue-100">Total a cobrar</span>
                <span className="text-xl font-semibold text-white">
                  {formatCurrency(formData.total)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-6 text-center">
              <p className="text-xs text-gray-300 font-medium">
                Seleccioná un producto para ver el resumen de precio.
              </p>
            </div>
          )}

          <div className="border-t border-gray-100" />

          {/* Botón */}
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