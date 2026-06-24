import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Stock");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportMovementsToExcel(movements: any[], filename: string) {
  const formattedData = movements.map(m => {
    let ot = "";
    let area = "";
    const rawNote = m.note || "";
    const parts = rawNote.split('|').map((p: string) => p.trim());
    const remainingNotes: string[] = [];

    parts.forEach((part: string) => {
      if (part.startsWith('OT:')) {
        ot = part.replace('OT:', '').trim();
      } else if (part.startsWith('Área:')) {
        area = part.replace('Área:', '').trim();
      } else if (part.startsWith('Nota:')) {
        remainingNotes.push(part.replace('Nota:', '').trim());
      } else {
        remainingNotes.push(part);
      }
    });

    return {
      "Fecha Mvto.": new Date(m.date).toLocaleString('es-MX'),
      "SKU": m.productSku || "-",
      "Producto": m.productName || "Desconocido",
      "Tipo Operación": m.type === "entrada" ? "Entrada" : "Salida",
      "Cantidad": Math.abs(m.quantity),
      "Personal (Responsable)": m.responsible || "-",
      "Área de Solicitud": area || "-",
      "No. OT": ot || "-",
      "Almacén": m.warehouse === "instrumentacion" ? "Instrumentación" : "Eléctrico",
      "Notas Adicionales": remainingNotes.join(' - ') || "-"
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportMonthlyConsumptionToExcel(productName: string, sku: string, data: any[]) {
  const formattedData = data.map(row => ({
    "Mes / Año": row.monthLabel,
    "Cantidad Consumida": row.quantity,
    "Número de Salidas": row.count,
    "Promedio por Salida": Number((row.quantity / row.count).toFixed(2))
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Consumo Mensual");
  XLSX.writeFile(workbook, `Consumo_${sku}_${productName.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
}
