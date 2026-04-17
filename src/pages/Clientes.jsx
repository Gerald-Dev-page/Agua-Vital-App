// src/pages/Clientes.jsx
import { useState } from 'react';
import { insertRecord } from '../services/api';
import { UserPlus, User, MapPin, Phone, CheckCircle, AlertCircle } from 'lucide-react';

export default function Clientes() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', msg: string }
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: ''
  });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await insertRecord('insertCliente', {
        id_cliente: 'C-' + Date.now(),
        ...formData
      });
      showToast('success', 'Cliente registrado exitosamente.');
      setFormData({ nombre: '', direccion: '', telefono: '' });
    } catch (err) {
      console.error(err);
      showToast('error', 'Error al guardar el cliente en el sistema.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-16 md:py-10 max-w-4xl mx-auto w-full">

      {/* Toast */}
      {toast && (
        <div className={`
          fixed top-5 right-5 z-50 flex items-center gap-3
          px-4 py-3 rounded-xl shadow-lg border text-sm font-medium
          transition-all duration-300
          ${toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'}
        `}>
          {toast.type === 'success'
            ? <CheckCircle size={17} className="text-emerald-500 shrink-0" />
            : <AlertCircle size={17} className="text-red-400 shrink-0" />
          }
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="max-w-2xl mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <UserPlus size={18} className="text-blue-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Gestión de Clientes</h1>
        </div>
        <p className="text-sm text-gray-400 ml-12">
          Completá los datos para registrar un nuevo cliente en el sistema.
        </p>
      </div>

      {/* Card formulario */}
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        {/* Franja superior */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600" />

        <div className="p-6 md:p-8 space-y-6">

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Nombre completo o razón social
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                placeholder="Ej: Juan Pérez / Empresa S.A."
                value={formData.nombre}
                onChange={handleChange('nombre')}
                required
                className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                  placeholder:text-gray-300 text-gray-700 transition-all"
              />
            </div>
          </div>

          {/* Dirección + Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Dirección de entrega
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="text"
                  placeholder="Ej: Calle Falsa 123"
                  value={formData.direccion}
                  onChange={handleChange('direccion')}
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                    placeholder:text-gray-300 text-gray-700 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Teléfono de contacto
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="tel"
                  placeholder="Ej: 2664123456"
                  value={formData.telefono}
                  onChange={handleChange('telefono')}
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                    placeholder:text-gray-300 text-gray-700 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
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
                Registrando en sistema...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Registrar Cliente
              </>
            )}
          </button>

        </div>
      </form>
    </div>
  );
}