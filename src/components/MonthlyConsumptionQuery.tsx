import { useState, useMemo } from "react";
import type { Product, Movement } from "../hooks/useInventory";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Search, Download, Calendar, BarChart3, Info } from "lucide-react";
import { exportMonthlyConsumptionToExcel } from "../lib/utils";

interface MonthlyConsumptionQueryProps {
  products: Product[];
  internalProducts: Product[];
  electricalProducts: Product[];
  movements: Movement[];
}

export function MonthlyConsumptionQuery({
  products,
  internalProducts,
  electricalProducts,
  movements,
}: MonthlyConsumptionQueryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  const allProducts = useMemo(() => {
    const seen = new Set<string>();
    const list: Product[] = [];
    [...internalProducts, ...electricalProducts, ...products].forEach((p) => {
      if (p.sku && !seen.has(p.sku)) {
        seen.add(p.sku);
        list.push(p);
      }
    });
    return list;
  }, [products, internalProducts, electricalProducts]);

  const suggestions = useMemo(() => {
    if (searchTerm.length < 2) return [];
    return allProducts
      .filter((p) =>
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 10);
  }, [searchTerm, allProducts]);

  const selectedProduct = allProducts.find((p) => p.id === selectedProductId);

  const consumptionData = useMemo(() => {
    if (!selectedProduct) return [];

    const productMovements = movements.filter(
      (m) => m.productSku === selectedProduct.sku && m.type === "salida"
    );

    const groups: { [key: string]: { quantity: number; count: number } } = {};

    productMovements.forEach((m) => {
      const d = new Date(m.date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;

      if (!groups[key]) {
        groups[key] = { quantity: 0, count: 0 };
      }
      groups[key].quantity += m.quantity;
      groups[key].count += 1;
    });

    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const [year, monthStr] = key.split("-");
        const monthIdx = parseInt(monthStr) - 1;
        return {
          yearMonth: key,
          monthLabel: `${monthNames[monthIdx]} ${year}`,
          quantity: groups[key].quantity,
          count: groups[key].count,
        };
      });
  }, [selectedProduct, movements]);

  const maxQuantity = useMemo(() => {
    if (consumptionData.length === 0) return 0;
    return Math.max(...consumptionData.map((d) => d.quantity));
  }, [consumptionData]);

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
        <div className="space-y-2">
          <Label htmlFor="skuSearch" className="font-bold text-sm">
            Ingresa código artículo o Nombre del Producto
          </Label>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="skuSearch"
              placeholder="Ej: SKU-1234 o Rodamiento..."
              className="pl-10 h-11 border-2 focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!!selectedProductId}
            />
            {selectedProductId && (
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 font-bold"
                onClick={() => {
                  setSelectedProductId("");
                  setSearchTerm("");
                }}
              >
                Cambiar Producto
              </Button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {searchTerm && !selectedProductId && suggestions.length > 0 && (
            <div className="border border-t-0 rounded-b-xl -mt-1 bg-white shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-50 divide-y max-w-xl">
              {suggestions.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProductId(p.id);
                    setSearchTerm(`${p.sku} - ${p.name}`);
                  }}
                  className="p-3 hover:bg-primary/5 cursor-pointer flex flex-col gap-1 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono">
                      {p.sku}
                    </span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      Stock: {p.stock}
                    </span>
                  </div>
                  <span className="text-xs text-foreground font-semibold truncate">
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Product Data */}
      {selectedProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Product details sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground bg-muted w-fit px-2.5 py-1 rounded">
                Detalles del Producto
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground block">Código artículo</span>
                  <span className="text-sm font-mono font-bold bg-muted px-2 py-1 rounded border inline-block mt-1">
                    {selectedProduct.sku}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Nombre / Descripción</span>
                  <span className="text-sm font-bold text-slate-800 text-wrap leading-relaxed block mt-1 font-sans">
                    {selectedProduct.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <span className="text-xs text-muted-foreground block">Categoría</span>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded mt-1 inline-block">
                      {selectedProduct.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Stock Actual</span>
                    <span className="text-sm font-black text-slate-800 block mt-1">
                      {selectedProduct.stock} {selectedProduct.unit}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Consumption History Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg">Consumo Mensual Acumulado</h3>
                </div>
                {consumptionData.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 font-bold"
                    onClick={() =>
                      exportMonthlyConsumptionToExcel(
                        selectedProduct.name,
                        selectedProduct.sku,
                        consumptionData
                      )
                    }
                  >
                    <Download className="h-4 w-4" /> Excel de Consumo
                  </Button>
                )}
              </div>

              {consumptionData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                      <tr>
                        <th className="px-5 py-3.5 font-bold">Mes / Año</th>
                        <th className="px-5 py-3.5 font-bold">Cant. Consumida</th>
                        <th className="px-5 py-3.5 font-bold text-center">Salidas (Nº)</th>
                        <th className="px-5 py-3.5 font-bold">Intensidad de Consumo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {consumptionData.map((row) => {
                        const pct = maxQuantity > 0 ? (row.quantity / maxQuantity) * 100 : 0;
                        return (
                          <tr key={row.yearMonth} className="hover:bg-muted/10 transition-colors">
                            <td className="px-5 py-4 font-semibold text-slate-700">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {row.monthLabel}
                              </div>
                            </td>
                            <td className="px-5 py-4 font-bold text-slate-800 tabular-nums">
                              {row.quantity} {selectedProduct.unit}
                            </td>
                            <td className="px-5 py-4 text-center font-medium text-slate-600 tabular-nums">
                              {row.count}
                            </td>
                            <td className="px-5 py-4 w-1/3">
                              <div className="flex items-center gap-3">
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border">
                                  <div
                                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground w-8 shrink-0">
                                  {Math.round(pct)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10 text-center space-y-3">
                  <div className="bg-primary/5 text-primary p-4 rounded-full w-fit mx-auto">
                    <Info className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-muted-foreground">
                      No se registra consumo (salidas)
                    </p>
                    <p className="text-xs text-muted-foreground/80 mt-1">
                      No se han registrado salidas para este producto en el historial de movimientos.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
