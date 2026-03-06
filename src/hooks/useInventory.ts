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
  const [internalProducts, setInternalProducts] = useState<Product[]>([]);
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

  const fetchInternalProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos_internos')
        .select('*');

      if (error) throw error;
      if (data) {
        const mapped = data.map((p: any) => ({
          id: String(p.id),
          sku: String(p.numero_articulo || ""),
          name: String(p.descripcion || "Sin nombre"),
          stock: Number(p.stock_actual !== undefined ? p.stock_actual : p.en_stock || 0),
          minStock: 0,
          unit: String(p.unidad_medida || "pzas"),
          category: "Interno",
          location: String(p.zona || "N/A"),
          status: "Activo"
        }));
        setInternalProducts(mapped);
      }
    } catch (e) {
      console.error("Error productos internos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchProducts(), fetchInternalProducts()]);
    };
    init();

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
    // 1. Find product in internal or general depending on type
    let product = internalProducts.find((p) => p.id === productId);
    let isFromGeneral = false;

    if (!product && type === "entrada") {
      product = products.find((p) => p.id === productId);
      isFromGeneral = true;
    }

    if (!product) return false;
    if (type === "salida" && product.stock < quantity) return false;

    const currentStock = isFromGeneral ? 0 : product.stock;
    const newStock = type === "entrada" ? currentStock + quantity : currentStock - quantity;

    try {
      if (isFromGeneral) {
        // Create in internal if it doesn't exist
        const { error } = await supabase
          .from('productos_internos')
          .insert([{
            numero_articulo: product.sku,
            descripcion: product.name,
            stock_actual: newStock,
            unidad_medida: product.unit,
            zona: product.location
          }]);
        if (error) throw error;
        await fetchInternalProducts();
      } else {
        // Update existing internal
        const { error } = await supabase
          .from('productos_internos')
          .update({ stock_actual: newStock })
          .eq('id', product.id);
        if (error) throw error;
        setInternalProducts(prev =>
          prev.map(p => p.id === productId ? { ...p, stock: newStock } : p)
        );
      }

      const m: Movement = {
        id: Math.random().toString(36).substr(2, 9),
        productId,
        productName: product.name,
        type,
        quantity,
        date: new Date().toISOString(),
        note,
        responsible,
      };

      const updated = [m, ...movements];
      setMovements(updated);
      localStorage.setItem("inventory_movements", JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error("Error stock interno:", e);
      return false;
    }
  };

  const addProduct = async (product: Omit<Product, "id">) => {
    try {
      const { error } = await supabase
        .from('productos_internos')
        .insert([{
          numero_articulo: product.sku,
          descripcion: product.name,
          stock_actual: product.stock,
          unidad_medida: product.unit,
          zona: product.location
        }]);
      if (error) throw error;
      fetchInternalProducts();
    } catch (e) {
      console.error("Error añadir interno:", e);
    }
  };

  const importProducts = async (newProducts: Product[]) => {
    try {
      setLoading(true);
      const toInsert = newProducts.map(p => ({
        numero_articulo: p.sku,
        descripcion: p.name,
        stock_actual: p.stock,
        unidad_medida: p.unit,
        zona: p.location
      }));

      const { error } = await supabase
        .from('productos_internos')
        .upsert(toInsert, { onConflict: 'numero_articulo' });

      if (error) throw error;
      fetchInternalProducts();
      return true;
    } catch (e) {
      console.error("Error importar interno:", e);
      return false;
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayEntries = movements.filter(m => m.type === "entrada" && m.date.startsWith(today)).length;
  const todayExits = movements.filter(m => m.type === "salida" && m.date.startsWith(today)).length;
  const lowStockCount = internalProducts.filter(p => p.stock <= p.minStock).length;

  return {
    products,
    internalProducts,
    movements,
    loading,
    addMovement,
    addProduct,
    importProducts,
    stats: {
      totalProducts: products.length,
      totalInternal: internalProducts.length,
      todayEntries,
      todayExits,
      lowStockCount,
    },
  };
}


