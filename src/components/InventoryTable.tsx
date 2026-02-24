import type { Product } from "../hooks/useInventory";
import { AlertTriangle } from "lucide-react";

interface InventoryTableProps {
  products: Product[];
}

export function InventoryTable({ products }: InventoryTableProps) {
  return (
    <div className="bg-card rounded-lg border animate-fade-in">
      <div className="p-5 border-b">
        <h2 className="text-lg font-semibold">Inventario Actual</h2>
        <p className="text-sm text-muted-foreground">Estado del stock en tiempo real</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-semibold">SKU</th>
              <th className="text-left p-3 font-semibold">Producto</th>
              <th className="text-left p-3 font-semibold">Categoría</th>
              <th className="text-left p-3 font-semibold">Subcategoría</th>
              <th className="text-left p-3 font-semibold">Ubicación</th>
              <th className="text-right p-3 font-semibold">Stock</th>
              <th className="text-right p-3 font-semibold">Último Precio</th>
              <th className="text-center p-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isLow = p.stock <= (p.minStock || 0);
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                  <td className="p-3 font-medium">{p.name}</td>
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
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                        <AlertTriangle className="h-3 w-3" /> Bajo
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium bg-success/10 text-success px-2 py-1 rounded-full">
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
