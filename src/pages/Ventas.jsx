// src/pages/Ventas.jsx
import { useState, useEffect } from 'react';
import { fetchAppData, insertRecord } from '../services/api';
import '../styles/ventas.css';

export default function Ventas() {
  const [clientes, setClientes] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Nuevo estado para manejar el texto escrito en el buscador
  const [busquedaCliente, setBusquedaCliente] = useState('');

  // Estado del formulario
  const [formData, setFormData] = useState({
    id_cliente: '',
    id_producto: '',
    cantidad: 1,
    precio_unitario: 0,
    total: 0
  });

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAppData();
        setClientes(data.clientes || []);
        setCatalogo(data.catalogo || []);
      } catch (error) {
        alert("Error al cargar los datos. Revisa la consola.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Manejador del buscador de clientes (Datalist)
  const handleClienteBuscador = (e) => {
    const valorEscrito = e.target.value;
    setBusquedaCliente(valorEscrito);

    // Buscar si lo que escribió coincide exactamente con el nombre de un cliente
    const clienteEncontrado = clientes.find(c => c.nombre === valorEscrito);
    
    if (clienteEncontrado) {
      setFormData(prev => ({ ...prev, id_cliente: clienteEncontrado.id_cliente }));
    } else {
      setFormData(prev => ({ ...prev, id_cliente: '' })); // Resetea si no hay coincidencia
    }
  };

  // Manejador de cambios en el formulario (Productos y Cantidad)
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    // Lógica de negocio: Autocompletar precio y calcular total al cambiar producto o cantidad
    if (name === 'id_producto') {
      const productoSeleccionado = catalogo.find(p => p.id_producto.toString() === value);
      const precio = productoSeleccionado ? parseFloat(productoSeleccionado.precio) : 0;
      newFormData.precio_unitario = precio;
      newFormData.total = precio * newFormData.cantidad;
    }

    if (name === 'cantidad') {
      const cantidad = parseInt(value) || 0;
      newFormData.total = newFormData.precio_unitario * cantidad;
    }

    setFormData(newFormData);
  };

  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_cliente) {
      alert("Por favor, seleccione un cliente válido de la lista.");
      return;
    }
    if (!formData.id_producto || formData.cantidad <= 0) {
      alert("Por favor completa todos los campos de producto y cantidad correctamente.");
      return;
    }

    setSaving(true);
    try {
      const ventaRecord = {
        id_venta: crypto.randomUUID(), // Genera un ID único para la transacción
        fecha: new Date().toISOString(),
        id_cliente: formData.id_cliente,
        id_producto: formData.id_producto,
        cantidad: formData.cantidad,
        precio_unitario: formData.precio_unitario,
        total: formData.total
      };

      await insertRecord('insertVenta', ventaRecord);
      
      alert("¡Venta registrada con éxito!");
      
      // Resetear formulario manteniendo el cliente seleccionado (buena UX para registrar múltiples ventas al mismo cliente)
      setFormData(prev => ({
        ...prev,
        id_producto: '',
        cantidad: 1,
        precio_unitario: 0,
        total: 0
      }));
    } catch (error) {
      alert("Error al guardar la venta.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Cargando sistema Agua Vital...</div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Registrar Nueva Venta</h2>
        <p>Seleccione el cliente y producto para registrar la transacción.</p>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Buscar Cliente (Escriba nombre o razón social)</label>
          <input 
            list="lista-clientes" 
            placeholder="Ej: Juan Pérez..."
            value={busquedaCliente}
            onChange={handleClienteBuscador}
            required
            autoComplete="off"
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #ced4da', fontFamily: 'inherit', transition: 'var(--transition-smooth)' }}
          />
          <datalist id="lista-clientes">
            {clientes.map(cliente => (
              <option key={cliente.id_cliente} value={cliente.nombre} />
            ))}
          </datalist>
          
          {busquedaCliente && !formData.id_cliente && (
            <small style={{ color: 'var(--danger)', marginTop: '0.5rem', display: 'block', fontWeight: '500' }}>
              Cliente no encontrado. Seleccione uno de la lista.
            </small>
          )}
          {formData.id_cliente && (
            <small style={{ color: 'var(--success)', marginTop: '0.5rem', display: 'block', fontWeight: '500' }}>
              ✓ Cliente vinculado correctamente
            </small>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Producto</label>
            <select 
              name="id_producto" 
              value={formData.id_producto} 
              onChange={handleChange} 
              required
            >
              <option value="">-- Seleccione Producto --</option>
              {catalogo.map(producto => (
                <option key={producto.id_producto} value={producto.id_producto}>
                  {producto.nombre} - {producto.tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Cantidad</label>
            <input 
              type="number" 
              name="cantidad" 
              min="1" 
              value={formData.cantidad} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        <div className="form-summary">
          <div className="summary-item">
            <span>Precio Unitario:</span>
            <strong>${formData.precio_unitario.toFixed(2)}</strong>
          </div>
          <div className="summary-item highlight">
            <span>Total a Cobrar:</span>
            <strong>${formData.total.toFixed(2)}</strong>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Registrando Venta...' : 'Confirmar Venta'}
        </button>
      </form>
    </div>
  );
}