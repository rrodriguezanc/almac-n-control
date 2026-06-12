import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Search, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import type { Product } from "../hooks/useInventory";

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  internalProducts: Product[];
  electricalProducts: Product[];
  onAdjustStock: (
    productId: string,
    newStock: number,
    warehouse: "instrumentacion" | "electrico"
  ) => Promise<boolean>;
}

export function AdjustStockModal({
  isOpen,
  onClose,
  internalProducts,
  electricalProducts,
  onAdjustStock,
}: AdjustStockModalProps) {
  const [warehouse, setWarehouse] = useState<"instrumentacion" | "electrico">("instrumentacion");
  const [searchTerm, setSearchTerm] = useState("");
  const [productId, setProductId] = useState("");
  const [newStock, setNewStock] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset fields when modal closes/opens
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setProductId("");
      setNewStock("");
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  const activeProducts = useMemo(() => {
    return warehouse === "instrumentacion" ? internalProducts : electricalProducts;
  }, [warehouse, internalProducts, electricalProducts]);

  const filteredItems = useMemo(() => {
    if (searchTerm.length < 2) return [];
    return activeProducts
      .filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 10);
  }, [searchTerm, activeProducts]);

  const selectedProduct = activeProducts.find((p) => p.id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!productId) {
      setError("Debes seleccionar un producto.");
      return;
    }

    const stockVal = parseInt(newStock);
    if (isNaN(stockVal) || stockVal < 0) {
      setError("El stock debe ser un número mayor o igual a 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await onAdjustStock(productId, stockVal, warehouse);
      if (result) {
        setSuccess("Stock ajustado correctamente.");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError("Error al actualizar el stock. Revisa tu conexión.");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 gap-5 shadow-2xl border-2 custom-scrollbar">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
            Corrección de Stock (Ajuste Directo)
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Esta acción actualizará los datos directamente en la base de datos y se mantendrá en registros de auditoría interna de la base de datos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Almacén selector */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Seleccionar Almacén</Label>
            <div className="flex p-1 bg-muted rounded-xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setWarehouse("instrumentacion");
                  setProductId("");
                  setSearchTerm("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${warehouse === "instrumentacion"
                  ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                  : "text-muted-foreground hover:bg-white/50"
                  }`}
              >
                Instrumentación
              </button>
              <button
                type="button"
                onClick={() => {
                  setWarehouse("electrico");
                  setProductId("");
                  setSearchTerm("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${warehouse === "electrico"
                  ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                  : "text-muted-foreground hover:bg-white/50"
                  }`}
              >
                Almacén Eléctrico
              </button>
            </div>
          </div>

          {/* Buscador de producto */}
          <div className="space-y-2 relative">
            <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Buscar Producto a Corregir</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={`Buscar por código SKU o nombre...`}
                className="pl-10 h-11 text-sm border-2 focus-visible:ring-amber-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!!productId}
              />
              {productId && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 text-xs font-bold"
                  onClick={() => {
                    setProductId("");
                    setSearchTerm("");
                    setNewStock("");
                  }}
                >
                  Cambiar Producto
                </Button>
              )}
            </div>

            {/* Dropdown de sugerencias */}
            {searchTerm && !productId && filteredItems.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 border-2 rounded-xl bg-white shadow-2xl max-h-60 overflow-y-auto z-50 divide-y">
                {filteredItems.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setProductId(p.id);
                      setSearchTerm(`${p.sku} - ${p.name}`);
                      setNewStock(String(p.stock));
                    }}
                    className="p-3 hover:bg-amber-50/50 cursor-pointer flex flex-col gap-1 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono">{p.sku}</span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Stock: {p.stock}</span>
                    </div>
                    <span className="text-xs text-foreground font-medium text-wrap">{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Datos del producto seleccionado */}
          {selectedProduct && (
            <div className="p-4 bg-amber-50/30 border-2 border-amber-500/20 rounded-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                      {selectedProduct.sku}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      Ubicación: {selectedProduct.location || "Sin ubicación"}
                    </span>
                  </div>
                  <p className="font-semibold text-sm text-foreground text-wrap leading-relaxed">
                    {selectedProduct.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center border-t border-amber-500/10 pt-4">
                <div className="sm:col-span-2 bg-white p-3 rounded-xl border flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">Stock en Sistema</span>
                  <span className="text-xl font-black text-slate-800">{selectedProduct.stock} <span className="text-xs font-medium text-muted-foreground">{selectedProduct.unit}</span></span>
                </div>

                <div className="flex justify-center sm:col-span-1">
                  <ArrowRight className="h-5 w-5 text-amber-500 rotate-90 sm:rotate-0" />
                </div>

                <div className="sm:col-span-2 space-y-1 bg-white p-3 rounded-xl border flex flex-col">
                  <Label htmlFor="newStockInput" className="text-[10px] uppercase font-black text-amber-600 block mb-0.5">Nuevo Stock Real</Label>
                  <Input
                    id="newStockInput"
                    type="number"
                    min="0"
                    placeholder="0"
                    className="h-10 text-base font-bold text-slate-900 border-2 focus-visible:ring-amber-500"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/50">
                <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Esta modificación creará un registro de auditoría interna en la base de datos.</span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive font-semibold bg-destructive/5 p-3 rounded-lg border border-destructive/20">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-success font-semibold bg-success/5 p-3 rounded-lg border border-success/20">
              {success}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="h-11">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedProduct || newStock === ""} className="h-11 font-bold px-6 bg-amber-600 hover:bg-amber-700 text-white">
              {isSubmitting ? "Guardando..." : "Confirmar Ajuste"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
