import { useState, useEffect } from "react";
import type { Product } from "../hooks/useInventory";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface InventoryTableProps {
  products: Product[];
}

export function InventoryTable({ products }: InventoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Reset page to 1 when products list changes (e.g. on search)
  useEffect(() => {
    setCurrentPage(1);
  }, [products]);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div className="bg-card rounded-lg border animate-fade-in shadow-sm overflow-hidden">
      <div className="p-5 border-b flex items-center justify-between bg-card/50">
        <div>
          <h2 className="text-lg font-semibold">Inventario Actual</h2>
          <p className="text-sm text-muted-foreground">Estado del stock en tiempo real ({products.length} productos)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground font-medium">
            Página {currentPage} de {totalPages}
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
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-semibold">SKU</th>
              <th className="text-left p-3 font-semibold">Producto</th>
              <th className="text-left p-3 font-semibold">Categoría</th>
              <th className="text-left p-3 font-semibold">Subcategoría</th>
              <th className="text-left p-3 font-semibold">Ubicación</th>
              <th className="text-right p-3 font-semibold">Stock</th>
              <th className="text-right p-3 font-semibold">Precio</th>
              <th className="text-center p-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.map((p) => {
              const isLow = p.stock <= (p.minStock || 0);
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono text-xs text-muted-foreground truncate max-w-[120px]" title={p.sku}>{p.sku}</td>
                  <td className="p-3 font-medium truncate max-w-[200px]" title={p.name}>{p.name}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{p.category}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{p.subCategory}</td>
                  <td className="p-3 font-mono text-xs">{p.location}</td>
                  <td className="p-3 text-right font-semibold tabular-nums">
                    {p.stock} <span className="text-muted-foreground font-normal">{p.unit}</span>
                  </td>
                  <td className="p-3 text-right text-muted-foreground tabular-nums">
                    {p.lastPrice ? `$${p.lastPrice.toLocaleString()}` : "-"}
                  </td>
                  <td className="p-3 text-center">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                        <AlertTriangle className="h-3 w-3" /> Bajo
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium bg-success/10 text-success px-2 py-0.5 rounded-full">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
