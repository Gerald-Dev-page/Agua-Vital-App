// src/pages/Productos.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { insertRecord, fetchAppData } from '../services/api';
import {
  Package, Tag, DollarSign, Layers, CheckCircle,
  AlertCircle, Edit2, X, Search, Loader2
} from 'lucide-react';

const TIPOS = [
  { value: 'Bidón',     label: 'Bidón',     desc: 'Envase de agua retornable' },
  { value: 'Dispenser', label: 'Dispenser', desc: 'Equipo dispensador' },
  { value: 'Promo',     label: 'Promo',     desc: 'Pack o promoción especial' },
];

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);

const INITIAL_FORM = { id_producto: '', nombre: '', precio: '', tipo: 'Bidón' };

const TIPO_STYLES = {
  Bidón:     { pill: 'bg-blue-50 text-blue-600',   dot: 'bg-blue-400' },
  Dispenser: { pill: 'bg-cyan-50 text-cyan-600',   dot: 'bg-cyan-400' },
  Promo:     { pill: 'bg-amber-50 text-amber-600', dot: 'bg-amber-400' },
};

export default function Productos() {
  const [catalogo, setCatalogo]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData]   = useState(INITIAL_FORM);
  const [busqueda, setBusqueda]   = useState('');

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadCatalogo = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAppData();
      setCatalogo(data?.catalogo || []);
    } catch {
      showToast('error', 'Error al cargar el catálogo.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadCatalogo(); }, [loadCatalogo]);

  const catalogoFiltrado = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return catalogo;
    return catalogo.filter(p =>
      (p.nombre || '').toLowerCase().includes(q) ||
      (p.tipo   || '').toLowerCase().includes(q)
    );
  }, [catalogo, busqueda]);

  const handleChange = (field) => (e) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleEditClick = (prod) => {
    setFormData({
      id_producto: prod.id_producto,
      nombre:      prod.nombre,
      precio:      prod.precio,
      tipo:        prod.tipo || 'Bidón',
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setFormData(INITIAL_FORM);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const accion  = isEditing ? 'updateProducto' : 'insertProducto';
    const idProd  = isEditing ? formData.id_producto : 'P-' + Date.now();
    try {
      await insertRecord(accion, {
        id_producto: idProd,
        nombre:      formData.nombre,
        precio:      parseFloat(formData.precio),
        tipo:        formData.tipo,
      });
      showToast('success', isEditing ? 'Cambios guardados.' : 'Producto agregado al catálogo.');
      setFormData(INITIAL_FORM);
      setIsEditing(false);
      await loadCatalogo();
    } catch {
      showToast('error', 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && catalogo.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      <p className="text-sm font-medium text-gray-400 animate-pulse">Cargando catálogo...</p>
    </div>
  );

  const accentBlue   = isEditing ? false : true;
  const gradientBar  = isEditing ? 'from-amber-400 to-amber-500' : 'from-blue-400 to-blue-600';
  const submitColor  = isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700';
  const iconBg       = isEditing ? 'bg-amber-100' : 'bg-blue-100';
  const iconColor    = isEditing ? 'text-amber-600' : 'text-blue-600';
  const borderColor  = isEditing ? 'border-amber-200' : 'border-gray-100';

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-10 max-w-4xl mx-auto w-full pb-24">

      {/* Toast */}
      {toast && (
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Package size={20} className={isEditing ? 'text-amber-500' : 'text-blue-500'} />
            {isEditing ? 'Editar Producto' : 'Gestión de Catálogo'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isEditing
              ? 'Modificá los datos y guardá los cambios.'
              : 'Agregá o modificá los productos del catálogo.'}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className={`bg-white rounded-2xl border shadow-sm overflow-hidden mb-6 transition-colors ${borderColor}`}
      >
        <div className={`h-1 w-full bg-gradient-to-r ${gradientBar}`} />

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
                placeholder="Ej: Bidón 20L Negocio"
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
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Botones */}
          <div className="flex gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2
                  bg-gray-100 hover:bg-gray-200 text-gray-600
                  text-sm font-semibold py-3 rounded-xl transition-all"
              >
                <X size={15} />
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className={`flex-[2] flex items-center justify-center gap-2
                active:scale-[0.98] text-white text-sm font-semibold
                py-3 rounded-xl transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed ${submitColor}`}
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  {isEditing ? <Edit2 size={15} /> : <Package size={15} />}
                  {isEditing ? 'Guardar cambios' : 'Agregar producto'}
                </>
              )}
            </button>
          </div>

        </div>
      </form>

      {/* Lista de productos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Header de la lista con buscador */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Layers size={16} className="text-gray-400 shrink-0" />
            <h2 className="text-sm font-semibold text-gray-700">Catálogo activo</h2>
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              {catalogoFiltrado.length}/{catalogo.length}
            </span>
          </div>

          {/* Buscador */}
          <div className="relative sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                placeholder:text-gray-300 text-gray-700 transition-all"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Filas */}
        <ul className="divide-y divide-gray-50">
          {catalogoFiltrado.map(prod => {
            const style      = TIPO_STYLES[prod.tipo] || TIPO_STYLES['Bidón'];
            const editando   = isEditing && formData.id_producto === prod.id_producto;

            return (
              <li
                key={prod.id_producto}
                className={`flex items-center justify-between px-5 py-4 transition-colors
                  ${editando ? 'bg-amber-50/60' : 'hover:bg-gray-50/60'}`}
              >
                {/* Dot + info */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{prod.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${style.pill}`}>
                        {prod.tipo}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600">
                        {formatCurrency(prod.precio)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acción */}
                {editando ? (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-lg shrink-0">
                    Editando
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEditClick(prod)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                    title="Editar"
                  >
                    <Edit2 size={15} />
                  </button>
                )}
              </li>
            );
          })}

          {/* Sin resultados de búsqueda */}
          {catalogoFiltrado.length === 0 && !loading && (
            <li className="px-6 py-12 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                <Search size={18} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-1">
                {busqueda ? `Sin resultados para "${busqueda}"` : 'El catálogo está vacío.'}
              </p>
              <p className="text-xs text-gray-400">
                {busqueda ? 'Probá con otro nombre o categoría.' : 'Agregá el primer producto usando el formulario.'}
              </p>
            </li>
          )}
        </ul>
      </div>

    </div>
  );
}