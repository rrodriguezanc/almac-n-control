import { useState, useEffect } from "react";
import type { Movement } from "../hooks/useInventory";
import { ArrowDownToLine, ArrowUpFromLine, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface MovementHistoryProps {
  movements: Movement[];
  limit?: number;
}

export function MovementHistory({ movements, limit }: MovementHistoryProps) {
  const getDisplayMovements = () => {
    return limit ? movements.slice(0, limit) : movements;
  };

  const rawMovements = getDisplayMovements();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Ajusta este número según prefieras

  useEffect(() => {
    setCurrentPage(1);
  }, [movements]);

  const totalPages = Math.ceil(rawMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  // Solo paginamos si no estamos en modo "limitado" (dashboard mini widget)
  const displayMovements = limit ? rawMovements : rawMovements.slice(startIndex, startIndex + itemsPerPage);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-card rounded-lg border animate-fade-in">
      <div className="p-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Historial de Movimientos</h2>
          <p className="text-sm text-muted-foreground">
            {limit ? "Últimas entradas y salidas registradas" : "Registro completo de operaciones"}
          </p>
        </div>
        
        {!limit && rawMovements.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground font-medium">
              Página {currentPage} de {totalPages || 1}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="divide-y overflow-y-auto max-h-[calc(100vh-250px)]">
        {displayMovements.length > 0 ? (
          displayMovements.map((m) => (
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
          ))
        ) : (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-bold text-muted-foreground">No se encontraron movimientos.</p>
            <p className="text-xs text-muted-foreground/60">Registra una entrada o salida para ver el historial.</p>
          </div>
        )}
      </div>
    </div>
  );
}
