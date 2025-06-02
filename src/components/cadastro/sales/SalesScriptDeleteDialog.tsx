
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface SalesScriptDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  scriptName: string;
}

const SalesScriptDeleteDialog = ({
  isOpen,
  onClose,
  onConfirm,
  scriptName
}: SalesScriptDeleteDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <div className="py-4">
          <p>
            Tem certeza que deseja excluir o script para "{scriptName}"?
            Esta ação não poderá ser desfeita.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={onConfirm}
          >
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SalesScriptDeleteDialog;
