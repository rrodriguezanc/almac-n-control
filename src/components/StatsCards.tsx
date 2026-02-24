import { Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from "lucide-react";

interface StatsCardsProps {
  totalProducts: number;
  todayEntries: number;
  todayExits: number;
  lowStockCount: number;
}

export function StatsCards({ totalProducts, todayEntries, todayExits, lowStockCount }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Productos",
      value: totalProducts,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Entradas Hoy",
      value: todayEntries,
      icon: ArrowDownToLine,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Salidas Hoy",
      value: todayExits,
      icon: ArrowUpFromLine,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Stock Bajo",
      value: lowStockCount,
      icon: AlertTriangle,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card rounded-lg border p-5 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
              <p className="text-3xl font-bold mt-1">{card.value}</p>
            </div>
            <div className={`${card.bg} ${card.color} p-3 rounded-lg`}>
              <card.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
