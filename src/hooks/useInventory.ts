import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from Supabase
  const fetchProducts = async () => {
    try {
      setLoading(true);
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .range(from, from + pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += pageSize;
          // Si recibimos menos del tamaño de página, es que ya no hay más
          if (data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }

        // Límite de seguridad para evitar bucles infinitos
        if (from > 50000) break;
      }

      const mappedProducts: Product[] = allData.map((p: any) => ({
        id: String(p.id),
        sku: String(p.numero_articulo || ""),
        name: String(p.descripcion_articulo || "Sin nombre"),
        stock: Number(p.en_stock || 0),
        minStock: Number(p.min_stock || 0),
        unit: String(p.unidad_medida || "pzas"),
        category: String(p.clase_descripcion || "General"),
        subCategory: String(p.sub_clase_descripcion || ""),
        location: String(p.ubicacion || "N/A"),
        lastPrice: Number(p.ultimo_precio_compra || p.ultimo_precio_determinado || 0),
        lastPurchaseDate: String(p.ultima_fecha_compra || ""),
        status: p.inactivo ? "Inactivo" : "Activo"
      }));
      setProducts(mappedProducts);
    } catch (e) {
      console.error("Error al cargar productos de Supabase:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // For now we still use localStorage for movements since they are simpler, 
    // or you can also move them to a 'movimientos' table later
    const savedMovements = localStorage.getItem("inventory_movements");
    if (savedMovements) setMovements(JSON.parse(savedMovements));
  }, []);

  const addMovement = async (
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

    // Update stock in Supabase
    try {
      const { error } = await supabase
        .from('productos')
        .update({ en_stock: newStock })
        .eq('id', productId);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
      );

      const movement: Movement = {
        id: Math.random().toString(36).substr(2, 9),
        productId,
        productName: product.name,
        type,
        quantity,
        date: new Date().toISOString(),
        note,
        responsible,
      };

      const updatedMovements = [movement, ...movements];
      setMovements(updatedMovements);
      localStorage.setItem("inventory_movements", JSON.stringify(updatedMovements));
      return true;
    } catch (e) {
      console.error("Error al actualizar stock:", e);
      return false;
    }
  };

  const addProduct = async (product: Omit<Product, "id">) => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .insert([{
          numero_articulo: product.sku,
          descripcion_articulo: product.name,
          clase_descripcion: product.category,
          sub_clase_descripcion: product.subCategory,
          en_stock: product.stock,
          unidad_medida: product.unit,
          ubicacion: product.location,
          ultimo_precio_compra: product.lastPrice,
          ultima_fecha_compra: product.lastPurchaseDate,
          inactivo: product.status === "Inactivo"
        }])
        .select();

      if (error) throw error;
      fetchProducts(); // Refresh list
    } catch (e) {
      console.error("Error al añadir producto:", e);
    }
  };

  const importProducts = async (newProducts: Product[]) => {
    try {
      setLoading(true);
      // Delete existing products if you want a full replacement, 
      // or use upsert if you want to update existing products

      const toInsert = newProducts.map(p => ({
        numero_articulo: p.sku,
        descripcion_articulo: p.name,
        clase_descripcion: p.category,
        sub_clase_descripcion: p.subCategory,
        en_stock: p.stock,
        unidad_medida: p.unit,
        ubicacion: p.location,
        ultimo_precio_compra: p.lastPrice,
        ultima_fecha_compra: p.lastPurchaseDate,
        inactivo: p.status === "Inactivo"
      }));

      // NOTE: For safety, let's keep it simple. You might need to adjust based on table constraints.
      const { error } = await supabase
        .from('productos')
        .upsert(toInsert, { onConflict: 'numero_articulo' });

      if (error) throw error;

      fetchProducts();
      return true;
    } catch (e) {
      console.error("Error al importar a Supabase:", e);
      return false;
    }
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
    loading,
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


