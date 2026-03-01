import { useState } from "react";
import { useInventory } from "../hooks/useInventory";
import { StatsCards } from "../components/StatsCards";
import { InventoryTable } from "../components/InventoryTable";
import { MovementForm } from "../components/MovementForm";
import { MovementHistory } from "../components/MovementHistory";
import { ImportExcel } from "../components/ImportExcel";
import { Warehouse, LayoutDashboard, Package, ArrowLeftRight, History } from "lucide-react";

type Tab = "dashboard" | "inventario" | "movimiento" | "historial";

const Index = () => {
  const { products, movements, addMovement, addProduct, importProducts, stats, loading } = useInventory();
  const [tab, setTab] = useState<Tab>("dashboard");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventario", label: "Inventario", icon: Package },
    { id: "movimiento", label: "Registrar", icon: ArrowLeftRight },
    { id: "historial", label: "Historial", icon: History },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg overflow-hidden flex items-center justify-center">
            <img src="/shouxin.jpeg" alt="Logotipo Shouxin" className="h-12 w-12 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Control de Almacén</h1>
            <p className="text-sm opacity-80">Sistema de gestión de inventario interno</p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Package className="h-12 w-12 text-muted-foreground mb-4 animate-bounce" />
            <p className="text-lg text-muted-foreground">Cargando inventario desde Supabase...</p>
          </div>
        ) : (
          <>
            {tab === "dashboard" && (
              <>
                <StatsCards {...stats} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MovementHistory movements={movements} />
                  <InventoryTable products={products} />
                </div>
              </>
            )}

            {
              tab === "inventario" && (
                <div className="space-y-6">
                  <ImportExcel onImport={importProducts} />
                  <InventoryTable products={products} />
                </div>
              )
            }

            {
              tab === "movimiento" && (
                <div className="max-w-lg mx-auto">
                  <MovementForm products={products} onSubmit={addMovement} />
                </div>
              )
            }

            {tab === "historial" && <MovementHistory movements={movements} />}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
