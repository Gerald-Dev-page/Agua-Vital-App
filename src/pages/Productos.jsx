// src/pages/Productos.jsx
import { useState } from 'react';
import { insertRecord } from '../services/api';
import { Package, Tag, DollarSign, Layers, CheckCircle, AlertCircle } from 'lucide-react';

const TIPOS = [
  { value: 'Bidón',    label: 'Bidón',    desc: 'Envase de agua retornable' },
  { value: 'Dispenser', label: 'Dispenser', desc: 'Equipo dispensador' },
  { value: 'Promo',   label: 'Promo',    desc: 'Pack o promoción especial' },
];

export default function Productos() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', precio: '', tipo: 'Bidón' });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await insertRecord('insertProducto', {
        id_producto: 'P-' + Date.now(),
        ...formData,
        precio: parseFloat(formData.precio),
      });
      showToast('success', 'Producto agregado al catálogo.');
      setFormData({ nombre: '', precio: '', tipo: 'Bidón' });
    } catch {
      showToast('error', 'Error al guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

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
            <Package size={18} className="text-blue-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Gestión de Catálogo</h1>
        </div>
        <p className="text-sm text-gray-400 ml-12">
          Completá los datos para agregar un nuevo producto al sistema.
        </p>
      </div>

      {/* Card formulario */}
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600" />

        <div className="p-6 md:p-8 space-y-6">

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Nombre del producto
            </label>
            <div className="relative">
              <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                placeholder="Ej: Bidón 20L"
                value={formData.nombre}
                onChange={handleChange('nombre')}
                required
                className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                  placeholder:text-gray-300 text-gray-700 transition-all"
              />
            </div>
          </div>

          {/* Precio + Categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Precio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Precio de venta
              </label>
              <div className="relative">
                <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.precio}
                  onChange={handleChange('precio')}
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                    placeholder:text-gray-300 text-gray-700 transition-all"
                />
              </div>
            </div>

            {/* Categoría */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Categoría
              </label>
              <div className="relative">
                <Layers size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <select
                  value={formData.tipo}
                  onChange={handleChange('tipo')}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                    text-gray-700 appearance-none cursor-pointer transition-all"
                >
                  {TIPOS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {/* Flecha custom del select */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Preview del tipo seleccionado */}
          {formData.tipo && (() => {
            const tipo = TIPOS.find(t => t.value === formData.tipo);
            return (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Package size={14} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-700">{tipo.label}</p>
                  <p className="text-[11px] text-blue-400">{tipo.desc}</p>
                </div>
              </div>
            );
          })()}

          <div className="border-t border-gray-100" />

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2
              bg-blue-600 hover:bg-blue-700 active:scale-[0.98]
              text-white text-sm font-semibold
              py-3 rounded-xl transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <Package size={16} />
                Registrar Producto
              </>
            )}
          </button>

        </div>
      </form>
    </div>
  );
}