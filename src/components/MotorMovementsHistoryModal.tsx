import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { MotorMovement, Motor } from "../hooks/useInventory";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface MotorMovementsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  movements: MotorMovement[];
  motors: Motor[];
}

export function MotorMovementsHistoryModal({ isOpen, onClose, movements, motors }: MotorMovementsHistoryModalProps) {
  const getMotorName = (motorId: string) => {
    const m = motors.find(x => x.id === motorId);
    return m ? `${m.tag || "Sin Tag"} - ${m.equipo || "Sin Equipo"}` : "Motor Desconocido";
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [movements, isOpen]);

  const totalPages = Math.ceil(movements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMovements = movements.slice(startIndex, startIndex + itemsPerPage);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Historial de Movimientos de Taller</DialogTitle>
          <DialogDescription>
            Registro de todos los ingresos y salidas de mantenimiento de los motores.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mt-4 mb-2">
          <div className="text-sm text-muted-foreground">
            Mostrando {currentMovements.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, movements.length)} de {movements.length} movimientos
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2">Página {currentPage} de {totalPages || 1}</span>
            <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage >= totalPages || totalPages === 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar rounded-md border">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Motor</th>
                <th className="px-4 py-3 font-semibold">Origen/Destino</th>
                <th className="px-4 py-3 font-semibold">Responsable</th>
                <th className="px-4 py-3 font-semibold">Observación</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentMovements.length > 0 ? (
                currentMovements.map((mov) => {
                  const isIngreso = mov.tipo === "INGRESO_MT";
                  return (
                    <tr key={mov.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(mov.fecha).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${isIngreso ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {mov.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-primary">
                        {getMotorName(mov.motor_id)}
                      </td>
                      <td className="px-4 py-3">
                        {mov.origen || mov.destino || "-"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {mov.responsable || "-"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-normal min-w-[200px]">
                        {mov.observacion || "-"}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No hay movimientos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
