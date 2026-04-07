import { useState, useEffect } from "react";
import { Motor } from "../hooks/useInventory";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

interface MotorMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  motor: Motor | null;
  type: "entrada" | "salida";
  onSubmit: (motorId: string, payload: any) => Promise<any>;
}

export function MotorMaintenanceModal({ isOpen, onClose, motor, type, onSubmit }: MotorMaintenanceModalProps) {
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [responsible, setResponsible] = useState("");
  const [observation, setObservation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set default local datetime
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setDate(now.toISOString().slice(0, 16));
      
      // Default location for entrada can be the motor's current area
      setLocation(type === "entrada" && motor ? (motor.ubicacion_actual || motor.area || "") : "");
      setResponsible("");
      setObservation("");
      setIsSubmitting(false);
    }
  }, [isOpen, motor, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motor) return;

    setIsSubmitting(true);
    try {
      await onSubmit(motor.id, {
        date,
        location,
        responsible,
        observation
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!motor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {type === "entrada" ? "Entrada a Mantenimiento" : "Salida de Mantenimiento"}
          </DialogTitle>
          <DialogDescription>
            {type === "entrada" 
              ? "Registra el envío de este motor al taller o área de mantenimiento."
              : "Registra el retorno del motor o su nueva instalación."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Motor (Tag / Equipo)</Label>
            <Input 
              value={`${motor.tag || "Sin Tag"} - ${motor.equipo || "Sin Equipo"}`} 
              disabled 
              className="bg-muted font-bold text-primary"
            />
          </div>

          <div className="space-y-2">
            <Label>Fecha y Hora</Label>
            <Input 
              type="datetime-local" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>{type === "entrada" ? "Área origen" : "Destino"}</Label>
            <Input 
              placeholder={type === "entrada" ? "De dónde se retira..." : "Dónde se instalará o guardará..."}
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>Personal Responsable</Label>
            <Input 
              placeholder="Nombre del técnico o responsable..."
              value={responsible} 
              onChange={(e) => setResponsible(e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>Observación</Label>
            <textarea 
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={type === "entrada" ? "Motivo del mantenimiento, fallas..." : "Trabajo realizado, estado..."}
              value={observation} 
              onChange={(e) => setObservation(e.target.value)} 
              required 
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Registro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
