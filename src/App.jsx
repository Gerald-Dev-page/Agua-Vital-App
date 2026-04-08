// src/App.jsx
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Ventas from "./pages/Ventas";
import Productos from "./pages/Productos";
import Clientes from "./pages/Clientes";
import "./styles/global.css";

function App() {
  // Inicializamos la app directamente en el Dashboard
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "ventas":
        return <Ventas />;
      case "productos":
        return <Productos />;
      case "clientes":
        return <Clientes />;
      case "stock":
        return (
          <div className="page-container">
            <header className="page-header">
              <h2>Módulo de Stock</h2>
              <p className="text-muted">
                Próximamente: Gestión de envases e inventario en tiempo real.
              </p>
            </header>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="page-container">{renderPage()}</main>
    </div>
  );
}

export default App;
