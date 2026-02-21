import type { Movement } from "../hooks/useInventory";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

interface MovementHistoryProps {
  movements: Movement[];
}

export function MovementHistory({ movements }: MovementHistoryProps) {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-card rounded-lg border animate-fade-in">
      <div className="p-5 border-b">
        <h2 className="text-lg font-semibold">Historial de Movimientos</h2>
        <p className="text-sm text-muted-foreground">Últimas entradas y salidas registradas</p>
      </div>
      <div className="divide-y">
        {movements.slice(0, 10).map((m) => (
          <div key={m.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
            <div
              className={`p-2 rounded-lg ${
                m.type === "entrada" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              }`}
            >
              {m.type === "entrada" ? (
                <ArrowDownToLine className="h-4 w-4" />
              ) : (
                <ArrowUpFromLine className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{m.productName}</p>
              <p className="text-xs text-muted-foreground truncate">{m.note}</p>
            </div>
            <div className="text-right shrink-0">
              <p
                className={`font-semibold text-sm tabular-nums ${
                  m.type === "entrada" ? "text-success" : "text-destructive"
                }`}
              >
                {m.type === "entrada" ? "+" : "-"}{m.quantity}
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(m.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
