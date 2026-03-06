import { Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Warehouse } from "lucide-react";

interface StatsCardsProps {
  totalProducts: number;
  totalInternal: number;
  todayEntries: number;
  todayExits: number;
  lowStockCount: number;
}

export function StatsCards({ totalProducts, totalInternal, todayEntries, todayExits, lowStockCount }: StatsCardsProps) {
  const cards = [
    {
      label: "Stock General",
      value: totalProducts,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Stock Interno",
      value: totalInternal,
      icon: Warehouse,
      color: "text-purple-600",
      bg: "bg-purple-50",
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card rounded-xl border-2 border-muted/50 p-5 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-tight text-muted-foreground">{card.label}</p>
              <p className="text-3xl font-black mt-1 tabular-nums">{card.value}</p>
            </div>
            <div className={`${card.bg} ${card.color} p-2.5 rounded-xl`}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
