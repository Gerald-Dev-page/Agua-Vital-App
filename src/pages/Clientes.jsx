// src/pages/Clientes.jsx
import { useState } from 'react';
import { insertRecord } from '../services/api';

export default function Clientes() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const nuevoCliente = {
        id_cliente: 'C-' + Date.now(), // Generación de ID único
        ...formData
      };
      
      await insertRecord('insertCliente', nuevoCliente);
      
      alert("Cliente registrado exitosamente.");
      
      // Limpiamos el formulario tras el éxito
      setFormData({ nombre: '', direccion: '', telefono: '' });
    } catch (err) {
      console.error(err);
      alert("Error al guardar el cliente en el sistema.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Gestión de Clientes</h2>
        <p>Registre los datos de sus clientes para asociarlos posteriormente a las ventas.</p>
      </header>
      
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre Completo o Razón Social</label>
          <input 
            type="text" 
            placeholder="Ej: Juan Pérez / Empresa S.A."
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            required 
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Dirección de Entrega</label>
            <input 
              type="text" 
              placeholder="Ej: Calle Falsa 123"
              value={formData.direccion}
              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Teléfono de Contacto</label>
            <input 
              type="tel" 
              placeholder="Ej: 2664123456"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              required 
            />
          </div>
        </div>
        
        <button className="btn-primary" disabled={loading}>
          {loading ? 'Registrando en sistema...' : 'Registrar Cliente'}
        </button>
      </form>
    </div>
  );
}