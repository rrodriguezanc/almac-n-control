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
  const [electricalProducts, setElectricalProducts] = useState<Product[]>([]);
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
      const { data, error } = await supabase.from('productos_internos').select('*');
      if (error) throw error;
      if (data) {
        setInternalProducts(data.map((p: any) => ({
          id: String(p.id),
          sku: String(p.numero_articulo || ""),
          name: String(p.descripcion || "Sin nombre"),
          stock: Number(p.stock_actual !== undefined ? p.stock_actual : p.en_stock || 0),
          minStock: 0,
          unit: String(p.unidad_medida || "pzas"),
          category: "Interno",
          location: String(p.zona || "N/A"),
          status: "Activo"
        })));
      }
    } catch (e) {
      console.error("Error productos internos:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchElectricalProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('productos_internos_electricos').select('*');
      if (error) throw error;
      if (data) {
        setElectricalProducts(data.map((p: any) => ({
          id: String(p.id),
          sku: String(p.numero_articulo || ""),
          name: String(p.descripcion || "Sin nombre"),
          stock: Number(p.stock_actual !== undefined ? p.stock_actual : p.en_stock || 0),
          minStock: 0,
          unit: String(p.unidad_medida || "pzas"),
          category: "Eléctrico",
          location: String(p.zona || "N/A"),
          status: "Activo"
        })));
      }
    } catch (e) {
      console.error("Error productos eléctricos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchProducts(), fetchInternalProducts(), fetchElectricalProducts()]);
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
    responsible: string,
    warehouse: "interno" | "electrico" = "interno"
  ) => {
    const tableName = warehouse === "interno" ? 'productos_internos' : 'productos_internos_electricos';
    const currentProducts = warehouse === "interno" ? internalProducts : electricalProducts;
    const setState = warehouse === "interno" ? setInternalProducts : setElectricalProducts;
    const fetcher = warehouse === "interno" ? fetchInternalProducts : fetchElectricalProducts;

    let productToUpdate: Product | undefined;
    let isNewToWarehouse = false;

    if (type === "salida") {
      productToUpdate = currentProducts.find((p) => p.id === productId);
    } else {
      productToUpdate = currentProducts.find((p) => p.id === productId);
      if (!productToUpdate) {
        const genProduct = products.find((p) => p.id === productId);
        if (genProduct) {
          const existing = currentProducts.find(p => p.sku === genProduct.sku);
          if (existing) {
            productToUpdate = existing;
          } else {
            productToUpdate = genProduct;
            isNewToWarehouse = true;
          }
        }
      }
    }

    if (!productToUpdate) return false;
    if (type === "salida" && productToUpdate.stock < quantity) return false;

    const currentBalance = isNewToWarehouse ? 0 : productToUpdate.stock;
    const newStock = type === "entrada" ? currentBalance + quantity : currentBalance - quantity;

    try {
      if (isNewToWarehouse) {
        const { error } = await supabase
          .from(tableName)
          .insert([{
            numero_articulo: productToUpdate.sku,
            descripcion: productToUpdate.name,
            stock_actual: newStock,
            unidad_medida: productToUpdate.unit,
            zona: productToUpdate.location
          }]);
        if (error) throw error;
        await fetcher();
      } else {
        const { error } = await supabase
          .from(tableName)
          .update({ stock_actual: newStock })
          .eq('id', productToUpdate.id);
        if (error) throw error;
        setState(prev => prev.map(p => p.id === productToUpdate!.id ? { ...p, stock: newStock } : p));
      }

      const m: Movement = {
        id: Math.random().toString(36).substr(2, 9),
        productId,
        productName: `${productToUpdate.name} (${warehouse === 'interno' ? 'Inst' : 'Elec'})`,
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
      console.error(`Error stock ${warehouse}:`, e);
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
  const lowStockCount = [...internalProducts, ...electricalProducts].filter(p => p.stock <= p.minStock).length;

  return {
    products,
    internalProducts,
    electricalProducts,
    movements,
    loading,
    addMovement,
    addProduct,
    importProducts,
    stats: {
      totalProducts: products.length,
      totalInternal: internalProducts.length,
      totalElectrical: electricalProducts.length,
      todayEntries,
      todayExits,
      lowStockCount,
    },
  };
}


