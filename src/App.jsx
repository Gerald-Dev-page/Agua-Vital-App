// src/App.jsx
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Ventas from "./pages/Ventas";
import Productos from "./pages/Productos";
import Clientes from "./pages/Clientes";
// import Stock from "./pages/Stock";
import "./styles/global.css";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":  return <Dashboard />;
      case "ventas":     return <Ventas />;
      case "productos":  return <Productos />;
      case "clientes":   return <Clientes />;
      // case "stock":   return <Stock />;
      default:           return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 flex flex-col w-full md:ml-56">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

