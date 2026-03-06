import { useState } from "react";
import { useInventory } from "../hooks/useInventory";
import { StatsCards } from "../components/StatsCards";
import { InventoryTable } from "../components/InventoryTable";
import { MovementForm } from "../components/MovementForm";
import { MovementHistory } from "../components/MovementHistory";
import { Warehouse, LayoutDashboard, Package, ArrowLeftRight, History, Search } from "lucide-react";
import { Input } from "../components/ui/input";

type Tab = "dashboard" | "inventario" | "interno" | "movimiento" | "historial";

const Index = () => {
  const { products, internalProducts, movements, addMovement, stats, loading } = useInventory();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGeneral = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInternal = internalProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventario", label: "Almacén General", icon: Package },
    { id: "interno", label: "Almacén Interno", icon: Warehouse },
    { id: "movimiento", label: "Registrar", icon: ArrowLeftRight },
    { id: "historial", label: "Historial", icon: History },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
            <img src="/shouxin.jpeg" alt="Logotipo Shouxin" className="h-12 w-12 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Control de Almacén</h1>
            <p className="text-sm opacity-80 font-medium">Shouxin Industrial Monitoring</p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setSearchTerm("");
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${tab === t.id
                  ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
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
          <div className="flex flex-col items-center justify-center py-32 animate-in fade-in zoom-in duration-500">
            <Package className="h-16 w-16 text-primary/40 mb-4 animate-bounce" />
            <p className="text-lg font-medium text-muted-foreground">Sincronizando con Supabase...</p>
          </div>
        ) : (
          <>
            {tab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StatsCards {...stats} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-md font-bold uppercase tracking-wider text-muted-foreground">Últimos Movimientos</h3>
                    <MovementHistory movements={movements} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-md font-bold uppercase tracking-wider text-muted-foreground">Estado Crítico Interno</h3>
                    <InventoryTable products={internalProducts.filter(p => p.stock <= p.minStock).slice(0, 10)} />
                  </div>
                </div>
              </div>
            )}

            {
              tab === "inventario" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold tracking-tight">Inventario General</h2>
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar en almacén general..."
                        className="pl-10 h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <InventoryTable products={filteredGeneral} />
                </div>
              )
            }

            {
              tab === "interno" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold tracking-tight">Almacén Interno (Producción)</h2>
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar en almacén interno..."
                        className="pl-10 h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <InventoryTable products={filteredInternal} />
                </div>
              )
            }

            {
              tab === "movimiento" && (
                <div className="max-w-lg mx-auto animate-in zoom-in-95 duration-300">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold tracking-tight">Registrar Movimiento</h2>
                    <p className="text-muted-foreground">Las entradas y salidas afectan al Almacén Interno</p>
                  </div>
                  <MovementForm products={internalProducts} onSubmit={addMovement} />
                </div>
              )
            }

            {tab === "historial" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold tracking-tight">Historial de Operaciones</h2>
                <MovementHistory movements={movements} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
