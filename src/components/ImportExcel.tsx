import { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Product } from "../hooks/useInventory";

interface ImportExcelProps {
    onImport: (products: Product[]) => void;
}

export const ImportExcel = ({ onImport }: ImportExcelProps) => {
    const [loading, setLoading] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();

        reader.onload = (event) => {
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
                    // Limpiamos los nombres de las columnas por si tienen espacios ocultos
                    const cleanItem: any = {};
                    Object.keys(item).forEach(key => {
                        cleanItem[key.trim()] = item[key];
                    });

                    return {
                        id: String(cleanItem["Número de artículo"] || index + 1),
                        name: String(cleanItem["Descripción del artículo"] || "Sin nombre"),
                        sku: String(cleanItem["Número de artículo"] || `SKU-${index}`),
                        category: String(cleanItem["CLASE DESCRIPCION"] || "General"),
                        subCategory: String(cleanItem["SUB CLASE DESCRIPCION"] || ""),
                        stock: Number(cleanItem["En stock"] || 0),
                        minStock: 0,
                        unit: String(cleanItem["Unidad de medida de compras"] || "pzas"),
                        location: String(cleanItem["Ubicación"] || cleanItem["Ubicacion"] || "N/A"),
                        lastPrice: Number(cleanItem["Último precio de compra"] || cleanItem["Último precio determinado"] || 0),
                        lastPurchaseDate: String(cleanItem["Última fecha de compra"] || ""),
                        status: String(cleanItem["Inactivo"] || "No"),
                    };
                });

                onImport(formattedProducts);
                toast.success(`${formattedProducts.length} productos importados correctamente`);
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
