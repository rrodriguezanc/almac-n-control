import { useState, useMemo } from "react";
import type { Product } from "../hooks/useInventory";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowDownToLine, ArrowUpFromLine, Search, CheckCircle2 } from "lucide-react";

interface MovementFormProps {
  products: Product[];
  internalProducts: Product[];
  onSubmit: (
    productId: string,
    type: "entrada" | "salida",
    quantity: number,
    note: string,
    responsible: string
  ) => Promise<boolean>;
}

export function MovementForm({ products, internalProducts, onSubmit }: MovementFormProps) {
  const [type, setType] = useState<"entrada" | "salida">("entrada");
  const [productId, setProductId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [responsible, setResponsible] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selector de lista de productos basado en el tipo de movimiento
  const activeProductsSource = type === "entrada" ? products : internalProducts;

  const filteredItems = useMemo(() => {
    if (searchTerm.length < 2) return [];
    return activeProductsSource
      .filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 10);
  }, [searchTerm, activeProductsSource]);

  const selectedProduct = activeProductsSource.find(p => p.id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!productId || !quantity || !responsible) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("La cantidad debe ser un número positivo.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await onSubmit(productId, type, qty, note, responsible);
      if (!result) {
        setError("Error al registrar el movimiento. Verifica el stock o la conexión.");
        return;
      }

      setSuccess(`${type === "entrada" ? "Entrada" : "Salida"} registrada correctamente.`);
      setProductId("");
      setSearchTerm("");
      setQuantity("");
      setNote("");
      setResponsible("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError("Error inesperado al procesar el movimiento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border-2 shadow-sm animate-fade-in overflow-hidden">
      <div className="p-6 border-b bg-muted/20">
        <h2 className="text-xl font-bold">Registrar Movimiento</h2>
        <p className="text-sm text-muted-foreground mt-1">Busca el código y selecciona la operación</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Type toggle */}
        <div className="flex p-1 bg-muted rounded-xl gap-1">
          <button
            type="button"
            onClick={() => { setType("entrada"); setProductId(""); setSearchTerm(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${type === "entrada"
              ? "bg-white text-success shadow-sm scale-[1.02]"
              : "text-muted-foreground hover:bg-white/50"
              }`}
          >
            <ArrowDownToLine className="h-4 w-4" /> Ingreso (Gral)
          </button>
          <button
            type="button"
            onClick={() => { setType("salida"); setProductId(""); setSearchTerm(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${type === "salida"
              ? "bg-white text-destructive shadow-sm scale-[1.02]"
              : "text-muted-foreground hover:bg-white/50"
              }`}
          >
            <ArrowUpFromLine className="h-4 w-4" /> Salida (Interno)
          </button>
        </div>

        {/* Search and Select */}
        <div className="space-y-3">
          <Label className="text-sm font-bold">Buscar Producto (Código o Nombre)</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar en ${type === "entrada" ? "Stock General" : "Stock Interno"}...`}
              className="pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!!productId}
            />
            {productId && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 text-xs underline"
                onClick={() => { setProductId(""); setSearchTerm(""); }}
              >
                Cambiar
              </Button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchTerm && !productId && filteredItems.length > 0 && (
            <div className="border border-t-0 rounded-b-lg -mt-3 bg-white shadow-lg overflow-hidden max-h-60 overflow-y-auto z-50">
              {filteredItems.map(p => (
                <div
                  key={p.id}
                  onClick={() => { setProductId(p.id); setSearchTerm(`${p.sku} - ${p.name}`); }}
                  className="p-3 hover:bg-primary/5 cursor-pointer border-b last:border-0 flex flex-col"
                >
                  <span className="font-bold text-sm">{p.sku}</span>
                  <span className="text-xs text-muted-foreground truncate">{p.name}</span>
                  <span className="text-[10px] font-bold text-primary">Stock act: {p.stock}</span>
                </div>
              ))}
            </div>
          )}

          {/* Selected Product Card */}
          {selectedProduct && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3 animate-in zoom-in-95">
              <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm truncate">{selectedProduct.sku} — {selectedProduct.name}</p>
                <p className="text-xs text-muted-foreground">Ubicación: {selectedProduct.location}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="font-bold text-xs uppercase tracking-wider">Cantidad *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="0"
              className="h-11"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsible" className="font-bold text-xs uppercase tracking-wider">Responsable *</Label>
            <Input
              id="responsible"
              placeholder="Nombre"
              className="h-11"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note" className="font-bold text-xs uppercase tracking-wider">Nota / Referencia</Label>
          <Input
            id="note"
            placeholder="Orden, destino, etc."
            className="h-11"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium bg-destructive/5 p-3 rounded-lg border border-destructive/20">{error}</p>
        )}
        {success && (
          <p className="text-sm text-success font-medium bg-success/5 p-3 rounded-lg border border-success/20">{success}</p>
        )}

        <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSubmitting || !productId}>
          {isSubmitting ? "Procesando..." : `Registrar ${type === "entrada" ? "Ingreso" : "Salida"}`}
        </Button>
      </form>
    </div>
  );
}
