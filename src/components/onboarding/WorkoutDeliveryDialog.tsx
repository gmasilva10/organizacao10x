
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WorkoutDeliveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deliveryDate: Date) => void;
}

const WorkoutDeliveryDialog = ({ isOpen, onClose, onConfirm }: WorkoutDeliveryDialogProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar entrega do treino</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="mb-4 text-gray-600">
            Confirme a entrega do treino deste aluno.
          </p>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Data da entrega
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={() => date && onConfirm(date)}
            disabled={!date}
          >
            Confirmar entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutDeliveryDialog;
