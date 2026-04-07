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

export interface Motor {
  id: string;
  area: string | null;
  componente: string | null;
  tag: string | null;
  equipo: string | null;
  tipo_motor: string | null;
  frame: string | null;
  potencia_kw: number | null;
  corriente_a: string | null;
  nivel_tension_kv: string | null;
  tipo_conexion: string | null;
  rpm: number | null;
  frecuencia_hz: number | null;
  clase_aislamiento: string | null;
  cos_phi: number | null;
  rodamiento_lado_acople: string | null;
  rodamiento_lado_opuesto: string | null;
  codigo1: string | null;
  codigo2: string | null;
  fabricante: string | null;
  peso_kg: number | null;
  estado?: string | null;
  ubicacion_actual?: string | null;
  created_at: string;
}

export interface MotorMovement {
  id: string;
  motor_id: string;
  tipo: string;
  fecha: string;
  origen: string | null;
  destino: string | null;
  responsable: string | null;
  observacion: string | null;
  created_at: string;
}

export interface Movement {
  id: string;
  productId: string;
  productName?: string; // Para mostrar en el historial (buscado en memoria o join)
  currentStock?: number; // Para estimaciones
  type: "entrada" | "salida";
  quantity: number;
  date: string;
  note: string;
  responsible: string;
  warehouse: "instrumentacion" | "electrico";
}

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [internalProducts, setInternalProducts] = useState<Product[]>([]);
  const [electricalProducts, setElectricalProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [motors, setMotors] = useState<Motor[]>([]);
  const [motorMovements, setMotorMovements] = useState<MotorMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('productos_internos')
          .select('*')
          .range(from, from + pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += pageSize;
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }

        if (from > 10000) break; // Límite de seguridad
      }

      setInternalProducts(allData.map((p: any) => ({
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
    } catch (e) {
      console.error("Error productos internos:", e);
    }
  };

  const fetchElectricalProducts = async () => {
    try {
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('productos_internos_electricos')
          .select('*')
          .range(from, from + pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += pageSize;
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }

        if (from > 10000) break; // Límite de seguridad
      }

      setElectricalProducts(allData.map((p: any) => ({
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
    } catch (e) {
      console.error("Error productos eléctricos:", e);
    }
  };

  const fetchMovements = async () => {
    try {
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('movimientos')
          .select('*')
          .order('date', { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += pageSize;
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }

        if (from > 20000) break; // Límite de seguridad para historial (hasta 20k, ajustable)
      }

      console.log(`Movimientos cargados: ${allData.length}`);
      setMovements(allData.map((m: any) => ({
        id: m.id,
        productId: m.product_id,
        type: m.type,
        quantity: Number(m.quantity),
        date: m.date,
        note: m.note || "",
        responsible: m.responsible || "",
        warehouse: m.warehouse
      })));
    } catch (e) {
      console.error("Error al cargar movimientos:", e);
    }
  };

  const registerMotorMaintenance = async (motorId: string, type: "entrada" | "salida", payload: any) => {
    try {
      // 1. Insertar el historial del mantenimiento
      const isEntry = type === "entrada";
      const { error: historyError } = await supabase
        .from('movimientos_motores')
        .insert([{
          motor_id: motorId,
          tipo: isEntry ? 'INGRESO_MT' : 'SALIDA_MT',
          fecha: new Date(payload.date || new Date()).toISOString(),
          origen: isEntry ? payload.location : null,
          destino: !isEntry ? payload.location : null,
          responsable: payload.responsible,
          observacion: payload.observation
        }]);
      
      if (historyError) {
        console.warn("Error al registrar en movimientos_motores:", historyError.message);
      }

      // 2. Actualizar el estado y ubicación del motor
      const nuevoEstado = type === "entrada" ? "EN_MANTENIMIENTO" : "DISPONIBLE"; // o 'INSTALADO' si quieren, pero dejaremos DISPONIBLE por defecto
      const { error: updateError } = await supabase
        .from('motores')
        .update({
          estado: nuevoEstado,
          ubicacion_actual: payload.location
        })
        .eq('id', motorId);

      if (updateError) throw updateError;

      // 3. Refrescar localmente
      await fetchMotors();
      await fetchMotorMovements();
      return true;
    } catch (e) {
      console.error("Error al registrar mantenimiento:", e);
      throw e;
    }
  };

  const fetchMotors = async () => {
    try {
      let allData: any[] = [];
      let hasMore = true;
      let from = 0;
      const pageSize = 1000;

      while (hasMore) {
        const { data, error } = await supabase
          .from('motores')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += pageSize;
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }
        if (from > 10000) break;
      }
      setMotors(allData);
    } catch (e) {
      console.error("Error al cargar motores:", e);
    }
  };

  const fetchMotorMovements = async () => {
    try {
      let allData: any[] = [];
      let hasMore = true;
      let from = 0;
      const pageSize = 1000;

      while (hasMore) {
        const { data, error } = await supabase
          .from('movimientos_motores')
          .select('*')
          .order('fecha', { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += pageSize;
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }
        if (from > 10000) break;
      }
      setMotorMovements(allData);
    } catch (e) {
      console.error("Error al cargar historial de motores:", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Verificar si hay una sesión activa
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        await Promise.all([
          fetchProducts(),
          fetchInternalProducts(),
          fetchElectricalProducts(),
          fetchMovements(),
          fetchMotors(),
          fetchMotorMovements()
        ]);
      } catch (error) {
        console.error("Error inicializando:", error);
      } finally {
        setLoading(false);
      }
    };
    init();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const addMovement = async (
    productId: string,
    type: "entrada" | "salida",
    quantity: number,
    note: string,
    responsible: string,
    warehouse: "instrumentacion" | "electrico" = "instrumentacion"
  ) => {
    const tableName = warehouse === "instrumentacion" ? 'productos_internos' : 'productos_internos_electricos';
    const currentProducts = warehouse === "instrumentacion" ? internalProducts : electricalProducts;
    const setState = warehouse === "instrumentacion" ? setInternalProducts : setElectricalProducts;
    const fetcher = warehouse === "instrumentacion" ? fetchInternalProducts : fetchElectricalProducts;

    let productToUpdate: Product | undefined;
    let isNewToWarehouse = false;
    let masterProductId = "";

    // 1. Resolver el producto y obtener su ID del catálogo maestro para la tabla de movimientos (FK)
    console.log(`Iniciando movimiento en ${warehouse} para producto:`, productId);

    if (type === "salida") {
      productToUpdate = currentProducts.find((p) => p.id === productId);
      if (productToUpdate) {
        // Buscamos el ID maestro en el catálogo general por SKU (numero_articulo)
        const genP = products.find(p => p.sku === productToUpdate!.sku);
        masterProductId = genP ? genP.id : productToUpdate.id;
      }
    } else {
      productToUpdate = currentProducts.find((p) => p.id === productId);
      if (!productToUpdate) {
        // Si no está en el almacén, viene del catálogo general
        const genProduct = products.find((p) => p.id === productId);
        if (genProduct) {
          masterProductId = genProduct.id;
          const existing = currentProducts.find(p => p.sku === genProduct.sku);
          if (existing) {
            productToUpdate = existing;
            isNewToWarehouse = false;
          } else {
            productToUpdate = genProduct;
            isNewToWarehouse = true;
          }
        }
      } else {
        // Si ya está en el almacén, buscamos su ID maestro por SKU
        const genP = products.find(p => p.sku === productToUpdate!.sku);
        masterProductId = genP ? genP.id : productToUpdate.id;
      }
    }

    if (!productToUpdate) {
      console.error("Producto no encontrado para la operación");
      return false;
    }

    // Si masterProductId no parece un UUID (ej: un string corto), el insert en movimientos fallará
    // Intentamos asegurar que tenemos un UUID válido del catálogo maestro
    if (!masterProductId || masterProductId.length < 10) {
      const retryGenP = products.find(p => p.sku === productToUpdate!.sku);
      if (retryGenP) masterProductId = retryGenP.id;
      else {
        console.error("No se pudo obtener un UUID de producto maestro válido para la restricción de SQL.");
        return false;
      }
    }
    if (type === "salida" && productToUpdate.stock < quantity) return false;

    const currentBalance = isNewToWarehouse ? 0 : productToUpdate.stock;
    const newStock = type === "entrada" ? currentBalance + quantity : currentBalance - quantity;

    try {
      // 2. Actualizar Stock en tabla de almacén
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

      // 3. Registrar Movimiento en Supabase
      console.log("Intentando registrar movimiento para masterProductId:", masterProductId);
      const { error: mError } = await supabase
        .from('movimientos')
        .insert([{
          product_id: masterProductId,
          type,
          quantity,
          note,
          responsible,
          warehouse
        }]);

      if (mError) {
        console.error("Error de Supabase al insertar movimiento:", mError);
        throw mError;
      }

      await fetchMovements();
      return true;
    } catch (e: any) {
      console.error(`Error crítico en registro (${warehouse}):`, e);
      // Si el error viene de Supabase, lo mostramos detallado en consola
      if (e.message) console.error("Detalle del error:", e.message);
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

  const now = new Date();
  const isLocalToday = (isoString: string) => {
    const d = new Date(isoString);
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth() === now.getMonth() &&
           d.getDate() === now.getDate();
  };

  const todayEntries = movements
    .filter(m => m.type === "entrada" && isLocalToday(m.date))
    .reduce((sum, m) => sum + m.quantity, 0);
  const todayExits = movements
    .filter(m => m.type === "salida" && isLocalToday(m.date))
    .reduce((sum, m) => sum + m.quantity, 0);
  const lowStockCount = [...internalProducts, ...electricalProducts].filter(p => p.stock <= p.minStock).length;

  return {
    products,
    internalProducts,
    electricalProducts,
    motors,
    motorMovements,
    registerMotorMaintenance,
    movements: movements.map(m => {
      // 1. Encontrar el producto máster en el catálogo general
      const masterProduct = products.find(prod => prod.id === m.productId || prod.sku === m.productId);
      
      // 2. Extraer el SKU (para enlazar con el almacén local donde IDs difieren)
      const targetSku = masterProduct ? masterProduct.sku : m.productId; 

      // 3. Buscar en el almacén específico usando el SKU
      const warehouseProducts = m.warehouse === 'instrumentacion' ? internalProducts : electricalProducts;
      let localProduct = warehouseProducts.find(prod => prod.sku === targetSku || prod.id === targetSku);
      
      let name = "Producto no encontrado";
      let currentStock = 0;
      
      if (localProduct) {
        name = localProduct.name;
        currentStock = localProduct.stock !== undefined ? localProduct.stock : 0;
      } else if (masterProduct) {
        name = masterProduct.name;
        currentStock = masterProduct.stock !== undefined ? masterProduct.stock : 0;
      } else {
        const allPossibleProducts = [...products, ...internalProducts, ...electricalProducts];
        const fallbackP = allPossibleProducts.find(prod => prod.id === m.productId || prod.sku === m.productId);
        if (fallbackP) {
          name = fallbackP.name;
          currentStock = fallbackP.stock !== undefined ? fallbackP.stock : 0;
        }
      }

      return {
        ...m,
        productName: `${name} (${m.warehouse === 'instrumentacion' ? 'Inst' : 'Elec'})`,
        currentStock
      };
    }),
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
    user,
    isAdmin: !!user,
    signOut: () => supabase.auth.signOut(),
  };
}


