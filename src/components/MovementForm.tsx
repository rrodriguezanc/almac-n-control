import { useState } from "react";
import type { Product } from "../hooks/useInventory";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

interface MovementFormProps {
  products: Product[];
  onSubmit: (
    productId: string,
    type: "entrada" | "salida",
    quantity: number,
    note: string,
    responsible: string
  ) => Promise<boolean>;
}

export function MovementForm({ products, onSubmit }: MovementFormProps) {
  const [type, setType] = useState<"entrada" | "salida">("entrada");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [responsible, setResponsible] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="bg-card rounded-lg border animate-fade-in">
      <div className="p-5 border-b">
        <h2 className="text-lg font-semibold">Registrar Movimiento</h2>
        <p className="text-sm text-muted-foreground">Ingresa una nueva entrada o salida de material</p>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Type toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("entrada")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${type === "entrada"
              ? "bg-success text-success-foreground shadow-md"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
          >
            <ArrowDownToLine className="h-4 w-4" /> Entrada
          </button>
          <button
            type="button"
            onClick={() => setType("salida")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${type === "salida"
              ? "bg-destructive text-destructive-foreground shadow-md"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
          >
            <ArrowUpFromLine className="h-4 w-4" /> Salida
          </button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product">Producto *</Label>
          <select
            id="product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Seleccionar producto...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} — {p.name} (Stock: {p.stock})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsible">Responsable *</Label>
            <Input
              id="responsible"
              placeholder="Nombre"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Nota / Referencia</Label>
          <Input
            id="note"
            placeholder="Orden de compra, destino, etc."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
        )}
        {success && (
          <p className="text-sm text-success bg-success/10 p-3 rounded-lg">{success}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Registrando..." : `Registrar ${type === "entrada" ? "Entrada" : "Salida"}`}
        </Button>
      </form>
    </div>
  );
}
