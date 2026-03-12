import { useState } from "react";
import { useInventory } from "../hooks/useInventory";
import { StatsCards } from "../components/StatsCards";
import { InventoryTable } from "../components/InventoryTable";
import { MovementForm } from "../components/MovementForm";
import { MovementHistory } from "../components/MovementHistory";
import { LoginModal } from "../components/LoginModal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Warehouse,
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  History as HistoryIcon,
  Search,
  LogOut,
  Key,
  UserCheck,
  Download
} from "lucide-react";
import { exportToExcel } from "../lib/utils";

type Tab = "dashboard" | "inventario" | "interno" | "electrico" | "movimiento" | "historial" | "login";

const Index = () => {
  const { products, internalProducts, electricalProducts, movements, addMovement, stats, loading, isAdmin, signOut, user } = useInventory();
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

  const filteredElectrical = electricalProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: React.ElementType; hidden?: boolean }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventario", label: "Catálogo Gral", icon: Package },
    { id: "interno", label: "Instrumentación", icon: Warehouse },
    { id: "electrico", label: "Eléctrico", icon: Warehouse },
    { id: "movimiento", label: "Registrar", icon: ArrowLeftRight, hidden: !isAdmin },
    { id: "historial", label: "Historial", icon: HistoryIcon },
    { id: "login", label: isAdmin ? "Admin" : "Login", icon: isAdmin ? UserCheck : Key },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
            <img src="/shouxin.jpeg" alt="Logotipo Shouxin" className="h-12 w-12 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Control de Almacén</h1>
            <p className="text-sm opacity-80 font-medium tracking-wide">Industrial Monitoring System</p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-card border-b sticky top-0 z-20 shadow-sm backdrop-blur-md bg-card/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((t) => !t.hidden && (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setSearchTerm("");
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${tab === t.id
                  ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground active:scale-95"
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
            <div className="relative">
              <Package className="h-16 w-16 text-primary/40 mb-4 animate-bounce" />
              <div className="absolute inset-0 h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
            <p className="text-lg font-bold text-muted-foreground mt-4">Sincronizando con Supabase...</p>
          </div>
        ) : (
          <>
            {tab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StatsCards {...stats} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground bg-muted w-fit px-2 py-1 rounded">Últimos Movimientos</h3>
                    <MovementHistory movements={movements} limit={10} />
                  </div>
                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-rose-600 bg-rose-50 w-fit px-2 py-1 rounded">Crítico Instrumentación</h3>
                    <InventoryTable products={internalProducts.filter(p => p.stock <= p.minStock).slice(0, 10)} />
                  </div>
                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded">Crítico Eléctrico</h3>
                    <InventoryTable products={electricalProducts.filter(p => p.stock <= p.minStock).slice(0, 10)} />
                  </div>
                </div>
              </div>
            )}

            {
              tab === "inventario" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold tracking-tight">Catálogo General</h2>
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar en catálogo general..."
                        className="pl-10 h-11 border-2 focus-visible:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <InventoryTable products={filteredGeneral} variant="general" />
                </div>
              )
            }

            {
              tab === "interno" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold tracking-tight">Almacén de Instrumentación</h2>
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 font-bold"
                        onClick={() => exportToExcel(filteredInternal, "Stock_Instrumentacion")}
                      >
                        <Download className="h-4 w-4" /> Descargar Excel
                      </Button>
                      <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar en almacén instrumentación..."
                          className="pl-10 h-11 border-2 focus-visible:ring-primary"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <InventoryTable products={filteredInternal} />
                </div>
              )
            }

            {
              tab === "electrico" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold tracking-tight">Almacén Eléctrico</h2>
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 font-bold"
                        onClick={() => exportToExcel(filteredElectrical, "Stock_Electrico")}
                      >
                        <Download className="h-4 w-4" /> Descargar Excel
                      </Button>
                      <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar en almacén eléctrico..."
                          className="pl-10 h-11 border-2 focus-visible:ring-primary"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <InventoryTable products={filteredElectrical} />
                </div>
              )
            }

            {tab === "movimiento" && isAdmin && (
              <div className="max-w-lg mx-auto animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8 bg-muted/30 p-4 rounded-xl">
                  <h2 className="text-2xl font-bold tracking-tight">Registro de Operaciones</h2>
                  <p className="text-muted-foreground font-medium">Gestiona traslados y repartos internos</p>
                </div>
                <MovementForm
                  products={products}
                  internalProducts={internalProducts}
                  electricalProducts={electricalProducts}
                  onSubmit={addMovement}
                />
              </div>
            )
            }

            {tab === "login" && (
              <div className="max-w-md mx-auto">
                {isAdmin ? (
                  <div className="bg-card border-2 p-8 rounded-2xl text-center space-y-6 mt-12 shadow-sm animate-in fade-in zoom-in duration-300">
                    <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full w-fit mx-auto">
                      <UserCheck className="h-10 w-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">Sesión Iniciada</h2>
                      <p className="text-muted-foreground font-medium mt-1">Conectado como {user?.email}</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg text-left">
                      <p className="text-xs font-black uppercase text-muted-foreground mb-2">Permisos Activos</p>
                      <ul className="text-sm space-y-1 font-bold">
                        <li className="flex items-center gap-2 text-emerald-600"><div className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Registrar Entradas</li>
                        <li className="flex items-center gap-2 text-emerald-600"><div className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Registrar Salidas</li>
                        <li className="flex items-center gap-2 text-emerald-600"><div className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Gestionar Stock</li>
                      </ul>
                    </div>
                    <Button variant="destructive" className="w-full h-12 font-bold text-lg" onClick={() => { signOut(); setTab("dashboard"); }}>
                      <LogOut className="mr-2 h-5 w-5" /> Cerrar Sesión
                    </Button>
                  </div>
                ) : (
                  <LoginModal />
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
