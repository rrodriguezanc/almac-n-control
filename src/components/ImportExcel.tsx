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

                const formattedProducts: Product[] = jsonData.map((item, index) => ({
                    id: String(item["Número de artículo"] || index + 1),
                    name: String(item["Descripción del artículo"] || "Sin nombre"),
                    sku: String(item["Número de artículo"] || `SKU-${index}`),
                    category: String(item["CLASE DESCRIPCION"] || "General"),
                    subCategory: String(item["SUB CLASE DESCRIPCION"] || ""),
                    stock: Number(item["En stock"] || 0),
                    minStock: 0,
                    unit: String(item["Unidad de medida de compras"] || "pzas"),
                    location: String(item["Ubicación"] || item["Ubicacion"] || "N/A"),
                    lastPrice: Number(item["Último precio de compra"] || 0),
                    lastPurchaseDate: String(item["Última fecha de compra"] || ""),
                    status: String(item["Inactivo"] || "No"),
                }));

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
