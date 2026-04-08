// src/pages/Productos.jsx
import { useState } from 'react';
import { insertRecord } from '../services/api';

export default function Productos() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    tipo: 'Bidón'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const nuevoProducto = {
        id_producto: 'P-' + Date.now(),
        ...formData,
        precio: parseFloat(formData.precio)
      };
      await insertRecord('insertProducto', nuevoProducto);
      alert("Producto agregado al catálogo");
      setFormData({ nombre: '', precio: '', tipo: 'Bidón' });
    } catch (err) {
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Gestión de Catálogo</h2>
        <p>Añade nuevos productos o servicios al sistema.</p>
      </header>
      
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre del Producto</label>
          <input 
            type="text" 
            placeholder="Ej: Bidón 20L"
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            required 
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Precio de Venta</label>
            <input 
              type="number" 
              step="0.01"
              value={formData.precio}
              onChange={(e) => setFormData({...formData, precio: e.target.value})}
              required 
            />
          </div>
          <div className="form-group">
            <label>Categoría</label>
            <select 
              value={formData.tipo}
              onChange={(e) => setFormData({...formData, tipo: e.target.value})}
            >
              <option value="Bidón">Bidón</option>
              <option value="Dispenser">Dispenser</option>
              <option value="Promo">Promo</option>
            </select>
          </div>
        </div>
        <button className="btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Registrar Producto'}
        </button>
      </form>
    </div>
  );
}