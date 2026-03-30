import { useState } from "react";
import { Motor } from "../hooks/useInventory";
import { Search, Zap } from "lucide-react";
import { Input } from "./ui/input";

interface MotorsTableProps {
  motors: Motor[];
}

export function MotorsTable({ motors }: MotorsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = motors.filter(m => 
    (m.tag?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (m.equipo?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (m.area?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (m.componente?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-card p-6 rounded-xl border border-muted shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Motores Eléctricos</h2>
            <p className="text-sm text-muted-foreground">Especificaciones técnicas y ubicaciones</p>
          </div>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por tag, equipo, área o componente..."
            className="pl-10 border-2 focus-visible:ring-primary h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 whitespace-nowrap">
              <tr>
                <th className="px-4 py-4 font-black tracking-wider">Tag</th>
                <th className="px-4 py-4 font-black tracking-wider">Equipo</th>
                <th className="px-4 py-4 font-black tracking-wider">Área</th>
                <th className="px-4 py-4 font-black tracking-wider">Componente</th>
                <th className="px-4 py-4 font-black tracking-wider border-l border-muted/50">Tipo Motor</th>
                <th className="px-4 py-4 font-black tracking-wider">Potencia (kW)</th>
                <th className="px-4 py-4 font-black tracking-wider">Corriente (A)</th>
                <th className="px-4 py-4 font-black tracking-wider">Tensión (kV)</th>
                <th className="px-4 py-4 font-black tracking-wider">RPM</th>
                <th className="px-4 py-4 font-black tracking-wider">Hz</th>
                <th className="px-4 py-4 font-black tracking-wider border-l border-muted/50">Frame</th>
                <th className="px-4 py-4 font-black tracking-wider">Conexión</th>
                <th className="px-4 py-4 font-black tracking-wider">Aislamiento</th>
                <th className="px-4 py-4 font-black tracking-wider">Cos Phi</th>
                <th className="px-4 py-4 font-black tracking-wider border-l border-muted/50">Rod. Acople</th>
                <th className="px-4 py-4 font-black tracking-wider">Rod. Opuesto</th>
                <th className="px-4 py-4 font-black tracking-wider border-l border-muted/50">Fabricante</th>
                <th className="px-4 py-4 font-black tracking-wider">Peso (Kg)</th>
                <th className="px-4 py-4 font-black tracking-wider bg-muted/50">Código 1</th>
                <th className="px-4 py-4 font-black tracking-wider bg-muted/50">Código 2</th>
              </tr>
            </thead>
            <tbody className="divide-y border-t whitespace-nowrap">
              {filtered.length > 0 ? (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-primary">{m.tag || '-'}</td>
                    <td className="px-4 py-3 font-medium bg-muted/10">{m.equipo || '-'}</td>
                    <td className="px-4 py-3">{m.area || '-'}</td>
                    <td className="px-4 py-3">{m.componente || '-'}</td>
                    <td className="px-4 py-3 border-l border-muted/30">{m.tipo_motor || '-'}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 bg-emerald-50/30">{m.potencia_kw ?? '-'}</td>
                    <td className="px-4 py-3 font-medium">{m.corriente_a || '-'}</td>
                    <td className="px-4 py-3 font-bold text-amber-600 bg-amber-50/30">{m.nivel_tension_kv || '-'}</td>
                    <td className="px-4 py-3">{m.rpm ?? '-'}</td>
                    <td className="px-4 py-3">{m.frecuencia_hz ?? '-'}</td>
                    <td className="px-4 py-3 border-l border-muted/30 font-medium">{m.frame || '-'}</td>
                    <td className="px-4 py-3">{m.tipo_conexion || '-'}</td>
                    <td className="px-4 py-3">{m.clase_aislamiento || '-'}</td>
                    <td className="px-4 py-3">{m.cos_phi ?? '-'}</td>
                    <td className="px-4 py-3 border-l border-muted/30 font-medium text-sky-700 bg-sky-50/30">{m.rodamiento_lado_acople || '-'}</td>
                    <td className="px-4 py-3 font-medium text-sky-700 bg-sky-50/30">{m.rodamiento_lado_opuesto || '-'}</td>
                    <td className="px-4 py-3 border-l border-muted/30 text-muted-foreground">{m.fabricante || '-'}</td>
                    <td className="px-4 py-3">{m.peso_kg ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs bg-muted/30">{m.codigo1 || '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs bg-muted/30">{m.codigo2 || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={20} className="px-4 py-12 text-center text-muted-foreground">
                    <p className="font-bold">No se encontraron motores</p>
                    <p className="text-sm">Prueba ajustando los términos de tu búsqueda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
