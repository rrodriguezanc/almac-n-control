import { useState } from "react";


export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  location: string;
}

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: "entrada" | "salida";
  quantity: number;
  date: string;
  note: string;
  responsible: string;
}

const initialProducts: Product[] = [
  { id: "1", name: "Tornillos M8x30", sku: "TRN-001", category: "Ferretería", stock: 1500, minStock: 200, unit: "pzas", location: "A-01" },
  { id: "2", name: "Aceite Hidráulico 20L", sku: "ACE-010", category: "Lubricantes", stock: 45, minStock: 10, unit: "bidones", location: "B-03" },
  { id: "3", name: "Guantes de Nitrilo (Caja)", sku: "SEG-005", category: "Seguridad", stock: 8, minStock: 15, unit: "cajas", location: "C-02" },
  { id: "4", name: "Cinta Aislante Negra", sku: "ELE-020", category: "Eléctrico", stock: 120, minStock: 30, unit: "rollos", location: "A-05" },
  { id: "5", name: "Rodamiento 6205", sku: "MEC-015", category: "Mecánico", stock: 25, minStock: 10, unit: "pzas", location: "D-01" },
  { id: "6", name: "Filtro de Aire Industrial", sku: "FIL-003", category: "Filtros", stock: 5, minStock: 8, unit: "pzas", location: "B-07" },
];

const initialMovements: Movement[] = [
  { id: "m1", productId: "1", productName: "Tornillos M8x30", type: "entrada", quantity: 500, date: "2026-02-21T08:30:00", note: "Orden de compra #1234", responsible: "Carlos M." },
  { id: "m2", productId: "3", productName: "Guantes de Nitrilo (Caja)", type: "salida", quantity: 5, date: "2026-02-21T09:15:00", note: "Línea de producción 2", responsible: "Ana R." },
  { id: "m3", productId: "2", productName: "Aceite Hidráulico 20L", type: "entrada", quantity: 20, date: "2026-02-20T14:00:00", note: "Proveedor Lubritec", responsible: "Carlos M." },
  { id: "m4", productId: "4", productName: "Cinta Aislante Negra", type: "salida", quantity: 10, date: "2026-02-20T10:45:00", note: "Mantenimiento eléctrico", responsible: "Luis G." },
  { id: "m5", productId: "6", productName: "Filtro de Aire Industrial", type: "salida", quantity: 3, date: "2026-02-19T16:20:00", note: "Equipo compresor #7", responsible: "Ana R." },
];

let idCounter = 100;
function generateId() {
  return `gen-${++idCounter}`;
}

export function useInventory() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [movements, setMovements] = useState<Movement[]>(initialMovements);

  const addMovement = (
    productId: string,
    type: "entrada" | "salida",
    quantity: number,
    note: string,
    responsible: string
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return false;
    if (type === "salida" && product.stock < quantity) return false;

    const newStock = type === "entrada" ? product.stock + quantity : product.stock - quantity;

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );

    const movement: Movement = {
      id: generateId(),
      productId,
      productName: product.name,
      type,
      quantity,
      date: new Date().toISOString(),
      note,
      responsible,
    };

    setMovements((prev) => [movement, ...prev]);
    return true;
  };

  const addProduct = (product: Omit<Product, "id">) => {
    setProducts((prev) => [...prev, { ...product, id: generateId() }]);
  };

  const todayEntries = movements.filter(
    (m) => m.type === "entrada" && m.date.startsWith("2026-02-21")
  ).length;

  const todayExits = movements.filter(
    (m) => m.type === "salida" && m.date.startsWith("2026-02-21")
  ).length;

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return {
    products,
    movements,
    addMovement,
    addProduct,
    stats: {
      totalProducts: products.length,
      todayEntries,
      todayExits,
      lowStockCount,
    },
  };
}
