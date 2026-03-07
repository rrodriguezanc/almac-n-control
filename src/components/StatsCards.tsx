import { Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Warehouse, Zap } from "lucide-react";

interface StatsCardsProps {
  totalProducts: number;
  totalInternal: number;
  totalElectrical: number;
  todayEntries: number;
  todayExits: number;
  lowStockCount: number;
}

export function StatsCards({ totalProducts, totalInternal, totalElectrical, todayEntries, todayExits, lowStockCount }: StatsCardsProps) {
  const cards = [
    {
      label: "Catálogo Gral",
      value: totalProducts,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Stock Instrumentación",
      value: totalInternal,
      icon: Warehouse,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Stock Eléctrico",
      value: totalElectrical,
      icon: Zap,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Entradas Hoy",
      value: todayEntries,
      icon: ArrowDownToLine,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Salidas Hoy",
      value: todayExits,
      icon: ArrowUpFromLine,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Alertas Stock",
      value: lowStockCount,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card rounded-xl border-2 border-muted/50 p-5 shadow-sm hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{card.label}</p>
              <p className="text-2xl font-black tabular-nums">{card.value}</p>
            </div>
            <div className={`${card.bg} ${card.color} p-2 rounded-lg group-hover:scale-110 transition-transform`}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
