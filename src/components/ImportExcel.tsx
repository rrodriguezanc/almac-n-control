import { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Product } from "../hooks/useInventory";

interface ImportExcelProps {
    onImport: (products: Product[]) => Promise<boolean>;
}

export const ImportExcel = ({ onImport }: ImportExcelProps) => {
    const [loading, setLoading] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                // Debug para ver qué columnas detecta realmente
                if (jsonData.length > 0) {
                    console.log("Columnas detectadas en el Excel:", Object.keys(jsonData[0]));
                }

                const formattedProducts: Product[] = jsonData.map((item, index) => {
                    const keys = Object.keys(item);
                    const findKey = (possibleNames: string[]) => {
                        return keys.find(k => {
                            const cleanK = k.trim().toLowerCase();
                            return possibleNames.some(p => cleanK.includes(p.toLowerCase()));
                        });
                    };

                    const keyNum = findKey(["número de artículo", "numero_articulo", "sku", "codigo", "código"]);
                    const keyDesc = findKey(["descripción del artículo", "descripcion_articulo", "nombre", "item", "articulo"]);
                    const keyStock = findKey(["en stock", "en_stock", "stock", "cantidad", "cant."]);
                    const keyClase = findKey(["clase descripcion", "clase_descripcion", "categoría", "categoria", "clase"]);
                    const keySubClase = findKey(["sub clase descripcion", "sub_clase_descripcion", "subclase", "sub-clase"]);
                    const keyUnit = findKey(["unidad de medida", "unidad_medida", "unidad", "unit", "u.m."]);
                    const keyLoc = findKey(["ubicación", "ubicacion", "location", "pasillo", "estante"]);
                    const keyPrice = findKey(["último precio de compra", "ultimo_precio_compra", "ultimo_precio_determinado", "precio", "costo"]);
                    const keyDate = findKey(["última fecha de compra", "ultima_fecha_compra", "fecha"]);
                    const keyStatus = findKey(["inactivo", "estado", "status"]);

                    return {
                        id: String(item[keyNum!] || index + 1),
                        name: String(item[keyDesc!] || "Sin nombre"),
                        sku: String(item[keyNum!] || `SKU-${index}`),
                        category: String(item[keyClase!] || "General"),
                        subCategory: String(item[keySubClase!] || ""),
                        stock: Number(item[keyStock!] || 0),
                        minStock: 0,
                        unit: String(item[keyUnit!] || "pzas"),
                        location: String(item[keyLoc!] || "N/A"),
                        lastPrice: Number(item[keyPrice!] || 0),
                        lastPurchaseDate: String(item[keyDate!] || ""),
                        status: String(item[keyStatus!] || "No"),
                    };
                });

                const success = await onImport(formattedProducts);
                if (success) {
                    toast.success(`${formattedProducts.length} productos importados correctamente`);
                } else {
                    toast.error("El archivo es demasiado grande para guardarlo.");
                }
            } catch (error) {
                console.error("Error al leer el Excel:", error);
                toast.error("Error al procesar el archivo Excel. Verifica el formato.");
            } finally {
                setLoading(false);
                // Reset the input
                e.target.value = "";
            }
        };

        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <div className="bg-primary/10 p-3 rounded-full">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
                <h3 className="text-sm font-semibold">Importar Inventario</h3>
                <p className="text-xs text-muted-foreground">
                    Sube tu archivo .xlsx o .csv con columnas: nombre, sku, stock...
                </p>
            </div>
            <div className="relative">
                <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                />
                <Button variant="outline" size="sm" className="gap-2" disabled={loading}>
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="h-4 w-4" />
                    )}
                    Seleccionar Archivo
                </Button>
            </div>
        </div>
    );
};
