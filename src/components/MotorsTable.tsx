import { useMemo, useState, useEffect } from "react";
import { Motor, MotorMovement } from "../hooks/useInventory";
import { Search, Zap, ArrowDownToLine, ArrowUpFromLine, Wrench, History, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface MotorsTableProps {
  motors: Motor[];
  motorMovements: MotorMovement[];
  isAdmin?: boolean;
  onShowHistory?: () => void;
  onRegisterEntryToMaintenance?: (motor: Motor) => void;
  onRegisterExitFromMaintenance?: (motor: Motor) => void;
}

export function MotorsTable({
  motors,
  motorMovements = [],
  isAdmin = false,
  onShowHistory,
  onRegisterEntryToMaintenance,
  onRegisterExitFromMaintenance,
}: MotorsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return motors.filter((m) =>
      (m.tag?.toLowerCase() || "").includes(term) ||
      (m.equipo?.toLowerCase() || "").includes(term) ||
      (m.area?.toLowerCase() || "").includes(term) ||
      (m.componente?.toLowerCase() || "").includes(term)
    );
  }, [motors, searchTerm]);

  const summary = useMemo(() => {
    const total = motors.length;
    const enMantenimiento = motors.filter(
      (m: any) => (m.estado || "").toUpperCase() === "EN_MANTENIMIENTO"
    ).length;
    const disponibles = motors.filter(
      (m: any) => (m.estado || "").toUpperCase() === "DISPONIBLE"
    ).length;

    const movimientosMes = motorMovements?.filter(mov => {
      if (!mov.fecha) return false;
      const movDate = new Date(mov.fecha);
      const now = new Date();
      return movDate.getMonth() === now.getMonth() && movDate.getFullYear() === now.getFullYear();
    }).length || 0;

    return { total, enMantenimiento, disponibles, movimientosMes };
  }, [motors, motorMovements]);

  const getStatusBadge = (estado?: string) => {
    const value = (estado || "SIN ESTADO").toUpperCase();

    if (value === "EN_MANTENIMIENTO") {
      return (
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-amber-100 text-amber-700">
          EN MANTENIMIENTO
        </span>
      );
    }

    if (value === "DISPONIBLE") {
      return (
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-700">
          DISPONIBLE
        </span>
      );
    }

    if (value === "INSTALADO") {
      return (
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-sky-100 text-sky-700">
          INSTALADO
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-muted text-muted-foreground">
        {value}
      </span>
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFiltered = filtered.slice(startIndex, startIndex + itemsPerPage);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-card p-6 rounded-xl border border-muted shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Motores Eléctricos</h2>
            <p className="text-sm text-muted-foreground">
              Consulta técnica, estado actual y movimientos a mantenimiento
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="gap-2 font-bold whitespace-nowrap" onClick={onShowHistory}>
            <History className="h-4 w-4" /> Historial
          </Button>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por tag, equipo, área o componente..."
              className="pl-10 border-2 focus-visible:ring-primary h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase">Total</p>
          <p className="text-2xl font-black mt-1">{summary.total}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase">Disponibles</p>
          <p className="text-2xl font-black mt-1 text-emerald-600">{summary.disponibles}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase">En mantenimiento</p>
          <p className="text-2xl font-black mt-1 text-amber-600">{summary.enMantenimiento}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase">Movimientos del mes</p>
          <p className="text-2xl font-black mt-1 text-sky-600">{summary.movimientosMes}</p>
        </div>
      </div>

      {/* Sección Activa de Mantenimiento */}
      {summary.enMantenimiento > 0 && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50/30 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-amber-800">
            <div className="bg-amber-100 p-1.5 rounded-md">
              <Wrench className="h-5 w-5" />
            </div>
            <h3 className="font-black text-lg">Motores en Taller de Mantenimiento</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {motors.filter(m => (m.estado || "").toUpperCase() === "EN_MANTENIMIENTO").map(m => {
              const lastMovement = motorMovements.find(mov => mov.motor_id === m.id && mov.tipo === "INGRESO_MT");
              let daysInMT = "-";
              let formattedDate = "Desconocida";
              if (lastMovement) {
                const moveDate = new Date(lastMovement.fecha);
                formattedDate = moveDate.toLocaleDateString();
                const diffTime = Math.abs(new Date().getTime() - moveDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                daysInMT = diffDays.toString();
              }

              return (
                <div key={`mt-${m.id}`} className="bg-white border rounded-xl p-3 flex justify-between items-center shadow-sm">
                  <div className="space-y-1">
                    <p className="font-bold text-primary text-sm flex items-center gap-2">
                      {m.tag || "Sin Tag"}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">{m.equipo || "Sin Equipo"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded-sm">
                        Ingreso: {formattedDate}
                      </span>
                      <span className="text-[10px] text-red-800 font-bold bg-red-100 px-1.5 py-0.5 rounded-sm">
                        {daysInMT} días en MT
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      type="button"
                      size="sm"
                      className="gap-2 shrink-0 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                      onClick={() => onRegisterExitFromMaintenance?.(m)}
                    >
                      <ArrowUpFromLine className="h-4 w-4" />
                      Dar Salida
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-medium text-muted-foreground">
            Mostrando {currentFiltered.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, filtered.length)} de {filtered.length} motores
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground font-medium">
              Página {currentPage} de {totalPages || 1}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 whitespace-nowrap">
              <tr>
                {isAdmin && <th className="px-4 py-4 font-black tracking-wider bg-muted/80 sticky left-0 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] z-10 w-fit">Acciones</th>}
                <th className="px-4 py-4 font-black tracking-wider">Tag</th>
                <th className="px-4 py-4 font-black tracking-wider">Equipo</th>
                <th className="px-4 py-4 font-black tracking-wider">Área</th>
                <th className="px-4 py-4 font-black tracking-wider">Componente</th>
                <th className="px-4 py-4 font-black tracking-wider border-l border-muted/50">Estado</th>
                <th className="px-4 py-4 font-black tracking-wider">Ubicación actual</th>
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
              {currentFiltered.length > 0 ? (
                currentFiltered.map((m: any) => {
                  const estado = (m.estado || "").toUpperCase();
                  const isInMaintenance = estado === "EN_MANTENIMIENTO";

                  return (
                    <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                      {isAdmin && (
                        <td className="px-4 py-3 bg-card sticky left-0 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] z-10 w-fit">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-2 shrink-0 bg-white"
                              onClick={() => onRegisterEntryToMaintenance?.(m)}
                              disabled={isInMaintenance}
                            >
                              <ArrowDownToLine className="h-4 w-4" />
                              Ingreso a MT
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              className="gap-2 shrink-0"
                              onClick={() => onRegisterExitFromMaintenance?.(m)}
                              disabled={!isInMaintenance}
                            >
                              <ArrowUpFromLine className="h-4 w-4" />
                              Salida de MT
                            </Button>
                          </div>
                        </td>
                      )}
                      
                      <td className="px-4 py-3 font-bold text-primary">{m.tag || "-"}</td>
                      <td className="px-4 py-3 font-medium bg-muted/10">{m.equipo || "-"}</td>
                      <td className="px-4 py-3">{m.area || "-"}</td>
                      <td className="px-4 py-3">{m.componente || "-"}</td>
                      <td className="px-4 py-3 border-l border-muted/30">{getStatusBadge(m.estado)}</td>
                      <td className="px-4 py-3">{m.ubicacion_actual || m.area || "-"}</td>
                      <td className="px-4 py-3 border-l border-muted/30">{m.tipo_motor || "-"}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600 bg-emerald-50/20">{m.potencia_kw ?? "-"}</td>
                      <td className="px-4 py-3 font-medium">{m.corriente_a || "-"}</td>
                      <td className="px-4 py-3 font-bold text-amber-600 bg-amber-50/20">{m.nivel_tension_kv || "-"}</td>
                      <td className="px-4 py-3">{m.rpm ?? "-"}</td>
                      <td className="px-4 py-3">{m.frecuencia_hz ?? "-"}</td>
                      <td className="px-4 py-3 border-l border-muted/30 font-medium">{m.frame || "-"}</td>
                      <td className="px-4 py-3">{m.tipo_conexion || "-"}</td>
                      <td className="px-4 py-3">{m.clase_aislamiento || "-"}</td>
                      <td className="px-4 py-3">{m.cos_phi ?? "-"}</td>
                      <td className="px-4 py-3 border-l border-muted/30 font-medium text-sky-700 bg-sky-50/30">{m.rodamiento_lado_acople || "-"}</td>
                      <td className="px-4 py-3 font-medium text-sky-700 bg-sky-50/30">{m.rodamiento_lado_opuesto || "-"}</td>
                      <td className="px-4 py-3 border-l border-muted/30 text-muted-foreground">{m.fabricante || "-"}</td>
                      <td className="px-4 py-3">{m.peso_kg ?? "-"}</td>
                      <td className="px-4 py-3 font-mono text-xs bg-muted/30">{m.codigo1 || "-"}</td>
                      <td className="px-4 py-3 font-mono text-xs bg-muted/30">{m.codigo2 || "-"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={25} className="px-4 py-12 text-center text-muted-foreground">
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