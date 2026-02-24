import { useState, useEffect } from "react";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  subCategory?: string;
  stock: number;
  minStock: number;
  unit: string;
  location: string;
  lastPrice?: number;
  lastPurchaseDate?: string;
  status?: string;
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
  { id: "1", name: "Tornillos M8x30", sku: "TRN-001", category: "Ferretería", subCategory: "Tornillería", stock: 1500, minStock: 200, unit: "pzas", location: "A-01", lastPrice: 0.5, lastPurchaseDate: "2026-02-01" },
  { id: "2", name: "Aceite Hidráulico 20L", sku: "ACE-010", category: "Lubricantes", subCategory: "Aceites", stock: 45, minStock: 10, unit: "bidones", location: "B-03", lastPrice: 120, lastPurchaseDate: "2026-01-15" },
];

const initialMovements: Movement[] = [
  { id: "m1", productId: "1", productName: "Tornillos M8x30", type: "entrada", quantity: 500, date: "2026-02-21T08:30:00", note: "Orden de compra #1234", responsible: "Carlos M." },
];

export function useInventory() {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("inventory_products");
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [movements, setMovements] = useState<Movement[]>(() => {
    const saved = localStorage.getItem("inventory_movements");
    return saved ? JSON.parse(saved) : initialMovements;
  });

  useEffect(() => {
    localStorage.setItem("inventory_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("inventory_movements", JSON.stringify(movements));
  }, [movements]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

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

  const importProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    setMovements([]); // Reset movements when importing a new base
    localStorage.setItem("inventory_products", JSON.stringify(newProducts));
    localStorage.setItem("inventory_movements", JSON.stringify([]));
  };

  const today = new Date().toISOString().split('T')[0];
  const todayEntries = movements.filter(
    (m) => m.type === "entrada" && m.date.startsWith(today)
  ).length;

  const todayExits = movements.filter(
    (m) => m.type === "salida" && m.date.startsWith(today)
  ).length;

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return {
    products,
    movements,
    addMovement,
    addProduct,
    importProducts,
    stats: {
      totalProducts: products.length,
      todayEntries,
      todayExits,
      lowStockCount,
    },
  };
}

